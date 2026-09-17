// Deploy this as a Google Apps Script Web App under YOUR OWN Google account.
// It emails YOU whenever the virtual-date site calls it — i.e. the moment
// Sony confirms a date, time and activity.
//
// Setup:
//   1. Go to https://script.google.com -> New project.
//   2. Delete the placeholder code and paste this whole file in.
//   3. Replace SECRET below with a long random string of your own.
//   4. Replace EMAIL_TO below with the Gmail address that should receive it
//      (already set to policettybalarahul@gmail.com).
//   5. Deploy -> New deployment -> type "Web app".
//      - Execute as: Me
//      - Who has access: Anyone
//   6. Click Deploy, approve the Gmail permission it asks for.
//   7. Copy the resulting Web app URL (ends in /exec).
//   8. Put that URL and your SECRET into script.js (NOTIFY_URL / NOTIFY_SECRET).

const SECRET = 'REPLACE_WITH_YOUR_OWN_RANDOM_SECRET';
const EMAIL_TO = 'policettybalarahul@gmail.com';

function doGet(e) {
  const params = e.parameter;

  if (params.secret !== SECRET) {
    return ContentService.createTextOutput('Forbidden').setMimeType(ContentService.MimeType.TEXT);
  }

  const startMillis = Number(params.start);
  const endMillis = Number(params.end);
  const title = params.title || 'Virtual date';
  const details = params.details || '';

  if (!startMillis || !endMillis) {
    return ContentService.createTextOutput('Missing start/end').setMimeType(ContentService.MimeType.TEXT);
  }

  const start = new Date(startMillis);
  const end = new Date(endMillis);

  MailApp.sendEmail({
    to: EMAIL_TO,
    subject: `Sony picked a date! ${title}`,
    body:
      `Sony just confirmed the virtual date:\n\n`
      + `${title}\n`
      + `From: ${start}\n`
      + `To: ${end}\n\n`
      + `${details}`
  });

  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}
