import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface QueryOptions {
  documentIds?: number[];
  themeCount?: number;
  relevanceThreshold?: number;
  advancedMode?: boolean;
  citationLevel?: 'document' | 'paragraph' | 'sentence';
}

const api = {
  uploadDocument: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      return await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      throw error;
    }
  },

  getDocuments: async (options = { page: 1, pageSize: 20 }) => {
    try {
      return await axios.get(`${API_URL}/documents`, {
        params: {
          page: options.page,
          page_size: options.pageSize
        }
      });
    } catch (error) {
      console.error('Error in getDocuments:', error);
      throw error;
    }
  },

  getDocument: async (documentId: number) => {
    try {
      return await axios.get(`${API_URL}/documents/${documentId}`);
    } catch (error) {
      console.error('Error in getDocument:', error);
      throw error;
    }
  },
    
  getDocumentChunk: async (documentId: number, chunkIndex: number, chunkSize: number = 5000) => {
    try {
      return await axios.get(`${API_URL}/documents/${documentId}/chunks/${chunkIndex}`, {
        params: {
          chunk_size: chunkSize
        }
      });
    } catch (error) {
      console.error('Error in getDocumentChunk:', error);
      throw error;
    }
  },

  getDocumentParagraphs: async (documentId: number) => {
    try {
      return await axios.get(`${API_URL}/documents/${documentId}/paragraphs`);
    } catch (error) {
      console.error('Error in getDocumentParagraphs:', error);
      throw error;
    }
  },

  batchProcessDocuments: async (documentIds: number[], operation: string, params: any = {}) => {
    try {
      return await axios.post(`${API_URL}/documents/batch`, {
        document_ids: documentIds,
        operation,
        params
      });
    } catch (error) {
      console.error('Error in batchProcessDocuments:', error);
      throw error;
    }
  },

  deleteDocument: async (documentId: number) => {
    try {
      return await axios.delete(`${API_URL}/documents/${documentId}`);
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  },

  deleteAllDocuments: async () => {
    try {
      return await axios.delete(`${API_URL}/documents`);
    } catch (error) {
      console.error('Error in deleteAllDocuments:', error);
      throw error;
    }
  },

  queryDocuments: async (query: string, enableThemes: boolean = false, options: QueryOptions = {}) => {
    try {
      const requestData = {
        query: query,
        enable_themes: enableThemes,
        document_ids: options.documentIds || [],
        theme_count: options.themeCount || 3,
        relevance_threshold: options.relevanceThreshold || 0.7,
        advanced_mode: options.advancedMode || false,
        citation_level: options.citationLevel || 'paragraph'
      };

      return await axios.post(`${API_URL}/query`, requestData);
    } catch (error) {
      console.error('Error in queryDocuments:', error);
      throw error;
    }
  },

  getThemeCitations: async (themeId: number, citationLevel: 'document' | 'paragraph' | 'sentence' = 'paragraph') => {
    try {
      return await axios.get(`${API_URL}/themes/${themeId}/citations`, {
        params: {
          citation_level: citationLevel
        }
      });
    } catch (error) {
      console.error('Error in getThemeCitations:', error);
      throw error;
    }
  }
};

export default api; 