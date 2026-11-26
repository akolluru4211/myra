import OpportunityBoard from "@/components/dashboard/OpportunityBoard";

import { getOpenHackathons } from "@/lib/data/opportunities";

export const dynamic = "force-dynamic";

export default function OpportunitiesPage() {
  return <OpportunityBoard initialHackathons={getOpenHackathons()} />;
}
