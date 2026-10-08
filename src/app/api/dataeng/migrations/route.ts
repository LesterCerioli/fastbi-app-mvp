import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { MigrationService } from "@/services/data_engineering/migration_service";
import { ClientConnectionService } from "@/services/data_engineering/client_connection_service";
import { EncryptionService } from "@/services/data_engineering/encryption_service";

let cachedMigrationService: MigrationService | null = null;

async function getMigrationService(): Promise<MigrationService> {
  if (!cachedMigrationService) {
    const encryptionService = new EncryptionService();
    const clientConnService = new ClientConnectionService(encryptionService);
    cachedMigrationService = new MigrationService(clientConnService, encryptionService);
  }
  return cachedMigrationService;
}

export async function POST(request: Request) {
  try {
    await authenticate(request);
    const migrationService = await getMigrationService();

    const body = await request.json().catch(() => ({}));
    const { action, migration_id, ...data } = body;

    if (action === "start" && migration_id) {
      await migrationService.startMigration(migration_id);
      const migration = await migrationService.getMigration(migration_id);
      return NextResponse.json(migration, { status: 200 });
    }

    if (action === "cancel" && migration_id) {
      const cancelled = await migrationService.cancelMigration(migration_id);
      return NextResponse.json({ success: cancelled }, { status: 200 });
    }

    if (action === "retry" && migration_id) {
      await migrationService.retryMigration(migration_id);
      const migration = await migrationService.getMigration(migration_id);
      return NextResponse.json(migration, { status: 200 });
    }

    const { organization_name, source_connection_id, target_connection_id, options } = data;

    if (!organization_name || !source_connection_id || !target_connection_id) {
      return NextResponse.json(
        { error: "organization_name, source_connection_id, and target_connection_id are required" },
        { status: 400 }
      );
    }

    const migration = await migrationService.createMigration({
      organization_name,
      source_connection_id,
      target_connection_id,
      options,
    });

    return NextResponse.json(migration, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    await authenticate(request);
    const migrationService = await getMigrationService();

    const { searchParams } = new URL(request.url);
    const migrationId = searchParams.get("migration_id");
    const organizationName = searchParams.get("organization_name");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (migrationId) {
      const migration = await migrationService.getMigration(migrationId);
      if (!migration) {
        return NextResponse.json({ error: "Migration not found" }, { status: 404 });
      }
      return NextResponse.json(migration, { status: 200 });
    }

    if (organizationName) {
      const result = await migrationService.getMigrationHistory(organizationName, { status: status || undefined, limit, offset });
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json({ error: "organization_name or migration_id is required" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}