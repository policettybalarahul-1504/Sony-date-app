// Deploy this as a Google Apps Script Web App under YOUR OWN Google account.
// It writes an event straight into YOUR default Google Calendar whenever
// the virtual-date site calls it — i.e. the moment Sony confirms a date.
//
// Setup:
//   1. Go to https://script.google.com -> New project.
//   2. Delete the placeholder code and paste this whole file in.
//   3. Replace SECRET below with a long random string of your own.
//   4. Deploy -> New deployment -> type "Web app".
//      - Execute as: Me
//      - Who has access: Anyone
//   5. Click Deploy, approve the Calendar permission it asks for.
//   6. Copy the resulting Web app URL (ends in /exec).
//   7. Put that URL and your SECRET into script.js (NOTIFY_URL / NOTIFY_SECRET).

const SECRET = 'REPLACE_WITH_YOUR_OWN_RANDOM_SECRET';

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

  CalendarApp.getDefaultCalendar().createEvent(
    title,
    new Date(startMillis),
    new Date(endMillis),
    { description: details }
  );

  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}
