import { syncFourthwall, syncGumroad, type SyncResult } from '../lib/sync/catalog';

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FOURTHWALL_STOREFRONT_TOKEN',
  'GUMROAD_ACCESS_TOKEN',
] as const;

async function main(): Promise<void> {
  const missing = REQUIRED.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const results: SyncResult[] = [await syncFourthwall(), await syncGumroad()];

  let failed = false;
  for (const r of results) {
    console.log(`${r.source}: ${r.synced} synced, ${r.errors.length} error(s)`);
    for (const e of r.errors) {
      console.error(`  - ${e}`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
