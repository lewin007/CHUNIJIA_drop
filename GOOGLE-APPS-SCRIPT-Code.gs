/**
 * CHUNIJIA Telegram order notifier
 *
 * PRIVATE VALUES:
 *   TELEGRAM_BOT_TOKEN -> Google Apps Script > Project Settings > Script properties
 *   TELEGRAM_CHAT_ID   -> Google Apps Script > Project Settings > Script properties
 *
 * Do not paste either value into index.html or GitHub.
 */

const ALLOWED_SIZES = ["S", "M", "L"];
const MAX_REQUESTS_PER_MINUTE = 30;
const DUPLICATE_WINDOW_SECONDS = 600;

/** Health check. Open the deployed /exec URL in a browser. */
function doGet() {
  return jsonResponse({
    ok: true,
    service: "CHUNIJIA Telegram notifier",
    message: "The notifier is running."
  });
}

/** Receives a new order from chunijia.tech and sends a Telegram notification. */
function doPost(e) {
  try {
    const order = parseRequestBody(e);

    // Honeypot. Normal customers never see or fill this field.
    if (cleanText(order.website, 80)) {
      return jsonResponse({ ok: true });
    }

    // This is only an identifier, not a security secret.
    if (cleanText(order.source, 80) !== "chunijia.tech") {
      return jsonResponse({ ok: false, error: "Invalid source." });
    }

    const validated = validateOrder(order);
    const fingerprint = sha256([
      validated.orderId,
      validated.phone,
      validated.size,
      validated.address
    ].join("|"));

    const rateResult = checkRateLimits(fingerprint);
    if (!rateResult.allowed) {
      return jsonResponse({
        ok: true,
        ignored: rateResult.reason
      });
    }

    const message = buildOrderMessage(validated);
    sendTelegramMessage(message);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonResponse({
      ok: false,
      error: "Notification failed."
    });
  }
}

/** Run this once in Apps Script to verify your private properties and Telegram bot. */
function testTelegramSetup() {
  const now = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || "Africa/Tunis",
    "yyyy-MM-dd HH:mm:ss"
  );

  sendTelegramMessage([
    "✅ CHUNIJIA TELEGRAM TEST",
    "",
    "Your private bot token and chat ID are configured correctly.",
    "Time: " + now
  ].join("\n"));
}

function parseRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body.");
  }

  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error("Request body is not valid JSON.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid request body.");
  }

  return body;
}

function validateOrder(order) {
  const orderId = cleanText(order.orderId, 40);
  const fullName = cleanText(order.fullName, 100);
  const phone = cleanText(order.phone, 30);
  const wilaya = cleanText(order.wilaya, 60);
  const address = cleanText(order.address, 250);
  const size = cleanText(order.size, 5).toUpperCase();
  const note = cleanText(order.note, 300);

  if (!/^CHU-\d{7}$/.test(orderId)) {
    throw new Error("Invalid order ID.");
  }
  if (fullName.length < 2) {
    throw new Error("Invalid customer name.");
  }
  if (!/^[+\d][\d\s-]{7,18}$/.test(phone)) {
    throw new Error("Invalid telephone number.");
  }
  if (wilaya.length < 2) {
    throw new Error("Invalid wilaya.");
  }
  if (address.length < 3) {
    throw new Error("Invalid delivery address.");
  }
  if (ALLOWED_SIZES.indexOf(size) === -1) {
    throw new Error("Invalid size.");
  }

  return { orderId, fullName, phone, wilaya, address, size, note };
}

function buildOrderMessage(order) {
  return [
    "🛍️ NEW CHUNIJIA ORDER",
    "",
    "Order: " + order.orderId,
    "Customer: " + order.fullName,
    "Phone: " + order.phone,
    "Wilaya: " + order.wilaya,
    "Address: " + order.address,
    "Size: " + order.size,
    "Note: " + (order.note || "—"),
    "",
    "Product: Mediterranean Heritage Tee",
    "Price: 79 DT",
    "Delivery: FREE",
    "Total: 79 DT",
    "Payment: Cash on delivery",
    "",
    "Admin: https://chunijia.tech/admin.html"
  ].join("\n");
}

function sendTelegramMessage(message) {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty("TELEGRAM_BOT_TOKEN");
  const chatId = properties.getProperty("TELEGRAM_CHAT_ID");

  if (!token) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN in Script properties.");
  }
  if (!chatId) {
    throw new Error("Missing TELEGRAM_CHAT_ID in Script properties.");
  }

  const response = UrlFetchApp.fetch(
    "https://api.telegram.org/bot" + token + "/sendMessage",
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true
      }),
      muteHttpExceptions: true
    }
  );

  const status = response.getResponseCode();
  let result = null;
  try {
    result = JSON.parse(response.getContentText());
  } catch (error) {
    // Keep result null and report a generic Telegram error below.
  }

  if (status < 200 || status >= 300 || !result || result.ok !== true) {
    const description = result && result.description
      ? result.description
      : "Unknown Telegram error";
    throw new Error("Telegram error " + status + ": " + description);
  }
}

function checkRateLimits(fingerprint) {
  const cache = CacheService.getScriptCache();
  const duplicateKey = "duplicate:" + fingerprint;

  if (cache.get(duplicateKey)) {
    return { allowed: false, reason: "duplicate" };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(3000);
  } catch (error) {
    return { allowed: false, reason: "busy" };
  }

  try {
    const minute = Utilities.formatDate(new Date(), "GMT", "yyyyMMddHHmm");
    const minuteKey = "minute:" + minute;
    const count = Number(cache.get(minuteKey) || "0");

    if (count >= MAX_REQUESTS_PER_MINUTE) {
      return { allowed: false, reason: "rate-limit" };
    }

    cache.put(minuteKey, String(count + 1), 70);
    cache.put(duplicateKey, "1", DUPLICATE_WINDOW_SECONDS);
    return { allowed: true };
  } finally {
    lock.releaseLock();
  }
}

function cleanText(value, maximumLength) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function sha256(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );

  return bytes.map(function(byte) {
    const normalized = byte < 0 ? byte + 256 : byte;
    return normalized.toString(16).padStart(2, "0");
  }).join("");
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
