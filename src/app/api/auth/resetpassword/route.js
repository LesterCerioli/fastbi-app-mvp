import { NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/services/db";
import { EmailSenderService } from "@/services/email_sender_service";
import { authenticate } from "@/lib/api-auth";

export async function POST(request) {
  try {
    await authenticate(request);
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const userResult = await query(
      `SELECT id, name, email FROM public.users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
      [email]
    );

    if (!userResult.rows[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await query(
      `UPDATE public.users SET reset_token = $1, reset_token_expires_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [token, expiresAt, user.id]
    );

    const baseUrl = process.env.BASE_URL || `https://fast-bi-app.vercel.app`;
    const resetLink = `${baseUrl}/reset-password/${token}`;

    const emailSender = new EmailSenderService();
    await emailSender.sendPasswordResetWithLink(user.name, user.email, resetLink);

    return NextResponse.json({ message: "Password reset email sent. Check your inbox." }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
