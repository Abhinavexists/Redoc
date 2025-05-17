import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box
} from '@mui/material';
import type { DocumentMatch } from '../types/index.ts';

interface ResultsDisplayProps {
  matches: DocumentMatch[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Document Matches ({matches.length})
      </Typography>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document</TableCell>
              <TableCell>Extracted Answer</TableCell>
              <TableCell>Citation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map((match, index) => (
              <TableRow key={index}>
                <TableCell>{match.filename}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      maxHeight: '200px',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      p: 1,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    {match.matched_text}
                  </Box>
                </TableCell>
                <TableCell>{match.citation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ResultsDisplay;
