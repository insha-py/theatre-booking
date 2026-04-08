import nodemailer from 'nodemailer';

export async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('CRITICAL: Real SMTP credentials are missing in your .env file. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS to send real emails.');
  }

  return nodemailer.createTransport({
    host: host,
    port: Number(port),
    secure: port == 465, // true for 465, false for other ports (like 587)
    auth: {
      user: user,
      pass: pass,
    },
  });
}
