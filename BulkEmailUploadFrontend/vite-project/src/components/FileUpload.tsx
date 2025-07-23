import React, { useState } from 'react';
import { Button, LinearProgress, Typography, Paper, Box } from '@mui/material';
import axios from 'axios';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ 
    message: string; 
    totalUsers?: number 
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setUploadResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError(null);
      
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResult(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to upload file');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Bulk Email Sender
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        Upload an Excel file with user data (name, email, password) to send welcome emails.
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </Box>
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!file || uploading}
        >
          Upload and Send Emails
        </Button>
        
        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Uploading and processing file. Emails will be sent in the background...
            </Typography>
          </Box>
        )}
        
        {uploadResult && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="body1">
              {uploadResult.message}
            </Typography>
            {uploadResult.totalUsers && (
              <Typography variant="body2">
                Total users: {uploadResult.totalUsers}
              </Typography>
            )}
          </Box>
        )}
        
        {error && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          </Box>
        )}
      </form>
    </Paper>
  );
};

export default FileUpload;