"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { RefreshCw, ChevronRight, X, Search } from "lucide-react";
import * as S from "./styles";
import Pagination from "@/components/shared/pagination/pagination";
import { useTranslations } from "@/lib/i18n/useTranslations";

interface GeneralFile {
  id: string;
  organization_id: string;
  file_name: string;
  s3_key: string;
  bucket_name: string;
  file_size: number;
  file_extension: string;
  row_count: number;
  columns: string[];
  status: string;
  error?: string;
  truncated?: boolean;
  created_at: string;
  updated_at: string;
}

interface GeneralFileDetail extends GeneralFile {
  rows: Record<string, unknown>[];
}

interface GeneralFilesListProps {
  organizationName?: string;
  refreshKey?: number;
}

const PAGE_SIZE = 100;
const CARD_PAGE_SIZE = 10;

async function getFreshToken(): Promise<string> {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error("Failed to obtain auth token");
  const data = await res.json();
  return data.token;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function parseDateValue(value: string): Date | null {
  const s = value.trim();
  let m = s.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/
  );
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) return null;
    return new Date(
      year,
      month - 1,
      day,
      m[4] ? Number(m[4]) : 0,
      m[5] ? Number(m[5]) : 0,
      m[6] ? Number(m[6]) : 0
    );
  }
  m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) return null;
    return new Date(
      year,
      month - 1,
      day,
      m[4] ? Number(m[4]) : 0,
      m[5] ? Number(m[5]) : 0,
      m[6] ? Number(m[6]) : 0
    );
  }
  return null;
}

function formatDateValue(value: string, locale: string): string | null {
  const date = parseDateValue(value);
  if (!date) return null;
  const hasTime = /[T ]\d{1,2}:\d{2}/.test(value.trim());
  if (hasTime) {
    return date.toLocaleString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDate(
  dateStr: string,
  t: ReturnType<typeof useTranslations>["t"],
  locale: string
): string {
  if (!dateStr) return t("dataeng.generalFiles.never");
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("dataeng.generalFiles.justNow");
  if (diffMins < 60)
    return t("dataeng.generalFiles.minutesAgo", { count: diffMins });
  if (diffHours < 24)
    return t("dataeng.generalFiles.hoursAgo", { count: diffHours });
  if (diffDays < 7)
    return t("dataeng.generalFiles.daysAgo", { count: diffDays });
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatCell(value: unknown, locale: string): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    const formatted = formatDateValue(value, locale);
    return formatted !== null ? formatted : value;
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString(locale)
      : value.toLocaleString(locale, { maximumFractionDigits: 4 });
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function GeneralFilesList({
  organizationName,
  refreshKey = 0,
}: GeneralFilesListProps) {
  const [orgName, setOrgName] = useState(organizationName || "");
  const [files, setFiles] = useState<GeneralFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const [detail, setDetail] = useState<GeneralFileDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [cardPage, setCardPage] = useState(0);
  const [search, setSearch] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { t, locale } = useTranslations();

  const effectiveOrgName = organizationName || orgName;

  const fetchFiles = useCallback(
    async (asRefresh = false) => {
      const name = organizationName || orgName;
      if (!name) return;
      if (asRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      setHasFetched(true);
      setCardPage(0);

      try {
        const token = await getFreshToken();
        const params = new URLSearchParams({
          organization_name: name,
        });

        const res = await fetch(`/api/dataeng/generalfiles?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || t("dataeng.generalFiles.loadError"));
          return;
        }

        setFiles(Array.isArray(data) ? data : []);
      } catch {
        setError(t("dataeng.generalFiles.serverError"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [organizationName, orgName, t]
  );

  useEffect(() => {
    if (effectiveOrgName) {
      fetchFiles();
    }
  }, [fetchFiles, refreshKey, effectiveOrgName]);

  const openDetail = useCallback(
    async (fileId: string) => {
      setIsDetailLoading(true);
      setDetailError(null);
      setPage(0);
      setSearch("");
      try {
        const token = await getFreshToken();
        const params = new URLSearchParams({ id: fileId });
        const res = await fetch(`/api/dataeng/generalfiles?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setDetailError(data.error || t("dataeng.generalFiles.loadDetailError"));
          return;
        }
        setDetail(data);
      } catch {
        setDetailError(t("dataeng.generalFiles.loadDetailError"));
      } finally {
        setIsDetailLoading(false);
      }
    },
    [t]
  );

  const closeDetail = useCallback(() => {
    setDetail(null);
    setDetailError(null);
    setIsDetailLoading(false);
    setPage(0);
  }, []);

  useEffect(() => {
    if (!detail) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [detail, closeDetail]);

  const handleCardKeyDown = (
    e: React.KeyboardEvent,
    fileId: string
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetail(fileId);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    if (!detail) return [];
    if (!normalizedSearch) return detail.rows;
    return detail.rows.filter((row) =>
      detail.columns.some((col) => {
        if (col.toLowerCase().includes(normalizedSearch)) return true;
        const value = row[col];
        return (
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(normalizedSearch)
        );
      })
    );
  }, [detail, normalizedSearch]);

  const filteredPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const rowStart = filteredRows.length > 0 ? page * PAGE_SIZE + 1 : 0;
  const rowEnd = Math.min((page + 1) * PAGE_SIZE, filteredRows.length);

  const cardPages = Math.max(1, Math.ceil(files.length / CARD_PAGE_SIZE));
  const pageCards = files.slice(
    cardPage * CARD_PAGE_SIZE,
    (cardPage + 1) * CARD_PAGE_SIZE
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  if (isLoading) {
    return (
      <S.Wrapper>
        <S.Header>
          <S.TitleGroup>
            <S.Title>{t("dataeng.generalFiles.title")}</S.Title>
          </S.TitleGroup>
        </S.Header>
        <S.Grid>
          <S.SkeletonCard>
            <S.SkeletonIcon />
            <S.SkeletonLines>
              <S.SkeletonLine $width="180px" />
              <S.SkeletonLine $width="260px" />
            </S.SkeletonLines>
          </S.SkeletonCard>
          <S.SkeletonCard>
            <S.SkeletonIcon />
            <S.SkeletonLines>
              <S.SkeletonLine $width="160px" />
              <S.SkeletonLine $width="220px" />
            </S.SkeletonLines>
          </S.SkeletonCard>
        </S.Grid>
      </S.Wrapper>
    );
  }

  return (
    <S.Wrapper>
      <S.Header>
        <S.TitleGroup>
          <S.Title>{t("dataeng.generalFiles.title")}</S.Title>
          {effectiveOrgName && (
            <S.FilesCount>
              {t(
                files.length === 1
                  ? "dataeng.generalFiles.countOne"
                  : "dataeng.generalFiles.countMany",
                { count: files.length }
              )}
            </S.FilesCount>
          )}
        </S.TitleGroup>
        <S.RefreshButton
          $spinning={isRefreshing}
          onClick={() => fetchFiles(true)}
          disabled={isRefreshing || !effectiveOrgName}
          title={t("dataeng.generalFiles.refresh")}
          aria-label={t("dataeng.generalFiles.refresh")}
        >
          <RefreshCw size={16} />
        </S.RefreshButton>
      </S.Header>

      {!effectiveOrgName && (
        <S.Empty>
          <S.EmptyIcon>&#128193;</S.EmptyIcon>
          <S.EmptyText>{t("dataeng.generalFiles.noOrg")}</S.EmptyText>
          <S.OrgInputInline
            type="text"
            placeholder={t("dataeng.generalFiles.orgPlaceholder")}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </S.Empty>
      )}

      {error && (
        <S.ErrorMessage>
          {error}
          <S.RetryButton onClick={() => fetchFiles()}>
            {t("dataeng.generalFiles.retry")}
          </S.RetryButton>
        </S.ErrorMessage>
      )}

      {!error && effectiveOrgName && !hasFetched && (
        <S.LoadingWrapper>
          <S.Spinner />
          <S.LoadingText>{t("dataeng.generalFiles.loading")}</S.LoadingText>
        </S.LoadingWrapper>
      )}

      {!error && effectiveOrgName && hasFetched && files.length === 0 && (
        <S.Empty>
          <S.EmptyIcon>&#128193;</S.EmptyIcon>
          <S.EmptyText>{t("dataeng.generalFiles.empty")}</S.EmptyText>
        </S.Empty>
      )}

      {files.length > 0 && (
        <S.Grid>
          {pageCards.map((file, index) => (
            <S.Card
              key={file.id}
              $index={index}
              role="button"
              tabIndex={0}
              aria-haspopup="dialog"
              aria-label={`${file.file_name} - ${t(
                file.status === "processed"
                  ? "dataeng.generalFiles.statusProcessed"
                  : file.status === "unsupported"
                  ? "dataeng.generalFiles.statusUnsupported"
                  : "dataeng.generalFiles.statusUnknown"
              )}`}
              onClick={() => openDetail(file.id)}
              onKeyDown={(e) => handleCardKeyDown(e, file.id)}
            >
              <S.CardLeft>
                <S.ExtensionTile $extension={file.file_extension}>
                  {file.file_extension.slice(0, 4).toUpperCase()}
                </S.ExtensionTile>
                <S.CardInfo>
                  <S.FileName>{file.file_name}</S.FileName>
                  <S.FileMeta>
                    <S.MetaTag $noDot>{formatBytes(file.file_size)}</S.MetaTag>
                    {file.row_count > 0 && (
                      <S.MetaTag>
                        {t(
                          file.row_count === 1
                            ? "dataeng.generalFiles.rowsOne"
                            : "dataeng.generalFiles.rowsMany",
                          { count: file.row_count }
                        )}
                      </S.MetaTag>
                    )}
                    {file.columns.length > 0 && (
                      <S.MetaTag>
                        {file.columns.length} {t("dataeng.generalFiles.columns")}
                      </S.MetaTag>
                    )}
                    <S.MetaTag>
                      {t("dataeng.generalFiles.created", {
                        date: formatDate(file.created_at, t, locale),
                      })}
                    </S.MetaTag>
                    {file.truncated && (
                      <S.MetaTag>{t("dataeng.generalFiles.truncated")}</S.MetaTag>
                    )}
                  </S.FileMeta>
                </S.CardInfo>
              </S.CardLeft>
              <S.CardRight>
                <S.StatusBadge $status={file.status}>
                  {t(
                    file.status === "processed"
                      ? "dataeng.generalFiles.statusProcessed"
                      : file.status === "unsupported"
                      ? "dataeng.generalFiles.statusUnsupported"
                      : "dataeng.generalFiles.statusUnknown"
                  )}
                </S.StatusBadge>
                <S.Chevron>
                  <ChevronRight size={16} />
                </S.Chevron>
              </S.CardRight>
            </S.Card>
          ))}
        </S.Grid>
      )}

      {files.length > 0 && (
        <Pagination
          page={cardPage}
          pageCount={cardPages}
          onPageChange={setCardPage}
          totalItems={files.length}
          pageSize={CARD_PAGE_SIZE}
          infoKey="dataeng.generalFiles.showingFiles"
        />
      )}

      {detail && (
        <S.Overlay onClick={closeDetail}>
          <S.Modal
            role="dialog"
            aria-modal="true"
            aria-label={detail.file_name}
            onClick={(e) => e.stopPropagation()}
          >
            <S.ModalHeader>
              <S.ModalTitleGroup>
                <S.ExtensionTile $extension={detail.file_extension}>
                  {detail.file_extension.slice(0, 4).toUpperCase()}
                </S.ExtensionTile>
                <S.ModalTitleBlock>
                  <S.ModalTitle>{detail.file_name}</S.ModalTitle>
                  <S.ModalMeta>
                    <S.MetaTag $noDot>{formatBytes(detail.file_size)}</S.MetaTag>
                    {detail.row_count > 0 && (
                      <S.MetaTag>
                        {t(
                          detail.row_count === 1
                            ? "dataeng.generalFiles.rowsOne"
                            : "dataeng.generalFiles.rowsMany",
                          { count: detail.row_count }
                        )}
                      </S.MetaTag>
                    )}
                    <S.MetaTag>
                      {t("dataeng.generalFiles.created", {
                        date: formatDate(detail.created_at, t, locale),
                      })}
                    </S.MetaTag>
                    {detail.truncated && (
                      <S.MetaTag>
                        {t("dataeng.generalFiles.truncatedNote")}
                      </S.MetaTag>
                    )}
                  </S.ModalMeta>
                </S.ModalTitleBlock>
              </S.ModalTitleGroup>
              <S.CloseButton
                ref={closeButtonRef}
                onClick={closeDetail}
                aria-label={t("dataeng.generalFiles.close")}
                title={t("dataeng.generalFiles.close")}
              >
                <X size={18} />
              </S.CloseButton>
            </S.ModalHeader>

            <S.ModalBody>
              {isDetailLoading ? (
                <S.LoadingWrapper>
                  <S.Spinner />
                  <S.LoadingText>
                    {t("dataeng.generalFiles.loadingDetail")}
                  </S.LoadingText>
                </S.LoadingWrapper>
              ) : detailError ? (
                <S.ErrorMessage>
                  {detailError}
                  <S.RetryButton onClick={() => openDetail(detail.id)}>
                    {t("dataeng.generalFiles.retry")}
                  </S.RetryButton>
                </S.ErrorMessage>
              ) : detail.rows.length === 0 ? (
                <S.Empty>
                  <S.EmptyIcon>&#128193;</S.EmptyIcon>
                  <S.EmptyText>{t("dataeng.generalFiles.noData")}</S.EmptyText>
                </S.Empty>
              ) : (
                <>
                  <S.SearchToolbar>
                    <S.SearchBox>
                      <S.SearchIcon>
                        <Search size={15} />
                      </S.SearchIcon>
                      <S.SearchInput
                        type="text"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder={t("dataeng.generalFiles.searchPlaceholder")}
                        aria-label={t("dataeng.generalFiles.searchPlaceholder")}
                      />
                      {search && (
                        <S.ClearSearchButton
                          onClick={() => handleSearchChange("")}
                          aria-label={t("dataeng.generalFiles.clearSearch")}
                          title={t("dataeng.generalFiles.clearSearch")}
                        >
                          <X size={14} />
                        </S.ClearSearchButton>
                      )}
                    </S.SearchBox>
                    {normalizedSearch && filteredRows.length > 0 && (
                      <S.SearchResultHint>
                        {t("dataeng.generalFiles.searchResults", {
                          count: filteredRows.length,
                        })}
                      </S.SearchResultHint>
                    )}
                  </S.SearchToolbar>

                  {filteredRows.length === 0 ? (
                    <S.Empty>
                      <S.EmptyIcon>&#128269;</S.EmptyIcon>
                      <S.EmptyText>
                        {t("dataeng.generalFiles.searchNoResults", {
                          query: search,
                        })}
                      </S.EmptyText>
                    </S.Empty>
                  ) : (
                    <>
                      <S.TableWrap>
                        <S.Table>
                          <S.THead>
                            <tr>
                              {detail.columns.map((col, i) => (
                                <S.Th key={`${col}-${i}`}>{col}</S.Th>
                              ))}
                            </tr>
                          </S.THead>
                          <tbody>
                            {pageRows.map((row, i) => (
                              <tr key={page * PAGE_SIZE + i}>
                                {detail.columns.map((col, j) => {
                                  const value = row[col];
                                  return (
                                    <S.Td key={`${col}-${j}`} $numeric={typeof value === "number"}>
                                      {formatCell(value, locale)}
                                    </S.Td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </S.Table>
                      </S.TableWrap>
                      {filteredPages > 1 && (
                        <S.Pagination>
                          <S.PaginationInfo>
                            {t("dataeng.generalFiles.showingRows", {
                              start: rowStart,
                              end: rowEnd,
                              count: filteredRows.length,
                            })}
                          </S.PaginationInfo>
                          <S.PaginationButtons>
                            <S.PaginationButton
                              onClick={() => setPage((p) => Math.max(0, p - 1))}
                              disabled={page === 0}
                            >
                              {t("dataeng.generalFiles.prev")}
                            </S.PaginationButton>
                            <S.PaginationButton
                              onClick={() =>
                                setPage((p) => Math.min(filteredPages - 1, p + 1))
                              }
                              disabled={page >= filteredPages - 1}
                            >
                              {t("dataeng.generalFiles.next")}
                            </S.PaginationButton>
                          </S.PaginationButtons>
                        </S.Pagination>
                      )}
                    </>
                  )}
                </>
              )}
            </S.ModalBody>
          </S.Modal>
        </S.Overlay>
      )}
    </S.Wrapper>
  );
}
