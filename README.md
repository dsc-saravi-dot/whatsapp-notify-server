# Google Sheet → WhatsApp group notifier

Two pieces:
1. `server.js` — a Node server that logs into WhatsApp and posts messages into a group.
2. `apps-script.gs` — a script that lives inside your Google Sheet and calls the server whenever a row is filled in.

## 1. Deploy the server

1. Push this folder to a GitHub repo (or upload directly to your host).
2. Create a free account on [Render](https://render.com) or [Railway](https://railway.app).
3. Create a new "Web Service" pointing at this repo. Set the start command to `npm start`.
4. Add environment variables in the host's dashboard:
   - `NOTIFY_SECRET` — any random string you make up (e.g. `k3j2h4g5f6d7s8a9`)
   - `WHATSAPP_GROUP_ID` — leave blank for now, you'll fill this in after step 2 below
5. Deploy. Watch the logs — a QR code will print.
6. Open WhatsApp on the phone you want the bot to use → Settings → Linked Devices → Link a Device → scan the QR code from the logs.
7. Once connected, visit `https://your-server-url/chats` in a browser. This lists all your groups with their IDs.
8. Copy the ID of your target group, add it back into the `WHATSAPP_GROUP_ID` environment variable, and redeploy.

## 2. Set up the Apps Script

1. Open your Google Sheet → Extensions → Apps Script.
2. Paste in the contents of `apps-script.gs`.
3. Update `NOTIFY_URL` to your deployed server's `/notify` address (e.g. `https://your-server-url.onrender.com/notify`).
4. Update `NOTIFY_SECRET` to match exactly what you set on the server.
5. Adjust `formatMessage()` and the column checks in `onEditInstallable()` to match your actual sheet's columns.
6. In the function dropdown at the top, select `createTrigger` and click Run once. Approve the permissions it asks for.
7. That's it — the trigger is now installed and will keep running even after you close the script editor.

## 3. Test it

Fill in a row in your Sheet the way an agent normally would. Within a few seconds, the message should appear in your WhatsApp group.

## Notes

- This uses an **unofficial** WhatsApp automation library. It works well in practice but isn't sanctioned by Meta — there's a small risk the linked number could get flagged. Consider using a spare number rather than your primary one.
- If the server restarts, `LocalAuth` normally keeps you logged in — but on some free hosts the disk resets, in which case you'll need to rescan the QR code.
