import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const externalLabels: Record<string, string> = {
  external_hackathon: "Hackathon · registration self-reported",
  external_internship: "Internship · application self-reported",
  external_job: "Job · application self-reported",
};

function externalLink(value: unknown): string | undefined {
  if (typeof value !== "string" || !URL.canParse(value)) return;
  const url = new URL(value);
  if (url.protocol === "https:" && !url.username && !url.password) return url.href;
}

export default async function AppliedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectUrl=%2Fprofile%2Fapplied");

  const [tracked, submitted] = await Promise.all([
    supabase.from("job_applications_pipeline")
      .select("id, company_name, job_title, job_url, source, status, applied_at")
      .eq("user_id", user.id).neq("status", "saved").order("applied_at", { ascending: false }),
    supabase.from("job_applications").select("id, status, applied_at, jobs(id, title, company)")
      .eq("user_id", user.id).order("applied_at", { ascending: false }),
  ]);

  const items = [
    ...(tracked.data ?? []).map(item => ({
      id: item.id,
      title: item.job_title,
      organization: item.company_name,
      status: Object.hasOwn(externalLabels, item.source) ? externalLabels[item.source] : item.status,
      appliedAt: item.applied_at,
      href: externalLink(item.job_url),
    })),
    ...(submitted.data ?? []).map(item => {
      const job = Array.isArray(item.jobs) ? item.jobs[0] : item.jobs;
      return {
        id: item.id,
        title: job?.title ?? "Job application",
        organization: job?.company,
        status: item.status,
        appliedAt: item.applied_at,
        href: job?.id ? `/jobs/${encodeURIComponent(job.id)}` : undefined,
      };
    }),
  ].sort((a, b) => (Date.parse(b.appliedAt ?? "") || 0) - (Date.parse(a.appliedAt ?? "") || 0));

  return (
    <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
      <div>
        <Link href="/profile" className="text-sm font-semibold text-blue-800 hover:underline">Back to profile</Link>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Applied</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your EdWorld applications and registrations you marked as completed on external sites.
        </p>
      </div>
      {(tracked.error || submitted.error) && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Some application records could not be loaded. Refresh to try again.
        </p>
      )}
      {items.length ? (
        <ul className="divide-y divide-slate-200">
          {items.map(item => (
            <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">{item.title}</h2>
                <p className="text-sm text-slate-600">{item.organization}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.status?.replace(/_/g, " ")}
                  {item.appliedAt && ` · ${new Date(item.appliedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`}
                </p>
              </div>
              {item.href && <a href={item.href} className="text-sm font-semibold text-blue-800 hover:underline">View listing</a>}
            </li>
          ))}
        </ul>
      ) : !tracked.error && !submitted.error && (
        <p className="text-sm text-slate-600">No applications or registrations recorded yet.</p>
      )}
      <Link href="/opportunities" className="inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
        Browse opportunities
      </Link>
    </section>
  );
}
