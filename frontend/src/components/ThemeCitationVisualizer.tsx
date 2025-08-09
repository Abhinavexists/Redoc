import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, MessageSquare, Layers, BarChart3, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger} from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import type { DocumentMatch } from '../types';

interface ThemeCitationVisualizerProps {
  themeId: number;
  themeName: string;
  supportingDocuments?: string[];
  matches?: DocumentMatch[];
  onDocumentView?: (documentId: number) => void;
}

interface ThemeCitation {
  theme_id: number;
  document_id: number;
  citation_type: 'document' | 'paragraph' | 'sentence';
  reference_id: string;
  content: string;
  relevance: number;
  citation: string;
  paragraph_index?: number;
  sentence_index?: number;
}

const ThemeCitationVisualizer: React.FC<ThemeCitationVisualizerProps> = ({
  themeId,
  themeName,
  supportingDocuments = [],
  matches = [],
  onDocumentView
}) => {
  const [citationLevel, setCitationLevel] = useState<'document' | 'paragraph' | 'sentence'>('paragraph');
  const [citations, setCitations] = useState<ThemeCitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [] as DocumentMatch[];
    if (!supportingDocuments || supportingDocuments.length === 0) return matches;
    const supportSet = new Set(supportingDocuments.map(s => s.toLowerCase()));
    return matches.filter(m => supportSet.has((m.filename || '').toLowerCase()));
  }, [matches, supportingDocuments]);

  useEffect(() => {
    // Build citations client-side from matches for real data
    try {
      setLoading(true);
      setError(null);
      if (!filteredMatches || filteredMatches.length === 0) {
        setCitations([]);
        setLoading(false);
        return;
      }

      if (citationLevel === 'document') {
        // One citation per document: pick best match per doc
        const bestPerDoc = new Map<number, DocumentMatch>();
        for (const m of filteredMatches) {
          const prev = bestPerDoc.get(m.id);
          if (!prev || (m.relevance || 0) > (prev.relevance || 0)) {
            bestPerDoc.set(m.id, m);
          }
        }
        const built: ThemeCitation[] = Array.from(bestPerDoc.entries()).map(([docId, m]) => ({
          theme_id: themeId,
          document_id: docId,
          citation_type: 'document',
          reference_id: String(docId),
          content: m.matched_text,
          relevance: m.relevance,
          citation: m.citation,
        }));
        setCitations(built);
      } else if (citationLevel === 'paragraph') {
        const built: ThemeCitation[] = filteredMatches.map((m) => ({
          theme_id: themeId,
          document_id: m.id,
          citation_type: 'paragraph',
          reference_id: m.paragraph !== undefined ? `para-${m.paragraph}` : String(m.id),
          content: m.matched_text,
          relevance: m.relevance,
          paragraph_index: m.paragraph,
          citation: m.citation,
        }));
        setCitations(built);
      } else {
        // sentence level when available; fallback to paragraph
        const built: ThemeCitation[] = filteredMatches.map((m) => ({
          theme_id: themeId,
          document_id: m.id,
          citation_type: 'sentence',
          reference_id: m.paragraph !== undefined ? `para-${m.paragraph}` : String(m.id),
          content: m.matched_text,
          relevance: m.relevance,
          paragraph_index: m.paragraph,
          citation: m.citation,
          // we don't have sentence_index consistently; leave undefined if missing
        }));
        setCitations(built);
      }
    } catch (err) {
      console.error('Error building citations:', err);
      setError('Failed to build citations.');
      setCitations([]);
    } finally {
      setLoading(false);
    }
  }, [filteredMatches, citationLevel, themeId]);

  const handleDocumentClick = (documentId: number) => {
    if (onDocumentView) {
      onDocumentView(documentId);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Theme Citations: {themeName}</span>
          </div>
          <Badge variant="secondary">{citationLevel}</Badge>
        </CardTitle>
        
        <Tabs 
          defaultValue={citationLevel} 
          className="mt-2"
          onValueChange={(value) => setCitationLevel(value as 'document' | 'paragraph' | 'sentence')}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="document" className="text-xs">
              <Layers className="h-3 w-3 mr-1" /> Document
            </TabsTrigger>
            <TabsTrigger value="paragraph" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" /> Paragraph
            </TabsTrigger>
            <TabsTrigger value="sentence" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" /> Sentence
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-red-500 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setError(null)} 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : citations.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">No citations found at this level.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              {citations.map((citation) => (
                <div 
                  key={`${citation.document_id}-${citation.reference_id}`} 
                  className={`border p-3 rounded-md bg-card`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className={`h-4 w-4 text-primary`} />
                      <span className="text-sm font-medium">{citation.citation}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        Relevance: {(citation.relevance * 100).toFixed(0)}%
                      </Badge>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => handleDocumentClick(citation.document_id)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm border rounded p-2 bg-card">
                    <div className="whitespace-pre-wrap">{citation.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ThemeCitationVisualizer; 