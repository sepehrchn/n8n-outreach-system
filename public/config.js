// ─────────────────────────────────────────────────────────────
//  AI Outreach System — config.js
//  Update both URLs below to match your Cloudflare Tunnel host.
// ─────────────────────────────────────────────────────────────

// Step 1 webhook — receives lead form, returns email draft as JSON
window.WEBHOOK_URL = 'https://n8n.sepehr.homes/webhook/lead-submit';

// Step 2 webhook — receives confirmed email and sends it
window.SEND_EMAIL_URL = 'https://n8n.sepehr.homes/webhook/send-email';