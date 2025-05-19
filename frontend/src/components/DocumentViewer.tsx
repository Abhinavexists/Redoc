import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs.js';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface DocumentViewerProps {
  documentId: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

interface DocumentChunk {
  index: number;
  content: string;
  isLoaded: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
}) => {
  const [document, setDocument] = useState<any>(null);
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chunkLoading, setChunkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [error, setError] = useState<string | null>(null);

  const CHUNK_SIZE = 5000; // characters per chunk for efficient loading

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would be an actual API call
        // For demonstration, we'll simulate the response
        setTimeout(async () => {
          try {
            // In a production environment, replace this with:
            // const response = await api.getDocument(documentId);
            // const documentData = response.data;
            
            const documentData = {
              id: documentId,
              filename: `Document_${documentId}.pdf`,
              filetype: 'application/pdf',
              uploaded_at: new Date().toISOString(),
              content: `This is the content of document ${documentId}. It contains multiple paragraphs of text that can be analyzed by the AI.\n\nParagraph 2 contains additional information about the topic. The text continues with relevant details that might be used for theme identification.\n\nParagraph 3 discusses some important points related to the document's main subject. This helps establish connections between different documents.\n\nParagraph 4 provides a conclusion or summary of the main points covered in this document.`,
              metadata: {
                author: 'Jane Doe',
                created: '2023-10-15',
                modified: '2023-11-02',
                type: 'application/pdf',
                size: '1.2 MB',
                pages: 5
              }
            };
            
            setDocument(documentData);
            initializeChunks(documentData);
          } catch (err) {
            console.error('Error fetching document:', err);
            setError('Failed to load document details');
          } finally {
            setLoading(false);
          }
        }, 800); // Simulating network delay
      } catch (err) {
        setError('Failed to load document details');
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [documentId]);

  const initializeChunks = useCallback((docData: any) => {
    // Calculate how many chunks we need based on content length
    if (!docData.content) {
      setDocumentChunks([{ index: 0, content: 'Document has no content', isLoaded: true }]);
      return;
    }
    
    const contentLength = docData.content.length;
    const chunkCount = Math.ceil(contentLength / CHUNK_SIZE);
    
    // Create placeholder chunks
    const chunks: DocumentChunk[] = [];
    
    // Load first chunk immediately
    chunks.push({
      index: 0,
      content: docData.content.slice(0, CHUNK_SIZE),
      isLoaded: true
    });
    
    // Create placeholders for remaining chunks
    for (let i = 1; i < chunkCount; i++) {
      chunks.push({
        index: i,
        content: '',
        isLoaded: false
      });
    }
    
    setDocumentChunks(chunks);
  }, []);

  const loadChunk = useCallback(async (chunkIndex: number) => {
    if (chunkIndex < 0 || !document || !documentChunks[chunkIndex]) return;
    
    // Don't reload already loaded chunks
    if (documentChunks[chunkIndex].isLoaded) {
      setCurrentChunk(chunkIndex);
      return;
    }
    
    setChunkLoading(true);
    
    try {
      // In a real implementation, this would be an API call to get a specific document chunk
      // For now, we're simulating with the full document content
      const startPos = chunkIndex * CHUNK_SIZE;
      const endPos = Math.min(startPos + CHUNK_SIZE, document.content.length);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const chunkContent = document.content.slice(startPos, endPos);
      
      setDocumentChunks(prevChunks => {
        const newChunks = [...prevChunks];
        newChunks[chunkIndex] = {
          ...newChunks[chunkIndex],
          content: chunkContent,
          isLoaded: true
        };
        return newChunks;
      });
      
      setCurrentChunk(chunkIndex);
    } catch (err) {
      console.error('Failed to load document chunk', err);
    } finally {
      setChunkLoading(false);
    }
  }, [document, documentChunks]);

  const handleNextChunk = () => {
    if (currentChunk < documentChunks.length - 1) {
      loadChunk(currentChunk + 1);
    }
  };

  const handlePrevChunk = () => {
    if (currentChunk > 0) {
      loadChunk(currentChunk - 1);
    }
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
            <div className="text-red-500 mb-2">Error loading document</div>
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

  const formatParagraphs = (text: string) => {
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-4 last:mb-0">
        <span className="text-xs text-muted-foreground mr-2">¶{index + 1}</span>
        {paragraph}
      </p>
    ));
  };

  const currentContent = documentChunks[currentChunk]?.content || '';
  const hasNextChunk = currentChunk < documentChunks.length - 1;
  const hasPrevChunk = currentChunk > 0;

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
          <TabsContent value="content" className="h-full">
            {chunkLoading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            <ScrollArea className="h-[calc(100vh-260px)]">
              <div className="p-4 text-sm leading-relaxed">
                {formatParagraphs(currentContent)}
              </div>
            </ScrollArea>
            
            {documentChunks.length > 1 && (
              <div className="flex justify-between items-center mt-4 px-4 py-2 bg-muted/30 rounded-md">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrevChunk}
                  onClick={handlePrevChunk}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Section
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  Section {currentChunk + 1} of {documentChunks.length}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNextChunk}
                  onClick={handleNextChunk}
                  className="gap-1"
                >
                  Next Section
                  <ChevronRight className="h-4 w-4" />
                </Button>
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
                  <dd className="font-medium">{document.uploaded_at ? new Date(document.uploaded_at).toLocaleString() : 'Unknown'}</dd>
                  
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

export default DocumentViewer; 