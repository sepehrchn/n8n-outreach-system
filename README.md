# AI Outreach System — n8n Workflow

Automated cold outreach assistant for freelance full-stack development services.  
Built by **Sepehr Jokanian** · Yerevan, Armenia · [sep-web.pages.dev](https://sep-web.pages.dev)

---

## What this does

You enter a company name and website URL into a form.  
The workflow automatically:

1. Scrapes the company's homepage
2. Researches what they do and why they are a fit
3. Writes a personalised cold email in your voice
4. Shows you the draft for review and editing
5. Sends the email via Gmail SMTP after your approval
6. Logs everything to a Google Sheet

You type two fields. The system handles the rest.

---

## Workflow overview

```
Form submission (company name + website)
  → Lead Data (normalise input + load profile)
  → Fetch Homepage (scrape company site)
  → Extract Page Text (title, headings, paragraphs)
  → Build Research Text (clean + trim to 8000 chars)
  → Scrape OK? (if < 500 chars → log and stop)
  → Research Agent / Gemini (returns JSON: what_they_do, why_they_fit, specific_hook)
  → Parse Research (safely parse JSON)
  → Research Valid? (if empty → log and stop)
  → Email Writer / Gemini (write personalised email)
  → Format Output (extract subject + clean body)
  → Review Email Form (human approval gate)
  → Send Email (Gmail SMTP, plain text)
  → Log Sent (Google Sheet via Apps Script)
```

### Failure branches

- **Scrape fails or returns < 500 chars** → logs row to Google Sheet with status `Needs manual research`
- **Research JSON is empty or invalid** → same log, no email generated

---

## Tech stack

| Tool | Purpose | Cost |
|---|---|---|
| n8n (self-hosted via Docker) | Workflow automation | Free |
| Google Gemini 2.5 Flash | Research + email writing | Free (250 req/day) |
| Gmail SMTP + App Password | Email sending | Free |
| Google Apps Script | Google Sheet logging webhook | Free |
| Google Sheets | Outreach pipeline tracker | Free |

**Total monthly cost: $0**

---

## Prerequisites

Before importing the workflow you need:

- Docker Desktop installed and running
- n8n running locally at `localhost:5678`
- A Gmail account with 2-Step Verification enabled
- A Google Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- A Google Sheet set up as the outreach log
- A Google Apps Script deployed as a web app

---

## Setup instructions

### Step 1 — Install n8n via Docker

If n8n is not running yet:

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Open `localhost:5678` in your browser.

---

### Step 2 — Create a Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com) → Security
2. Enable 2-Step Verification if not already on
3. Go to Security → App passwords
4. App name: `n8n outreach` → click Create
5. Copy the 16-character password (remove spaces when using it)

---

### Step 3 — Get a Gemini API key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API key" → "Create API key"
3. Copy the key

---

### Step 4 — Set up the Google Sheet

Create a new Google Sheet named `outreach-log`.

Add these headers in Row 1 exactly as written:

```
date | company | contact_name | contact_role | contact_email | subject | email_body | status | notes
```

Copy the sheet ID from the URL:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```

---

### Step 5 — Deploy the Apps Script webhook

1. In your Google Sheet → Extensions → Apps Script
2. Delete all existing code
3. Paste this:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp
      .openById("YOUR_SHEET_ID_HERE")
      .getActiveSheet();

    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.date          || "",
      data.company       || "",
      data.contact_name  || "",
      data.contact_role  || "",
      data.contact_email || "",
      data.subject       || "",
      data.email_body    || "",
      data.status        || "",
      data.notes         || ""
    ]);

    return ContentService
      .createTextOutput("OK")
      .setMimeType(ContentService.MimeType.TEXT);

  } catch(error) {
    return ContentService
      .createTextOutput("Error: " + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
```

4. Replace `YOUR_SHEET_ID_HERE` with your actual sheet ID
5. Click Save
6. Click Deploy → New deployment
7. Type: Web app
8. Execute as: Me
9. Who has access: Anyone
10. Click Deploy → copy the web app URL

---

### Step 6 — Add credentials in n8n

**Gemini API key:**
1. n8n → top-right menu → Credentials → Add credential
2. Search: `Google Gemini(PaLM) Api`
3. Paste your API key → Save

**Gmail SMTP:**
1. Credentials → Add credential
2. Search: `SMTP`
3. Fill in:

| Field | Value |
|---|---|
| Host | `smtp.gmail.com` |
| Port | `465` |
| Secure (SSL) | On |
| User | `sepehrjokanian99@gmail.com` |
| Password | your 16-character App Password (no spaces) |

4. Click Save → Test (must say Connection successful)

---

### Step 7 — Import the workflow

1. In n8n → top-left menu → Workflows → Import from file
2. Select `outreach-workflow.json` from this repo
3. Click Import

---

### Step 8 — Update the workflow with your details

After importing, open the workflow and update these nodes:

**Lead Data node** — update the `my_profile` field with your own profile text:
```
Name, location, website, email, services, positioning, target clients
```

Also update `best_email_1` and `best_email_2` with your own best example emails.

**Log Manual Research node and Log Sent node** — update the URL field with your Apps Script web app URL from Step 5.

**Send Email node** — confirm:
- `fromEmail` is set to your Gmail address
- `replyTo` is set to your Gmail address
- `emailFormat` is `text`
- `appendAttribution` is `false`

---

### Step 9 — Test the workflow

The workflow uses a Form Trigger. To run it:

1. In n8n, click the workflow to open it
2. Click "Test workflow" at the bottom
3. A form URL appears — open it in your browser
4. Fill in a test company:

| Field | Example |
|---|---|
| Company Name | AIST Global |
| Website URL | aist.global |
| Contact Name | Hrayr Shahbazyan |
| Contact Role | Founder and Director |
| Contact Email | your own email address |

5. Submit the form
6. Watch nodes run in n8n (takes 15–30 seconds)
7. When the Review Email Form appears, check the draft
8. Edit if needed → Submit
9. Check your inbox — email should arrive
10. Check your Google Sheet — new row should appear

---

## How to use it daily

1. Open n8n at `localhost:5678`
2. Open the `Outreach v3 - Review & Send` workflow
3. Click "Test workflow"
4. Open the form URL in your browser
5. Enter the company details → Submit
6. Wait for the Review Email Form to appear
7. Read the draft → edit any lines that feel generic
8. Submit to send
9. Update the status column in your Google Sheet after any reply

**Recommended daily limit: 15–20 emails maximum.**

---

## Google Sheet columns reference

| Column | What it contains |
|---|---|
| date | Date the email was generated |
| company | Company name |
| contact_name | Contact person's name |
| contact_role | Their job title |
| contact_email | Email address sent to |
| subject | Email subject line |
| email_body | Full email body as sent |
| status | `Sent`, `Needs manual research`, or your manual updates |
| notes | Scrape failure reason, or your follow-up notes |

Update the `status` column manually as leads progress:
- `Sent` → set automatically by the workflow
- `Replied` → update manually when they respond
- `Meeting booked` → update manually
- `Not interested` → update manually
- `Follow up` → update manually with a date

---

## Deliverability notes

Emails send from `sepehrjokanian99@gmail.com` via Gmail SMTP.

Gmail SMTP automatically signs outgoing mail with Google's own DKIM, which passes authentication checks. Gmail's daily send limit is 500 emails — well above the recommended cold email volume.

**To improve inbox placement:**
- Send maximum 15–20 cold emails per day
- Warm up your account by sending normal emails from the same address daily
- Sign up at [mails.ai](https://mails.ai) for free email warm-up (Gmail supported)
- Run your domain through [mxtoolbox.com/emailhealth](https://mxtoolbox.com/emailhealth) to check for issues
- Test deliverability at [mail-tester.com](https://mail-tester.com) — aim for 9/10 or higher

---

## Updating your profile or example emails

Open the `Lead Data` node. Update these fields:

| Field | What to put there |
|---|---|
| `my_profile` | Your name, location, services, positioning, target clients |
| `best_email_1` | Your best sent email that received a positive reply |
| `best_email_2` | Your second best example email |

The AI learns tone and style from these examples. Update them whenever you find a better-performing email.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Form URL not working | Workflow not in test mode | Click "Test workflow" first, then open the URL |
| Scrape returns nothing | Site blocks bots or uses JavaScript rendering | Add company details manually in the Review form |
| Research JSON empty | Gemini returned malformed output | Run the workflow again — usually fixes itself |
| Email not arriving | SMTP credential wrong | Re-test the SMTP credential in n8n → Credentials |
| Email goes to spam | New sending account, no warm-up | Run mails.ai warm-up for 14 days before bulk sending |
| Review form pre-fills blank | n8n form default value timing issue | Type the draft manually from the Format Output node |
| Google Sheet not updating | Apps Script URL changed or not redeployed | Redeploy the script as a new version |

---

## File structure

```
outreach-workflow.json   ← import this into n8n
README.md                ← this file
```

---

## Workflow node map

| Node | Type | Purpose |
|---|---|---|
| On form submission | Form Trigger | Entry point — collects company + contact details |
| Lead Data | Set | Normalises input, stores profile and example emails |
| Fetch Homepage | HTTP Request | Downloads company website HTML |
| Extract Page Text | HTML | Pulls title, meta, headings, paragraphs |
| Build Research Text | Code | Cleans and trims scraped text to 8000 chars |
| Scrape OK? | IF | Routes to manual log if content < 500 chars |
| Research Agent | AI Agent | Analyses site, returns JSON research |
| Google Gemini Chat Model | LLM | Powers both Research Agent and Email Writer |
| Parse Research | Code | Safely parses Gemini's JSON output |
| Research Valid? | IF | Routes to manual log if research is empty |
| Email Writer | AI Agent | Writes personalised cold email |
| Format Output | Set | Extracts subject line and cleans email body |
| Review Email Form | Form | Human approval gate before sending |
| Send Email | Email Send | Sends plain text email via Gmail SMTP |
| Log Sent | HTTP Request | Posts sent email data to Google Sheet |
| Log Manual Research | HTTP Request | Posts failure rows to Google Sheet |
| Send a message | Gmail | Unused node — can be deleted |

---

## License

Personal use. Not for redistribution.  
Built for freelance outreach by Sepehr Jokanian — Yerevan, Armenia.
