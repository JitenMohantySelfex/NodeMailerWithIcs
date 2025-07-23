import { Request, Response } from 'express';
import { EmailLog } from '../models/emailLog.model';

export class EmailController {
  static async getEmailLogs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: { timestamp: -1 }
      };

      const result = await EmailLog.paginate({}, options);
      
      res.json({
        docs: result.docs,
        totalDocs: result.totalDocs,
        limit: result.limit,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      });
    } catch (error) {
      console.error('Error fetching email logs:', error);
      res.status(500).json({ 
        error: 'Error fetching email logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}