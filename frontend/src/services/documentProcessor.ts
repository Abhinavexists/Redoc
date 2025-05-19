import api from './api';
import type { Document, Theme } from '../types';

const MAX_CONCURRENT_REQUESTS = 5;
const DOCUMENTS_PER_BATCH = 15;

/**
 * Service for efficiently processing large document sets
 */
export const documentProcessor = {
  /**
   * Process documents in batches to avoid overwhelming the server
   * @param documentIds IDs of documents to process
   * @param operation The operation to perform (analyze, extract, summarize)
   * @param onProgress Optional callback for progress updates
   */
  async processBatches(
    documentIds: number[], 
    operation: string,
    params: any = {},
    onProgress?: (processed: number, total: number) => void
  ) {
    const totalDocuments = documentIds.length;
    let processedCount = 0;
    
    // Process documents in batches
    for (let i = 0; i < documentIds.length; i += DOCUMENTS_PER_BATCH) {
      const batchIds = documentIds.slice(i, i + DOCUMENTS_PER_BATCH);
      await api.batchProcessDocuments(batchIds, operation, params);
      
      processedCount += batchIds.length;
      if (onProgress) {
        onProgress(processedCount, totalDocuments);
      }
    }
  },

  /**
   * Identify themes across a large collection of documents
   * @param documentIds IDs of the documents to analyze
   * @param maxThemes Maximum number of themes to identify
   * @param relevanceThreshold Minimum relevance score (0-1)
   * @param _onProgress Optional callback for progress updates
   */
  async identifyThemesAcrossDocuments(
    documentIds: number[], 
    maxThemes: number = 5,
    relevanceThreshold: number = 0.7,
    _onProgress?: (processed: number, total: number) => void
  ): Promise<Theme[]> {
    try {
      const result = await api.batchProcessDocuments(documentIds, 'identify_themes', {
        max_themes: maxThemes,
        relevance_threshold: relevanceThreshold
      });
      
      return result.data.themes;
    } catch (error) {
      console.error('Error identifying themes:', error);
      throw error;
    }
  },

  /**
   * Load documents in parallel with concurrency control
   * @param documentIds The IDs of documents to load
   * @param onProgress Optional callback for progress updates
   */
  async loadDocumentsInParallel(
    documentIds: number[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<Document[]> {
    const documents: Document[] = [];
    let processedCount = 0;
    const totalDocuments = documentIds.length;

    // Process documents in chunks to limit concurrency
    for (let i = 0; i < documentIds.length; i += MAX_CONCURRENT_REQUESTS) {
      const chunk = documentIds.slice(i, i + MAX_CONCURRENT_REQUESTS);
      
      // Create an array of promises for this chunk
      const promises = chunk.map(async docId => {
        try {
          const response = await api.getDocument(docId);
          processedCount++;
          
          if (onProgress) {
            onProgress(processedCount, totalDocuments);
          }
          
          return response.data;
        } catch (error) {
          console.error(`Error loading document ${docId}:`, error);
          processedCount++;
          if (onProgress) {
            onProgress(processedCount, totalDocuments);
          }
          return null;
        }
      });
      
      // Wait for all promises in this chunk to resolve
      const results = await Promise.all(promises);
      documents.push(...results.filter(Boolean));
    }
    
    return documents;
  },

  /**
   * Analyze a query against a large set of documents
   * @param query The user's query text
   * @param documentIds Document IDs to search within (optional)
   */
  async analyzeQueryAgainstDocuments(
    query: string,
    documentIds: number[] = [],
    enableThemes: boolean = true,
    options: {
      themeCount?: number;
      relevanceThreshold?: number;
      advancedMode?: boolean;
    } = {}
  ) {
    // For large document sets, make sure we use efficient query methods
    if (documentIds.length > 50) {
      // Process in batches if dealing with a very large set
      const batchSize = 50;
      const results = [];
      
      for (let i = 0; i < documentIds.length; i += batchSize) {
        const batchIds = documentIds.slice(i, i + batchSize);
        const batchResult = await api.queryDocuments(query, enableThemes, {
          documentIds: batchIds,
          ...options
        });
        results.push(batchResult.data);
      }
      
      // Merge results - in a real implementation, you'd need to deduplicate and sort
      return {
        matches: results.flatMap(r => r.matches || []),
        themes: enableThemes ? results.flatMap(r => r.themes || []) : []
      };
    } else {
      // Use standard approach for reasonable document set sizes
      const result = await api.queryDocuments(query, enableThemes, {
        documentIds,
        ...options
      });
      return result.data;
    }
  }
};

export default documentProcessor; 