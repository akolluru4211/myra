import OpportunityBoard from "@/components/dashboard/OpportunityBoard";
import { getOpenHackathons } from "@/lib/data/opportunities";

export const dynamic = "force-dynamic";

export default function OpportunitiesPage({ searchParams }: { searchParams: { type?: string } }) {
  const type = searchParams.type;
  const initialCategory = type === "jobs" || type === "internships" ? type : "hackathons";

  return <OpportunityBoard key={initialCategory} initialCategory={initialCategory} initialHackathons={getOpenHackathons()} />;
}
