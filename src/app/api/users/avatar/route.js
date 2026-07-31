import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getAvatarUrl, saveAvatarUrl } from "@/services/dynamodb/userProfiles";
import { uploadToS3 } from "@/services/s3/upload";

export async function GET(request) {
  try {
    await authenticate(request);
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const avatar_url = await getAvatarUrl(userId);
    return NextResponse.json({ avatar_url });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message || "Failed to fetch avatar" }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await authenticate(request);
    const formData = await request.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");

    if (!file || !userId) {
      return NextResponse.json({ error: "File and userId are required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const key = `avatars/${userId}/${Date.now()}.${ext}`;
    const avatar_url = await uploadToS3(buffer, key, file.type);

    await saveAvatarUrl(userId, avatar_url);

    return NextResponse.json({ avatar_url });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message || "Failed to upload avatar" }, { status: 400 });
  }
}
