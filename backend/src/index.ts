// import express from 'express';
// import nodemailer from 'nodemailer';
// import { createEvent } from 'ics';
// import dotenv from 'dotenv';
// import { DateTime } from 'luxon'; // Add at top if not yet

// dotenv.config();
// const app = express();
// app.use(express.json());

// // Transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // API to send email with ICS
// app.post('/send-invite', async (req, res) => {
//   const {
//     to,
//     subject,
//     title,
//     description,
//     location,
//     start, // [YYYY, M, D, H, M] in IST
//     duration, // { hours, minutes }
//     recurrence = 'DAILY',
//     count = 30,
//     organizer = {
//       name: 'Organizer',
//       email: process.env.EMAIL_USER!,
//     },
//     attendees = [],
//   } = req.body;

//   try {
//     // Convert IST to UTC
//     const startIST = DateTime.fromObject(
//       {
//         year: start[0],
//         month: start[1],
//         day: start[2],
//         hour: start[3],
//         minute: start[4],
//       },
//       { zone: 'Asia/Kolkata' }
//     );

//     const startUTC = startIST.toUTC();
//     const startArray: [number, number, number, number, number] = [
//       startUTC.year,
//       startUTC.month,
//       startUTC.day,
//       startUTC.hour,
//       startUTC.minute,
//     ];

//     const { error, value: icsContent } = createEvent({
//       title,
//       description,
//       location,
//       start: startArray,
//       duration,
//       recurrenceRule: `FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;COUNT=${count}`,
//       organizer,
//       attendees,
//     });

//     if (error) {
//       console.error('ICS generation error:', error);
//       return res.status(500).json({ error: 'Could not generate ICS file' });
//     }

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to,
//       subject,
//       text: 'Calendar invite attached.',
//       alternatives: [
//         {
//           contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
//           content: icsContent,
//         },
//       ],
//       attachments: [
//         {
//           filename: 'invite.ics',
//           content: icsContent,
//           contentType: 'text/calendar',
//         },
//       ],
//     };

//     await transporter.sendMail(mailOptions);
//     res.json({ message: 'Invite sent successfully' });
//   } catch (err) {
//     console.error('Send error:', err);
//     res.status(500).json({ error: 'Failed to send invite' });
//   }
// });

// // Server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`ICS Email API running on http://localhost:${PORT}`);
// });

// Required packages
// import express from "express";
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// import { DateTime } from "luxon";
// import { createEvents } from "ics";

// dotenv.config();
// const app = express();
// app.use(express.json());

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
  
// });

// // Helper to build weekly schedule string
// type Slot = { store: string; startHour: number };
// type WeekDay = {
//   day: string; // e.g., 'MO', 'TU'
//   slots: Slot[];
// };

// function generateWeeklyDescription(weeks: WeekDay[]): string {
//   const dayMap: Record<string, string> = {
//     MO: "Monday",
//     TU: "Tuesday",
//     WE: "Wednesday",
//     TH: "Thursday",
//     FR: "Friday",
//     SA: "Saturday",
//     SU: "Sunday",
//   };
//   return weeks
//     .map((w) => `• ${dayMap[w.day]}: ${w.slots.map((s) => s.store).join(", ")}`)
//     .join("\n");
// }

// app.post("/send-schedule", async (req, res) => {
//   const {
//     to,
//     title,
//     startDate,
//     duration, // e.g., {hours: 1}
//     weeks, // Your weekly schedule
//     organizer = {
//       name: "Organizer",
//       email: process.env.EMAIL_USER!,
//     },
//     // Attendees can be defined once and reused for each event
//     attendees = [
//       {
//         name: "Recipient",
//         email: to,
//         rsvp: true,
//         partstat: "NEEDS-ACTION",
//         role: "REQ-PARTICIPANT",
//       },
//     ],
//   } = req.body;

//   try {
//     const startDay = DateTime.fromISO(startDate).startOf("day");
//     const dayAbbr = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

//     const sentEmails: string[] = [];

//     // Loop through each day in the provided weeks schedule
//     for (const weekDay of weeks) {
//       const dayCode = weekDay.day;
//       const dayIndex = dayAbbr.indexOf(dayCode); // Get day index (0 for SU, 1 for MO, etc.)

//       if (dayIndex === -1) {
//         console.warn(`Invalid day code: ${dayCode}. Skipping.`);
//         continue;
//       }

//       for (const slot of weekDay.slots) {
//         // Calculate the first occurrence of this specific slot based on startDate
//         let firstOccurrence = startDay.set({ hour: slot.startHour, minute: 0 });
//         // Adjust firstOccurrence to match the correct day of the week if startDate is not that day
//         while (firstOccurrence.weekday % 7 !== dayIndex) {
//             firstOccurrence = firstOccurrence.plus({ days: 1 });
//         }
        
//         // Ensure the first occurrence is not before the specified startDate
//         if (firstOccurrence < startDay.set({hour: slot.startHour, minute: 0})) {
//              firstOccurrence = firstOccurrence.plus({days: 7}); // Move to next week if already passed this week
//         }

//         // Convert to UTC for ICS
//         const startUTC = firstOccurrence.toUTC();

//         // Create a single recurring event for this slot
//         const { error, value: icsContent } = createEvents([
//             { // createEvents takes an array, even for a single event
//               start: [startUTC.year, startUTC.month, startUTC.day, startUTC.hour, startUTC.minute],
//               duration,
//               title: `${slot.store} visit (${weekDay.day})`, // Make title specific
//               description: `Store visit to ${slot.store} on ${weekDay.day} at ${firstOccurrence.toFormat("HH:mm")}`,
//               location: "Store Location",
//               organizer,
//               attendees,
//               alarms: [
//                 {
//                   action: "display",
//                   trigger: { minutes: 5, before: true },
//                   description: "Reminder",
//                 },
//               ],
//               status: "CONFIRMED",
//               // Use a recurrence rule for the next 30 days (or desired period)
//               // You might adjust this. For a fixed 30-day window, you'd calculate occurrences.
//               // For simplicity, let's say it recurs weekly until the 30-day period ends.
//               recurrenceRule: `FREQ=WEEKLY;BYDAY=${dayCode};COUNT=${Math.ceil(30 / 7)}` // Recur weekly for approximately 30 days
//             }
//         ]);


//         if (error) {
//           console.error("ICS Event Creation Error:", error);
//           // Decide whether to continue or fail for this specific error
//           continue;
//         }

//         const mailOptions = {
//           from: `"${organizer.name}" <${organizer.email}>`,
//           to,
//           subject: `Store Visit Schedule: ${slot.store} on ${weekDay.day}`, // Specific subject for each invite
//           text: `Here is your recurring store visit schedule for ${slot.store} on ${weekDay.day}.\n\nThis invite will recur weekly.`,
//           alternatives: [
//             {
//               contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
//               content: icsContent,
//             },
//           ],
//           attachments: [
//             {
//               filename: `${slot.store}-${weekDay.day}-visit.ics`,
//               content: icsContent,
//               contentType: "text/calendar",
//             },
//           ],
//         };

//         await transporter.sendMail(mailOptions);
//         sentEmails.push(`Sent invite for ${slot.store} on ${weekDay.day} to ${to}`);
//       }
//     }

//     res.json({ message: "Store visit schedules sent successfully!", details: sentEmails });

//   } catch (err) {
//     console.error("Error sending schedule:", err);
//     res.status(500).json({ error: "Failed to send schedule" });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () =>
//   console.log(`Server running on http://localhost:${PORT}`)
// );


// Required packages
// import express from "express";
// import dotenv from "dotenv";
// import { DateTime } from "luxon";
// import { createEvents } from "ics";

// // --- AWS SES IMPORTS ---
// import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
// import MailComposer from "nodemailer/lib/mail-composer";

// dotenv.config();
// const app = express();
// app.use(express.json());

// const sesClient = new SESClient({
//   region: process.env.AWS_REGION || "ap-south-1",
// });

// // Helper functions
// type Slot = { store: string; startHour: number };
// type WeekDay = {
//   day: string;
//   slots: Slot[];
// };

// function generateWeeklyDescription(weeks: WeekDay[]): string {
//   const dayMap: Record<string, string> = {
//     MO: "Monday", TU: "Tuesday", WE: "Wednesday", TH: "Thursday",
//     FR: "Friday", SA: "Saturday", SU: "Sunday",
//   };
//   return weeks
//     .map((w) => `• ${dayMap[w.day]}: ${w.slots.map((s) => s.store).join(", ")}`)
//     .join("\n");
// }

// const iCalDayToLuxonWeekday: Record<string, number> = {
//   MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7
// };

// app.post("/send-schedules", async (req, res) => {
//   const {
//     to,
//     title,
//     startDate,
//     duration = { hours: 1 },
//     weeks,
//     organizer = {
//       name: "Organizer",
//       email: process.env.EMAIL_USER!,
//     },
//     attendees = [
//       {
//         name: "Recipient",
//         email: to,
//         rsvp: true, // CHANGED: Enable RSVP for REQUEST method
//         partstat: "NEEDS-ACTION",
//         role: "REQ-PARTICIPANT",
//       },
//     ],
//   } = req.body;

//   try {
//     const allEvents: any[] = [];
//     const schedulePeriodDays = 30;

//     const startOfScheduleInLocalTimezone = DateTime.fromISO(startDate, {
//       zone: 'Asia/Kolkata',
//     }).startOf("day");

//     if (!startOfScheduleInLocalTimezone.isValid) {
//       return res.status(400).json({ error: "Invalid startDate provided." });
//     }

//     // Create events (same logic as before)
//     for (const weekDay of weeks) {
//       const dayCode = weekDay.day;
//       const luxonWeekday = iCalDayToLuxonWeekday[dayCode];

//       if (luxonWeekday === undefined) {
//         console.warn(`Invalid day code: ${dayCode}. Skipping.`);
//         continue;
//       }

//       for (const slot of weekDay.slots) {
//         let firstOccurrenceInLocalTimezone = startOfScheduleInLocalTimezone.set({
//           hour: slot.startHour,
//           minute: 0,
//           second: 0,
//           millisecond: 0
//         });

//         while (firstOccurrenceInLocalTimezone.weekday !== luxonWeekday) {
//           firstOccurrenceInLocalTimezone = firstOccurrenceInLocalTimezone.plus({ days: 1 });
//         }
        
//         if (firstOccurrenceInLocalTimezone < startOfScheduleInLocalTimezone.set({ hour: slot.startHour })) {
//           firstOccurrenceInLocalTimezone = firstOccurrenceInLocalTimezone.plus({ weeks: 1 });
//         }

//         const startUTC = firstOccurrenceInLocalTimezone.toUTC();
//         const numberOfOccurrences = Math.ceil(schedulePeriodDays / 7);

//         allEvents.push({
//           start: [startUTC.year, startUTC.month, startUTC.day, startUTC.hour, startUTC.minute],
//           duration,
//           title: `${slot.store} Visit (${dayCode})`,
//           description: `Scheduled weekly visit to ${slot.store}. Please ensure your presence.`,
//           location: "Store Location (Check with manager for specifics)",
//           organizer,
//           attendees,
//           alarms: [
//             {
//               action: "display",
//               trigger: { minutes: 15, before: true },
//               description: `Reminder for ${slot.store} visit`,
//             },
//           ],
//           status: "CONFIRMED",
//           recurrenceRule: `FREQ=WEEKLY;BYDAY=${dayCode};COUNT=${numberOfOccurrences}`,
//           uid: `${slot.store}-${dayCode}-${startUTC.toISODate()}-${Math.random().toString(36).substring(2, 9)}`
//         });
//       }
//     }

//     // SOLUTION 1: Create calendar invitation using METHOD:REQUEST
//     const { error: inviteError, value: inviteIcsContent } = createEvents(allEvents, { 
//       method: "REQUEST" // CHANGED: Use REQUEST instead of PUBLISH
//     });

//     if (inviteError) {
//       console.error("ICS Generation Error:", inviteError);
//       return res.status(500).json({ error: "Could not generate calendar invitation." });
//     }

//     // SOLUTION 2: Also create a downloadable version using METHOD:PUBLISH
//     const { error: downloadError, value: downloadIcsContent } = createEvents(allEvents, { 
//       method: "PUBLISH"
//     });

//     if (downloadError) {
//       console.error("Download ICS Generation Error:", downloadError);
//       return res.status(500).json({ error: "Could not generate downloadable schedule." });
//     }

//     const weeklyDesc = generateWeeklyDescription(weeks);

//     // SOLUTION 3: Send email with proper MIME structure
//     const mailComposer = new MailComposer({
//       from: `"${organizer.name}" <${organizer.email}>`,
//       to,
//       subject: `Calendar Invitation: ${title}`, // CHANGED: More calendar-focused subject
//       text: `Hello,\n\nYou have been invited to recurring store visits. Please find the calendar invitation below and the complete schedule attached.\n\nYour schedule at a glance:\n${weeklyDesc}\n\nPlease accept the calendar invitation to add these events to your calendar.\n\nAlternatively, you can download the attached "store-visit-schedule.ics" file and import it manually.\n\nBest regards,\n${organizer.name}`,
//       html: `
//         <html>
//           <body>
//             <h2>Store Visit Schedule Invitation</h2>
//             <p>Hello,</p>
//             <p>You have been invited to recurring store visits. Please find the calendar invitation below and the complete schedule attached.</p>
//             <h3>Your schedule at a glance:</h3>
//             <ul>
//               ${weeks.map((w: WeekDay) => `<li><strong>${{MO:'Monday',TU:'Tuesday',WE:'Wednesday',TH:'Thursday',FR:'Friday',SA:'Saturday',SU:'Sunday'}[w.day]}:</strong> ${w.slots.map(s => s.store).join(', ')}</li>`).join('')}
//             </ul>
//             <p>Please accept the calendar invitation to add these events to your calendar.</p>
//             <p>Alternatively, you can download the attached "store-visit-schedule.ics" file and import it manually.</p>
//             <p>Best regards,<br>${organizer.name}</p>
//           </body>
//         </html>
//       `,
//       // SOLUTION 4: Add calendar content as alternative MIME part
//       alternatives: [
//         {
//           contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
//           content: inviteIcsContent,
//         },
//       ],
//       attachments: [
//         {
//           filename: "store-visit-schedule.ics",
//           content: downloadIcsContent, // Use PUBLISH version for download
//           contentType: "text/calendar",
//         },
//       ],
//     });

//     const rawEmail = await mailComposer.compile().build();

//     const command = new SendRawEmailCommand({
//       RawMessage: {
//         Data: rawEmail,
//       },
//     });

//     await sesClient.send(command);
//     res.json({ 
//       message: "Calendar invitation sent successfully via AWS SES!",
//       details: {
//         eventsCreated: allEvents.length,
//         method: "REQUEST (for invitation) + PUBLISH (for download)"
//       }
//     });

//   } catch (err) {
//     console.error("Error processing and sending calendar invitation:", err);
//     const errorMessage = typeof err === "object" && err !== null && "message" in err ? 
//       (err as { message: string }).message : String(err);
//     res.status(500).json({ error: `Failed to send calendar invitation. Error: ${errorMessage}` });
//   }
// });

// // SOLUTION 5: Alternative endpoint for individual event invitations
// app.post("/send-individual-invites", async (req, res) => {
//   const {
//     to,
//     title,
//     startDate,
//     duration = { hours: 1 },
//     weeks,
//     organizer = {
//       name: "Organizer",
//       email: process.env.EMAIL_USER!,
//     },
//   } = req.body;

//   try {
//     const sentInvitations: string[] = [];
//     const startOfScheduleInLocalTimezone = DateTime.fromISO(startDate, {
//       zone: 'Asia/Kolkata',
//     }).startOf("day");

//     // Send individual invitations for each recurring event
//     for (const weekDay of weeks) {
//       const dayCode = weekDay.day;
//       const luxonWeekday = iCalDayToLuxonWeekday[dayCode];

//       if (luxonWeekday === undefined) continue;

//       for (const slot of weekDay.slots) {
//         let firstOccurrenceInLocalTimezone = startOfScheduleInLocalTimezone.set({
//           hour: slot.startHour,
//           minute: 0,
//           second: 0,
//           millisecond: 0
//         });

//         while (firstOccurrenceInLocalTimezone.weekday !== luxonWeekday) {
//           firstOccurrenceInLocalTimezone = firstOccurrenceInLocalTimezone.plus({ days: 1 });
//         }
        
//         if (firstOccurrenceInLocalTimezone < startOfScheduleInLocalTimezone.set({ hour: slot.startHour })) {
//           firstOccurrenceInLocalTimezone = firstOccurrenceInLocalTimezone.plus({ weeks: 1 });
//         }

//         const startUTC = firstOccurrenceInLocalTimezone.toUTC();
//         const numberOfOccurrences = Math.ceil(30 / 7);

//         // Create individual event
//         const { error, value: icsContent } = createEvents([{
//           start: [startUTC.year, startUTC.month, startUTC.day, startUTC.hour, startUTC.minute],
//           duration,
//           title: `${slot.store} Visit`,
//           description: `Weekly visit to ${slot.store}`,
//           location: "Store Location",
//           organizer,
//           attendees: [{
//             name: "Recipient",
//             email: to,
//             rsvp: true,
//             partstat: "NEEDS-ACTION",
//             role: "REQ-PARTICIPANT",
//           }],
//           alarms: [{
//             action: "display",
//             trigger: { minutes: 15, before: true },
//             description: `Reminder for ${slot.store} visit`,
//           }],
//           status: "CONFIRMED",
//           recurrenceRule: `FREQ=WEEKLY;BYDAY=${dayCode};COUNT=${numberOfOccurrences}`,
//           uid: `${slot.store}-${dayCode}-${startUTC.toISODate()}-${Math.random().toString(36).substring(2, 9)}`
//         }], { method: "REQUEST" });

//         if (error) continue;

//         const mailComposer = new MailComposer({
//           from: `"${organizer.name}" <${organizer.email}>`,
//           to,
//           subject: `Meeting Invitation: ${slot.store} Visit - ${weekDay.day}`,
//           text: `You are invited to a recurring meeting for ${slot.store} visits every ${weekDay.day}.`,
//           alternatives: [{
//             contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
//             content: icsContent,
//           }],
//         });

//         const rawEmail = await mailComposer.compile().build();
//         const command = new SendRawEmailCommand({
//           RawMessage: { Data: rawEmail },
//         });

//         await sesClient.send(command);
//         sentInvitations.push(`${slot.store} - ${weekDay.day}`);
//       }
//     }

//     res.json({ 
//       message: "Individual calendar invitations sent successfully!",
//       invitationsSent: sentInvitations
//     });

//   } catch (err) {
//     console.error("Error sending individual invitations:", err);
//     res.status(500).json({ error: "Failed to send individual invitations" });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () =>
//   console.log(`Server runncing on http://localhost:${PORT}`)
// );




// Required packages
// import express from "express";
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// import { DateTime } from "luxon";
// import { createEvents } from "ics";

// dotenv.config();
// const app = express();
// app.use(express.json());

// // Gmail transporter configuration
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // Helper functions
// type Slot = { store: string; startHour: number };
// type WeekDay = {
//   day: string;
//   slots: Slot[];
// };

// function generateWeeklyDescription(weeks: WeekDay[]): string {
//   const dayMap: Record<string, string> = {
//     MO: "Monday", TU: "Tuesday", WE: "Wednesday", TH: "Thursday",
//     FR: "Friday", SA: "Saturday", SU: "Sunday",
//   };
//   return weeks
//     .map((w) => `• ${dayMap[w.day]}: ${w.slots.map((s) => s.store).join(", ")}`)
//     .join("\n");
// }

// const iCalDayToLuxonWeekday: Record<string, number> = {
//   MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7
// };

// // SOLUTION 1: Send individual calendar invitations (RECOMMENDED)
// app.post("/send-individual-invites", async (req, res) => {
//   const {
//     to,
//     title,
//     startDate,
//     duration = { hours: 1 },
//     weeks,
//     organizer = {
//       name: "Organizer",
//       email: process.env.EMAIL_USER!,
//     },
//   } = req.body;

//   try {
//     const sentInvitations: string[] = [];
//     const startOfScheduleInLocalTimezone = DateTime.fromISO(startDate, {
//       zone: 'Asia/Kolkata',
//     }).startOf("day");

//     if (!startOfScheduleInLocalTimezone.isValid) {
//       return res.status(400).json({ error: "Invalid startDate provided." });
//     }

//     // Send individual invitations for each recurring event
//     for (const weekDay of weeks) {
//       const dayCode = weekDay.day;
//       const luxonWeekday = iCalDayToLuxonWeekday[dayCode];

//       if (luxonWeekday === undefined) {
//         console.warn(`Invalid day code: ${dayCode}. Skipping.`);
//         continue;
//       }

//       for (const slot of weekDay.slots) {
//         let firstOccurrenceInLocalTimezone = startOfScheduleInLocalTimezone.set({
//           hour: slot.startHour,
//           minute: 0,
//           second: 0,
//           millisecond: 0
//         });

//         while (firstOccurrenceInLocalTimezone.weekday !== luxonWeekday) {
//           firstOccurrenceInLocalTimezone = firstOccurrenceInLocalTimezone.plus({ days: 1 });
//         }
        
//         if (firstOccurrenceInLocalTimezone < startOfScheduleInLocalTimezone.set({ hour: slot.startHour })) {
//           firstOccurrenceInLocalTimezone = firstOccurrenceInLocalTimezone.plus({ weeks: 1 });
//         }

//         const startUTC = firstOccurrenceInLocalTimezone.toUTC();
//         const numberOfOccurrences = Math.ceil(30 / 7);

//         // Create individual event with proper formatting
//         const { error, value: icsContent } = createEvents([{
//           start: [startUTC.year, startUTC.month, startUTC.day, startUTC.hour, startUTC.minute],
//           duration,
//           title: `${slot.store} Visit - Weekly`,
//           description: `Weekly visit to ${slot.store}\n\nScheduled by: ${organizer.name}\nLocation: Store Location\n\nThis is a recurring weekly appointment.`,
//           location: `${slot.store} Store Location`,
//           organizer: {
//             name: organizer.name,
//             email: organizer.email,
//           },
//           attendees: [{
//             name: "Store Visit Attendee",
//             email: to,
//             rsvp: true,
//             partstat: "NEEDS-ACTION",
//             role: "REQ-PARTICIPANT",
//           }],
//           alarms: [{
//             action: "display",
//             trigger: { minutes: 15, before: true },
//             description: `Reminder: ${slot.store} visit in 15 minutes`,
//           }],
//           status: "TENTATIVE", // Changed from CONFIRMED to TENTATIVE
//           recurrenceRule: `FREQ=WEEKLY;BYDAY=${dayCode};COUNT=${numberOfOccurrences}`,
//           uid: `${slot.store.toLowerCase()}-${dayCode.toLowerCase()}-${startUTC.toISODate()}-${Date.now()}@yourdomain.com`, // More unique UID
//           sequence: 0, // Add sequence number
//           productId: "//Your Company//Your Product//EN", // Add product ID
//         }], { 
//           method: "REQUEST",
//           productId: "//Your Company//Calendar System//EN" // Add product ID to createEvents
//         });

//         if (error) {
//           console.error(`Error creating ICS for ${slot.store} - ${dayCode}:`, error);
//           continue;
//         }

//         // CRITICAL FIX: Proper MIME structure for Gmail
//         const mailOptions = {
//           from: `"${organizer.name}" <${organizer.email}>`,
//           to: to,
//           subject: `Meeting Invitation: ${slot.store} Visit - ${dayCode}`,
//           text: `You are invited to a recurring meeting for ${slot.store} visits.\n\nTime: Every ${dayCode} at ${slot.startHour}:00\nDuration: ${duration.hours} hour(s)\n\nPlease accept this calendar invitation to confirm your attendance.\n\nBest regards,\n${organizer.name}`,
//           html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px;">
//               <h2 style="color: #1a73e8;">Meeting Invitation</h2>
//               <p><strong>Event:</strong> ${slot.store} Visit - Weekly</p>
//               <p><strong>Time:</strong> Every ${dayCode} at ${slot.startHour}:00</p>
//               <p><strong>Duration:</strong> ${duration.hours} hour(s)</p>
//               <p><strong>Location:</strong> ${slot.store} Store Location</p>
              
//               <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
//                 <p>Please accept this calendar invitation to confirm your attendance.</p>
//               </div>
              
//               <p>Best regards,<br>${organizer.name}</p>
//             </div>
//           `,
//           // SOLUTION: Use icalEvent instead of alternatives for better Gmail compatibility
//           icalEvent: {
//             filename: `${slot.store}-visit.ics`,
//             method: 'REQUEST',
//             content: icsContent,
//           },
//           // Also include as attachment for backup
//           attachments: [{
//             filename: `${slot.store}-${dayCode}-visit.ics`,
//             content: icsContent,
//             contentType: "text/calendar; charset=utf-8; method=REQUEST",
//           }],
//         };

//         await transporter.sendMail(mailOptions);
//         sentInvitations.push(`${slot.store} - ${dayCode} at ${slot.startHour}:00`);
        
//         // Add small delay between emails to avoid rate limiting
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }
//     }

//     res.json({ 
//       message: "Individual calendar invitations sent successfully!",
//       invitationsSent: sentInvitations,
//       totalInvitations: sentInvitations.length
//     });

//   } catch (err) {
//     console.error("Error sending individual invitations:", err);
//     const errorMessage = typeof err === "object" && err !== null && "message" in err ? 
//       (err as { message: string }).message : String(err);
//     res.status(500).json({ error: `Failed to send individual invitations. Error: ${errorMessage}` });
//   }
// });

// // SOLUTION 2: Alternative approach - Single event with multiple occurrences
// app.post("/send-combined-schedule", async (req, res) => {
//   const {
//     to,
//     title,
//     startDate,
//     duration = { hours: 1 },
//     weeks,
//     organizer = {
//       name: "Organizer",
//       email: process.env.EMAIL_USER!,
//     },
//   } = req.body;

//   try {
//     // Create a simple single event that summarizes the schedule
//     const startOfScheduleInLocalTimezone = DateTime.fromISO(startDate, {
//       zone: 'Asia/Kolkata',
//     }).startOf("day").set({ hour: 9, minute: 0 }); // Start at 9 AM as overview

//     const startUTC = startOfScheduleInLocalTimezone.toUTC();
//     const weeklyDesc = generateWeeklyDescription(weeks);

//     const { error, value: icsContent } = createEvents([{
//       start: [startUTC.year, startUTC.month, startUTC.day, startUTC.hour, startUTC.minute],
//       duration: { hours: 8 }, // Full day overview
//       title: `Store Visit Schedule Overview - ${title}`,
//       description: `Your comprehensive store visit schedule:\n\n${weeklyDesc}\n\nThis is an overview event. Please check the attached ICS file for detailed recurring events.\n\nScheduled by: ${organizer.name}`,
//       location: "Multiple Store Locations",
//       organizer: {
//         name: organizer.name,
//         email: organizer.email,
//       },
//       attendees: [{
//         name: "Store Visit Attendee",
//         email: to,
//         rsvp: true,
//         partstat: "NEEDS-ACTION",
//         role: "REQ-PARTICIPANT",
//       }],
//       alarms: [{
//         action: "display",
//         trigger: { minutes: 30, before: true },
//         description: "Review your store visit schedule for the week",
//       }],
//       status: "TENTATIVE",
//       uid: `schedule-overview-${startUTC.toISODate()}-${Date.now()}@yourdomain.com`,
//       sequence: 0,
//     }], { method: "REQUEST" });

//     if (error) {
//       return res.status(500).json({ error: "Could not generate overview invitation." });
//     }

//     const mailOptions = {
//       from: `"${organizer.name}" <${organizer.email}>`,
//       to: to,
//       subject: `Store Visit Schedule Overview: ${title}`,
//       text: `Hello,\n\nPlease find your store visit schedule overview below.\n\n${weeklyDesc}\n\nThis invitation contains an overview of your schedule. Please accept to acknowledge receipt.\n\nBest regards,\n${organizer.name}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px;">
//           <h2 style="color: #1a73e8;">Store Visit Schedule Overview</h2>
//           <p>Hello,</p>
//           <p>Please find your store visit schedule overview below:</p>
          
//           <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
//             <h3>Weekly Schedule:</h3>
//             ${weeks.map((w: WeekDay) => `<p><strong>${{MO:'Monday',TU:'Tuesday',WE:'Wednesday',TH:'Thursday',FR:'Friday',SA:'Saturday',SU:'Sunday'}[w.day]}:</strong> ${w.slots.map(s => `${s.store} (${s.startHour}:00)`).join(', ')}</p>`).join('')}
//           </div>
          
//           <p>Please accept this invitation to acknowledge receipt of your schedule.</p>
//           <p>Best regards,<br>${organizer.name}</p>
//         </div>
//       `,
//       icalEvent: {
//         filename: 'schedule-overview.ics',
//         method: 'REQUEST',
//         content: icsContent,
//       },
//     };

//     await transporter.sendMail(mailOptions);
//     res.json({ 
//       message: "Schedule overview invitation sent successfully!",
//       details: "Overview event created with schedule summary"
//     });

//   } catch (err) {
//     console.error("Error sending overview invitation:", err);
//     const errorMessage = typeof err === "object" && err !== null && "message" in err ? 
//       (err as { message: string }).message : String(err);
//     res.status(500).json({ error: `Failed to send overview invitation. Error: ${errorMessage}` });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () =>
//   console.log(`Server runndding on http://localhost:${PORT}`)
// );




//Store email working fine
// Required packages
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { DateTime } from "luxon";
import { createEvents } from "ics";

dotenv.config();
const app = express();
app.use(express.json());

// Gmail transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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

// SOLUTION 1: Send individual calendar invitations (RECOMMENDED - Creates actual recurring events)
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

    if (!startOfScheduleInLocalTimezone.isValid) {
      return res.status(400).json({ error: "Invalid startDate provided." });
    }

    // Send individual invitations for each recurring event
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
        const numberOfOccurrences = Math.ceil(30 / 7);

        // Create individual event with proper formatting
        const { error, value: icsContent } = createEvents([{
          start: [startUTC.year, startUTC.month, startUTC.day, startUTC.hour, startUTC.minute],
          duration,
          title: `${slot.store} Visit - Weekly`,
          description: `Weekly visit to ${slot.store}\n\nScheduled by: ${organizer.name}\nLocation: Store Location\n\nThis is a recurring weekly appointment.`,
          location: `${slot.store} Store Location`,
          organizer: {
            name: organizer.name,
            email: organizer.email,
          },
          attendees: [{
            name: "Store Visit Attendee",
            email: to,
            rsvp: true,
            partstat: "NEEDS-ACTION",
            role: "REQ-PARTICIPANT",
          }],
          alarms: [{
            action: "display",
            trigger: { minutes: 15, before: true },
            description: `Reminder: ${slot.store} visit in 15 minutes`,
          }],
          status: "TENTATIVE", // Changed from CONFIRMED to TENTATIVE
          recurrenceRule: `FREQ=WEEKLY;BYDAY=${dayCode};COUNT=${numberOfOccurrences}`,
          uid: `${slot.store.toLowerCase()}-${dayCode.toLowerCase()}-${startUTC.toISODate()}-${Date.now()}@yourdomain.com`, // More unique UID
          sequence: 0, // Add sequence number
          productId: "//Your Company//Your Product//EN", // Add product ID
        }], { 
          method: "REQUEST",
          productId: "//Your Company//Calendar System//EN" // Add product ID to createEvents
        });

        if (error) {
          console.error(`Error creating ICS for ${slot.store} - ${dayCode}:`, error);
          continue;
        }

        // CRITICAL FIX: Proper MIME structure for Gmail
        const mailOptions = {
          from: `"${organizer.name}" <${organizer.email}>`,
          to: to,
          subject: `Meeting Invitation: ${slot.store} Visit - ${dayCode}`,
          text: `You are invited to a recurring meeting for ${slot.store} visits.\n\nTime: Every ${dayCode} at ${slot.startHour}:00\nDuration: ${duration.hours} hour(s)\n\nPlease accept this calendar invitation to confirm your attendance.\n\nBest regards,\n${organizer.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2 style="color: #1a73e8;">Meeting Invitation</h2>
              <p><strong>Event:</strong> ${slot.store} Visit - Weekly</p>
              <p><strong>Time:</strong> Every ${dayCode} at ${slot.startHour}:00</p>
              <p><strong>Duration:</strong> ${duration.hours} hour(s)</p>
              <p><strong>Location:</strong> ${slot.store} Store Location</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p>Please accept this calendar invitation to confirm your attendance.</p>
              </div>
              
              <p>Best regards,<br>${organizer.name}</p>
            </div>
          `,
          // SOLUTION: Use icalEvent instead of alternatives for better Gmail compatibility
          icalEvent: {
            filename: `${slot.store}-visit.ics`,
            method: 'REQUEST',
            content: icsContent,
          },
          // Also include as attachment for backup
          attachments: [{
            filename: `${slot.store}-${dayCode}-visit.ics`,
            content: icsContent,
            contentType: "text/calendar; charset=utf-8; method=REQUEST",
          }],
        };

        await transporter.sendMail(mailOptions);
        sentInvitations.push(`${slot.store} - ${dayCode} at ${slot.startHour}:00`);
        
        // Add small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({ 
      message: "Individual calendar invitations sent successfully!",
      invitationsSent: sentInvitations,
      totalInvitations: sentInvitations.length
    });

  } catch (err) {
    console.error("Error sending individual invitations:", err);
    const errorMessage = typeof err === "object" && err !== null && "message" in err ? 
      (err as { message: string }).message : String(err);
    res.status(500).json({ error: `Failed to send individual invitations. Error: ${errorMessage}` });
  }
});

// SOLUTION 2: Alternative approach - Single event with multiple occurrences
app.post("/send-combined-schedule", async (req, res) => {
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
    // Create a simple single event that summarizes the schedule
    const startOfScheduleInLocalTimezone = DateTime.fromISO(startDate, {
      zone: 'Asia/Kolkata',
    }).startOf("day").set({ hour: 9, minute: 0 }); // Start at 9 AM as overview

    const startUTC = startOfScheduleInLocalTimezone.toUTC();
    const weeklyDesc = generateWeeklyDescription(weeks);

    const { error, value: icsContent } = createEvents([{
      start: [startUTC.year, startUTC.month, startUTC.day, startUTC.hour, startUTC.minute],
      duration: { hours: 8 }, // Full day overview
      title: `Store Visit Schedule Overview - ${title}`,
      description: `Your comprehensive store visit schedule:\n\n${weeklyDesc}\n\nThis is an overview event. Please check the attached ICS file for detailed recurring events.\n\nScheduled by: ${organizer.name}`,
      location: "Multiple Store Locations",
      organizer: {
        name: organizer.name,
        email: organizer.email,
      },
      attendees: [{
        name: "Store Visit Attendee",
        email: to,
        rsvp: true,
        partstat: "NEEDS-ACTION",
        role: "REQ-PARTICIPANT",
      }],
      alarms: [{
        action: "display",
        trigger: { minutes: 30, before: true },
        description: "Review your store visit schedule for the week",
      }],
      status: "TENTATIVE",
      uid: `schedule-overview-${startUTC.toISODate()}-${Date.now()}@yourdomain.com`,
      sequence: 0,
    }], { method: "REQUEST" });

    if (error) {
      return res.status(500).json({ error: "Could not generate overview invitation." });
    }

    const mailOptions = {
      from: `"${organizer.name}" <${organizer.email}>`,
      to: to,
      subject: `Store Visit Schedule Overview: ${title}`,
      text: `Hello,\n\nPlease find your store visit schedule overview below.\n\n${weeklyDesc}\n\nThis invitation contains an overview of your schedule. Please accept to acknowledge receipt.\n\nBest regards,\n${organizer.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #1a73e8;">Store Visit Schedule Overview</h2>
          <p>Hello,</p>
          <p>Please find your store visit schedule overview below:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Weekly Schedule:</h3>
            ${(() => {
              const dayMap: Record<string, string> = {
                MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday',
                FR: 'Friday', SA: 'Saturday', SU: 'Sunday'
              };
              return weeks.map((w: WeekDay) =>
                `<p><strong>${dayMap[w.day as keyof typeof dayMap]}</strong>: ${w.slots.map(s => `${s.store} (${s.startHour}:00)`).join(', ')}</p>`
              ).join('');
            })()}
          </div>
          
          <p>Please accept this invitation to acknowledge receipt of your schedule.</p>
          <p>Best regards,<br>${organizer.name}</p>
        </div>
      `,
      icalEvent: {
        filename: 'schedule-overview.ics',
        method: 'REQUEST',
        content: icsContent,
      },
    };

    await transporter.sendMail(mailOptions);
    res.json({ 
      message: "Schedule overview invitation sent successfully!",
      details: "Overview event created with schedule summary"
    });

  } catch (err) {
    console.error("Error sending overview invitation:", err);
    const errorMessage = typeof err === "object" && err !== null && "message" in err ? 
      (err as { message: string }).message : String(err);
    res.status(500).json({ error: `Failed to send overview invitation. Error: ${errorMessage}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
