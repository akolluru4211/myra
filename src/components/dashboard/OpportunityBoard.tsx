"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Code2, GraduationCap, Search } from "lucide-react";
import { getOpenHackathons, hackathonDirectories, type Opportunity, type OpportunityCategory } from "@/lib/data/opportunities";

const pageSize = 12;

const categories = [
  { id: "hackathons", label: "Hackathons", icon: Code2 },
  { id: "internships", label: "Internships", icon: GraduationCap },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
] as const;
const dateFormat = new Intl.DateTimeFormat("en", {
  month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
});

const indiaDateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
});

interface JobFeed {
  jobs: Opportunity[];
  sourcesAvailable: number;
  sourcesTotal: number;
}

interface OpportunityBoardProps {
  initialHackathons?: Opportunity[];
  hackathonsOnly?: boolean;
  initialCategory?: OpportunityCategory;
}

export default function OpportunityBoard({ initialHackathons = [], hackathonsOnly = false, initialCategory = "hackathons" }: OpportunityBoardProps) {
  const headingId = useId();
  const [category, setCategory] = useState<OpportunityCategory>(hackathonsOnly ? "hackathons" : initialCategory);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(pageSize);
  const [hackathons, setHackathons] = useState<Opportunity[]>(initialHackathons);
  const [jobFeed, setJobFeed] = useState<JobFeed | null>(null);
  const [jobError, setJobError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [tracking, setTracking] = useState<Record<string, "pending" | "saved" | "signin" | "error">>({});

  useEffect(() => setHackathons(getOpenHackathons()), []);
  useEffect(() => {
    if (category === "hackathons" || jobFeed) return;
    const controller = new AbortController();
    setJobError(false);
    async function loadJobs() {
      try {
        const response = await fetch("/api/opportunities", { signal: controller.signal });
        if (!response.ok) throw new Error("Employer listings unavailable");
        const feed = await response.json() as JobFeed;
        if (!controller.signal.aborted) setJobFeed(feed);
      } catch {
        if (!controller.signal.aborted) setJobError(true);
      }
    }

    void loadJobs();
    return () => controller.abort();
  }, [category, jobFeed, retry]);

  async function trackApplication(item: Opportunity) {
    setTracking(previous => ({ ...previous, [item.id]: "pending" }));
    try {
      const response = await fetch("/api/career/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trackExternal",
          kind: category === "hackathons" ? "hackathon" : category === "internships" ? "internship" : "job",
          title: item.title, organization: item.organization, location: item.location, url: item.url,
        }),
      });
      setTracking(previous => ({
        ...previous,
        [item.id]: response.ok ? "saved" : response.status === 401 ? "signin" : "error",
      }));
    } catch {
      setTracking(previous => ({ ...previous, [item.id]: "error" }));
    }
  }

  const isCareerListing = category !== "hackathons";
  const Heading = hackathonsOnly ? "h1" : "h2";
  const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const careerListings = jobFeed?.jobs.filter(job =>
    category === "internships" ? job.employmentType === "internship" : job.employmentType !== "internship",
  ) ?? [];
  const matches = (isCareerListing ? careerListings : hackathons).filter(opportunity => {
    const text = [
      opportunity.title, opportunity.organization, opportunity.location,
      opportunity.source, opportunity.summary, opportunity.eligibility,
    ].join(" ").toLowerCase();
    return searchTerms.every(term => text.includes(term));
  });

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading id={headingId} className="text-xl font-bold text-slate-900 sm:text-2xl">
          {hackathonsOnly ? "Hackathons" : "Global opportunities"}
        </Heading>
        {!hackathonsOnly && (
          <Link href="/hackathons" className="rounded-md py-1 text-sm font-semibold text-blue-800 hover:underline">
            View all hackathons
          </Link>
        )}
      </div>
      <p className="mt-1 max-w-prose text-sm text-slate-600">
        {hackathonsOnly
          ? "Find open online and in-person hackathons. Register directly with the organizer."
          : "Find hackathons, internships, and jobs. Apply directly on the original listing."}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {hackathonsOnly ? (
          <nav aria-label="Other opportunities" className="flex gap-4 text-sm font-semibold text-blue-800">
            <Link href="/opportunities?type=internships" className="hover:underline">Internships</Link>
            <Link href="/opportunities?type=jobs" className="hover:underline">Jobs</Link>
          </nav>
        ) : (
          <div role="group" aria-label="Opportunity type" className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
            {categories.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={category === id}
                onClick={() => { setCategory(id); setLimit(pageSize); }}
                className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-700 aria-pressed:bg-white aria-pressed:text-blue-800 aria-pressed:shadow-sm"
              >
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        )}
        <label className="relative min-w-0 flex-auto sm:max-w-sm">
          <span className="sr-only">Search opportunities by title, organization, or location</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={event => { setQuery(event.target.value); setLimit(pageSize); }}
            placeholder={isCareerListing ? "Try Unstop, software, or remote" : "Try Unstop, online, or Bengaluru"}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900"
          />
        </label>
      </div>

      {isCareerListing && !jobFeed ? (
        <div className="mt-4 text-sm text-slate-600" role="status">
          {jobError ? (
            <>
              Employer listings are temporarily unavailable.{" "}
              <button type="button" className="font-semibold text-blue-800 underline" onClick={() => setRetry(retry + 1)}>Retry</button>
            </>
          ) : "Loading employer listings…"}
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-600" role="status">
            {matches.length} {category} found
            {isCareerListing && jobFeed && ` · ${jobFeed.sourcesAvailable} of ${jobFeed.sourcesTotal} employer boards available`}
          </p>
          {matches.length === 0 && (
            <p className="mt-2 text-sm text-slate-700">
              {query.trim() ? "Try a different title, organization, or location." : "Check back for new listings."}
            </p>
          )}
          <ul className="mt-2 divide-y divide-slate-200">
            {(hackathonsOnly ? matches : matches.slice(0, limit)).map(item => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="min-w-0 flex-auto basis-52">
                  <h3 className="break-words text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {item.organization} · {item.location}{item.source && ` · via ${item.source}`}
                    {item.deadline && <> · Closes {item.source === "Unstop"
                      ? indiaDateFormat.format(new Date(item.deadline)) + " IST"
                      : dateFormat.format(new Date(item.deadline)) + (item.deadline.includes("T") ? " UTC" : "")}</>}
                  </p>
                  {item.summary && <p className="mt-1 text-sm text-slate-700">{item.summary}</p>}
                  {item.eligibility && <p className="mt-1 text-sm text-slate-600">Eligibility: {item.eligibility}</p>}
                  {(item.teamSize || item.prize) && (
                    <p className="mt-1 text-sm text-slate-600">{[item.teamSize, item.prize].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${isCareerListing ? "Apply for" : "Register for"} ${item.title} (opens in a new tab)`}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                >
                  {isCareerListing ? "Apply" : "Register"} <ArrowUpRight size={15} aria-hidden="true" />
                </a>
                {tracking[item.id] === "saved" ? (
                  <Link href="/profile/applied" className="text-sm font-semibold text-emerald-800 hover:underline">View in Applied</Link>
                ) : tracking[item.id] === "signin" ? (
                  <Link href={hackathonsOnly ? "/login?redirectUrl=%2Fhackathons" : `/login?redirectUrl=${encodeURIComponent(`/opportunities?type=${category}`)}`} className="text-sm font-semibold text-blue-800 hover:underline">
                    Sign in to track
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void trackApplication(item)}
                    disabled={tracking[item.id] === "pending"}
                    aria-label={`Mark ${item.title} as ${isCareerListing ? "applied" : "registered"}`}
                    className="min-h-10 rounded-lg px-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {tracking[item.id] === "pending" ? "Saving…" : isCareerListing ? "Mark applied" : "Mark registered"}
                  </button>
                )}
                {tracking[item.id] === "error" && <span role="status" className="text-xs text-rose-700">Could not save. Try again.</span>}
                </div>
              </li>
            ))}
          </ul>
          {!hackathonsOnly && matches.length > limit && (
            <button type="button" className="btn btn-blue-secondary mt-3" onClick={() => setLimit(limit + pageSize)}>
              Show more
            </button>
          )}
        </>
      )}

      {isCareerListing ? (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200 pt-4 text-sm">
          <span className="text-slate-600">More {category}</span>
          <a href={`https://unstop.com/${category}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-800 hover:underline">
            Unstop <ArrowUpRight size={14} aria-hidden="true" className="inline" />
          </a>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200 pt-4 text-sm">
          <span className="text-slate-600">More hackathons</span>
          {hackathonDirectories.map(source => (
            <a key={source.name} href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-800 hover:underline">
              {source.name} <ArrowUpRight size={14} aria-hidden="true" className="inline" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
