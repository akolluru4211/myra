import React from "react";

export default function PageLoadingScreen({ skeleton = false }: { skeleton?: boolean }) {
  return (
    <div data-page-loading role="status" aria-live="polite" className="fixed inset-0 z-[100] grid place-items-center bg-white p-6">
      <div className="flex flex-col items-center gap-4">
        <span aria-hidden="true" className="size-8 rounded-full border-2 border-blue-100 border-t-blue-600 motion-safe:animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading</p>
        {skeleton && <div aria-hidden="true" className="grid w-40 justify-items-center gap-2 motion-safe:animate-pulse">
          <span className="h-2 w-full rounded-full bg-blue-100" />
          <span className="h-2 w-3/4 rounded-full bg-slate-100" />
          <span className="h-2 w-1/2 rounded-full bg-slate-100" />
        </div>}
      </div>
    </div>
  );
}
