const nodemailer = require('nodemailer');

function mailError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw mailError('שליחת האימייל לא הוגדרה. הוסף SMTP_USER ו-SMTP_PASS לקובץ .env', 500);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user, pass },
  });
}

function logSmtpError(action, error) {
  console.log(`Gmail SMTP ${action} failed: ${error.code || ''} ${error.message}`.trim());
}

async function verifyMailTransport() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Gmail SMTP is waiting for SMTP_USER and SMTP_PASS in .env');
    return;
  }
  try {
    await createTransport().verify();
    console.log('Gmail SMTP connection verified');
  } catch (error) {
    logSmtpError('verification', error);
  }
}

function genderLabel(gender) {
  return gender === 'Female' ? 'נקבה' : 'זכר';
}

async function deliver(message) {
  try {
    await createTransport().sendMail({
      ...message,
      from: process.env.SMTP_USER,
    });
  } catch (error) {
    logSmtpError('send', error);
    if (error.statusCode) throw error;
    throw mailError('שליחת האימייל נכשלה', 502);
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function detailLines(profile, preferences, user) {
  const ageRange = preferences && preferences.ageRange
    ? `${preferences.ageRange.min}–${preferences.ageRange.max}`
    : 'לא צוין';
  const extra = preferences && preferences.additionalCriteria
    ? JSON.stringify(preferences.additionalCriteria)
    : 'לא צוין';
  return [
    `שם פרטי: ${profile.firstName || 'לא צוין'}`,
    `שם משפחה: ${profile.lastName || 'לא צוין'}`,
    `אימייל: ${user.email}`,
    `מגדר: ${genderLabel(profile.gender)}`,
    `מגזר: ${profile.sector || 'לא צוין'}`,
    `גיל: ${profile.age ?? 'לא צוין'}`,
    `עיר: ${profile.city || 'לא צוין'}`,
    `השכלה: ${profile.education || 'לא צוין'}`,
    `סדר יום: ${profile.lifestyle || 'לא צוין'}`,
    `שפות: ${(profile.languages || []).join(', ') || 'לא צוין'}`,
    `פנוי: ${profile.isAvailable === false ? 'לא' : 'כן'}`,
    `תיאור: ${profile.description || 'לא צוין'}`,
    '',
    'העדפות:',
    `מגדר מבוקש: ${preferences ? genderLabel(preferences.gender) : 'לא צוין'}`,
    `מגזר מבוקש: ${preferences?.sector || 'לא צוין'}`,
    `טווח גילאים: ${ageRange}`,
    `ערים: ${preferences ? (preferences.cities || []).join(', ') || 'לא צוין' : 'לא צוין'}`,
    `שפות מועדפות: ${preferences ? (preferences.languages || []).join(', ') || 'לא צוין' : 'לא צוין'}`,
    `השכלה מועדפת: ${preferences?.education || 'לא צוין'}`,
    `סדר יום מועדף: ${preferences?.lifestyle || 'לא צוין'}`,
    `קריטריונים נוספים: ${extra}`,
  ];
}

async function sendVerificationEmail({ to, verifyUrl }) {
  const safeUrl = escapeHtml(verifyUrl);
  await deliver({
    to,
    subject: 'אימות כתובת האימייל',
    text: `כדי להשלים את ההרשמה ל-MatchPoint, פתחו את הקישור:\n${verifyUrl}`,
    html: `
      <div dir="rtl" style="font-family:Heebo,Segoe UI,sans-serif;color:#172033;line-height:1.7;">
        <p>כדי להשלים את ההרשמה ל-MatchPoint, אשרו את כתובת האימייל.</p>
        <p><a href="${safeUrl}" style="display:inline-block;background:#163a73;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;">אימות האימייל</a></p>
        <p style="font-size:14px;color:#667085;">${safeUrl}</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const safeUrl = escapeHtml(resetUrl);
  await deliver({
    to,
    subject: 'איפוס סיסמה',
    text: `כדי לבחור סיסמה חדשה ל-MatchPoint, פתחו את הקישור. הוא בתוקף לשעה:\n${resetUrl}`,
    html: `
      <div dir="rtl" style="font-family:Heebo,Segoe UI,sans-serif;color:#172033;line-height:1.7;">
        <p>כדי לבחור סיסמה חדשה ל-MatchPoint, לחצו על הקישור. הוא בתוקף לשעה.</p>
        <p><a href="${safeUrl}" style="display:inline-block;background:#163a73;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;">בחירת סיסמה חדשה</a></p>
        <p style="font-size:14px;color:#667085;">${safeUrl}</p>
      </div>
    `,
  });
}

async function sendMatchmakerEmail({ matchmaker, candidate, user, profile, preferences }) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const interested = profile.gender === 'Female' ? 'מעוניינת' : 'מעוניין';
  const lines = [
    `שלום ${matchmaker.name},`,
    '',
    `${name || profile.firstName} ${interested} במועמד/ת ${candidate.firstName}.`,
    '',
    ...detailLines(profile, preferences, user),
  ];
  const rows = detailLines(profile, preferences, user)
    .map((line) => `<p style="margin:0 0 6px;">${escapeHtml(line)}</p>`)
    .join('');

  await deliver({
    to: matchmaker.email,
    replyTo: user.email,
    subject: `פנייה לגבי ${candidate.firstName}`,
    text: lines.join('\n'),
    html: `
      <div dir="rtl" style="font-family:Heebo,Segoe UI,sans-serif;color:#172033;line-height:1.7;">
        <p>שלום ${escapeHtml(matchmaker.name)},</p>
        <p>${escapeHtml(name || profile.firstName)} ${interested} במועמד/ת ${escapeHtml(candidate.firstName)}.</p>
        ${rows}
      </div>
    `,
  });
}

async function sendEngagementApprovalEmail({ to, firstName, matchmakerName, approvalUrl }) {
  const safeUrl = escapeHtml(approvalUrl);
  const lines = [
    `שלום ${firstName},`,
    '',
    `${matchmakerName} ביקש/ה את אישורך לשידוך.`,
    'הקישור מאשר רק את הצד שלך. השידוך נסגר רק אחרי ששני הצדדים מאשרים.',
    '',
    approvalUrl,
  ];

  await deliver({
    to,
    subject: 'אישור שידוך',
    text: lines.join('\n'),
    html: `
      <div dir="rtl" style="font-family:Heebo,Segoe UI,sans-serif;color:#172033;line-height:1.7;">
        <p>שלום ${escapeHtml(firstName)},</p>
        <p>${escapeHtml(matchmakerName)} ביקש/ה את אישורך לשידוך.</p>
        <p>הקישור מאשר רק את הצד שלך. השידוך נסגר רק אחרי ששני הצדדים מאשרים.</p>
        <p><a href="${safeUrl}" style="display:inline-block;background:#ff5d78;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;">אישור השידוך</a></p>
        <p style="font-size:14px;color:#667085;">${safeUrl}</p>
      </div>
    `,
  });
}

module.exports = {
  verifyMailTransport,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMatchmakerEmail,
  sendEngagementApprovalEmail,
};
