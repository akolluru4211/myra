import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Bell, Compass, FileText, FolderKanban, ShieldCheck, Video } from "lucide-react";

export const metadata: Metadata = { title: "Career" };

const tools = [
  { href: "/career/roadmap", title: "Career roadmap", description: "Set a goal and plan your next steps.", icon: Compass, color: "bg-teal-100 text-teal-900" },
  { href: "/resumes", title: "Resume builder", description: "Create and refine your resume.", icon: FileText, color: "bg-sky-100 text-sky-900" },
  { href: "/interviews", title: "Mock interviews", description: "Practice for your next interview.", icon: Video, color: "bg-violet-100 text-violet-900" },
  { href: "/projects", title: "Project studio", description: "Build projects and show your skills.", icon: FolderKanban, color: "bg-amber-100 text-amber-950" },
  { href: "/career/scam-checker", title: "Offer checker", description: "Review a job offer for warning signs.", icon: ShieldCheck, color: "bg-rose-100 text-rose-900" },
  { href: "/settings/alerts", title: "Alert settings", description: "Choose which updates you receive.", icon: Bell, color: "bg-indigo-100 text-indigo-900" },
];

export default function CareerPage() {
  return (
    <section aria-labelledby="career-title" className="mx-auto w-full max-w-6xl py-2 sm:py-6">
      <header className="rounded-3xl border border-teal-100 bg-[#eaf7f4] px-6 py-8 sm:px-10 sm:py-11">
        <h1 id="career-title" className="text-4xl font-semibold tracking-tight text-[#173630] sm:text-5xl">
          Career workspace
        </h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-[#36554f]">
          Plan your path, build your resume, and prepare for interviews.
        </p>
      </header>

      <nav aria-label="Career tools" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(({ href, title, description, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className="group flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 hover:border-teal-400 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:p-5"
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${color}`}>
              <Icon size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-slate-600">{description}</span>
            </span>
            <ArrowUpRight size={17} className="mt-1 shrink-0 text-slate-500 group-hover:text-teal-800" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </section>
  );
}
