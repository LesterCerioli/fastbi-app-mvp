import { validateToken } from "@/services/auth_service";

export async function authenticate(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("token not found or expired");
  }
  const token = authHeader.slice(7);
  await validateToken(token);
}
