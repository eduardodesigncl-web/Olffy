import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import path from "node:path";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const migrationsDirectory = path.join(repositoryRoot, "supabase", "migrations");
const bootstrapFile = path.join(
  repositoryRoot,
  "supabase",
  "tests",
  "bootstrap.sql",
);
const databaseUrl = process.env.DATABASE_URL;
const psql = process.env.PSQL_BIN || "psql";

if (!databaseUrl) {
  console.error("DATABASE_URL es obligatoria para el replay de migraciones.");
  process.exit(1);
}

function sanitize(output) {
  return String(output || "").replaceAll(databaseUrl, "<DATABASE_URL>");
}

function runPsql(arguments_, label) {
  const result = spawnSync(
    psql,
    [
      databaseUrl,
      "--no-psqlrc",
      "--quiet",
      "--set",
      "ON_ERROR_STOP=1",
      ...arguments_,
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        PGCONNECT_TIMEOUT: "10",
      },
    },
  );

  if (result.error || result.status !== 0) {
    const details = [result.error?.message, result.stdout, result.stderr]
      .filter(Boolean)
      .map(sanitize)
      .join("\n");
    throw new Error(`${label} falló.\n${details}`);
  }

  return result.stdout.trim();
}

runPsql(["--file", bootstrapFile], "Bootstrap local de Supabase");

const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of migrationFiles) {
  const match = /^(\d{14})_([a-z0-9_]+)\.sql$/u.exec(file);
  if (!match) {
    throw new Error(`Nombre de migración inválido: ${file}`);
  }

  const [, version, name] = match;
  runPsql(
    ["--single-transaction", "--file", path.join(migrationsDirectory, file)],
    file,
  );
  runPsql(
    [
      "--command",
      `insert into supabase_migrations.schema_migrations
         (version, statements, name)
       values ('${version}', null, '${name}')`,
    ],
    `Registro ${version}`,
  );
  console.log(`PASS ${file}`);
}

const validation = runPsql(
  [
    "--tuples-only",
    "--no-align",
    "--field-separator",
    "|",
    "--command",
    `select
       (select count(*) from supabase_migrations.schema_migrations),
       to_regclass('public.loyalty_customers') is not null,
       to_regclass('public.physical_sales') is not null,
       to_regclass('public.olffy_order_refs') is not null,
       to_regclass('public.loyalty_pending_claims') is not null,
       to_regclass('public.admin_accounts') is not null,
       to_regclass('public.support_conversations') is not null,
       to_regclass('public.support_messages') is not null,
       to_regprocedure('public.loyalty_lot_remaining(bigint)') is not null,
       pg_get_function_result(
         to_regprocedure('public.loyalty_lot_remaining(bigint)')
       ) like '%remaining bigint%',
       not exists (
         select 1
         from pg_class
         join pg_namespace on pg_namespace.oid = pg_class.relnamespace
         where pg_namespace.nspname = 'public'
           and pg_class.relkind = 'r'
           and not pg_class.relrowsecurity
       )`,
  ],
  "Validación final",
);

runPsql(
  [
    "--command",
    "select * from public.loyalty_lot_remaining(999999999) limit 1",
  ],
  "Smoke test loyalty_lot_remaining",
);

if (validation !== "20|t|t|t|t|t|t|t|t|t|t") {
  throw new Error(`Resultado de replay inesperado: ${validation}`);
}

console.log("REPLAY_OK: 20 migraciones aplicadas sobre PostgreSQL limpio.");
