const nodemailer = require('nodemailer');

function mailError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw mailError('שליחת האימייל לא הוגדרה. הוסף SMTP_HOST, SMTP_USER ו-SMTP_PASS לקובץ .env', 500);
  }

  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function genderLabel(gender) {
  return gender === 'Female' ? 'נקבה' : 'זכר';
}

async function sendMatchmakerEmail({ matchmaker, candidate, user, profile }) {
  const transporter = createTransport();
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const interested = profile.gender === 'Female' ? 'מעוניינת' : 'מעוניין';
  const lines = [
    `שלום ${matchmaker.name},`,
    '',
    `${name} ${interested} במועמד/ת ${candidate.firstName}.`,
    '',
    `שם: ${name}`,
    `אימייל: ${user.email}`,
    `גיל: ${profile.age}`,
    `עיר: ${profile.city}`,
    `מגדר: ${genderLabel(profile.gender)}`,
    `מגזר: ${profile.sector}`,
    `מסגרת: ${profile.education}`,
    `סדר יום: ${profile.lifestyle}`,
    `שפות: ${(profile.languages || []).join(', ') || 'לא צוין'}`,
    `תיאור: ${profile.description || 'לא צוין'}`,
  ];

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: matchmaker.email,
    replyTo: user.email,
    subject: `התעניינות בשידוך: ${candidate.firstName}`,
    text: lines.join('\n'),
  });

  return {
    previewUrl: nodemailer.getTestMessageUrl(info) || null,
  };
}

async function sendEngagementApprovalEmail({ to, firstName, matchmakerName, approvalUrl }) {
  const transporter = createTransport();
  const lines = [
    `שלום ${firstName},`,
    '',
    `${matchmakerName} ביקש/ה את אישורך לשידוך.`,
    'הקישור מאשר רק את הצד שלך. השידוך נסגר רק אחרי ששני הצדדים מאשרים.',
    '',
    approvalUrl,
  ];

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'אישור שידוך',
    text: lines.join('\n'),
  });

  return {
    previewUrl: nodemailer.getTestMessageUrl(info) || null,
  };
}

module.exports = {
  sendMatchmakerEmail,
  sendEngagementApprovalEmail,
};
