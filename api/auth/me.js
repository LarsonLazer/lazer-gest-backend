import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  if (!url || !anonKey) {
    return res.status(500).json({ ok: false, error: "Supabase não configurado." });
  }

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ ok: false, error: "Token ausente." });
  }

  try {
    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: authData, error: authError } = await client.auth.getUser(token);
    if (authError || !authData.user) {
      return res.status(401).json({ ok: false, error: "Sessão inválida." });
    }

    const email = authData.user.email?.toLowerCase();
    const { data: user, error } = await client
      .from("usuarios")
      .select("id,nome,email,perfil,empresa_id,ativo")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "Usuário autenticado, mas não cadastrado no Lazer Gest."
      });
    }

    if (user.ativo === false) {
      return res.status(403).json({ ok: false, error: "Usuário inativo." });
    }

    if (!user.empresa_id) {
      return res.status(403).json({
        ok: false,
        error: "Usuário sem empresa associada. Contate o administrador."
      });
    }

    return res.status(200).json({
      ok: true,
      user
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Erro ao validar sessão.",
      details: error?.message
    });
  }
}
