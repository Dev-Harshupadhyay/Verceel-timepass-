/** Best-effort Telegram notifications — same flow the site always had. */

export function escapeHtml(value: unknown): string {
  return String(value ?? "?")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function notify(text: string): Promise<boolean> {
  try {
    const res = await fetch("/api/telegram-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      keepalive: true
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function line(label: string, value: unknown): string {
  return `├ <b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`;
}

export function block(title: string, rows: string[]): string {
  return [`⚡ <b>${escapeHtml(title)}</b>`, "━━━━━━━━━━━━━━━━━━━━", ...rows, "━━━━━━━━━━━━━━━━━━━━"].join("\n");
}
