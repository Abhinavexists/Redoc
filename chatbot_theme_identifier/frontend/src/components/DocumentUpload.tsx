import React, { useState } from 'react';
import {
    Button,
    Box,
    Typography,
    LinearProgress,
    Alert, 
    Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../services/api.ts';

interface DocumentUploadProps {
    onUploadSuccess: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        try {
            setUploading(true);
            setError(null);
            setSuccess(false);
            
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);
            
            await api.UploadDocument(file);
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            setSuccess(true);
            setFile(null);
            onUploadSuccess();
            
            // Reset progress after a delay
            setTimeout(() => {
                setUploadProgress(0);
                setUploading(false);
            }, 1000);
            
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error uploading file');
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
                Upload Document
            </Typography>
            
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Supported formats: PDF, JPEG, PNG
                </Typography>
                
                <input
                    accept="application/pdf,image/jpeg,image/png"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                
                <label htmlFor="raised-button-file">
                    <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        disabled={uploading}
                    >
                        Select File
                    </Button>
                </label>
                
                {file && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Selected: {file.name}
                    </Typography>
                )}
            </Box>
            
            <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={!file || uploading}
                sx={{ mt: 1 }}
            >
                Upload
            </Button>
            
            {uploading && (
                <Box sx={{ width: '100%', mt: 2 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        {uploadProgress}% - Processing document...
                    </Typography>
                </Box>
            )}
            
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    Document uploaded successfully!
                </Alert>
            )}
        </Paper>
    );
};

export default DocumentUpload;