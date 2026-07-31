import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { OrganizationService } from "@/services/organization_service";

const service = new OrganizationService();

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (searchParams.has("cnpj") && action !== "validate-cnpj") {
      const org = await service.getByCNPJ(searchParams.get("cnpj"));
      if (!org) return NextResponse.json({ error: "organization not found" }, { status: 404 });
      return NextResponse.json(org, { status: 200 });
    }

    if (searchParams.has("ein") && action !== "validate-ein") {
      const org = await service.getByEIN(searchParams.get("ein"));
      if (!org) return NextResponse.json({ error: "organization not found" }, { status: 404 });
      return NextResponse.json(org, { status: 200 });
    }

    if (action === "validate-cnpj") {
      const cnpj = searchParams.get("cnpj");
      if (!cnpj) return NextResponse.json({ error: "cnpj is required" }, { status: 400 });
      const result = await service.validateCNPJ(cnpj);
      return NextResponse.json(result, { status: 200 });
    }

    if (action === "validate-ein") {
      const ein = searchParams.get("ein");
      if (!ein) return NextResponse.json({ error: "ein is required" }, { status: 400 });
      const result = await service.validateEIN(ein);
      return NextResponse.json(result, { status: 200 });
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("page_size") || "100", 10);

    if (searchParams.has("search")) {
      const q = searchParams.get("search");
      const result = await service.search(q, { page, pageSize });
      return NextResponse.json(result, { status: 200 });
    }

    if (searchParams.has("q")) {
      const q = searchParams.get("q");
      const result = await service.getByName(q, { page, pageSize });
      return NextResponse.json(result, { status: 200 });
    }

    const result = await service.getAll({ page, pageSize });
    return NextResponse.json(result, { status: 200 });
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

    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const org = await service.create({
      name: body.name,
      address: body.address || null,
      cnpj: body.cnpj || null,
      ein: body.ein || null,
    });

    return NextResponse.json(org, { status: 201 });
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
