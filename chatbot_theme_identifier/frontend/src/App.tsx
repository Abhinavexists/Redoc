import React, { useState } from 'react';
import { 
  Container, 
  CssBaseline, 
  Box, 
  Typography, 
  AppBar, 
  Toolbar
} from '@mui/material';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import QueryInterface from './components/QueryInterface';
import ResultsDisplay from './components/ResultDisplay';
import ThemeDisplay from './components/ThemeDisplay';
import type { QueryResults } from './types/index.ts';

const App: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResults | null>(null);

  const handleUploadSuccess = () => {
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

  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Document Research & Theme Identification Chatbot
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          
          <DocumentList 
            refreshTrigger={refreshTrigger} 
            onSelectionChange={setSelectedDocuments}
          />
          
          <QueryInterface 
            onResults={handleResults} 
            selectedDocuments={selectedDocuments}
          />
          
          {queryResults && (
            <Box id="results-section">
              <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Results
              </Typography>
              
              <ResultsDisplay matches={queryResults.matches} />
              
              {queryResults.themes && queryResults.themes.length > 0 && (
                <ThemeDisplay themes={queryResults.themes} />
              )}
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
};

export default App;
