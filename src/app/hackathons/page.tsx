import type { Metadata } from "next";
import OpportunityBoard from "@/components/dashboard/OpportunityBoard";
import { getOpenHackathons } from "@/lib/data/opportunities";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hackathons",
  description: "Browse open online and in-person hackathons and register with the organizer.",
};

export default function HackathonsPage() {
  return <OpportunityBoard hackathonsOnly initialHackathons={getOpenHackathons()} />;
}
