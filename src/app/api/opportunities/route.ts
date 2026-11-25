import { NextResponse } from "next/server";
import type { Opportunity } from "@/lib/data/opportunities";

const employers = [
  { token: "canonical", name: "Canonical" },
  { token: "cloudflare", name: "Cloudflare" },
  { token: "datadog", name: "Datadog" },
  { token: "gitlab", name: "GitLab" },
  { token: "grafanalabs", name: "Grafana Labs" },
  { token: "stripe", name: "Stripe" },
];

interface GreenhouseJob {
  id: number;
  title: string;
  location?: { name?: string };
  absolute_url: string;
  updated_at: string;
  internal_job_id?: number | null;
}

async function getEmployerJobs({ token, name }: (typeof employers)[number]) {
  const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs`, {
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`${name} board returned ${response.status}`);

  const { jobs } = (await response.json()) as { jobs: GreenhouseJob[] };
  return jobs.flatMap((job): (Opportunity & { updatedAt: number })[] => {
    if (job.internal_job_id === null || !job.title || !URL.canParse(job.absolute_url)) return [];
    const url = new URL(job.absolute_url);
    if (url.protocol !== "https:" || url.username || url.password) return [];

    return [{
      id: `${token}-${job.id}`,
      title: job.title,
      organization: name,
      location: job.location?.name || "See listing for location",
      url: url.href,
      updatedAt: Date.parse(job.updated_at) || 0,
    }];
  });
}

export async function GET() {
  const results = await Promise.allSettled(employers.map(getEmployerJobs));
  const available = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
  if (!available.length) {
    return NextResponse.json({ error: "Employer listings are temporarily unavailable." }, { status: 503 });
  }

  const jobs = available.flat()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(({ updatedAt: _updatedAt, ...job }) => job);
  return NextResponse.json({ jobs, sourcesAvailable: available.length, sourcesTotal: employers.length });
}
