import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  try {
    const redirectTo = req.query?.redirect_to;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: redirectTo
        ? { redirectTo: String(redirectTo) }
        : undefined
    });

    if (error || !data?.url) {
      return res.status(400).json({
        ok: false,
        error: error?.message || "Google Login não está configurado no Supabase."
      });
    }

    return res.status(200).json({
      ok: true,
      url: data.url
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Erro ao iniciar Login Google.",
      details: error?.message
    });
  }
}
