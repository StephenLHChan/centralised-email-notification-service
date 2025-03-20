import { SQSHandler } from "aws-lambda";
import nodemailer from "nodemailer";
import { z } from "zod";
import { Attachment } from "nodemailer/lib/mailer";
import { Buffer } from "buffer";

// Define the schema for validation using Zod
const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(), // Base64 encoded CSV content
        encoding: z.string().optional().default("base64"),
        contentType: z.string().optional().default("text/csv"),
      })
    )
    .optional(),
});

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // use TLS
});

export const handler: SQSHandler = async event => {
  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body);

      // Validate the message using Zod
      const emailData = emailSchema.parse(messageBody);

      // Prepare attachments if any
      const attachments: Attachment[] | undefined = emailData.attachments?.map(
        att => ({
          filename: att.filename,
          content: Buffer.from(att.content, att.encoding as Buffer.Encoding),
          contentType: att.contentType,
        })
      );

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        attachments,
      });

      console.log(`Email sent successfully to ${emailData.to}`);
    } catch (error) {
      console.error("Error processing SQS message:", error);
    }
  }
};
