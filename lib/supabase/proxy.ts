import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabasePublicConfig, getSupabasePublicConfig } from "./config";

export async function updateCustomerSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasSupabasePublicConfig()) {
    return response;
  }

  const { url, key } = getSupabasePublicConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}
