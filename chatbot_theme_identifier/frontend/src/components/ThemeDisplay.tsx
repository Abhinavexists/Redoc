import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import type { Theme } from '../types/index.ts';

interface ThemeDisplayProps {
  themes: Theme[];
}

const ThemeDisplay: React.FC<ThemeDisplayProps> = ({ themes }) => {
  if (!themes || themes.length === 0) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Identified Themes
      </Typography>
      
      {themes.map((theme, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Theme {index + 1}: {theme.theme_name}
          </Typography>
          
          <Typography variant="body1" paragraph>
            {theme.summary}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Supporting Documents:
            </Typography>
            <Box>
              {theme.supporting_documents.map((doc, idx) => (
                <Chip 
                  key={idx} 
                  label={doc} 
                  color="primary" 
                  variant="outlined" 
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>
            Evidence:
          </Typography>
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2">
              {theme.evidence}
            </Typography>
          </Box>
          
          {index < themes.length - 1 && <Divider sx={{ my: 2 }} />}
        </Box>
      ))}
    </Paper>
  );
};

export default ThemeDisplay;
