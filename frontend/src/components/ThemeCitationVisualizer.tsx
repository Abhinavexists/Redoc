import React, { useState, useEffect } from 'react';
import { BookOpen, MessageSquare, Layers, BarChart3, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger} from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import api from '../services/api';

interface ThemeCitationVisualizerProps {
  themeId: number;
  themeName: string;
  onDocumentView?: (documentId: number) => void;
  themeColor?: { bg: string; text: string; border: string; light: string };
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
  onDocumentView,
  themeColor = { 
    bg: 'bg-purple-100', 
    text: 'text-purple-800', 
    border: 'border-purple-200', 
    light: 'bg-purple-50' 
  }
}) => {
  const [citationLevel, setCitationLevel] = useState<'document' | 'paragraph' | 'sentence'>('paragraph');
  const [citations, setCitations] = useState<ThemeCitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCitations();
  }, [themeId, citationLevel]);

  const fetchCitations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getThemeCitations(themeId, citationLevel);
      setCitations(response.data.citations);
    } catch (err) {
      console.error('Error fetching theme citations:', err);
      setError('Failed to load citations. Please try again.');
      setCitations([]);
    } finally {
      setLoading(false);
    }
  };

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
            <span className={themeColor.text}>Theme Citations: {themeName}</span>
          </div>
          <Badge variant="outline" className={`${themeColor.bg} ${themeColor.text}`}>
            {citationLevel}
          </Badge>
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
              onClick={fetchCitations} 
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
                  className={`border p-3 rounded-md ${themeColor.light}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className={`h-4 w-4 ${themeColor.text}`} />
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
                  
                  <div className="mt-2 text-sm border rounded p-2 bg-white">
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