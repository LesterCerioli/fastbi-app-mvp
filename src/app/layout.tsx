

import AnalyticsWrapper from "@/components/shared/analytics";
import Header from "@/components/shared/header/header";
import BackToDashboards from "@/components/shared/backToDashboards/backToDashboards";
import { Toolbar as TopToolbar } from "@/components/shared/backToDashboards/styles";
import LanguageBar from "@/components/shared/languageBar/languageBar";
import StyledComponentsRegistry from "../lib/registry";
import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Footer from "@/components/shared/footer/footer";
import I18nProvider from "@/lib/i18n/I18nProvider";

const inter = localFont({
  src: "../../public/fonts/inter/Inter-Variable.woff2",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FastBI - Business Intelligence for Small and Medium-Sized Businesses",
  description: "Turn your data into intelligent decisions with FastBI. Easy and effective BI solutions for your business.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <I18nProvider>
            <Header />
            <TopToolbar>
              <BackToDashboards />
              <LanguageBar />
            </TopToolbar>
            {children}
            <AnalyticsWrapper />
            <Footer />
          </I18nProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}