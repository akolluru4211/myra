import Link from "next/link";
import { redirect } from "next/navigation";

export default function OpportunitiesPage({ searchParams }: { searchParams: { type?: string } }) {
  const pages = ["jobs", "internships", "hackathons"];
  if (searchParams.type && pages.includes(searchParams.type)) redirect(`/${searchParams.type}`);

  return (
    <section aria-labelledby="opportunities-title">
      <h1 id="opportunities-title" className="text-3xl font-bold text-black">Opportunities</h1>
      <ul className="mt-4 divide-y divide-blue-100">
        {pages.map((page) => (
          <li key={page}><Link href={`/${page}`} className="block py-4 font-semibold capitalize text-blue-800 hover:underline">{page}</Link></li>
        ))}
      </ul>
    </section>
  );
}
