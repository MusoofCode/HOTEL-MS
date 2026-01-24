// Lovable Cloud Function: one-time admin bootstrap for this HMS.
// - GET: { hasAdmin: boolean }
// - POST: { email, password } -> creates the first admin user and assigns admin role

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Server not configured" }, 500);

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Public status check (safe; reveals only existence)
  if (req.method === "GET") {
    const { data, error } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    if (error) return json({ error: error.message }, 500);
    return json({ hasAdmin: (data?.length ?? 0) > 0 });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const password = (body?.password ?? "").toString();

  if (!isValidEmail(email)) return json({ error: "Invalid email" }, 400);
  if (password.length < 12) return json({ error: "Password must be at least 12 characters" }, 400);

  // One-time bootstrap guard
  const { data: existingAdmins, error: adminCheckErr } = await adminClient
    .from("user_roles")
    .select("id")
    .eq("role", "admin")
    .limit(1);

  if (adminCheckErr) return json({ error: adminCheckErr.message }, 500);
  if ((existingAdmins?.length ?? 0) > 0) return json({ error: "Admin already configured" }, 409);

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr || !created.user) return json({ error: createErr?.message ?? "Failed to create user" }, 500);

  const { error: roleErr } = await adminClient.from("user_roles").insert({
    user_id: created.user.id,
    role: "admin",
  });

  if (roleErr) return json({ error: roleErr.message }, 500);

  return json({ ok: true });
});
