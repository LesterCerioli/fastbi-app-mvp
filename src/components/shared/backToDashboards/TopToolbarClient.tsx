"use client";

import { usePathname } from "next/navigation";
import BackToDashboards from "@/components/shared/backToDashboards/backToDashboards";
import { Toolbar as TopToolbar } from "@/components/shared/backToDashboards/styles";
import LanguageBar from "@/components/shared/languageBar/languageBar";

export default function TopToolbarClient() {
  const pathname = usePathname();

  return (
    <TopToolbar>
      {pathname !== "/dashboard" && <BackToDashboards />}
      <LanguageBar />
    </TopToolbar>
  );
}