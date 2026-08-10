"use client";

import React from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <polyline points="4 12 10 18 20 6" />
    </svg>
  );
}

export default function PricingComparison() {
  const { t } = useTranslations();

  const rows = [
    {
      group: t("pricing.comparison.groups.coreAnalytics"),
      items: [
        { label: t("pricing.comparison.rows.usersIncluded"), values: ["10", "200", t("pricing.comparison.values.unlimited"), t("pricing.comparison.values.unlimited")] },
        { label: t("pricing.comparison.rows.connectedSources"), values: ["10", "50", t("pricing.comparison.values.unlimited"), t("pricing.comparison.values.unlimited")] },
        { label: t("pricing.comparison.rows.dashboards"), values: [t("pricing.comparison.values.unlimited"), t("pricing.comparison.values.unlimited"), t("pricing.comparison.values.unlimited"), t("pricing.comparison.values.unlimited")] },
        { label: t("pricing.comparison.rows.refreshRate"), values: [t("pricing.comparison.values.daily"), t("pricing.comparison.values.hourly"), t("pricing.comparison.values.realTime"), t("pricing.comparison.values.realTime")] },
      ],
    },
    {
      group: t("pricing.comparison.groups.intelligence"),
      items: [
        { label: t("pricing.comparison.rows.predictiveAnalytics"), checks: [false, true, true, true] },
        { label: t("pricing.comparison.rows.aiReporting"), checks: [false, true, true, true] },
        { label: t("pricing.comparison.rows.scheduledReports"), checks: [false, true, true, true] },
      ],
    },
    {
      group: t("pricing.comparison.groups.governance"),
      items: [
        { label: t("pricing.comparison.rows.rbac"), checks: [false, false, true, true] },
        { label: t("pricing.comparison.rows.auditLogs"), checks: [false, false, true, true] },
        { label: t("pricing.comparison.rows.sso"), checks: [false, false, false, true] },
        { label: t("pricing.comparison.rows.uptimeSla"), values: ["\u2014", "99.5%", "99.9%", "99.9%"] },
        { label: t("pricing.comparison.rows.support"), values: [t("pricing.comparison.values.email"), t("pricing.comparison.values.priority"), t("pricing.comparison.values.successManager"), t("pricing.comparison.values.dedicatedSla")] },
      ],
    },
  ];

  return (
    <section>
      <S.SectionHead>
        <S.SectionTitle>{t("pricing.comparison.title")}</S.SectionTitle>
        <S.SectionSubtitle>{t("pricing.comparison.subtitle")}</S.SectionSubtitle>
      </S.SectionHead>
      <S.TableWrap>
        <S.TableInner>
        <S.Table>
          <thead>
            <tr>
              <S.TH>{t("pricing.comparison.headers.feature")}</S.TH>
              <S.TH>{t("pricing.comparison.headers.starter")}</S.TH>
              <S.THHighlight>{t("pricing.comparison.headers.professional")}</S.THHighlight>
              <S.TH>{t("pricing.comparison.headers.business")}</S.TH>
              <S.TH>{t("pricing.comparison.headers.enterprise")}</S.TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((group) => (
              <React.Fragment key={group.group}>
                <tr>
                  <S.TDGroup colSpan={5}>{group.group}</S.TDGroup>
                </tr>
                {group.items.map((item) => (
                  <tr key={item.label}>
                    <S.TD>{item.label}</S.TD>
                    {"values" in item
                      ? (item.values as string[]).map((val, i) => (
                          <S.TD key={i}>{val}</S.TD>
                        ))
                      : (item.checks as boolean[]).map((checked, i) =>
                          checked ? (
                            <S.CellCheck key={i}>
                              <CheckIcon />
                            </S.CellCheck>
                          ) : (
                            <S.CellDash key={i}>
                              {"\u2014"}
                            </S.CellDash>
                          )
                        )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </S.Table>
        </S.TableInner>
      </S.TableWrap>
    </section>
  );
}
