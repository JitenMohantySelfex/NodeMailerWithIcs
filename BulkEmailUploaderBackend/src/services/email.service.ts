import { SES } from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { EmailLog } from '../models/emailLog.model';
import { IUser } from '../interfaces/user.interface';
import { ses } from '../config/ses';
import { WebSocketService } from './websocket.service';

export class EmailService {
  private static templateCache: string | null = null;

  private static async getTemplate(): Promise<string> {
    if (!this.templateCache) {
      const templatePath = path.join(__dirname, '../../src/templates/welcome.html');
      this.templateCache = await fs.promises.readFile(templatePath, 'utf-8');
    }
    return this.templateCache;
  }

  private static renderTemplate(template: string, user: IUser): string {
    return template
      .replace(/{{name}}/g, user.name)
      .replace(/{{email}}/g, user.email)
      .replace(/{{password}}/g, user.password);
  }

  static async sendWelcomeEmail(user: IUser): Promise<boolean> {
    try {
      const template = await this.getTemplate();
      const htmlBody = this.renderTemplate(template, user);

      const params: SES.SendEmailRequest = {
        Source: process.env.SES_FROM_EMAIL || 'no-reply@example.com',
        Destination: {
          ToAddresses: [user.email]
        },
        Message: {
          Subject: {
            Data: 'Welcome to Our Platform - Your Account Details'
          },
          Body: {
            Html: {
              Data: htmlBody
            }
          }
        }
      };

      await ses.sendEmail(params).promise();
      
      // Log successful email
      await EmailLog.create({
        email: user.email,
        status: 'sent'
      });

      return true;
    } catch (error) {
      console.error(`Failed to send email to ${user.email}:`, error);
      
      // Broadcast failed email via WebSocket
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      WebSocketService.broadcastFailedEmail(user.email, errorMessage);
      
      // Log failed email
      await EmailLog.create({
        email: user.email,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  }

  static async sendBulkEmails(users: IUser[]): Promise<{ success: number; failure: number }> {
    let success = 0;
    let failure = 0;

    // Broadcast initial progress
    WebSocketService.broadcastProgress(0, users.length, 0, 0);

    // Process emails sequentially to avoid rate limiting
    for (const [index, user] of users.entries()) {
      const result = await this.sendWelcomeEmail(user);
      if (result) {
        success++;
      } else {
        failure++;
      }
      
      // Broadcast progress update
      WebSocketService.broadcastProgress(index + 1, users.length, success, failure);
      
      // Add delay between emails to avoid hitting SES rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Broadcast completion
    WebSocketService.broadcastCompletion(success, failure, users.length);

    return { success, failure };
  }
}