import React from "react";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 bg-white">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center shadow-sm animate-pulse">
          <Image
            src="/images/edworld-logo.png"
            alt="Loading Edworld Co"
            width={30}
            height={30}
            className="object-contain"
            priority
          />
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-500 tracking-wide">Loading</p>
    </div>
  );
}
