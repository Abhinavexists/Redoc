import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';
import type { QueryResults } from '../types/index.ts';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.queryDocuments(query, enableThemes);
      onResults(response.data);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error processing query');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Research Query
      </Typography>
      
      <TextField
        fullWidth
        label="Enter your research question"
        variant="outlined"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={loading}
        error={!!error}
        helperText={error}
        sx={{ mb: 2 }}
      />
      
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <FormControlLabel
          control={
            <Switch
              checked={enableThemes}
              onChange={(e) => setEnableThemes(e.target.checked)}
              color="primary"
            />
          }
          label="Identify themes across documents"
        />
        
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
          onClick={handleSearch}
          disabled={loading || !query.trim()}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </Box>
      
      {selectedDocuments.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Searching in {selectedDocuments.length} selected documents
        </Typography>
      )}
    </Paper>
  );
};

export default QueryInterface;
