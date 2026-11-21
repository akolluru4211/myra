# EdMail DNS & Production Mail Routing Architecture

## Domain Overview
- **Root Domain:** `edworld.co.in`
- **Webmail Interface:** `https://edmail.edworld.co.in` (and alias `https://mails.edworld.co.in`)
- **Mail Service:** EdMail for Students (`username@edworld.co.in`)
- **Infrastructure Provider:** Managed Cloud Mail Provider (Resend / AWS SES)

---

## 1. Domain Mail Routing & Delivery Preservation

Before making any changes to production DNS records, the domain's current mail routing was analyzed:
- Querying root MX records (`dig MX edworld.co.in`) returns `ENODATA` (no legacy on-premise MX records configured).
- Standard web traffic is hosted on Vercel / Next.js.
- Adding mail records will not disrupt any pre-existing corporate mail servers.

---

## 2. Recommended Production DNS Configuration

When ready to enable external inbound delivery and verified delivery to external providers (Google, Microsoft, Yahoo):

### A. MX Records (Inbound Mail Routing)
| Type | Host / Name | Value / Destination | Priority | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **MX** | `@` (`edworld.co.in`) | `feedback-smtp.us-east-1.amazonses.com` (or provider MX) | `10` | Routes incoming student emails to managed backend webhook |
| **MX** | `edmail` (`edmail.edworld.co.in`) | `feedback-smtp.us-east-1.amazonses.com` | `10` | Inbound routing fallback for subdomain |
| **MX** | `mails` (`mails.edworld.co.in`) | `feedback-smtp.us-east-1.amazonses.com` | `10` | Inbound routing fallback for mails subdomain |

### B. SPF (Sender Policy Framework)
Prevents spoofing and authenticates EdMail outbound mail servers:
| Type | Host / Name | Value | TTL |
| :--- | :--- | :--- | :--- |
| **TXT** | `@` | `v=spf1 include:amazonses.com include:resend.com ~all` | `300` |

### C. DKIM (DomainKeys Identified Mail)
Cryptographic signatures for outbound emails:
| Type | Host / Name | Value |
| :--- | :--- | :--- |
| **CNAME** | `resend._domainkey` | `dkim.resend.com.` |
| **CNAME** | `edmail._domainkey` | (Provided upon domain registration in provider dashboard) |

### D. DMARC (Domain-based Message Authentication, Reporting & Conformance)
| Type | Host / Name | Value |
| :--- | :--- | :--- |
| **TXT** | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@edworld.co.in; pct=100; sp=quarantine` |

---

## 3. Subdomain Setup: `edmail.edworld.co.in` & `mails.edworld.co.in`

1. **CNAME Record:**
   - Name: `edmail`
   - Value: `cname.vercel-dns.com` (or custom host pointing to the Next.js deployment)
   - Alias: `mails` -> `cname.vercel-dns.com`
2. **Next.js Edge Routing:**
   - Automatically handled in `src/middleware.ts` via `MAILS_SUBDOMAINS` matcher (`edmail.edworld.co.in`, `mails.edworld.co.in`, `edmail.localhost`).
   - Any request to `https://edmail.edworld.co.in/` is rewritten internally to `/edmail` while preserving URL address in browser.

---

## 4. Operational Runbook: Operator Diagnostics & Disaster Recovery

### A. Non-PII Diagnostic Logging
To allow routine support engineers to diagnose delivery problems without compromising student privacy:
- Inbound and outbound events log provider IDs, recipient hashes, error codes, and delivery timestamps to `public.edmail_delivery_logs`.
- Message subjects, email bodies, student mark sheets, and file attachments are strictly omitted from operational telemetry.
- Support operators reference `event_id` or `provider_message_id` with external providers (Resend / AWS SES) to trace bounces or spam classifications without inspecting private student mail.

### B. Backup & Restore Drill
- **Application & Metadata Backup:**
  - Automated daily snapshots of Supabase PostgreSQL database tables (`edmail_mailboxes`, `edmail_messages`, `student_marks`, `student_events`, `edmail_documents`).
- **Managed Provider Archive:**
  - Inbound raw payloads can optionally replicate to a private Amazon S3 / Supabase Storage bucket with 90-day lifecycle expiration.
- **Restore Drill Procedure:**
  1. Restore PostgreSQL database to staging sandbox point-in-time snapshot.
  2. Verify foreign key integrity between `public.profiles` and `public.edmail_mailboxes`.
  3. Replay unacknowledged deliveries from `edmail_delivery_logs` by matching `event_id` idempotency keys.

### C. Incident Handling: Provider Outage or DNS Rollback
If a provider outage occurs or DNS rollback is required:
1. **Remove Inbound MX Records:** Remove root domain MX records pointing to the provider. Inbound MTA senders will queue retries according to standard SMTP backoff (up to 72 hours).
2. **Web App Continuity:** Students can continue accessing their historical messages, marks, events, and study files at `https://edmail.edworld.co.in`.
3. **Queue Pausing:** Set `EDMAIL_OUTBOUND_PAUSED=true` to keep outbound student messages in `"queued"` status without attempting provider dispatch until upstream connectivity is verified.

---

## 5. Rollback Plan

If mail routing needs to be rolled back at any time:
1. **Remove MX Records:** Deleting the `@` MX records halts external SMTP delivery without affecting web traffic.
2. **Revert SPF Record:** Restore previous TXT record or set to `v=spf1 ~all`.
3. **Database Guard:** EdMail records remain strictly isolated in `public.edmail_*` tables with RLS; disabling the feature flag `process.env.NEXT_PUBLIC_EDMAIL_ENABLED` immediately hides activation buttons across the dashboard and signup flow.
