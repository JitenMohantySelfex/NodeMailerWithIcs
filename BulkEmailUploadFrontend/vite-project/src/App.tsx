import React from 'react';
import { Container, CssBaseline, Typography } from '@mui/material';
import FileUpload from './components/FileUpload';
import EmailLogs from './components/EmailLogs';
import { WebSocketProvider } from './contexts/WebSocketContext';

const App: React.FC = () => {
  return (
    <WebSocketProvider>

      <CssBaseline />
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 3, textAlign: 'center' }}>
          Bulk Email Sender with Amazon SES
        </Typography>
        <FileUpload />
        <EmailLogs />
      </Container>
    </WebSocketProvider>
  );
};

export default App;