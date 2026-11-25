import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderBrandedEmailHtml,
  renderOtpVerificationEmail,
  renderOtpVerificationText,
  renderJobAlertEmail,
  renderEventInvitationEmail
} from '../../src/lib/email-templates.ts';

describe('EdWorld Co. Email Branding & Logo Suite', () => {
  test('renderBrandedEmailHtml renders official logo image with https url, dimensions, and alt text', () => {
    const html = renderBrandedEmailHtml({
      previewText: 'Community Preview',
      title: 'Welcome to EdWorld Co.',
      contentHtml: '<p>Student announcement content here.</p>',
      ctaText: 'Visit Dashboard',
      ctaUrl: 'https://edworld.co.in/dashboard',
    });

    // 1. Logo check
    assert.match(html, /<img[^>]*src="https:\/\/edworld\.co\.in\/images\/edworld-logo\.png"/i);
    assert.match(html, /alt="EdWorld Co\."/i);
    assert.match(html, /width="52"/i);
    assert.match(html, /height="52"/i);

    // 2. Logo links to edworld.co.in
    assert.match(html, /<a href="https:\/\/edworld\.co\.in" target="_blank"/i);

    // 3. Clean styling: light outer background #F8FAFC, white inner container #FFFFFF
    assert.match(html, /background-color:\s*#F8FAFC/i);
    assert.match(html, /background-color:\s*#FFFFFF/i);

    // 4. Single title rendered
    const titleMatches = html.match(/<h1>Welcome to EdWorld Co\.<\/h1>/g);
    assert.equal(titleMatches?.length, 1);

    // 5. Old noisy elements removed
    assert.doesNotMatch(html, /telemetry-bar/i);
    assert.doesNotMatch(html, /OFFICIAL EDWORLD CO\. DISPATCH/i);
    assert.doesNotMatch(html, /monogram-badge/i);
    assert.doesNotMatch(html, />E\.<span/i);

    // 6. Restrained primary CTA styling
    assert.match(html, /background-color:\s*#059669/i);
    assert.match(html, /Visit Dashboard &rarr;/i);

    // 7. Footer requirements: legal compliance, privacy, unsubscribe
    assert.match(html, /Hyderabad, Telangana 500081, India/i);
    assert.match(html, /Privacy Policy/i);
    assert.match(html, /Terms/i);
    assert.match(html, /Unsubscribe/i);
    assert.match(html, /DPDP ACT 2023 COMPLIANT/i);
  });

  test('renderOtpVerificationEmail renders clean single-header email with prominent code', () => {
    const emailHtml = renderOtpVerificationEmail({
      otp: '739201',
      purpose: 'login',
      expiresMinutes: 5,
      studentName: 'Aarav Patel',
      identifier: 'aarav@edworld.co.in'
    });

    assert.match(emailHtml, /739201/);
    assert.match(emailHtml, /5 minutes/i);
    assert.match(emailHtml, /<img[^>]*src="https:\/\/edworld\.co\.in\/images\/edworld-logo\.png"/i);
    assert.match(emailHtml, /alt="EdWorld Co\."/i);

    // Single title
    const h1Matches = emailHtml.match(/<h1[^>]*>/g);
    assert.equal(h1Matches?.length, 1);
  });

  test('renderOtpVerificationText provides clean plain-text fallback', () => {
    const text = renderOtpVerificationText({
      otp: '739201',
      purpose: 'login',
      expiresMinutes: 5,
      studentName: 'Aarav Patel',
      identifier: 'aarav@edworld.co.in'
    });

    assert.match(text, /EDWORLD CO\./i);
    assert.match(text, /739201/);
    assert.match(text, /5 minutes/i);
    assert.doesNotMatch(text, /<[^>]+>/); // pure plain text
  });

  test('job alert and event invitation reuse clean branded layout with logo', () => {
    const jobHtml = renderJobAlertEmail({
      recipientName: 'Aarav',
      roleTitle: 'Software Engineer Intern',
      companyName: 'EdWorld Co.',
      location: 'Hyderabad (Hybrid)',
      type: 'internship',
      deadline: 'Dec 31, 2026',
      jobId: 'swe_2026',
      listingUrl: 'https://edworld.co.in/jobs/swe_2026'
    });
    assert.match(jobHtml, /<img[^>]*src="https:\/\/edworld\.co\.in\/images\/edworld-logo\.png"/i);

    const eventHtml = renderEventInvitationEmail({
      recipientName: 'Aarav',
      eventName: 'Winter AI Buildathon',
      organizer: 'EdWorld Co.',
      date: 'Dec 15, 2026',
      locationOrOnline: 'Online',
      description: 'Join us for a 48h buildathon.',
      eventId: 'build_2026',
      eventUrl: 'https://edworld.co.in/events'
    });
    assert.match(eventHtml, /<img[^>]*src="https:\/\/edworld\.co\.in\/images\/edworld-logo\.png"/i);
  });
});
