# Immediate security actions

1. Revoke the exposed Telegram bot token found in the original storefront using BotFather, then create a replacement only for a server-side Cloud Function.
2. Never place Telegram bot tokens, service-account keys, payment secrets, or admin credentials in HTML/JavaScript.
3. Deploy strict Firestore rules. The included `firestore.rules.example` requires an `admin` custom claim for reading/updating/deleting orders.
4. Restrict the Firebase browser API key by HTTP referrer and Firebase APIs in Google Cloud Console. The Firebase web config itself is public by design.
5. Enable Firebase App Check and consider CAPTCHA/rate limiting for order creation.
6. The original admin dashboard inserts customer-controlled values with `innerHTML`, creating stored-XSS risk. Replace dynamic HTML interpolation with `textContent`/DOM nodes or escape every value before rendering.
7. Publish real privacy, shipping, exchange, and contact policies before taking orders.
