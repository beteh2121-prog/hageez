import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { DEFAULT_CURRENCY, isKnownCurrency, isStoreCurrency } from '@/lib/fourthwall/routes';

const PRODUCT_URL = /^\/([A-Za-z]{3})\/product\/([^/]+)\/?$/;

export async function middleware(request: NextRequest) {
  // /eur/product/x → /EUR/product/x; a real but unsupported code (SEK…) → /USD/…
  // Redirects keep ?color=…&size=… intact.
  const productMatch = PRODUCT_URL.exec(request.nextUrl.pathname);
  const requestedCurrency = productMatch?.[1];
  if (productMatch && requestedCurrency && isKnownCurrency(requestedCurrency)) {
    const upper = requestedCurrency.toUpperCase();
    const target = isStoreCurrency(upper) ? upper : DEFAULT_CURRENCY;
    if (target !== requestedCurrency) {
      const url = request.nextUrl.clone();
      url.pathname = `/${target}/product/${productMatch[2]}`;
      return NextResponse.redirect(url, 308);
    }
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
};
