import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import type { GridPaginationModel } from '@mui/x-data-grid';
import axios from 'axios';
import { useWebSocket } from '../contexts/WebSocketContext';
import { List, ListItem, ListItemText, Typography } from '@mui/material';

interface EmailLog {
  id: string;
  email: string;
  status: 'sent' | 'failed';
  error?: string;
  timestamp: string;
}

const EmailLogs: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
   const { failedEmails } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/emails', {
          params: {
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize
          }
        });
        
        const formattedLogs = response.data.docs.map((log: any) => ({
          id: log._id,
          email: log.email,
          status: log.status,
          error: log.error,
          timestamp: new Date(log.timestamp).toLocaleString()
        }));
        
        setLogs(formattedLogs);
        setTotalCount(response.data.totalDocs);
      } catch (error) {
        console.error('Error fetching email logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [paginationModel]);

  const columns: GridColDef[] = [
    { field: 'email', headerName: 'Email', width: 250 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <span style={{ 
          color: params.value === 'sent' ? 'green' : 'red',
          fontWeight: 'bold'
        }}>
          {params.value}
        </span>
      )
    },
    { field: 'error', headerName: 'Error', width: 300 },
    { field: 'timestamp', headerName: 'Timestamp', width: 200 }
  ];

  return (
    <div style={{ height: 500, width: '100%', marginTop: 20 }}>
      <DataGrid
        rows={logs}
        columns={columns}
        loading={loading}
        paginationMode="server"
        rowCount={totalCount}
        pageSizeOptions={[10, 20, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        
      />
      {failedEmails.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <Typography variant="h6">Failed Emails (Real-time)</Typography>
          <List dense>
            {failedEmails.map((item, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={item.email}
                  secondary={item.error}
                />
              </ListItem>
            ))}
          </List>
        </div>
      )}
    </div>
  );
};

export default EmailLogs;