const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SENDER_EMAIL = Deno.env.get("WELCOME_EMAIL_FROM") ?? "no-reply@cymatichub.com";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  if (!RESEND_API_KEY) {
    return jsonResponse({ error: "Welcome email provider not configured." }, 503);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const orgName = (body.org_name || "").trim();
  const schoolKey = (body.school_key || "").trim();
  const adminName = (body.admin_name || "").trim();
  const adminEmail = (body.admin_email || "").trim();

  if (!orgName || !schoolKey || !adminName || !adminEmail) {
    return jsonResponse(
      { error: "org_name, school_key, admin_name and admin_email are required." },
      400,
    );
  }

  const emailHtml = `
    <div style="font-family: system-ui, sans-serif; color: #0f172a;">
      <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 0.75rem;">Welcome to Cymatic Hub</h1>
      <p style="font-size: 16px; margin-bottom: 1rem;">Hi ${adminName},</p>
      <p style="font-size: 14px; margin-bottom: 1rem; line-height: 1.6;">
        Your institution <strong>${orgName}</strong> is now registered on Cymatic Hub.
        Share the School ID below with teachers and students so they can link their accounts safely.
      </p>
      <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
        <p style="margin: 0 0 0.5rem 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb;">School ID</p>
        <p style="margin: 0; font-size: 20px; font-weight: 700;">${schoolKey}</p>
      </div>
      <p style="font-size: 14px; margin-bottom: 1rem; line-height: 1.6;">
        Teachers can now enroll learners, submit projects, and verify marks under this school.
      </p>
      <p style="font-size: 14px; margin: 0;">If you need help, reply to this email or visit the Hub dashboard.</p>
    </div>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: SENDER_EMAIL,
      to: [adminEmail],
      subject: `Welcome to Cymatic Hub — ${orgName}`,
      html: emailHtml,
    }),
  });

  if (!resendResponse.ok) {
    const text = await resendResponse.text();
    console.error("Welcome email delivery failed", resendResponse.status, text);
    return jsonResponse({ error: "Failed to send welcome email." }, 502);
  }

  return jsonResponse({ success: true });
};
