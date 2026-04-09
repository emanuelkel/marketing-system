import { sendMail } from "./mailer";
import { prisma } from "./prisma";

interface NotifyOptions {
  userId: string;
  subject: string;
  body: string;
  whatsappMessage?: string;
}

export async function notifyUser(opts: NotifyOptions) {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { email: true, name: true, phone: true },
  });
  if (!user) return;

  // Email notification
  const emailHtml = buildEmailHtml(user.name, opts.body, user.phone ? opts.whatsappMessage : undefined);
  const emailResult = await sendMail({
    to: user.email,
    subject: opts.subject,
    html: emailHtml,
    text: opts.body,
  });

  // Log notification
  await prisma.notification.create({
    data: {
      userId: opts.userId,
      channel: "EMAIL",
      subject: opts.subject,
      body: opts.body,
      sentAt: emailResult.success ? new Date() : undefined,
      error: emailResult.success ? undefined : String(emailResult.error),
    },
  });
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

function buildEmailHtml(
  recipientName: string,
  body: string,
  whatsappMessage?: string
): string {
  const waSection =
    whatsappMessage
      ? `<p style="margin-top:16px">
          <a href="${whatsappMessage}"
             style="background:#25D366;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Responder pelo WhatsApp
          </a>
        </p>`
      : "";

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1f2937">
      <div style="border-radius:8px;border:1px solid #e5e7eb;padding:24px">
        <p>Olá, <strong>${recipientName}</strong>!</p>
        <div style="line-height:1.6">${body.replace(/\n/g, "<br>")}</div>
        ${waSection}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="font-size:12px;color:#6b7280">
          Este e-mail foi enviado automaticamente. Por favor, não responda.
        </p>
      </div>
    </body>
    </html>
  `;
}
