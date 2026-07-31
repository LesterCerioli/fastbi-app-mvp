import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/services/db";
import { authenticate } from "@/lib/api-auth";

export async function POST(request) {
  try {
    await authenticate(request);
    const body = await request.json();
    const { token, newPassword, confirmPassword } = body;

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Token, new password and confirm password are required" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const userResult = await query(
      `SELECT id, name, email FROM public.users
       WHERE reset_token = $1 AND reset_token_expires_at > NOW() AND deleted_at IS NULL
       LIMIT 1`,
      [token]
    );

    if (!userResult.rows[0]) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 410 });
    }

    const user = userResult.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE public.users
       SET password = $1, reset_token = NULL, reset_token_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    return NextResponse.json({ message: "Password changed successfully" }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
