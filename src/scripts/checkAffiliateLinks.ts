import { createClient } from '@supabase/supabase-js';
import { buildAffiliateUrl } from '../lib/amazon/affiliate';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

interface BookRow {
  asin: string;
  title: string;
}

interface LinkCheckResult {
  status: number | null;
  dead: boolean;
}

// NOTE: Amazon often returns non-200 responses (soft blocks, CAPTCHA
// redirects) to automated traffic regardless of whether the ASIN is
// actually still valid. To avoid noisy false-positive failures, only a
// genuine 404 is treated as "dead" here; any other non-200 status is
// logged as a warning instead of failing the run.
async function checkLink(asin: string): Promise<LinkCheckResult> {
  try {
    const url = buildAffiliateUrl(asin);
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AffiliateLinkChecker/1.0)' },
    });
    return { status: response.status, dead: response.status === 404 };
  } catch {
    return { status: null, dead: true };
  }
}

async function main(): Promise<void> {
  const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

  const { data, error } = await supabase.from('kdp_books').select('asin, title').eq('is_published', true);

  if (error) {
    console.error('Failed to fetch books:', error.message);
    process.exit(1);
  }

  const books = (data ?? []) as BookRow[];
  const deadLinks: string[] = [];

  for (const book of books) {
    const result = await checkLink(book.asin);

    if (result.dead) {
      console.error(`✗ ${book.title} (${book.asin}) — likely removed (404 or unreachable)`);
      deadLinks.push(`${book.title} (${book.asin})`);
    } else if (result.status !== 200) {
      console.warn(`? ${book.title} (${book.asin}) — got status ${result.status}, may be a bot-block, not removed`);
    } else {
      console.log(`✓ ${book.title} (${book.asin})`);
    }
  }

  if (deadLinks.length > 0) {
    console.error(`\n${deadLinks.length} dead affiliate link(s) found:`);
    deadLinks.forEach((link) => console.error(`  - ${link}`));
    process.exit(1);
  }

  console.log(`\nChecked ${books.length} affiliate link(s). No confirmed dead links.`);
}

main();
