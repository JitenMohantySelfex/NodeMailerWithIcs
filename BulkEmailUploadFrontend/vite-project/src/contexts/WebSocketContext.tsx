import React, { createContext, useContext, useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import ReconnectingWebSocket from 'reconnecting-websocket';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface WebSocketContextType {
  failedEmails: Array<{ email: string; error: string }>;
}

const WebSocketContext = createContext<WebSocketContextType>({
  failedEmails: []
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [failedEmails, setFailedEmails] = useState<Array<{ email: string; error: string }>>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [currentError, setCurrentError] = useState<{ email: string; error: string } | null>(null);

  useEffect(() => {
    const socket = new ReconnectingWebSocket('ws://localhost:5000');

    socket.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      if (message.type === 'EMAIL_FAILED') {
        const { email, error } = message.data;
        setFailedEmails(prev => [...prev, { email, error }]);
        setCurrentError({ email, error });
        setOpenSnackbar(true);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <WebSocketContext.Provider value={{ failedEmails }}>
      {children}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          Failed to send email to {currentError?.email}: {currentError?.error}
        </Alert>
      </Snackbar>
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);