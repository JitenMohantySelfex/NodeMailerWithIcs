// Required packages
import express from "express";
import dotenv from "dotenv";
import { DateTime } from "luxon";
import { createEvents } from "ics";

// --- AWS SES IMPORTS ---
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import MailComposer from "nodemailer/lib/mail-composer";

dotenv.config();
const app = express();
app.use(express.json());

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

// Helper functions
type Slot = { store: string; startHour: number };
type WeekDay = {
  day: string;
  slots: Slot[];
};

function generateWeeklyDescription(weeks: WeekDay[]): string {
  const dayMap: Record<string, string> = {
    MO: "Monday", TU: "Tuesday", WE: "Wednesday", TH: "Thursday",
    FR: "Friday", SA: "Saturday", SU: "Sunday",
  };
  return weeks
    .map((w) => `• ${dayMap[w.day]}: ${w.slots.map((s) => s.store).join(", ")}`)
    .join("\n");
}

const iCalDayToLuxonWeekday: Record<string, number> = {
  MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7
};

app.post("/send-schedules", async (req, res) => {
  const {
    to,
    title,
    startDate,
    duration = { hours: 1 },
    weeks,
    organizer = {
      name: "Organizer",
      email: process.env.EMAIL_USER!,
    },
    attendees = [
      {
        name: "Recipient",
        email: to,
        rsvp: true, // CHANGED: Enable RSVP for REQUEST method
        partstat: "NEEDS-ACTION",
        role: "REQ-PARTICIPANT",
      },
    ],
  } = req.body;

  try {
    const allEvents: any[] = [];
    const schedulePeriodDays = 30;

    const startOfScheduleInLocalTimezone = DateTime.fromISO(startDate, {
      zone: 'Asia/Kolkata',
    }).startOf("day");

    if (!startOfScheduleInLocalTimezone.isValid) {
      return res.status(400).json({ error: "Invalid startDate provided." });
    }

    // Create events (same logic as before)
    for (const weekDay of weeks) {
      const dayCode = weekDay.day;
      const luxonWeekday = iCalDayToLuxonWeekday[dayCode];

      if (luxonWeekday === undefined) {
        console.warn(`Invalid day code: ${dayCode}. Skipping.`);
        continue;
      }

      for (const slot of weekDay.slots) {
        let firstOccurrenceInLocalTimezone = startOfScheduleInLocalTimezone.set({
          hour: slot.startHour,
          minute: 0,
          second: 0,
          millisecond: 0
        });

        while (firstOccurrenceInLocalTimezone.weekday !== luxonWeekday) {
          firstOccurrenceInLocalTimezone = firstOccurrenceInLocalTimezone.plus({ days: 1 });
        }
        
        if (firstOccurrenceInLocalTimezone < startOfScheduleInLocalTimezone.set({ hour: slot.startHour })) {
          firstOccurrenceInLocalTimezone = firstOccurrenceInLocalTimezone.plus({ weeks: 1 });
        }

        const startUTC = firstOccurrenceInLocalTimezone.toUTC();
        const numberOfOccurrences = Math.ceil(schedulePeriodDays / 7);

        allEvents.push({
          start: [startUTC.year, startUTC.month, startUTC.day, startUTC.hour, startUTC.minute],
          duration,
          title: `${slot.store} Visit (${dayCode})`,
          description: `Scheduled weekly visit to ${slot.store}. Please ensure your presence.`,
          location: "Store Location (Check with manager for specifics)",
          organizer,
          attendees,
          alarms: [
            {
              action: "display",
              trigger: { minutes: 15, before: true },
              description: `Reminder for ${slot.store} visit`,
            },
          ],
          status: "CONFIRMED",
          recurrenceRule: `FREQ=WEEKLY;BYDAY=${dayCode};COUNT=${numberOfOccurrences}`,
          uid: `${slot.store}-${dayCode}-${startUTC.toISODate()}-${Math.random().toString(36).substring(2, 9)}`
        });
      }
    }

    // SOLUTION 1: Create calendar invitation using METHOD:REQUEST
    const { error: inviteError, value: inviteIcsContent } = createEvents(allEvents, { 
      method: "REQUEST" // CHANGED: Use REQUEST instead of PUBLISH
    });

    if (inviteError) {
      console.error("ICS Generation Error:", inviteError);
      return res.status(500).json({ error: "Could not generate calendar invitation." });
    }

    // SOLUTION 2: Also create a downloadable version using METHOD:PUBLISH
    const { error: downloadError, value: downloadIcsContent } = createEvents(allEvents, { 
      method: "PUBLISH"
    });

    if (downloadError) {
      console.error("Download ICS Generation Error:", downloadError);
      return res.status(500).json({ error: "Could not generate downloadable schedule." });
    }

    const weeklyDesc = generateWeeklyDescription(weeks);

    // SOLUTION 3: Send email with proper MIME structure
    const mailComposer = new MailComposer({
      from: `"${organizer.name}" <${organizer.email}>`,
      to,
      subject: `Calendar Invitation: ${title}`, // CHANGED: More calendar-focused subject
      text: `Hello,\n\nYou have been invited to recurring store visits. Please find the calendar invitation below and the complete schedule attached.\n\nYour schedule at a glance:\n${weeklyDesc}\n\nPlease accept the calendar invitation to add these events to your calendar.\n\nAlternatively, you can download the attached "store-visit-schedule.ics" file and import it manually.\n\nBest regards,\n${organizer.name}`,
      html: `
        <html>
          <body>
            <h2>Store Visit Schedule Invitation</h2>
            <p>Hello,</p>
            <p>You have been invited to recurring store visits. Please find the calendar invitation below and the complete schedule attached.</p>
            <h3>Your schedule at a glance:</h3>
            <ul>
              ${weeks.map((w: WeekDay) => `<li><strong>${{MO:'Monday',TU:'Tuesday',WE:'Wednesday',TH:'Thursday',FR:'Friday',SA:'Saturday',SU:'Sunday'}[w.day]}:</strong> ${w.slots.map(s => s.store).join(', ')}</li>`).join('')}
            </ul>
            <p>Please accept the calendar invitation to add these events to your calendar.</p>
            <p>Alternatively, you can download the attached "store-visit-schedule.ics" file and import it manually.</p>
            <p>Best regards,<br>${organizer.name}</p>
          </body>
        </html>
      `,
      // SOLUTION 4: Add calendar content as alternative MIME part
      alternatives: [
        {
          contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
          content: inviteIcsContent,
        },
      ],
      attachments: [
        {
          filename: "store-visit-schedule.ics",
          content: downloadIcsContent, // Use PUBLISH version for download
          contentType: "text/calendar",
        },
      ],
    });

    const rawEmail = await mailComposer.compile().build();

    const command = new SendRawEmailCommand({
      RawMessage: {
        Data: rawEmail,
      },
    });

    await sesClient.send(command);
    res.json({ 
      message: "Calendar invitation sent successfully via AWS SES!",
      details: {
        eventsCreated: allEvents.length,
        method: "REQUEST (for invitation) + PUBLISH (for download)"
      }
    });

  } catch (err) {
    console.error("Error processing and sending calendar invitation:", err);
    const errorMessage = typeof err === "object" && err !== null && "message" in err ? 
      (err as { message: string }).message : String(err);
    res.status(500).json({ error: `Failed to send calendar invitation. Error: ${errorMessage}` });
  }
});

// SOLUTION 5: Alternative endpoint for individual event invitations
app.post("/send-individual-invites", async (req, res) => {
  const {
    to,
    title,
    startDate,
    duration = { hours: 1 },
    weeks,
    organizer = {
      name: "Organizer",
      email: process.env.EMAIL_USER!,
    },
  } = req.body;

  try {
    const sentInvitations: string[] = [];
    const startOfScheduleInLocalTimezone = DateTime.fromISO(startDate, {
      zone: 'Asia/Kolkata',
    }).startOf("day");

    // Send individual invitations for each recurring event
    for (const weekDay of weeks) {
      const dayCode = weekDay.day;
      const luxonWeekday = iCalDayToLuxonWeekday[dayCode];

      if (luxonWeekday === undefined) continue;

      for (const slot of weekDay.slots) {
        let firstOccurrenceInLocalTimezone = startOfScheduleInLocalTimezone.set({
          hour: slot.startHour,
          minute: 0,
          second: 0,
          millisecond: 0
        });

        while (firstOccurrenceInLocalTimezone.weekday !== luxonWeekday) {
          firstOccurrenceInLocalTimezone = firstOccurrenceInLocalTimezone.plus({ days: 1 });
        }
        
        if (firstOccurrenceInLocalTimezone < startOfScheduleInLocalTimezone.set({ hour: slot.startHour })) {
          firstOccurrenceInLocalTimezone = firstOccurrenceInLocalTimezone.plus({ weeks: 1 });
        }

        const startUTC = firstOccurrenceInLocalTimezone.toUTC();
        const numberOfOccurrences = Math.ceil(30 / 7);

        // Create individual event
        const { error, value: icsContent } = createEvents([{
          start: [startUTC.year, startUTC.month, startUTC.day, startUTC.hour, startUTC.minute],
          duration,
          title: `${slot.store} Visit`,
          description: `Weekly visit to ${slot.store}`,
          location: "Store Location",
          organizer,
          attendees: [{
            name: "Recipient",
            email: to,
            rsvp: true,
            partstat: "NEEDS-ACTION",
            role: "REQ-PARTICIPANT",
          }],
          alarms: [{
            action: "display",
            trigger: { minutes: 15, before: true },
            description: `Reminder for ${slot.store} visit`,
          }],
          status: "CONFIRMED",
          recurrenceRule: `FREQ=WEEKLY;BYDAY=${dayCode};COUNT=${numberOfOccurrences}`,
          uid: `${slot.store}-${dayCode}-${startUTC.toISODate()}-${Math.random().toString(36).substring(2, 9)}`
        }], { method: "REQUEST" });

        if (error) continue;

        const mailComposer = new MailComposer({
          from: `"${organizer.name}" <${organizer.email}>`,
          to,
          subject: `Meeting Invitation: ${slot.store} Visit - ${weekDay.day}`,
          text: `You are invited to a recurring meeting for ${slot.store} visits every ${weekDay.day}.`,
          alternatives: [{
            contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
            content: icsContent,
          }],
        });

        const rawEmail = await mailComposer.compile().build();
        const command = new SendRawEmailCommand({
          RawMessage: { Data: rawEmail },
        });

        await sesClient.send(command);
        sentInvitations.push(`${slot.store} - ${weekDay.day}`);
      }
    }

    res.json({ 
      message: "Individual calendar invitations sent successfully!",
      invitationsSent: sentInvitations
    });

  } catch (err) {
    console.error("Error sending individual invitations:", err);
    res.status(500).json({ error: "Failed to send individual invitations" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);