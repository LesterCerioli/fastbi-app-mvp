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
    if (err.message === "token not found or expired" || err.message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    console.error("[avatar] Failed to fetch avatar:", err);
    return NextResponse.json({ error: "Failed to fetch avatar" }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await authenticate(request);
    const formData = await request.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");
    const organizationName = formData.get("organization_name");

    if (!file || !userId) {
      return NextResponse.json({ error: "File and userId are required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";

    let key;
    let avatar_url;
    if (organizationName) {
      key = `imports/${organizationName}/${Date.now()}_${file.name}`;
      avatar_url = await uploadToS3(buffer, key, file.type);
      return NextResponse.json({ file_url: avatar_url, organization_name: organizationName }, { status: 201 });
    }

    key = `avatars/${userId}/${Date.now()}.${ext}`;
    avatar_url = await uploadToS3(buffer, key, file.type);

    await saveAvatarUrl(userId, avatar_url);

    return NextResponse.json({ avatar_url });
  } catch (err) {
    if (err.message === "token not found or expired" || err.message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    console.error("[avatar] Failed to upload avatar:", err);
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 400 });
  }
}
