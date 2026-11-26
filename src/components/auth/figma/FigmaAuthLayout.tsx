import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

interface FigmaAuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  activeTab: "login" | "signup" | "reset";
}

const tabs = [
  { id: "signup", label: "Sign up", href: "/signup" },
  { id: "login", label: "Sign in", href: "/login" },
] as const;

export default function FigmaAuthLayout({ children, title, subtitle, activeTab }: FigmaAuthLayoutProps) {
  return (
    <main className="grid min-h-svh w-full bg-white text-neutral-950 selection:bg-neutral-900 selection:text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative flex min-w-0 items-center justify-center overflow-hidden bg-[#f0efed] px-5 pt-5 lg:sticky lg:top-0 lg:h-svh lg:px-10 lg:pt-0">
        <div className="relative aspect-[8/9] w-36 overflow-hidden sm:w-44 lg:w-[min(86%,65svh,30rem)]">
          <div className="relative h-full w-[200%]">
            <Image
              src="/images/myra-auth.png"
              alt="Myra, the EdWorld bear, wearing a green hat and black hoodie"
              fill
              sizes="(min-width: 1024px) 840px, 360px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-7 flex items-center gap-3 sm:mb-9">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-black">
              <Image src="/images/edworld-mark.png" alt="" width={29} height={29} />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">EdWorld Co.</span>
          </div>

          <nav aria-label="Account access" className="mb-7 grid grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1">
            {tabs.map(({ id, label, href }) => (
              <Link
                key={id}
                href={href}
                aria-current={activeTab === id ? "page" : undefined}
                className="flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-neutral-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800 aria-[current=page]:bg-black aria-[current=page]:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>

          <header className="mb-6 space-y-2">
            <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-tight tracking-tight text-neutral-950">{title}</h1>
            <p className="max-w-prose text-sm leading-relaxed text-neutral-600">{subtitle}</p>
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}
