import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email e senha são obrigatórios." });
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: String(email).trim().toLowerCase(),
        password: String(password)
      });

    if (authError || !authData.user || !authData.session) {
      return res.status(401).json({
        ok: false,
        error: authError?.message || "Email ou senha inválidos."
      });
    }

    const authUserId = authData.user.id;
    const authEmail = authData.user.email?.toLowerCase() ?? String(email).trim().toLowerCase();

    let query = await supabase
      .from("usuarios")
      .select("id,nome,email,perfil,empresa_id,ativo")
      .eq("email", authEmail)
      .maybeSingle();

    if (query.error) {
      return res.status(500).json({
        ok: false,
        error: "Não foi possível consultar o usuário do Lazer Gest.",
        details: query.error.message
      });
    }

    if (!query.data) {
      return res.status(403).json({
        ok: false,
        error: "Usuário autenticado, mas sem cadastro no Lazer Gest.",
        auth_user_id: authUserId
      });
    }

    if (query.data.ativo === false) {
      return res.status(403).json({ ok: false, error: "Usuário inativo." });
    }

    if (!query.data.empresa_id) {
      return res.status(403).json({
        ok: false,
        error: "Usuário sem empresa associada. Contate o administrador."
      });
    }

    return res.status(200).json({
      ok: true,
      user: query.data,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        expires_in: authData.session.expires_in
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Erro interno no login.",
      details: error?.message
    });
  }
}
