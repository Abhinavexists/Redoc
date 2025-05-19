export interface Document {
  id: number;
  filename: string;
  filetype: string;
  uploaded_at: string;
  content_path?: string;
  content?: string;
  pages?: number;
  metadata?: {
    author?: string;
    created?: string;
    modified?: string;
    size?: string;
    type?: string;
    pages?: number;
  };
}

export interface DocumentParagraph {
  id: string;
  document_id: number;
  paragraph_index: number;
  content: string;
  position: {
    start: number;
    end: number;
  };
}

export interface DocumentSentence {
  id: string;
  document_id: number;
  paragraph_index: number;
  sentence_index: number;
  content: string;
  position: {
    start: number;
    end: number;
  };
}

export interface Theme {
  id: number;
  theme_name: string;
  summary: string;
  supporting_documents: string[];
  evidence: string;
  relevance?: number;
}

export interface ThemeCitation {
  theme_id: number;
  document_id: number;
  citation_type: 'document' | 'paragraph' | 'sentence';
  reference_id: string; // document_id, paragraph_id, or sentence_id
  content: string;
  relevance: number;
  paragraph_index?: number;
  sentence_index?: number;
  position?: {
    start: number;
    end: number;
  };
}

export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  authors?: string[];
  documentTypes?: string[];
  relevanceRange?: {
    min: number;
    max: number;
  };
}

export interface QueryResults {
  matches?: any[];
  themes?: Theme[];
}

export interface ThemeNode {
  id: string;
  name: string;
  type: 'theme';
  relevance: number;
  group: number;
}

export interface DocumentNode {
  id: string;
  name: string;
  type: 'document';
  group: number;
}

export interface CitationLink {
  source: string;
  target: string;
  relevance: number;
  value: number;
}

export interface DocumentMatch {
  id: number;
  filename: string;
  matched_text: string;
  paragraph?: number;
  page?: number;
  relevance: number;
  citation: string;
} 