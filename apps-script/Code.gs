// Deploy this as a Google Apps Script Web App under YOUR OWN Google account.
// It sends YOU a WhatsApp message (via the free CallMeBot service) whenever
// the virtual-date site calls it — i.e. the moment Sony confirms a date,
// time and activity.
//
// One-time WhatsApp opt-in (CallMeBot), do this FIRST:
//   1. On WhatsApp, add this contact: +34 644 59 71 30
//   2. Message it exactly: I allow callmebot to send me messages
//   3. It replies with your APIKEY (a number). Keep it.
//
// Setup:
//   1. Go to https://script.google.com -> New project.
//   2. Delete the placeholder code and paste this whole file in.
//   3. Fill in PHONE and APIKEY below with your own values.
//   4. Deploy -> New deployment -> type "Web app".
//      - Execute as: Me
//      - Who has access: Anyone
//   5. Click Deploy (no special permission prompt needed this time,
//      since this script only talks to CallMeBot, not your Google account).
//   6. Copy the resulting Web app URL (ends in /exec).
//   7. Put that URL and SECRET into script.js (NOTIFY_URL / NOTIFY_SECRET).
//
// IMPORTANT: PHONE and APIKEY below are private to you. Fill them in only
// inside your own script.google.com project — don't commit your real
// values back into this public repo file.

const SECRET = 'REPLACE_WITH_YOUR_OWN_RANDOM_SECRET';
const PHONE = 'REPLACE_WITH_YOUR_PHONE_NUMBER_WITH_COUNTRY_CODE'; // e.g. 919876543210
const APIKEY = 'REPLACE_WITH_YOUR_CALLMEBOT_APIKEY';

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

  const message =
    `Sony picked a date!\n${title}\nFrom: ${start}\nTo: ${end}\n\n${details}`;

  const url = 'https://api.callmebot.com/whatsapp.php'
    + '?phone=' + encodeURIComponent(PHONE)
    + '&text=' + encodeURIComponent(message)
    + '&apikey=' + encodeURIComponent(APIKEY);

  UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}
