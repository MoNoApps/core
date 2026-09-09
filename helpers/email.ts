import sgMail from "@sendgrid/mail";
import config from "../config.json";

export interface EmailData {
  email: string;
  subject: string;
  html: string;
  text?: string;
  name?: string;
  tags?: string[];
}

export function sendMail(
  data: EmailData,
  cb?: (error: Error | null, result?: unknown) => void,
): void {
  const token = process.env.SENDGRID_TOKEN;
  if (!token) {
    console.warn(
      "[sendMail] SENDGRID_TOKEN is not configured in process.env. Email sending skipped.",
    );
    if (cb) cb(null, { skipped: true });
    return;
  }

  try {
    sgMail.setApiKey(token);
    const msg = {
      to: data.email,
      from: config.mail?.from || "noreply@monoapps.co",
      subject: data.subject,
      html: data.html,
      text: data.text || data.subject,
    };

    sgMail
      .send(msg)
      .then((result) => {
        if (cb) cb(null, result);
      })
      .catch((err) => {
        console.error("[sendMail] Error sending email:", err);
        if (cb) cb(err);
      });
  } catch (err) {
    console.error("[sendMail] Error sending email:", err);
    if (cb) cb(err as Error);
  }
}

export default {
  sendMail,
};
