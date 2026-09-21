import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Defina SUPABASE_URL e SUPABASE_ANON_KEY nas variáveis de ambiente.");
}

const supabase = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  try {
    const { email, password } = req.body ?? {};
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ ok: false, error: "Email e senha são obrigatórios." });
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: String(password)
      });

    if (authError || !authData.user || !authData.session) {
      return res.status(401).json({
        ok: false,
        error: authError?.message || "Email ou senha inválidos."
      });
    }

    // Usa o JWT recém-criado para respeitar as políticas RLS da tabela usuarios.
    const authenticatedClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });

    const { data: user, error: userError } = await authenticatedClient
      .from("usuarios")
      .select("id,nome,email,perfil,empresa_id,ativo")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userError) {
      return res.status(500).json({
        ok: false,
        error: "Não foi possível consultar o usuário do Lazer Gest.",
        details: userError.message
      });
    }

    if (!user) {
      return res.status(403).json({
        ok: false,
        error: "Usuário autenticado, mas sem cadastro no Lazer Gest.",
        auth_user_id: authData.user.id
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
      user,
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
