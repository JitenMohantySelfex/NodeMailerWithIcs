import { Request, Response } from 'express';
import { ExcelService } from '../services/excel.service';
import { EmailService } from '../services/email.service';

export class UploadController {
  static async uploadExcel(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const users = await ExcelService.parseExcel(req.file.buffer);
      
      // Start sending emails (non-blocking)
      EmailService.sendBulkEmails(users)
        .then(({ success, failure }) => {
          console.log(`Email sending completed. Success: ${success}, Failure: ${failure}`);
        })
        .catch(error => {
          console.error('Bulk email sending error:', error);
        });

      res.json({
        message: 'File uploaded successfully. Emails are being sent in the background.',
        totalUsers: users.length
      });
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ 
        error: 'Error processing file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}