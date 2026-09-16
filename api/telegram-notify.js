export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body || {});

    const message = typeof text === "string" ? text.trim() : "";

    if (!message) {
      return res.status(400).json({ error: "Missing text" });
    }

    if (message.length > 6000) {
      return res.status(413).json({ error: "Message too long" });
    }

    // Vercel Environment Variables:
    // TELEGRAM_BOT_TOKEN
    // TELEGRAM_CHAT_ID
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({
        error: "Telegram server configuration missing"
      });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      console.error("Telegram API error:", result);
      return res.status(502).json({ ok: false });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("telegram-notify error:", error);
    return res.status(400).json({ error: "Invalid request" });
  }
}
