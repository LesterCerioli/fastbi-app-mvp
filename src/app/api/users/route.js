import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { UserService } from "@/services/users/user_service";

const service = new UserService();

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);

    if (searchParams.has("date")) {
      const dateStr = searchParams.get("date");
      if (!dateStr) {
        return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
      }
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
      }

      if (searchParams.get("type") === "updated") {
        const users = await service.getByUpdatedAt(dateStr);
        if (users.length === 0) {
          return NextResponse.json({ error: "No users found updated on the provided date" }, { status: 404 });
        }
        return NextResponse.json(users, { status: 200 });
      }

      const users = await service.getByCreatedAt(dateStr);
      if (users.length === 0) {
        return NextResponse.json({ error: "No users found created on the provided date" }, { status: 404 });
      }
      return NextResponse.json(users, { status: 200 });
    }

    return NextResponse.json({ error: "Specify a query parameter (date)" }, { status: 400 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await authenticate(request);

    const body = await request.json().catch(() => ({}));

    if (!body.name || !body.email || !body.role) {
      return NextResponse.json({
        error: "Missing required fields: name, email, or role"
      }, { status: 400 });
    }

    if (!body.organization_id) {
      return NextResponse.json({ error: "Missing required field: organization_id" }, { status: 400 });
    }

    const userDTO = {
      organization_id: body.organization_id,
      name: body.name,
      email: body.email,
      role: body.role,
    };

    const userID = await service.create(userDTO);

    return NextResponse.json({
      id: userID,
      message: "User created successfully",
    }, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "email already exists") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
