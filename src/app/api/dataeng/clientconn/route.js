import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { ClientConnectionService } from "@/services/data_engineering/client_connection_service";
import { EncryptionService } from "@/services/data_engineering/encryption_service";

const encryptionService = new EncryptionService();
const clientConnService = new ClientConnectionService(encryptionService);

export async function POST(request) {
  try {
    await authenticate(request);

    const body = await request.json().catch(() => ({}));
    const { action, ...data } = body;

    if (action === "query") {
      const result = await clientConnService.executeQuery(
        data.organization_name, data.connection_id, data.query, data.params
      );
      return NextResponse.json(result, { status: 200 });
    }

    if (action === "test") {
      const result = await clientConnService.testConnection(data.connection_id);
      return NextResponse.json(result, { status: 200 });
    }

    const result = await clientConnService.registerOrganizationConnection(
      data.organization_name, data.connection_name, data.host, data.port,
      data.database_name, data.username, data.password, data.db_type,
      data.ssl_mode, data.max_rows_limit, data.query_timeout_seconds
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("connection_id");
    const organizationName = searchParams.get("organization_name");
    const action = searchParams.get("action");

    if (action === "statistics" && organizationName) {
      const result = await clientConnService.getOrganizationConnectionStatistics(organizationName);
      return NextResponse.json(result, { status: 200 });
    }

    if (action === "name" && organizationName) {
      const connectionName = searchParams.get("connection_name");
      if (!connectionName) {
        return NextResponse.json({ error: "connection_name is required" }, { status: 400 });
      }
      const id = await clientConnService.getConnectionIDByName(organizationName, connectionName);
      return NextResponse.json({ connection_id: id }, { status: 200 });
    }

    if (connectionId) {
      const config = await clientConnService.getConnectionConfig(connectionId);
      if (!config) {
        return NextResponse.json({ error: "Connection not found or inactive" }, { status: 404 });
      }
      return NextResponse.json(config, { status: 200 });
    }

    if (organizationName) {
      const connections = await clientConnService.getOrganizationConnections(organizationName);
      return NextResponse.json(connections, { status: 200 });
    }

    return NextResponse.json({ error: "connection_id or organization_name is required" }, { status: 400 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("connection_id");

    if (!connectionId) {
      return NextResponse.json({ error: "connection_id is required" }, { status: 400 });
    }

    const deleted = await clientConnService.deleteConnection(connectionId);
    if (!deleted) {
      return NextResponse.json({ error: "Connection not found or already inactive" }, { status: 404 });
    }

    return NextResponse.json({ message: "Connection deleted", connection_id: connectionId }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
