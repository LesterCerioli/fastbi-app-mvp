import { cookies } from "next/headers";

const SESSION_COOKIE = "fastbi_org_name";

export async function getOrganizationName(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value || null;
}

export async function setOrganizationCookie(name: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}