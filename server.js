// server.js
// A small always-on server that logs into WhatsApp via whatsapp-web.js
// and exposes a POST /notify endpoint. Any request to /notify gets
// forwarded as a message into your WhatsApp group.

const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');

let latestQr = null; // holds the most recent QR string so /qr can render it as an image

const app = express();
app.use(express.json());

// A shared secret so random people on the internet can't spam your group.
// Set this in your hosting provider's environment variables.
const NOTIFY_SECRET = process.env.NOTIFY_SECRET || 'change-this-secret';

// Fill this in once you've found your group ID (see step 3 in the guide).
// It looks like: 1234567890-1234567890@g.us
const GROUP_ID = process.env.WHATSAPP_GROUP_ID || 'PASTE_YOUR_GROUP_ID_HERE';

const client = new Client({
  authStrategy: new LocalAuth(), // saves your login so you don't rescan every restart
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// Prints a QR code in the server logs the first time you run this.
// Scan it with WhatsApp > Linked Devices on the phone you want the bot to use.
client.on('qr', (qr) => {
  latestQr = qr;
  console.log('New QR code generated. Visit /qr on your server URL to scan it as an image.');
  qrcodeTerminal.generate(qr, { small: true });
});

client.on('ready', () => {
  latestQr = null;
  console.log('WhatsApp client is ready.');
});

client.on('auth_failure', (msg) => {
  console.error('Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
  console.error('Client was logged out:', reason);
});

// One-time helper: hit this route after logging in to list all your chats
// and find the correct group ID. Remove or protect this route once you're done.
app.get('/chats', async (req, res) => {
  try {
    const chats = await client.getChats();
    const groups = chats
      .filter((chat) => chat.isGroup)
      .map((chat) => ({ name: chat.name, id: chat.id._serialized }));
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The main webhook. Google Apps Script will POST here whenever
// a row in the Sheet is filled in.
app.post('/notify', async (req, res) => {
  const secret = req.headers['x-notify-secret'];
  if (secret !== NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Invalid or missing secret' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing "message" in request body' });
  }

  if (GROUP_ID === 'PASTE_YOUR_GROUP_ID_HERE') {
    return res.status(500).json({ error: 'GROUP_ID is not configured on the server yet' });
  }

  try {
    await client.sendMessage(GROUP_ID, message);
    res.json({ status: 'sent' });
  } catch (err) {
    console.error('Failed to send message:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('WhatsApp notify server is running.');
});

// Visit this route in a browser to see a clean, scannable QR code image.
// Refresh it if the code expires before you scan it.
app.get('/qr', async (req, res) => {
  if (!latestQr) {
    return res.send(
      'No QR code available right now. Either the client is already logged in, or it hasn\'t generated one yet — wait a few seconds and refresh.'
    );
  }
  try {
    const dataUrl = await QRCode.toDataURL(latestQr, { width: 400 });
    res.send(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
      <img src="${dataUrl}" alt="WhatsApp QR code" />
    </body></html>`);
  } catch (err) {
    res.status(500).send('Failed to render QR code: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

client.initialize();
