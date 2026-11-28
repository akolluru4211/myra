"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  MessageCircle,
  Send,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("General Support");
  const [message, setMessage] = useState("");
  const [consentAgreed, setConsentAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    if (!consentAgreed) {
      setErrorMsg("Please grant consent for processing your contact details to submit this inquiry.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        if (typeof window !== "undefined") {
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.8 },
            colors: ["#2563EB", "#10B981", "#F59E0B"],
          });
        }
      } else {
        setErrorMsg(data.error || "Failed to send message. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Network error occurred. Please try again or email edworld.eden@gmail.com directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-10 sm:space-y-12 font-sans text-white animate-in fade-in duration-200">
      
      {/* Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="liquid-pill text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
            Office &amp; Support
          </span>
          <span className="liquid-pill text-xs font-medium px-3 py-1 bg-white/70 text-slate-300 border-white/80">
            DPDP Grievance Redressal
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          We're here to help you thrive.
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Have questions about your mock interviews, resume optimization, institutional partnerships, or data privacy? Reach our Hyderabad team directly.
        </p>
      </section>

      {/* Grid: Details Left, Form Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start">
        
        {/* Left Column: Details & Statutory Redressal */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Office Details Card */}
          <div className="tactile-chassis bg-[#0C101A] border border-white/10 text-white p-6 shadow-xs space-y-4">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider block">
              Physical Operations
            </span>
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Operating Office:</strong><br />
                  HITEC City, Madhapur, Hyderabad, Telangana 500081, India
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong className="text-white">Support Email:</strong><br />
                  <a href="mailto:edworld.eden@gmail.com" className="font-semibold underline hover:text-blue-600">
                    edworld.eden@gmail.com
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong className="text-white">Student WhatsApp:</strong><br />
                  <a
                    href="https://wa.me/919999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:text-emerald-700"
                  >
                    Direct Student Hotline
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* Statutory DPDP Grievance Officer Card */}
          <div className="tactile-chassis bg-[#0C101A] border border-white/10 text-white p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>Statutory Grievance Officer (DPDP Act)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In accordance with the Digital Personal Data Protection Act 2023 &amp; IT Act 2000:
            </p>
            <div className="edworld-blue-card p-3 rounded-xl tactile-chassis  border border-white/10 text-white bg-white/60 border-white/80 text-[11px] space-y-1 text-slate-700">
              <div><strong className="text-white">Designation:</strong> Head of Compliance &amp; Data Privacy</div>
              <div><strong className="text-white">Email:</strong> edworld.eden@gmail.com</div>
              <div><strong className="text-white">Response SLA:</strong> Within 24–48 working hours</div>
            </div>
          </div>

        </div>

        {/* Right Column: Inquiry Form */}
        <div className="lg:col-span-7">
          <div className="tactile-chassis bg-[#0C101A] border border-white/10 text-white p-6 sm:p-8 shadow-xs">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/15 text-emerald-600 rounded-xl border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white">
                  Inquiry Successfully Received!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
                  Thank you, <strong>{name}</strong>. Your message has been logged. Our Hyderabad team will respond to <strong>{email}</strong> shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="font-bold text-lg text-white">
                    Send a Message
                  </h2>
                  <p className="text-xs text-slate-400">
                    Fill in your query details below for immediate routing.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya Roy"
                      className="liquid-input w-full px-3.5 py-2.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ananya@example.com"
                      className="liquid-input w-full px-3.5 py-2.5 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white">
                    Inquiry Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="liquid-input w-full px-3.5 py-2.5 text-xs cursor-pointer"
                  >
                    <option value="General Support">General Platform Support</option>
                    <option value="Data Privacy & Consent">Data Privacy &amp; Consent (DPDP)</option>
                    <option value="Mock Interview Issue">AI Mock Interview Studio Assistance</option>
                    <option value="Resume Tailoring">ATS Resume Builder Support</option>
                    <option value="Institutional Partnership">University / Campus Partnership</option>
                    <option value="Billing & Subscription">Billing &amp; Subscription Inquiries</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your inquiry with relevant details..."
                    className="liquid-input w-full px-3.5 py-2.5 text-xs"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="contactConsent"
                    required
                    checked={consentAgreed}
                    onChange={(e) => setConsentAgreed(e.target.checked)}
                    className="mt-0.5 rounded border border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                  <label htmlFor="contactConsent" className="text-xs text-slate-300 cursor-pointer leading-tight">
                    I consent to EdWorld Co. processing my name, email, and inquiry details to resolve this request in accordance with the{" "}
                    <Link href="/privacy" className="font-semibold underline text-white" target="_blank">
                      Privacy Notice
                    </Link>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="liquid-btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>{isSubmitting ? "Sending..." : "Submit Inquiry"}</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
