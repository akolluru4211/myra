import JobBoardPage from "@/components/jobs/JobBoardPage";

export const metadata = { title: "Internships" };

export default function InternshipsPage() {
  return <JobBoardPage internshipsOnly />;
}
