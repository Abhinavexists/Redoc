import React, { useState, useEffect } from 'react';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import QueryInterface from './components/QueryInterface';
import ResultsDisplay from './components/ResultDisplay';
import ThemeDisplay from './components/ThemeDisplay';
import LargeDocumentAnalyzer from './components/LargeDocumentAnalyzer';
import Header from './components/Header';
import { Toaster } from './components/ui/toaster';
import type { QueryResults, Theme } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

const App: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResults | null>(null);
  const [activeTab, setActiveTab] = useState<'query' | 'batch'>('query');
  const [identifiedThemes, setIdentifiedThemes] = useState<Theme[]>([]);

  // Determine if we're dealing with a large document set
  const isLargeDocumentSet = selectedDocuments.length > 50;

  useEffect(() => {
    // If a large document set is selected, suggest batch analysis
    if (isLargeDocumentSet && activeTab === 'query') {
      setActiveTab('batch');
    }
  }, [selectedDocuments.length, isLargeDocumentSet]);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDocumentsChange = () => {
    // Clear query results when documents change
    setQueryResults(null);
    setIdentifiedThemes([]);
    // Update refresh trigger to reload documents
    setRefreshTrigger(prev => prev + 1);
  };

  const handleResults = (results: QueryResults) => {
    setQueryResults(results);
    // Scroll to results
    setTimeout(() => {
      const resultsElement = document.getElementById('results-section');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleBatchAnalysisComplete = (themes: Theme[]) => {
    setIdentifiedThemes(themes);
    // Scroll to results
    setTimeout(() => {
      const resultsElement = document.getElementById('results-section');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <DocumentUpload onUploadSuccess={handleUploadSuccess} />
        
        <DocumentList 
          refreshTrigger={refreshTrigger} 
          onSelectionChange={setSelectedDocuments}
          onDocumentsChange={handleDocumentsChange}
        />
        
        {selectedDocuments.length > 0 && (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(val: string) => setActiveTab(val as 'query' | 'batch')}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="query">Research Query</TabsTrigger>
                <TabsTrigger value="batch">Batch Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="query" className="pt-4">
                <QueryInterface 
                  onResults={handleResults} 
                  selectedDocuments={selectedDocuments}
                />
              </TabsContent>
              
              <TabsContent value="batch" className="pt-4">
                <LargeDocumentAnalyzer 
                  documentIds={selectedDocuments}
                  onComplete={handleBatchAnalysisComplete}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {selectedDocuments.length === 0 && (
          <QueryInterface 
            onResults={handleResults} 
            selectedDocuments={selectedDocuments}
          />
        )}
        
        {(queryResults || identifiedThemes.length > 0) && (
          <div id="results-section" className="pt-4">
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Results
            </h2>
            
            <div className="space-y-6">
              {queryResults && queryResults.matches && queryResults.matches.length > 0 && (
                <ResultsDisplay matches={queryResults.matches} />
              )}
              
              {queryResults && queryResults.themes && queryResults.themes.length > 0 && (
                <ThemeDisplay themes={queryResults.themes} />
              )}
              
              {identifiedThemes.length > 0 && !queryResults && (
                <ThemeDisplay themes={identifiedThemes} />
              )}
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default App;
