import { Resend } from "resend";
import dotenv from "dotenv";
import * as xlsx from "xlsx";
import path from "path";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export class BroadcastEmailService {
  // Read emails from Excel file
  static readEmailsFromExcel(filePath: string): string[] {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = xlsx.utils.sheet_to_json<any>(worksheet);
    const emails = jsonData
      .map((row) => row.email?.toString().trim())
      .filter((email) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    return emails;
  }

  // Send welcome broadcast to a list of emails
  static async sendGreetingBroadcast(emails: string[]): Promise<void> {
    try {
      if (emails.length === 0) {
        console.warn("No valid emails found for broadcast.");
        return;
      }

      const response = await resend.emails.send({
        from: "Team ShelfExecution <noreply@shelfexecution.com>",
        to: emails,
        subject: "🎉 Welcome to ShelfExecution!",
        html: `
          <p>Hello 👋</p>
          <p>We're glad to have you onboard!</p>
          <p>Click below to start exploring:</p>
          <p><a href="https://www.shelfexecution.com/start">Get Started</a></p>
          <p>Cheers,<br/>ShelfExecution Team</p>
        `,
      });

      console.log("✅ Broadcast sent:", response);
    } catch (error) {
      console.error("❌ Failed to send broadcast:", error);
    }
  }

  // Combine: read from Excel and send
  static async sendBroadcastFromExcel(filePath: string): Promise<void> {
    const emails = this.readEmailsFromExcel(filePath);
    console.log(`📧 Found ${emails.length} emails. Sending broadcast...`);
    await this.sendGreetingBroadcast(emails);
  }
}
