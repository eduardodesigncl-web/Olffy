import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const migrationsDirectory = path.join(repositoryRoot, "supabase", "migrations");

const expectedMigrations = [
  [
    "20260609212048_create_loyalty_points_base.sql",
    "9e1cdf28f5a03d401291baa5781635ff",
  ],
  ["20260609223954_expand_loyalty_mvp.sql", "7abf42b081930b97c86c87e4fb973403"],
  [
    "20260610210216_add_physical_sales_pos_shopify.sql",
    "edd9fbbe982f38ca45db2d4c31fb0c1a",
  ],
  [
    "20260610210811_add_physical_sale_attempt_fk_index.sql",
    "100ab140136064bf04fc6d1bba324ef9",
  ],
  [
    "20260613094615_add_customer_account_dashboard.sql",
    "7c80eb84486eff4b1340b8deb11c0ebc",
  ],
  [
    "20260613095158_restrict_customer_redemption_codes.sql",
    "1e46f948335a16822d7231e6523f8635",
  ],
  [
    "20260615161412_connect_reward_redemptions_to_shopify_discounts.sql",
    "6faf7765f749606847d7b429992afe2a",
  ],
  [
    "20260628230328_add_production_transaction_pipeline.sql",
    "1bdd48a67b9c9d3f17b0d899e67ce831",
  ],
  [
    "20260709155049_add_digital_sales_admin.sql",
    "a6ac8a6258bf533685595833552861a8",
  ],
  [
    "20260710130000_versioned_loyalty_rules.sql",
    "011a582eac0f8a0042695c0441d908ac",
  ],
  [
    "20260711120000_eligible_total_physical_sale.sql",
    "5f0638c5263a539f837daf5b57327cb1",
  ],
  [
    "20260711130000_loyalty_points_expiration.sql",
    "b64f4ea3b7d5a5037bdc8901a9ff18b8",
  ],
  [
    "20260711140000_guest_pending_claims.sql",
    "d43ab86eefad975dae7a0a81ad01e4fc",
  ],
  [
    "20260712120000_fix_lot_remaining_cast.sql",
    "963f62ce1410a70423c94866a11fadf0",
  ],
  [
    "20260712214622_create_admin_accounts_permissions.sql",
    "ed036cd5ba7046e46d96048f356a15ef",
  ],
  [
    "20260717163746_add_customer_support_chat.sql",
    "eccf2c1946662b20c06af840861c7ab1",
  ],
  [
    "20260717164925_add_support_admin_account_index.sql",
    "9281c11155a3fb788e718f7ac5ff471e",
  ],
  [
    "20260717213432_upgrade_customer_support_center.sql",
    "4aaab10af1fbaf95dcc259023da3b4d9",
  ],
  [
    "20260717220252_archive_support_conversations.sql",
    "a63c0a8a83cf5c464931e9e46a0e17ed",
  ],
  [
    "20260717221925_present_information_requests_as_agent_messages.sql",
    "bfae5c7e722a8b3e422c394eb2149109",
  ],
];

function canonicalizeMigration(contents) {
  return contents.replaceAll("\r\n", "\n").replace(/\n+$/u, "");
}

function checksum(contents) {
  return createHash("md5")
    .update(canonicalizeMigration(contents), "utf8")
    .digest("hex");
}

async function verifyMigrations() {
  const actualFiles = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const expectedFiles = expectedMigrations.map(([file]) => file);
  const failures = [];

  const missing = expectedFiles.filter((file) => !actualFiles.includes(file));
  const unexpected = actualFiles.filter(
    (file) => !expectedFiles.includes(file),
  );

  if (missing.length > 0) {
    failures.push(`Migraciones faltantes: ${missing.join(", ")}`);
  }

  if (unexpected.length > 0) {
    failures.push(`Migraciones inesperadas: ${unexpected.join(", ")}`);
  }

  for (const [file, expectedChecksum] of expectedMigrations) {
    if (!actualFiles.includes(file)) {
      continue;
    }

    const contents = await readFile(
      path.join(migrationsDirectory, file),
      "utf8",
    );
    const actualChecksum = checksum(contents);

    if (actualChecksum !== expectedChecksum) {
      failures.push(
        `${file}: checksum ${actualChecksum}; esperado ${expectedChecksum}`,
      );
    }
  }

  if (failures.length > 0) {
    console.error("El historial local de Supabase no coincide con el canon:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Historial Supabase verificado: ${expectedMigrations.length} migraciones canónicas.`,
  );
}

await verifyMigrations();
