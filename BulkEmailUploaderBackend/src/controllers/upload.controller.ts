// import { Request, Response } from 'express';
// import { ExcelService } from '../services/excel.service';
// import { EmailService } from '../services/email.service';

// export class UploadController {
//   static async uploadExcel(req: Request, res: Response) {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//       }

//       const users = await ExcelService.parseExcel(req.file.buffer);
      
//       // Start sending emails (non-blocking)
//       EmailService.sendBulkEmails(users)
//         .then(({ success, failure }) => {
//           console.log(`Email sending completed. Success: ${success}, Failure: ${failure}`);
//         })
//         .catch(error => {
//           console.error('Bulk email sending error:', error);
//         });

//       res.json({
//         message: 'File uploaded successfully. Emails are being sent in the background.',
//         totalUsers: users.length
//       });
//     } catch (error) {
//       console.error('Error processing file:', error);
//       res.status(500).json({ 
//         error: 'Error processing file',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       });
//     }
//   }
// }



import { Request, Response } from 'express';
import { ExcelService } from '../services/excel.service';
import { BroadcastEmailService } from '../services/broadcast.service';

export class UploadController {
  static async uploadExcel(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Extract emails only from Excel
      const users = await ExcelService.parseExcel(req.file.buffer);
      const emails = users
        .map((user) => user.email?.toString().trim())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

      if (emails.length === 0) {
        return res.status(400).json({ error: 'No valid emails found in file' });
      }

      // Send using Resend broadcast (non-blocking)
      BroadcastEmailService.sendGreetingBroadcast(emails)
        .then(() => {
          console.log(`Broadcast sent to ${emails.length} recipients.`);
        })
        .catch((error) => {
          console.error('Broadcast error:', error);
        });

      res.json({
        message: 'File uploaded. Emails are being sent via broadcast.',
        totalEmails: emails.length,
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
