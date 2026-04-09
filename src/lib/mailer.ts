import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "localhost",
      port: Number(process.env.SMTP_PORT ?? 1025),
      auth:
        process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      secure: false,
    });
  }
  return transporter;
}

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(options: MailOptions) {
  const from = process.env.SMTP_FROM ?? "noreply@youragency.com";
  const mail = getTransporter();

  try {
    const info = await mail.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
