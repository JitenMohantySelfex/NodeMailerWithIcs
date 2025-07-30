// import { SES } from 'aws-sdk';
// import fs from 'fs';
// import path from 'path';
// import { EmailLog } from '../models/emailLog.model';
// import { IUser } from '../interfaces/user.interface';
// import { ses } from '../config/ses';
// import { WebSocketService } from './websocket.service';

// export class EmailService {
//   private static templateCache: string | null = null;

//   private static async getTemplate(): Promise<string> {
//     if (!this.templateCache) {
//       const templatePath = path.join(__dirname, '../../src/templates/welcome.html');
//       this.templateCache = await fs.promises.readFile(templatePath, 'utf-8');
//     }
//     return this.templateCache;
//   }

//   private static renderTemplate(template: string, user: IUser): string {
//     return template
//       .replace(/{{name}}/g, user.name)
//       .replace(/{{email}}/g, user.email)
//       .replace(/{{password}}/g, user.password);
//   }

//   static async sendWelcomeEmail(user: IUser): Promise<boolean> {
//     try {
//       const template = await this.getTemplate();
//       const htmlBody = this.renderTemplate(template, user);

//       const params: SES.SendEmailRequest = {
//         Source: process.env.SES_FROM_EMAIL || 'no-reply@example.com',
//         Destination: {
//           ToAddresses: [user.email]
//         },
//         Message: {
//           Subject: {
//             Data: 'Welcome to Our Platform - Your Account Details'
//           },
//           Body: {
//             Html: {
//               Data: htmlBody
//             }
//           }
//         }
//       };

//       await ses.sendEmail(params).promise();

//       // Log successful email
//       await EmailLog.create({
//         email: user.email,
//         status: 'sent'
//       });

//       return true;
//     } catch (error) {
//       console.error(`Failed to send email to ${user.email}:`, error);

//       // Broadcast failed email via WebSocket
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       WebSocketService.broadcastFailedEmail(user.email, errorMessage);

//       // Log failed email
//       await EmailLog.create({
//         email: user.email,
//         status: 'failed',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       });

//       return false;
//     }
//   }

//   static async sendBulkEmails(users: IUser[]): Promise<{ success: number; failure: number }> {
//     let success = 0;
//     let failure = 0;

//     // Broadcast initial progress
//     WebSocketService.broadcastProgress(0, users.length, 0, 0);

//     // Process emails sequentially to avoid rate limiting
//     for (const [index, user] of users.entries()) {
//       const result = await this.sendWelcomeEmail(user);
//       if (result) {
//         success++;
//       } else {
//         failure++;
//       }

//       // Broadcast progress update
//       WebSocketService.broadcastProgress(index + 1, users.length, success, failure);

//       // Add delay between emails to avoid hitting SES rate limits
//       await new Promise(resolve => setTimeout(resolve, 200));
//     }

//     // Broadcast completion
//     WebSocketService.broadcastCompletion(success, failure, users.length);

//     return { success, failure };
//   }
// }

import fs from "fs";
import path from "path";
import sgMail from "@sendgrid/mail";
import { EmailLog } from "../models/emailLog.model";
import { IUser } from "../interfaces/user.interface";
import { WebSocketService } from "./websocket.service";
import dotenv from "dotenv";
dotenv.config();

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

console.log(
  "envs",
  process.env.SENDGRID_API_KEY,
  process.env.SENDGRID_FROM_EMAIL
);

export class EmailService {
  private static templateCache: string | null = null;

  private static async getTemplate(): Promise<string> {
    if (!this.templateCache) {
      const templatePath = path.join(
        __dirname,
        "../../src/templates/welcome.html"
      );
      this.templateCache = await fs.promises.readFile(templatePath, "utf-8");
    }
    return this.templateCache;
  }

  private static renderTemplate(template: string, user: IUser): string {
    return template
      .replace(/{{name}}/g, user.name)
      .replace(/{{email}}/g, user.email)
      .replace(/{{password}}/g, user.password);
  }

  // Enhanced error logging to see detailed SendGrid errors
  private static logSendGridError(error: any, email: string): string {
    console.error(`Failed to send email to ${email}:`, error);

    // Log detailed SendGrid error info
    if (error.response && error.response.body && error.response.body.errors) {
      console.error(
        "SendGrid error details:",
        JSON.stringify(error.response.body.errors, null, 2)
      );
    }

    return error instanceof Error ? error.message : "Unknown error";
  }

  static async sendWelcomeEmail(user: IUser): Promise<boolean> {
    try {
      // Validate environment variables
      if (!process.env.SENDGRID_FROM_EMAIL) {
        throw new Error("SENDGRID_FROM_EMAIL environment variable is not set");
      }

      // Validate email format of FROM address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(process.env.SENDGRID_FROM_EMAIL)) {
        throw new Error(
          `Invalid FROM email format: ${process.env.SENDGRID_FROM_EMAIL}`
        );
      }

      const template = await this.getTemplate();
      const htmlBody = this.renderTemplate(template, user);

      const msg = {
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: "Welcome to Our Platform - Your Account Details",
        html: htmlBody,
        text: `Welcome ${user.name}! Your account has been created with email: ${user.email}`,
      };

      console.log(`Attempting to send email from: ${msg.from} to: ${msg.to}`);

      await sgMail.send(msg);

      console.log(`Email sent successfully to: ${user.email}`);

      // Log successful email
      await EmailLog.create({
        email: user.email,
        status: "sent",
      });

      return true;
    } catch (error) {
      const errorMessage = this.logSendGridError(error, user.email);

      // Broadcast failed email via WebSocket
      WebSocketService.broadcastFailedEmail(user.email, errorMessage);

      // Log failed email
      await EmailLog.create({
        email: user.email,
        status: "failed",
        error: errorMessage,
      });

      return false;
    }
  }

  // Sequential bulk sending for progress tracking/rate limits
  static async sendBulkEmails(
    users: IUser[]
  ): Promise<{ success: number; failure: number }> {
    let success = 0;
    let failure = 0;

    WebSocketService.broadcastProgress(0, users.length, 0, 0);

    for (const [index, user] of users.entries()) {
      const result = await this.sendWelcomeEmail(user);
      if (result) success++;
      else failure++;

      WebSocketService.broadcastProgress(
        index + 1,
        users.length,
        success,
        failure
      );
      await new Promise((resolve) => setTimeout(resolve, 100)); // Slightly longer delay
    }

    WebSocketService.broadcastCompletion(success, failure, users.length);
    console.log(
      `Email sending completed. Success: ${success}, Failure: ${failure}`
    );

    return { success, failure };
  }

  // Batch sending using sendMultiple() for up to 1000 recipients with same content
  static async sendBulkEmailsWithTemplate(
    users: IUser[]
  ): Promise<{ success: number; failure: number }> {
    const CHUNK_SIZE = 1000;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL!;
    const template = await this.getTemplate();

    let success = 0;
    let failure = 0;

    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
      const chunk = users.slice(i, i + CHUNK_SIZE);
      const messages = chunk.map((user) => ({
        to: user.email,
        from: fromEmail,
        subject: "Welcome to Our Platform - Your Account Details",
        html: this.renderTemplate(template, user),
        text: `Welcome ${user.name}! Your account has been created with email: ${user.email}`,
      }));

      try {
        await sgMail.send(messages);
        console.log(
          `✅ Sent ${messages.length} emails (batch ${i / CHUNK_SIZE + 1})`
        );

        await Promise.all(
          chunk.map((user) =>
            EmailLog.create({ email: user.email, status: "sent" })
          )
        );

        success += chunk.length;
      } catch (error:any) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("❌ Batch failed:", errorMessage);

        if (error.response?.body?.errors) {
          console.error(
            "SendGrid error:",
            JSON.stringify(error.response.body.errors, null, 2)
          );
        }

        await Promise.all(
          chunk.map((user) =>
            EmailLog.create({
              email: user.email,
              status: "failed",
              error: errorMessage,
            })
          )
        );

        failure += chunk.length;
      }

      WebSocketService.broadcastProgress(
        i + chunk.length,
        users.length,
        success,
        failure
      );

      // Optional: slight delay between chunks to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    WebSocketService.broadcastCompletion(success, failure, users.length);
    return { success, failure };
  }
}
