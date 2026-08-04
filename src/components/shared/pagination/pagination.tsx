"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  infoKey?: string;
}

const MAX_VISIBLE = 7;

function buildPageList(page: number, pageCount: number): (number | "...")[] {
  if (pageCount <= MAX_VISIBLE) {
    return Array.from({ length: pageCount }, (_, i) => i);
  }

  const list: (number | "...")[] = [0];
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount - 2, page + 2);

  if (start > 1) list.push("...");
  for (let i = start; i <= end; i++) list.push(i);
  if (end < pageCount - 2) list.push("...");
  list.push(pageCount - 1);

  return list;
}

export default function Pagination({
  page,
  pageCount,
  onPageChange,
  totalItems,
  pageSize,
  infoKey,
}: PaginationProps) {
  const { t } = useTranslations();

  const pages = useMemo(
    () => buildPageList(page, pageCount),
    [page, pageCount]
  );

  const itemStart =
    totalItems != null && totalItems > 0 ? page * (pageSize || 1) + 1 : 0;
  const itemEnd =
    totalItems != null
      ? Math.min((page + 1) * (pageSize || 1), totalItems)
      : 0;

  const goTo = (target: number) => {
    if (target >= 0 && target < pageCount) onPageChange(target);
  };

  if (pageCount <= 1) return null;

  return (
    <S.Container>
      {infoKey && totalItems != null && (
        <S.Info>
          {t(infoKey, { start: itemStart, end: itemEnd, count: totalItems })}
        </S.Info>
      )}

      <S.Buttons>
        <S.NavButton
          onClick={() => goTo(page - 1)}
          disabled={page === 0}
          aria-label={t("pagination.prev")}
          title={t("pagination.prev")}
        >
          <ChevronLeft size={14} />
          {t("pagination.prev")}
        </S.NavButton>

        {pages.map((item, index) =>
          item === "..." ? (
            <S.Ellipsis key={`ellipsis-${index}`}>…</S.Ellipsis>
          ) : (
            <S.PageButton
              key={item}
              $active={item === page}
              onClick={() => goTo(item)}
              disabled={item === page}
              aria-label={t("pagination.pageLabel", { page: item + 1 })}
              aria-current={item === page ? "page" : undefined}
            >
              {item + 1}
            </S.PageButton>
          )
        )}

        <S.NavButton
          onClick={() => goTo(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label={t("pagination.next")}
          title={t("pagination.next")}
        >
          {t("pagination.next")}
          <ChevronRight size={14} />
        </S.NavButton>
      </S.Buttons>
    </S.Container>
  );
}
