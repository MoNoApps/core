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
    const sendgrid = require("sendgrid")(token);
    const email = new sendgrid.Email();
    email.addTo(data.email);
    email.setFrom(config.mail?.from || "noreply@monoapps.co");
    email.setSubject(data.subject);
    email.setHtml(data.html);

    sendgrid.send(email, (error: Error | null, json: unknown) => {
      if (error && cb) {
        return cb(error);
      }
      if (cb) cb(null, json);
    });
  } catch (err) {
    console.error("[sendMail] Error sending email:", err);
    if (cb) cb(err as Error);
  }
}

export default {
  sendMail,
};
