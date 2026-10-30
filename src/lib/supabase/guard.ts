import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Exige um usuário autenticado que esteja em admin_users.
// Usado no layout do painel e em toda server action administrativa.
export async function requireAdmin() {
  const supabase = await createClient();

  // getUser() consulta o servidor de Auth: confirma que a sessão é válida
  // e não foi revogada.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/admin/login");
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect("/admin/login?erro=sem-acesso");
  }

  return { supabase, user: userData.user };
}
