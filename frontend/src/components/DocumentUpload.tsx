import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, X } from 'lucide-react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import axios from 'axios';

interface DocumentUploadProps {
    onUploadSuccess: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cancelUploadRef = useRef<(() => void) | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const selectedFile = event.target.files[0];
            console.log("File selected:", selectedFile.name, "Size:", selectedFile.size, "Type:", selectedFile.type);
            
            // Validate file size (100MB max)
            if (selectedFile.size > 100 * 1024 * 1024) {
                setError('File too large. Maximum size is 100MB.');
                return;
            }
            
            // Validate file type
            if (!['application/pdf', 'image/jpeg', 'image/png'].includes(selectedFile.type)) {
                setError('Invalid file type. Only PDF, JPEG, and PNG are supported.');
                return;
            }
            
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleSelectFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };
    
    const handleCancelUpload = () => {
        if (cancelUploadRef.current) {
            cancelUploadRef.current();
        }
        setUploading(false);
        setUploadProgress(0);
        setError('Upload canceled');
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        try {
            console.log("Starting upload for file:", file.name);
            setUploading(true);
            setError(null);
            setSuccess(false);
            setUploadProgress(0);
            
            // Create an axios cancel token source
            const source = axios.CancelToken.source();
            cancelUploadRef.current = () => source.cancel('Upload canceled by user');
            
            // Setup progress tracking
            const originalPost = axios.post;
            const customPost = async (url: string, data: FormData, config: any) => {
                // Add progress tracking
                const progressConfig = {
                    ...config,
                    onUploadProgress: (progressEvent: any) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                        console.log(`Upload progress: ${percentCompleted}%`);
                    },
                    cancelToken: source.token
                };
                
                return originalPost(url, data, progressConfig);
            };
            
            // Temporarily override axios.post
            // @ts-ignore
            axios.post = customPost;
            
            const response = await api.uploadDocument(file);
            console.log("Upload response:", response);
            
            // Restore original axios.post
            // @ts-ignore
            axios.post = originalPost;
            
            setUploadProgress(100);
            setSuccess(true);
            setFile(null);
            
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            onUploadSuccess();
            
            // Reset progress after a delay
            setTimeout(() => {
                setUploadProgress(0);
                setUploading(false);
            }, 2000);
            
        } catch (err: any) {
            console.error("Upload error:", err);
            
            let errorMessage = 'Error uploading file';
            
            if (err.code === 'ECONNABORTED') {
                errorMessage = 'Upload timeout - The server took too long to respond';
            } else if (axios.isCancel(err)) {
                errorMessage = 'Upload canceled';
            } else if (err.response) {
                errorMessage = err.response.data?.detail || 'Server error';
            }
            
            setError(errorMessage);
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-xl">Upload Document</CardTitle>
                <CardDescription>Add new documents to your research database</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                        Supported formats: PDF, JPEG, PNG (max 100MB)
                    </p>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <input
                                ref={fileInputRef}
                                accept="application/pdf,image/jpeg,image/png"
                                className="hidden"
                                id="raised-button-file"
                                type="file"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                            
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                disabled={uploading}
                                size="sm"
                                onClick={handleSelectFile}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                SELECT FILE
                            </Button>
                            
                            {!uploading ? (
                                <Button
                                    type="button"
                                    variant="default"
                                    className="gap-1"
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                >
                                    <Upload className="h-4 w-4" />
                                    UPLOAD
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="gap-1"
                                    onClick={handleCancelUpload}
                                >
                                    <X className="h-4 w-4" />
                                    CANCEL
                                </Button>
                            )}
                        </div>
                        
                        {file && (
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-primary" />
                                <span>{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {uploading && (
                        <div className="mt-4 space-y-2">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-center text-muted-foreground">
                                {uploadProgress < 100 
                                    ? `${uploadProgress}% - Uploading...` 
                                    : "100% - Processing document..."}
                            </p>
                        </div>
                    )}
                    
                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    {success && (
                        <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                            <Check className="h-4 w-4" />
                            <AlertDescription>Document uploaded successfully!</AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default DocumentUpload;