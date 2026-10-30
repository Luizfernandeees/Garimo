import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { env, isSupabaseConfigured } from "@/lib/env";

// Renova a sessão do Supabase e bloqueia o painel para quem não está
// logado. A verificação de "é admin?" acontece no layout do painel e,
// principalmente, nas políticas RLS do banco.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!isSupabaseConfigured) {
    return isLoginPage ? response : redirectToLogin(request);
  }

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Valida a assinatura do token (não confia cegamente no cookie).
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims?.sub);

  if (!isLoggedIn && !isLoginPage) {
    return redirectToLogin(request, response);
  }

  return response;
}

function redirectToLogin(request: NextRequest, carry?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  const redirect = NextResponse.redirect(url);
  carry?.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
