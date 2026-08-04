import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import {
  getGeneralFilesByOrganization,
  getGeneralFileById,
  GeneralFileNotFoundError,
  GeneralFileDetailNotFoundError,
} from "@/services/dynamodb/generalFiles";

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");
    const organizationName = searchParams.get("organization_name");

    if (fileId) {
      const file = await getGeneralFileById(fileId);
      return NextResponse.json(file, { status: 200 });
    }

    if (!organizationName) {
      return NextResponse.json(
        { error: "organization_name or id is required" },
        { status: 400 }
      );
    }

    const files = await getGeneralFilesByOrganization(organizationName);
    return NextResponse.json(files, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (err instanceof GeneralFileNotFoundError) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (err instanceof GeneralFileDetailNotFoundError) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
