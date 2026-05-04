import { Resend } from "resend";

const SITE_URL = "https://njitfencingmemories.com";
const FROM = process.env.EMAIL_FROM ?? "NJIT Fencing Memories <noreply@njitfencingmemories.com>";

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

async function send(to: string, subject: string, html: string, text: string) {
  const resend = getClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set; skipping send to", to);
    return { ok: false as const, error: "email_disabled" };
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html, text });
  if (error) {
    console.error("[email] send failed:", error);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

export async function sendApprovedEmail(to: string, fullName: string) {
  const subject = "You're in — NJIT Fencing Memories";
  const text = `Hi ${fullName},

Your request to join NJIT Fencing Memories has been approved.

Sign in with this same email address (${to}) at ${SITE_URL} to start posting memories.

— NJIT Fencing Memories`;
  const html = `<p>Hi ${escapeHtml(fullName)},</p>
<p>Your request to join <strong>NJIT Fencing Memories</strong> has been approved.</p>
<p>Sign in with this same email address (<code>${escapeHtml(to)}</code>) at <a href="${SITE_URL}">${SITE_URL}</a> to start posting memories.</p>
<p>— NJIT Fencing Memories</p>`;
  return send(to, subject, html, text);
}

export async function sendDeclinedEmail(to: string, fullName: string) {
  const subject = "Your NJIT Fencing Memories access request";
  const text = `Hi ${fullName},

Thanks for requesting access to NJIT Fencing Memories. After review, we weren't able to approve your request at this time.

If you believe this is a mistake, you can submit a new request at ${SITE_URL}/request-access.

— NJIT Fencing Memories`;
  const html = `<p>Hi ${escapeHtml(fullName)},</p>
<p>Thanks for requesting access to <strong>NJIT Fencing Memories</strong>. After review, we weren't able to approve your request at this time.</p>
<p>If you believe this is a mistake, you can submit a new request at <a href="${SITE_URL}/request-access">${SITE_URL}/request-access</a>.</p>
<p>— NJIT Fencing Memories</p>`;
  return send(to, subject, html, text);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
