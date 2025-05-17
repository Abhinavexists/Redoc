import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  CircularProgress,
  Box,
  Chip
} from '@mui/material';
import api from '../services/api';
import type { Document } from '../types/index.ts';

interface DocumentListProps {
  refreshTrigger: number;
  onSelectionChange?: (selectedDocs: number[]) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  refreshTrigger,
  onSelectionChange 
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getDocuments();
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedDocuments(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(docId => docId !== id)
        : [...prev, id];
      
      if (onSelectionChange) {
        onSelectionChange(newSelection);
      }
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    } else {
      const allIds = documents.map(doc => doc.id);
      setSelectedDocuments(allIds);
      if (onSelectionChange) {
        onSelectionChange(allIds);
      }
    }
  };

  const getFileTypeChip = (filetype: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    let label = filetype;
    
    if (filetype.includes('pdf')) {
      color = 'error';
      label = 'PDF';
    } else if (filetype.includes('image')) {
      color = 'primary';
      label = filetype.split('/')[1].toUpperCase();
    }
    
    return <Chip size="small" color={color} label={label} />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Documents ({documents.length})
      </Typography>
      
      {documents.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No documents uploaded yet. Upload documents to start analyzing.
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedDocuments.length > 0 && selectedDocuments.length < documents.length}
                    checked={documents.length > 0 && selectedDocuments.length === documents.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Filename</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Uploaded</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow 
                  key={doc.id}
                  selected={selectedDocuments.includes(doc.id)}
                  hover
                  onClick={() => handleToggleSelect(doc.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedDocuments.includes(doc.id)} />
                  </TableCell>
                  <TableCell>{doc.id}</TableCell>
                  <TableCell>{doc.filename}</TableCell>
                  <TableCell>{getFileTypeChip(doc.filetype)}</TableCell>
                  <TableCell>
                    {new Date(doc.uploaded_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default DocumentList;
