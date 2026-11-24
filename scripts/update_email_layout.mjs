import fs from 'node:fs';

let code = fs.readFileSync('src/lib/email-templates.ts', 'utf8');

// 1. Update EmailLayoutProps and renderBrandedEmailHtml
const oldPropsTarget = [
  'export interface EmailLayoutProps {',
  '  previewText: string;',
  '  title: string;',
  '  contentHtml: string;',
  '  ctaText?: string;',
  '  ctaUrl?: string;',
  '  footerNote?: string;',
  '  logoUrl?: string;',
  '}'
].join('\n');

const newProps = [
  'export interface EmailLayoutProps {',
  '  previewText: string;',
  '  title: string;',
  '  contentHtml: string;',
  '  ctaText?: string;',
  '  ctaUrl?: string;',
  '  footerNote?: string;',
  '  logoUrl?: string;',
  '  isAlert?: boolean;',
  '  alertType?: "job" | "internship" | "event" | string;',
  '  manageAlertsUrl?: string;',
  '  unsubscribeUrl?: string;',
  '}',
  '',
  '/**',
  ' * Validates and normalizes links to ensure only safe HTTPS or authorized app URLs are rendered.',
  ' */',
  'export function validateUrl(url: string | null | undefined, fallbackPath = "/dashboard"): string {',
  '  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";',
  '  if (!url) return `${appUrl}${fallbackPath.startsWith("/") ? "" : "/"}${fallbackPath}`;',
  '  const trimmed = url.trim();',
  '  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {',
  '    return trimmed;',
  '  }',
  '  if (trimmed.startsWith("/")) {',
  '    return `${appUrl}${trimmed}`;',
  '  }',
  '  return `${appUrl}/${trimmed}`;',
  '}'
].join('\n');

if (!code.includes(oldPropsTarget)) {
  console.error('oldPropsTarget not found');
  process.exit(1);
}
code = code.replace(oldPropsTarget, newProps);

// Update renderBrandedEmailHtml implementation
const oldRenderHead = [
  'export function renderBrandedEmailHtml(props: EmailLayoutProps): string {',
  '  const { previewText, title, contentHtml, ctaText, ctaUrl, footerNote } = props;',
  '  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";'
].join('\n');

const newRenderHead = [
  'export function renderBrandedEmailHtml(props: EmailLayoutProps): string {',
  '  const { previewText, title, contentHtml, ctaText, ctaUrl, footerNote, isAlert, alertType } = props;',
  '  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";',
  '  const verifiedCtaUrl = ctaUrl ? validateUrl(ctaUrl) : "";',
  '  const manageAlertsUrl = props.manageAlertsUrl || `${appUrl}/settings/alerts`;',
  '  const unsubscribeUrl = props.unsubscribeUrl || `${appUrl}/newsletter/unsubscribe`;'
].join('\n');

if (!code.includes(oldRenderHead)) {
  console.error('oldRenderHead not found');
  process.exit(1);
}
code = code.replace(oldRenderHead, newRenderHead);

// Replace cta button rendering
const oldCtaBlock = '            ${ctaText && ctaUrl ? `\n              <div class="cta-container">\n                <a href="${ctaUrl}" class="cta-button" target="_blank">${ctaText} &rarr;</a>\n              </div>\n            ` : ""}';
const newCtaBlock = '            ${ctaText && verifiedCtaUrl ? `\n              <div class="cta-container">\n                <a href="${verifiedCtaUrl}" class="cta-button" target="_blank">${ctaText} &rarr;</a>\n              </div>\n            ` : ""}';

if (!code.includes(oldCtaBlock)) {
  console.error('oldCtaBlock not found');
  process.exit(1);
}
code = code.replace(oldCtaBlock, newCtaBlock);

// Add responsive styles to style block
const styleCloseTarget = [
  '    .footer-stamp {',
  '      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;',
  '      font-size: 10px;',
  '      color: #64748B;',
  '      text-transform: uppercase;',
  '      letter-spacing: 1px;',
  '      margin-top: 12px;',
  '    }',
  '  </style>'
].join('\n');

const newStyleClose = [
  '    .footer-stamp {',
  '      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;',
  '      font-size: 10px;',
  '      color: #64748B;',
  '      text-transform: uppercase;',
  '      letter-spacing: 1px;',
  '      margin-top: 12px;',
  '    }',
  '    @media only screen and (max-width: 600px) {',
  '      .body-content {',
  '        padding: 24px 20px !important;',
  '      }',
  '      .header {',
  '        padding: 24px 20px 18px !important;',
  '      }',
  '      .footer {',
  '        padding: 24px 20px !important;',
  '      }',
  '      .cta-button {',
  '        display: block !important;',
  '        width: 100% !important;',
  '        box-sizing: border-box !important;',
  '        text-align: center !important;',
  '      }',
  '    }',
  '  </style>'
].join('\n');

if (!code.includes(styleCloseTarget)) {
  console.error('styleCloseTarget not found');
  process.exit(1);
}
code = code.replace(styleCloseTarget, newStyleClose);

// Add alert preferences box to footer if isAlert is true
const footerTarget = [
  '          <!-- Maximalist Trust & Compliance Footer -->',
  '          <div class="footer">',
  '            <p style="margin: 0 0 10px; color: #CBD5E1; font-weight: 500;">',
  '              ${footerNote || "You received this email because of your verified account on EdWorld Co."}',
  '            </p>'
].join('\n');

const newFooter = [
  '          <!-- Trust & Compliance Footer -->',
  '          <div class="footer">',
  '            <p style="margin: 0 0 10px; color: #CBD5E1; font-weight: 500;">',
  '              ${footerNote || "You received this email because of your verified account on EdWorld Co."}',
  '            </p>',
  '',
  '            ${isAlert ? `',
  '              <div style="margin: 14px 0 16px; padding: 12px 16px; background-color: #1E293B; border: 1px solid #334155; border-radius: 10px; font-size: 11px; color: #CBD5E1; text-align: center; line-height: 1.6;">',
  '                <span style="color: #E2E8F0; font-weight: 600;">You received this optional ${alertType || "notification"} alert based on your notification preferences.</span><br />',
  '                <a href="${manageAlertsUrl}" style="color: #38BDF8; font-weight: 700; text-decoration: underline; margin-right: 14px;">Manage alerts</a>',
  '                <a href="${unsubscribeUrl}" style="color: #94A3B8; text-decoration: underline;">Unsubscribe from alerts</a>',
  '              </div>',
  '            ` : ""}'
].join('\n');

if (!code.includes(footerTarget)) {
  console.error('footerTarget not found');
  process.exit(1);
}
code = code.replace(footerTarget, newFooter);

fs.writeFileSync('src/lib/email-templates.ts', code, 'utf8');
console.log('Successfully updated renderBrandedEmailHtml and EmailLayoutProps');
