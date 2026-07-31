"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";

export default function AnalyticsWrapper() {
  const pathname = usePathname();
  if (pathname?.startsWith("/login")) return null;
  return <Analytics />;
}
