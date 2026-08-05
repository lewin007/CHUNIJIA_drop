# CHUNIJIA Telegram notifications — easiest free setup

This package already contains the website code that sends an order notification to a Google Apps Script web app.

## The three values

| Value | Is it private? | Where it goes |
|---|---:|---|
| `TELEGRAM_BOT_TOKEN` | **Yes** | Google Apps Script → Project Settings → Script properties |
| `TELEGRAM_CHAT_ID` | **Yes** | Google Apps Script → Project Settings → Script properties |
| Google Apps Script URL ending in `/exec` | No | `index.html`, in `TELEGRAM_NOTIFICATION_URL` |

**Never place the bot token or chat ID in `index.html`, GitHub, or screenshots.**

## A. Create or reset the Telegram bot

1. On your phone, open the verified `@BotFather` chat.
2. Send `/mybots`.
3. Select the CHUNIJIA bot → **API Token**.
4. Revoke the old leaked token and generate a new token.
5. Open the bot itself, tap **Start**, and send `hello`.

## B. Find your chat ID on your phone

1. In a private browser tab, open:
   `https://api.telegram.org/botYOUR_NEW_TOKEN/getUpdates`
2. Replace `YOUR_NEW_TOKEN` with the new bot token.
3. Find `"chat":{"id":123456789...}` and copy that number.
4. Close the browser tab because its address contains the token.

## C. Create the free Google Apps Script

1. Open `https://script.google.com` while signed into your Google account.
2. Select **New project**.
3. Rename it `CHUNIJIA Telegram Notifications`.
4. Delete the default code in `Code.gs`.
5. Open `GOOGLE-APPS-SCRIPT-Code.gs` from this package, copy all its code, and paste it into Apps Script.
6. Click **Save**.

## D. Put the two PRIVATE values in Script Properties

In Apps Script, open **Project Settings** → **Script properties** → **Add script property**.

Add exactly:

- Property: `TELEGRAM_BOT_TOKEN`
  - Value: your new Telegram bot token
- Property: `TELEGRAM_CHAT_ID`
  - Value: your numeric Telegram chat ID

These two values stay in Google Apps Script. They do not go into the website.

## E. Test the private setup

1. Return to the Apps Script editor.
2. Choose the function `testTelegramSetup` from the function menu.
3. Click **Run**.
4. Approve Google's permission screen.
5. A test message should arrive in Telegram on your phone.

## F. Deploy the Apps Script endpoint

1. In Apps Script, choose **Deploy** → **New deployment**.
2. Click the gear icon → **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Click **Deploy** and approve access.
6. Copy the web app URL ending in `/exec`.

## G. Put only the PUBLIC `/exec` URL in the website

Open `index.html` and search for:

```javascript
const TELEGRAM_NOTIFICATION_URL="PASTE_YOUR_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE";
```

Replace only the placeholder, for example:

```javascript
const TELEGRAM_NOTIFICATION_URL="https://script.google.com/macros/s/EXAMPLE_DEPLOYMENT_ID/exec";
```

The `/exec` URL is not the Telegram token. It is acceptable for it to be in the website.

## H. Upload the website

Upload the updated package files to the root of the GitHub Pages branch, replacing the existing files. Do not upload any file containing the real bot token or chat ID.

## I. Test a real order

1. Open `https://chunijia.tech/` in a private browser window.
2. Choose S, M, or L.
3. Submit a test order.
4. Confirm that:
   - the order appears in Firestore/admin;
   - the Telegram notification arrives on your phone.

## When you change Apps Script code later

Use **Deploy** → **Manage deployments** → edit the current deployment → create a new version → **Deploy**. Keep the same `/exec` URL so you do not need to edit the website again.

## Security limitation

The bot token is protected, but the Apps Script endpoint itself is public. The included code validates fields, blocks duplicate notifications for ten minutes, and limits requests. A Firebase server-side trigger is stronger, but this setup is much safer than publishing the Telegram token in frontend JavaScript.
