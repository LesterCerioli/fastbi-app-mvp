import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { OrganizationService } from "@/services/organization_service";
import { query } from "@/services/db";

const service = new OrganizationService();

async function resolveOrganizationID(name) {
  const result = await query(
    `SELECT id FROM public.organizations WHERE name = $1 AND deleted_at IS NULL`,
    [name]
  );
  return result.rows[0]?.id || null;
}

export async function GET(request, { params }) {
  try {
    await authenticate(request);

    const { name } = await params;
    const { searchParams } = new URL(request.url);

    const id = await resolveOrganizationID(name);
    if (!id) return NextResponse.json({ error: "organization not found" }, { status: 404 });

    if (searchParams.get("action") === "statistics") {
      const org = await service.getByID(id);
      return NextResponse.json(org, { status: 200 });
    }

    const org = await service.getByID(id);
    if (!org) return NextResponse.json({ error: "organization not found" }, { status: 404 });

    return NextResponse.json(org, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  try {
    await authenticate(request);

    const { name } = await params;
    const body = await request.json().catch(() => ({}));

    const id = await resolveOrganizationID(name);
    if (!id) return NextResponse.json({ error: "organization not found" }, { status: 404 });

    const org = await service.update(id, {
      name: body.name,
      address: body.address,
      cnpj: body.cnpj,
      ein: body.ein,
    });

    if (!org) return NextResponse.json({ error: "organization not found" }, { status: 404 });
    return NextResponse.json(org, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await authenticate(request);

    const { name } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const id = await resolveOrganizationID(name);
    if (!id) return NextResponse.json({ error: "organization not found" }, { status: 404 });

    if (action === "deactivate") {
      const org = await service.deactivate(id);
      return NextResponse.json({ message: "Organization deactivated", name }, { status: 200 });
    }

    if (action === "reactivate") {
      const org = await service.reactivate(id);
      return NextResponse.json({ message: "Organization reactivated", name }, { status: 200 });
    }

    await service.delete(id);
    return NextResponse.json({ message: "Organization deleted", name }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message === "organization not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
