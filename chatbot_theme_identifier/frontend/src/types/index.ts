export interface Document {
    id: number;
    filename: string;
    filetype: string;
    uploaded_at: string;
    content_path: string;
}

export interface DocumentMatch {
    matched_text: string;
    filename: string;
    citation: string;
}

export interface Theme {
    theme_name: string;
    summary: string;
    supporting_documents: string[];
    evidence: string;
}

export interface QueryResults {
    matches: DocumentMatch[];
    themes: Theme[];
}
