// Google Apps Script — paste this into Extensions > Apps Script in your Sheet.
//
// This does NOT run automatically from the simple editor trigger dropdown;
// you must set up an "installable" onEdit trigger (instructions below the code),
// because UrlFetchApp requires permissions that the simple trigger doesn't grant.

// --- CONFIGURE THESE TWO VALUES ---
const NOTIFY_URL = 'https://your-server-url.onrender.com/notify'; // your deployed server's /notify route
const NOTIFY_SECRET = 'change-this-secret'; // must match NOTIFY_SECRET on the server
// -----------------------------------

function onEditInstallable(e) {
  // e.range is the cell/row that was just edited.
  const sheet = e.range.getSheet();
  const row = e.range.getRow();

  // Skip the header row.
  if (row === 1) return;

  // Only fire once the row looks complete — adjust this check to match
  // your actual columns. Example: assumes columns A-D must all be filled.
  const rowValues = sheet.getRange(row, 1, 1, 4).getValues()[0];
  const isComplete = rowValues.every((cell) => cell !== '' && cell !== null);
  if (!isComplete) return;

  const message = formatMessage(rowValues);
  sendToWhatsApp(message);
}

function formatMessage(rowValues) {
  // Customize this to match your actual column order/labels.
  const [colA, colB, colC, colD] = rowValues;
  return (
    `New entry submitted:\n` +
    `Field 1: ${colA}\n` +
    `Field 2: ${colB}\n` +
    `Field 3: ${colC}\n` +
    `Field 4: ${colD}`
  );
}

function sendToWhatsApp(message) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-notify-secret': NOTIFY_SECRET,
    },
    payload: JSON.stringify({ message: message }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(NOTIFY_URL, options);
  Logger.log(response.getContentText());
}

// --- ONE-TIME SETUP: run this function once manually to install the trigger ---
function createTrigger() {
  ScriptApp.newTrigger('onEditInstallable')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  Logger.log('Trigger installed.');
}
