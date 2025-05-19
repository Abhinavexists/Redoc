import api from './api';
import type { Document, Theme } from '../types';

const MAX_CONCURRENT_REQUESTS = 5;
const DOCUMENTS_PER_BATCH = 15;

export const documentProcessor = {
  async processBatches(
    documentIds: number[], 
    operation: string,
    params: any = {},
    onProgress?: (processed: number, total: number) => void
  ) {
    const totalDocuments = documentIds.length;
    let processedCount = 0;
    
    for (let i = 0; i < documentIds.length; i += DOCUMENTS_PER_BATCH) {
      const batchIds = documentIds.slice(i, i + DOCUMENTS_PER_BATCH);
      await api.batchProcessDocuments(batchIds, operation, params);
      
      processedCount += batchIds.length;
      if (onProgress) {
        onProgress(processedCount, totalDocuments);
      }
    }
  },

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

  async loadDocumentsInParallel(
    documentIds: number[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<Document[]> {
    const documents: Document[] = [];
    let processedCount = 0;
    const totalDocuments = documentIds.length;

    for (let i = 0; i < documentIds.length; i += MAX_CONCURRENT_REQUESTS) {
      const chunk = documentIds.slice(i, i + MAX_CONCURRENT_REQUESTS);
      
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
      
      const results = await Promise.all(promises);
      documents.push(...results.filter(Boolean));
    }
    
    return documents;
  },

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

    if (documentIds.length > 50) {
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
      
      return {
        matches: results.flatMap(r => r.matches || []),
        themes: enableThemes ? results.flatMap(r => r.themes || []) : []
      };
    } else {
      const result = await api.queryDocuments(query, enableThemes, {
        documentIds,
        ...options
      });
      return result.data;
    }
  }
};

export default documentProcessor; 