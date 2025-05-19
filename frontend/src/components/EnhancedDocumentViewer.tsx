import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, ChevronLeft, ChevronRight, Download, Loader2, Highlighter, BookOpen, AlignJustify, Text } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs.js';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Document, ThemeCitation } from '../types';
import api from '../services/api';

interface EnhancedDocumentViewerProps {
  documentId: number;
  highlightedCitations?: ThemeCitation[];
  selectedTheme?: number | null; 
  citationLevel?: 'document' | 'paragraph' | 'sentence';
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const EnhancedDocumentViewer: React.FC<EnhancedDocumentViewerProps> = ({
  documentId,
  highlightedCitations = [],
  selectedTheme = null,
  citationLevel = 'paragraph',
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
}) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [documentParagraphs, setDocumentParagraphs] = useState<string[]>([]);
  const [highlightedSections, setHighlightedSections] = useState<Record<number, {relevance: number, themeId?: number}>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [viewMode, setViewMode] = useState<'document' | 'paragraph' | 'sentence'>(citationLevel);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  useEffect(() => {
    if (highlightedCitations && highlightedCitations.length > 0) {
      // Process citations to create highlight map
      const newHighlightedSections: Record<number, {relevance: number, themeId?: number}> = {};
      
      highlightedCitations.forEach(citation => {
        if (citation.citation_type === 'paragraph' && citation.paragraph_index !== undefined) {
          newHighlightedSections[citation.paragraph_index] = {
            relevance: citation.relevance,
            themeId: citation.theme_id
          };
        }
      });
      
      setHighlightedSections(newHighlightedSections);
    } else {
      setHighlightedSections({});
    }
  }, [highlightedCitations]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getDocument(documentId);
      const documentData = response.data;
      
      setDocument(documentData);
      
      // Split document content into paragraphs
      if (documentData.content) {
        const paragraphs = documentData.content.split('\n\n').filter((p: { trim: () => { (): any; new(): any; length: number; }; }) => p.trim().length > 0);
        setDocumentParagraphs(paragraphs);
      }
    } catch (err: any) {
      setError(`Failed to load document: ${err.message || 'Unknown error'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToHighlightedSection = (paragraphIndex: number) => {
    if (contentRef.current) {
      const paragraphElements = contentRef.current.querySelectorAll('.document-paragraph');
      if (paragraphElements && paragraphElements.length > paragraphIndex) {
        paragraphElements[paragraphIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const getHighlightColor = (relevance: number, themeId?: number) => {
    // If highlighting for a specific theme
    if (selectedTheme && themeId && selectedTheme !== themeId) {
      return 'transparent';
    }
    
    // Color based on relevance
    if (relevance > 0.9) return 'bg-yellow-100 dark:bg-yellow-900/30'; 
    if (relevance > 0.7) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-yellow-50/50 dark:bg-yellow-900/10';
  };

  const renderParagraphWithSentences = (paragraph: string, paragraphIndex: number) => {
    const isHighlighted = highlightedSections[paragraphIndex];
    const highlightClass = isHighlighted ? getHighlightColor(isHighlighted.relevance, isHighlighted.themeId) : '';
    
    if (viewMode === 'paragraph') {
      return (
        <div 
          key={paragraphIndex} 
          className={`document-paragraph mb-4 p-2 rounded ${highlightClass} transition-colors`}
          onClick={() => isHighlighted && scrollToHighlightedSection(paragraphIndex)}
        >
          <div className="text-xs text-muted-foreground mb-1">¶{paragraphIndex + 1}</div>
          {paragraph}
        </div>
      );
    }
    
    // For sentence view, split paragraph into sentences
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    
    return (
      <div key={paragraphIndex} className="document-paragraph mb-4">
        <div className="text-xs text-muted-foreground mb-1">¶{paragraphIndex + 1}</div>
        {sentences.map((sentence, sentenceIndex) => {
          // In a real implementation, we'd have sentence-level highlighting information
          const sentenceKey = `${paragraphIndex}-${sentenceIndex}`;
          const isHighlighted = highlightedSections[paragraphIndex]; // For now, use paragraph highlighting
          const highlightClass = isHighlighted ? getHighlightColor(isHighlighted.relevance, isHighlighted.themeId) : '';
          
          return (
            <span 
              key={sentenceKey} 
              className={`${highlightClass} ${isHighlighted ? 'rounded px-1 py-0.5' : ''}`}
            >
              {sentence}{' '}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <CardContent className="bg-background p-6 rounded-lg shadow-xl w-full max-w-3xl">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading document data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <CardContent className="bg-background p-6 rounded-lg shadow-xl w-full max-w-3xl">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-2">Error</div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!document) {
    return null;
  }

  const hasHighlightedSections = Object.keys(highlightedSections).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="truncate max-w-[400px]">
                {document.filename}
              </span>
              <Badge variant="outline" className="ml-2">
                {document.filetype && document.filetype.includes('pdf') ? 'PDF' : 
                 document.filetype && document.filetype.includes('image') ? 'IMAGE' : 
                 document.filetype || 'PDF'}
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <div className="border-b px-6 py-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <CardContent className="flex-1 overflow-hidden">
          <TabsContent value="content" className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted-foreground">
                {hasHighlightedSections ? 
                  `${Object.keys(highlightedSections).length} highlighted sections` : 
                  'No highlighted sections'}
              </div>
              
              <ToggleGroup type="single" value={viewMode} onValueChange={(value: any) => value && setViewMode(value as any)}>
                <ToggleGroupItem value="document" aria-label="View as document">
                  <BookOpen className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="paragraph" aria-label="View by paragraph">
                  <AlignJustify className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="sentence" aria-label="View by sentence">
                  <Text className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <ScrollArea className="h-[calc(100vh-260px)]">
              <div className="p-4 text-sm leading-relaxed" ref={contentRef}>
                {documentParagraphs.map((paragraph, index) => 
                  renderParagraphWithSentences(paragraph, index)
                )}
              </div>
            </ScrollArea>
            
            {hasHighlightedSections && (
              <div className="mt-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Highlighter className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Citation Legend:</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30"></div>
                    <span>Strong match</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-50 dark:bg-yellow-900/20"></div>
                    <span>Medium match</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-50/50 dark:bg-yellow-900/10"></div>
                    <span>Weak match</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="metadata" className="h-full">
            <div className="p-4">
              <h3 className="text-sm font-medium mb-3">Document Information</h3>
              <div className="bg-muted/30 rounded-md border p-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">File Name:</dt>
                  <dd className="font-medium">{document.filename}</dd>
                  
                  <dt className="text-muted-foreground">File Type:</dt>
                  <dd className="font-medium">{document.filetype || document.metadata?.type || 'Unknown'}</dd>
                  
                  <dt className="text-muted-foreground">Size:</dt>
                  <dd className="font-medium">{document.metadata?.size || 'Unknown'}</dd>
                  
                  <dt className="text-muted-foreground">Author:</dt>
                  <dd className="font-medium">{document.metadata?.author || 'Unknown'}</dd>
                  
                  <dt className="text-muted-foreground">Created:</dt>
                  <dd className="font-medium">{document.metadata?.created || 'Unknown'}</dd>
                  
                  <dt className="text-muted-foreground">Modified:</dt>
                  <dd className="font-medium">{document.metadata?.modified || 'Unknown'}</dd>
                  
                  <dt className="text-muted-foreground">Pages:</dt>
                  <dd className="font-medium">{document.pages || document.metadata?.pages || 'Unknown'}</dd>
                  
                  <dt className="text-muted-foreground">Uploaded:</dt>
                  <dd className="font-medium">{new Date(document.uploaded_at).toLocaleString()}</dd>
                  
                  <dt className="text-muted-foreground">Document ID:</dt>
                  <dd className="font-medium">{document.id}</dd>
                </dl>
              </div>
            </div>
          </TabsContent>
        </CardContent>
        
        <CardFooter className="border-t py-3 flex justify-between">
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!hasPrevious} 
              onClick={onPrevious}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Doc
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!hasNext} 
              onClick={onNext}
              className="gap-1"
            >
              Next Doc
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EnhancedDocumentViewer; 