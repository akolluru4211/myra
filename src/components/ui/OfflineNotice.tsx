"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const syncConnection = () => setOffline(!navigator.onLine);
    window.addEventListener("offline", syncConnection);
    window.addEventListener("online", syncConnection);
    syncConnection();
    return () => {
      window.removeEventListener("offline", syncConnection);
      window.removeEventListener("online", syncConnection);
    };
  }, []);

  if (!offline) return null;

  return (
    <aside aria-label="Connection status" className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[110] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 shadow-lg">
      <WifiOff aria-hidden="true" className="size-5 shrink-0 text-slate-600" />
      <div role="status" className="flex-1">
        <p className="text-sm font-semibold">No internet connection</p>
        <p className="text-xs text-slate-600">Reconnect to load new content.</p>
      </div>
    </aside>
  );
}
