export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body || {});

    const password = body.password;
    const expected = process.env.ADMIN_PASSWORD;

    const ok = Boolean(
      expected &&
      typeof password === "string" &&
      password === expected
    );

    return res.status(ok ? 200 : 401).json({ ok });
  } catch {
    return res.status(400).json({ error: "Invalid request" });
  }
}
