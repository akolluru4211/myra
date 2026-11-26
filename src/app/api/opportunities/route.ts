import { NextResponse } from "next/server";
import { getOpenUnstopRoles, type Opportunity } from "@/lib/data/opportunities";

const greenhouseBoards = [
  ["canonical", "Canonical"],
  ["cloudflare", "Cloudflare"],
  ["datadog", "Datadog"],
  ["gitlab", "GitLab"],
  ["grafanalabs", "Grafana Labs"],
  ["stripe", "Stripe"],
];

const ashbyBoards = [
  ["notion", "Notion"],
  ["ramp", "Ramp"],
  ["replit", "Replit"],
  ["supabase", "Supabase"],
];

type FeedOpportunity = Opportunity & { updatedAt: number };

interface GreenhouseJob {
  id: number;
  title: string;
  location?: { name?: string };
  absolute_url: string;
  updated_at: string;
  internal_job_id?: number | null;
}

interface AshbyJob {
  title: string;
  location?: string;
  secondaryLocations?: { location: string }[];
  isListed: boolean;
  isRemote?: boolean;
  employmentType: string;
  jobUrl: string;
  applyUrl: string;
  publishedAt: string;
}

async function fetchBoard<T>(url: string, name: string): Promise<T[]> {
  const response = await fetch(url, {
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`${name} board returned ${response.status}`);
  const { jobs } = await response.json() as { jobs: T[] };
  if (!Array.isArray(jobs)) throw new Error(`${name} returned an invalid board`);
  return jobs;
}

function applicationUrl(value: string) {
  if (!URL.canParse(value)) return null;
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
}

async function getGreenhouseJobs([token, name]: string[]): Promise<FeedOpportunity[]> {
  const jobs = await fetchBoard<GreenhouseJob>(
    `https://boards-api.greenhouse.io/v1/boards/${token}/jobs`, name,
  );
  return jobs.flatMap(job => {
    const url = applicationUrl(job.absolute_url);
    if (job.internal_job_id === null || !job.title || !url) return [];
    return [{
      id: `greenhouse-${token}-${job.id}`,
      title: job.title,
      organization: name,
      location: job.location?.name || "See listing for location",
      url,
      source: "Greenhouse",
      employmentType: /\b(?:intern|internship|co[- ]op)\b/i.test(job.title) ? "internship" : "job",
      updatedAt: Date.parse(job.updated_at) || 0,
    }];
  });
}

async function getAshbyJobs([token, name]: string[]): Promise<FeedOpportunity[]> {
  const jobs = await fetchBoard<AshbyJob>(
    `https://api.ashbyhq.com/posting-api/job-board/${token}`, name,
  );
  return jobs.flatMap(job => {
    const url = applicationUrl(job.applyUrl);
    if (!job.isListed || !job.title || !url) return [];
    const locations = [job.location, ...(job.secondaryLocations ?? []).map(item => item.location)]
      .filter(Boolean);
    if (job.isRemote && !locations.some(location => /remote/i.test(location!))) locations.push("Remote");

    return [{
      id: job.jobUrl || url,
      title: job.title,
      organization: name,
      location: [...new Set(locations)].join(" · ") || "See listing for location",
      url,
      source: "Ashby",
      employmentType: job.employmentType === "Intern" ? "internship" : "job",
      updatedAt: Date.parse(job.publishedAt) || 0,
    }];
  });
}

export async function GET() {
  const sources = [...greenhouseBoards.map(getGreenhouseJobs), ...ashbyBoards.map(getAshbyJobs)];
  const results = await Promise.allSettled(sources);
  const available = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
  const curated = getOpenUnstopRoles();
  if (!available.length && !curated.length) {
    return NextResponse.json({ error: "Employer listings are temporarily unavailable." }, { status: 503 });
  }

  const feed = available.flat().sort((a, b) => b.updatedAt - a.updatedAt);
  const listings = [...curated, ...feed.map(({ updatedAt: _updatedAt, ...job }) => job)];
  const uniqueJobs = [...new Map(listings.map(job => [job.url, job])).values()];
  return NextResponse.json(
    { jobs: uniqueJobs, sourcesAvailable: available.length, sourcesTotal: sources.length },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" } },
  );
}
