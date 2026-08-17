"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as S from "./styles";
import { Users, Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "@/lib/i18n/useTranslations";

interface UserWithOrganization {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  organization_name: string;
}

async function getFreshToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token;
  } catch {
    return null;
  }
}

function getUserEmail(): string {
  try {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      return user.email || "";
    }
  } catch {
    return "";
  }
  return "";
}

const REFRESH_INTERVAL_MS = 8 * 60 * 60 * 1000;

export default function UserList() {
  const { t } = useTranslations();
  const [users, setUsers] = useState<UserWithOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const offset = (page - 1) * limit;
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(getUserEmail())}&limit=${limit}&offset=${offset}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data);
      const totalUsers = data.length < limit ? (page - 1) * limit + data.length : (page - 1) * limit + limit + 1;
      setTotalPages(Math.ceil(totalUsers / limit));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();

    intervalRef.current = setInterval(() => {
      fetchUsers();
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUsers]);

  const handleRefresh = () => {
    fetchUsers();
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  if (loading) {
    return (
      <S.LoadingContainer>
        <Loader2 size={18} className="spin" />
        {t("profile.userList.loading")}
      </S.LoadingContainer>
    );
  }

  if (error) {
    return (
      <S.ErrorContainer>
        <AlertCircle size={16} />
        <span>{error}</span>
        <S.RefreshButton onClick={handleRefresh}>
          <RefreshCw size={14} />
          {t("profile.userList.retry")}
        </S.RefreshButton>
      </S.ErrorContainer>
    );
  }

  if (users.length === 0) {
    return (
      <S.EmptyState>
        <Users size={18} />
        {t("profile.userList.noUsers")}
      </S.EmptyState>
    );
  }

  return (
    <S.Wrapper>
      <S.Card>
        <S.SectionTitle>
          <Users size={18} />
          {t("profile.userList.title")}
        </S.SectionTitle>

        <S.TableContainer>
          <S.Table>
            <S.Thead>
              <tr>
                <S.Th>{t("profile.userList.name")}</S.Th>
                <S.Th>{t("profile.userList.email")}</S.Th>
                <S.Th>{t("profile.userList.organization")}</S.Th>
                <S.Th>{t("profile.userList.status")}</S.Th>
              </tr>
            </S.Thead>
            <S.Tbody>
              {users.map((user) => (
                <S.Tr key={user.id}>
                  <S.Td>{user.name || "-"}</S.Td>
                  <S.Td>{user.email || "-"}</S.Td>
                  <S.Td>{user.organization_name || "-"}</S.Td>
                  <S.Td>
                    <S.StatusBadge $online={true}>
                      {t("profile.userList.online")}
                    </S.StatusBadge>
                  </S.Td>
                </S.Tr>
              ))}
            </S.Tbody>
          </S.Table>
        </S.TableContainer>

        {totalPages > 1 && (
          <S.PaginationContainer>
            <S.PaginationInfo>
              {t("profile.userList.pageInfo", { current: page, total: totalPages })}
            </S.PaginationInfo>
            <S.PaginationButtons>
              <S.PaginationButton $disabled={page === 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeft size={14} />
                {t("profile.userList.previous")}
              </S.PaginationButton>
              <S.PaginationButton $disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                {t("profile.userList.next")}
                <ChevronRight size={14} />
              </S.PaginationButton>
            </S.PaginationButtons>
          </S.PaginationContainer>
        )}
      </S.Card>
    </S.Wrapper>
  );
}