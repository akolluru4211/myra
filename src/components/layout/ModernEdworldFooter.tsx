"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const columns = [
  [
    { title: "Features", links: [["Career Workspace", "/career"], ["Résumé Builder", "/resumes"], ["Mock Interviews", "/interviews"], ["EdMail", "/edmail"]] },
    { title: "Community", links: [["Study Squads", "/squads"], ["Member Network", "/network"], ["Project Studio", "/projects"]] },
  ],
  [
    { title: "Explore", links: [["Jobs", "/jobs"], ["Internships", "/internships"], ["Hackathons", "/hackathons"], ["Application Tracker", "/profile/applied"]] },
    { title: "EdWorld", links: [["About", "/about"], ["For Colleges", "/for/colleges"], ["Pricing", "/pricing"]] },
  ],
  [
    { title: "Learn", links: [["EdLearn Courses", "/learn"], ["Practice Papers", "/learn/papers"], ["Career Roadmap", "/career/roadmap"]] },
    { title: "Practice", links: [["DSA Arena", "/dsa"], ["Daily Challenge", "/daily"], ["Aptitude Practice", "/aptitude"], ["Focus Studio", "/focus"]] },
  ],
];

export default function ModernEdworldFooter() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error();
      form.reset();
      setMessage("You’re subscribed to EdWorld updates.");
    } catch {
      setMessage("Couldn’t subscribe. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <footer className="w-full border-t-2 border-blue-300 bg-gradient-to-br from-blue-100 via-blue-50 to-white text-black">
      <div className="grid grid-cols-1 gap-8 px-4 py-9 sm:grid-cols-2 sm:px-6 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(15rem,1.35fr)] xl:px-8">
        {columns.map((groups) => (
          <div key={groups[0].title} className="grid content-start gap-6">
            {groups.map(({ title, links }) => (
              <nav key={title} aria-label={title}>
                <h2 className="mb-3 text-base font-semibold text-slate-950">{title}</h2>
                <ul className="space-y-2 text-sm">
                  {links.map(([label, href]) => (
                    <li key={href}><Link href={href} className="hover:text-blue-800 hover:underline">{label}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        ))}
        <div className="min-w-0 space-y-5 border-t border-blue-200 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <Link href="/contact" className="inline-flex items-center gap-2 font-semibold text-slate-950 hover:text-blue-800">
            Contact us <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Stay updated</h2>
            <p className="mt-1 text-sm">Get EdWorld news and opportunity updates.</p>
            <form onSubmit={subscribe} className="mt-3 flex">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input id="footer-email" name="email" type="email" autoComplete="email" required placeholder="Email address" className="min-w-0 flex-1 rounded-l-lg border border-blue-200 bg-white px-3 text-sm" />
              <button type="submit" aria-label="Subscribe to the newsletter" disabled={pending} className="grid min-h-11 w-12 shrink-0 place-items-center rounded-r-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60">
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </form>
            <p role="status" className="mt-2 text-sm">{pending ? "Subscribing…" : message}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-200 px-4 py-4 text-sm sm:px-6 xl:px-8">
        <nav aria-label="Legal" className="flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <button type="button" className="hover:underline" onClick={() => window.dispatchEvent(new CustomEvent("edworld-open-cookie-preferences"))}>Cookie preferences</button>
        </nav>
      </div>
    </footer>
  );
}
