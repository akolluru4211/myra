"use client";

import { useEffect, useId, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Code2, Search } from "lucide-react";
import { getOpenHackathons, hackathonDirectories, type Opportunity } from "@/lib/data/opportunities";

const pageSize = 12;
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

export default function OpportunityBoard({ initialHackathons = [] }: { initialHackathons?: Opportunity[] }) {
  const headingId = useId();
  const [category, setCategory] = useState<"hackathons" | "jobs">("hackathons");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(pageSize);
  const [hackathons, setHackathons] = useState<Opportunity[]>(initialHackathons);
  const [jobFeed, setJobFeed] = useState<JobFeed | null>(null);
  const [jobError, setJobError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => setHackathons(getOpenHackathons()), []);
  useEffect(() => {
    if (category !== "jobs" || jobFeed) return;
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

  const isJobs = category === "jobs";
  const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (isJobs ? jobFeed?.jobs ?? [] : hackathons).filter(opportunity => {
    const text = [
      opportunity.title, opportunity.organization, opportunity.location,
      opportunity.source, opportunity.summary, opportunity.eligibility,
    ].join(" ").toLowerCase();
    return searchTerms.every(term => text.includes(term));
  });

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 id={headingId} className="text-xl font-bold text-slate-900 sm:text-2xl">Global opportunities</h2>
      <p className="mt-1 max-w-prose text-sm text-slate-600">
        Find hackathons and jobs by role, organization, or location. Apply on the employer or organizer’s site.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Opportunity type" className="inline-flex gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            aria-pressed={!isJobs}
            onClick={() => { setCategory("hackathons"); setLimit(pageSize); }}
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-700 aria-pressed:bg-white aria-pressed:text-blue-800 aria-pressed:shadow-sm"
          >
            <Code2 size={16} aria-hidden="true" /> Hackathons
          </button>
          <button
            type="button"
            aria-pressed={isJobs}
            onClick={() => { setCategory("jobs"); setLimit(pageSize); }}
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-700 aria-pressed:bg-white aria-pressed:text-blue-800 aria-pressed:shadow-sm"
          >
            <BriefcaseBusiness size={16} aria-hidden="true" /> Jobs
          </button>
        </div>
        <label className="relative min-w-0 flex-auto sm:max-w-sm">
          <span className="sr-only">Search opportunities by title, organization, or location</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={event => { setQuery(event.target.value); setLimit(pageSize); }}
            placeholder={isJobs ? "Try internship, London, or remote" : "Try Unstop, online, or Bengaluru"}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900"
          />
        </label>
      </div>

      {isJobs && !jobFeed ? (
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
            {matches.length} {isJobs ? "jobs" : "hackathons"} found
            {isJobs && jobFeed && ` · ${jobFeed.sourcesAvailable} of ${jobFeed.sourcesTotal} employer boards available`}
          </p>
          {matches.length === 0 && (
            <p className="mt-2 text-sm text-slate-700">
              {query.trim() ? "Try a different title, organization, or location." : "Check back for new listings."}
            </p>
          )}
          <ul className="mt-2 divide-y divide-slate-200">
            {matches.slice(0, limit).map(item => (
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
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${isJobs ? "Apply for" : "Register for"} ${item.title} (opens in a new tab)`}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                >
                  {isJobs ? "Apply" : "Register"} <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          {matches.length > limit && (
            <button type="button" className="btn btn-blue-secondary mt-3" onClick={() => setLimit(limit + pageSize)}>
              Show more
            </button>
          )}
        </>
      )}

      {!isJobs && (
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
