import { NextResponse } from "next/server";
import type { JobListing } from "@/lib/types";

const employers = [
  { board: "anthropic", company: "Anthropic" },
  { board: "stripe", company: "Stripe" },
  { board: "cloudflare", company: "Cloudflare" },
  { board: "vercel", company: "Vercel" },
  { board: "scaleai", company: "Scale AI" },
];

interface BoardJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  location?: { name?: string };
}

async function loadBoard({ board, company }: (typeof employers)[number]): Promise<JobListing[]> {
  const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`, {
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Employer feed unavailable");
  const { jobs } = await response.json() as { jobs: BoardJob[] };
  return jobs.flatMap((job) => {
    if (!Number.isSafeInteger(job.id) || typeof job.title !== "string" || !job.title.trim()) return [];
    const url = URL.canParse(job.absolute_url) ? new URL(job.absolute_url) : null;
    if (!url || url.protocol !== "https:" || url.username || url.password) return [];
    return [{
      id: `greenhouse-${board}-${job.id}`,
      title: job.title,
      company,
      description: "See the employer’s listing for responsibilities and application requirements.",
      location: job.location?.name || "See employer listing",
      type: /\bintern(?:ship)?\b/i.test(job.title) ? "internship" : "full-time",
      postedBy: company,
      createdAt: job.updated_at || "",
      applicationDeadline: "",
      skillsRequired: [],
      isActive: true,
      moderationStatus: "approved",
      sourceType: "aggregated_api",
      sourceName: `${company} Careers`,
      externalUrl: url.href,
    }];
  });
}

export async function GET() {
  const boards = await Promise.allSettled(employers.map(loadBoard));
  const jobs = boards.flatMap((board) => board.status === "fulfilled" ? board.value : []);
  const available = boards.some((board) => board.status === "fulfilled");
  const unavailableEmployers = employers
    .filter((_, index) => boards[index].status === "rejected")
    .map(({ company }) => company);
  return NextResponse.json({ jobs, unavailableEmployers }, { status: available ? 200 : 503 });
}
