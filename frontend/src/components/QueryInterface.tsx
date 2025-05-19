import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Search, Loader2, BookOpen, Settings, Lightbulb, AlertTriangle, BarChart3 } from 'lucide-react';
import api from '../services/api';
import documentProcessor from '../services/documentProcessor';
import type { QueryResults } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Slider } from './ui/slider.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.js';
import { Textarea } from './ui/textarea.js';
import { Progress } from './ui/progress';

interface QueryInterfaceProps {
  onResults: (results: QueryResults) => void;
  selectedDocuments?: number[];
}

const QueryInterface: React.FC<QueryInterfaceProps> = ({ 
  onResults,
  selectedDocuments = []
}) => {
  const [query, setQuery] = useState('');
  const [enableThemes, setEnableThemes] = useState(true);
  const [themeCount, setThemeCount] = useState(3);
  const [selectedTab, setSelectedTab] = useState('simple');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedQuery, setAdvancedQuery] = useState('');
  const [relevanceThreshold, setRelevanceThreshold] = useState(70);
  const [processingLargeDocumentSet, setProcessingLargeDocumentSet] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');

  const isLargeDocumentSet = selectedDocuments.length > 50;

  const handleSearch = async () => {
    const currentQuery = selectedTab === 'simple' ? query : advancedQuery;
    
    if (!currentQuery.trim()) {
      setError('Please enter a query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (isLargeDocumentSet) {
        setProcessingLargeDocumentSet(true);
        setProcessingProgress(0);
        setProcessingStage('Processing query');
        
        try {
          const results = await documentProcessor.analyzeQueryAgainstDocuments(
            currentQuery,
            selectedDocuments,
            enableThemes,
            {
              themeCount,
              relevanceThreshold: relevanceThreshold / 100,
              advancedMode: selectedTab === 'advanced'
            }
          );
          
          setProcessingProgress(100);
          setProcessingStage('Query complete');
          onResults(results);
          
        } catch (err: any) {
          setError(`Error processing large document set: ${err.message || 'Unknown error'}`);
        } finally {
          setProcessingLargeDocumentSet(false);
          setLoading(false);
        }
      } else {
        const response = await api.queryDocuments(
          currentQuery, 
          enableThemes,
          {
            documentIds: selectedDocuments,
            themeCount: themeCount,
            relevanceThreshold: relevanceThreshold / 100,
            advancedMode: selectedTab === 'advanced'
          }
        );
        
        onResults(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error processing query');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Research Query
        </CardTitle>
        <CardDescription>Ask a question about your documents to analyze themes and connections</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLargeDocumentSet && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700">
              You've selected {selectedDocuments.length} documents. Large document sets will be processed in batches.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple Query</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Query</TabsTrigger>
          </TabsList>
          
          <TabsContent value="simple" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="simple-query">Enter your research question</Label>
              <Input
                id="simple-query"
                placeholder="Example: What are the key arguments presented across these documents?"
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                disabled={loading}
                className={error && selectedTab === 'simple' ? "border-destructive" : ""}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="advanced-query">Enter a detailed research query</Label>
              <Textarea
                id="advanced-query"
                placeholder="Example: Identify arguments related to climate policy that appear in at least 3 documents. Focus on economic considerations and international cooperation aspects."
                value={advancedQuery}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAdvancedQuery(e.target.value)}
                disabled={loading}
                className={`min-h-[120px] ${error && selectedTab === 'advanced' ? "border-destructive" : ""}`}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center mb-4">
            <Settings className="h-5 w-5 mr-2 text-muted-foreground" />
            <h3 className="font-medium">Analysis Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="theme-mode"
                    checked={enableThemes}
                    onCheckedChange={setEnableThemes}
                  />
                  <Label htmlFor="theme-mode" className="flex items-center gap-1.5">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Identify themes across documents
                  </Label>
                </div>
                
                {enableThemes && (
                  <span className="text-xs text-muted-foreground">
                    Find {themeCount} theme{themeCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {enableThemes && (
                <div className="pl-8 mt-2">
                  <Label htmlFor="theme-count" className="text-xs text-muted-foreground mb-2 block">
                    Number of themes to identify ({themeCount})
                  </Label>
                  <Slider
                    id="theme-count"
                    min={1}
                    max={isLargeDocumentSet ? 10 : 5}
                    step={1}
                    value={[themeCount]}
                    onValueChange={(values: number[]) => setThemeCount(values[0])}
                    disabled={!enableThemes}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="relevance" className="text-xs text-muted-foreground flex justify-between">
                <span>Relevance threshold</span>
                <span>{relevanceThreshold}%</span>
              </Label>
              <Slider
                id="relevance"
                min={50}
                max={95}
                step={5}
                value={[relevanceThreshold]}
                onValueChange={(values: number[]) => setRelevanceThreshold(values[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>More results</span>
                <span>Higher quality</span>
              </div>
            </div>
          </div>
        </div>

        {processingLargeDocumentSet && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span>{processingStage}</span>
              <span>{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Processing large document sets can take several minutes.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedDocuments.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Searching in {selectedDocuments.length} selected document{selectedDocuments.length !== 1 ? 's' : ''}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Searching across all documents
            </div>
          )}
        </div>
        
        <Button
          onClick={handleSearch}
          disabled={loading || (selectedTab === 'simple' ? !query.trim() : !advancedQuery.trim())}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isLargeDocumentSet ? "Processing..." : "Analyzing..."}
            </>
          ) : (
            <>
              {isLargeDocumentSet ? (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Analyze Documents
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QueryInterface;
