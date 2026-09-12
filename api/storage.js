import { supabaseAdmin, STORAGE_BUCKET, sanitizePath, publicStorageUrl } from "./lib/storage.js";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { action = "upload", path, fileBase64, contentType = "application/octet-stream", upsert = true } = req.body || {};

      if (!path) return res.status(400).json({ sucesso: false, mensagem: "path é obrigatório" });
      const cleanPath = sanitizePath(path);

      if (action === "upload") {
        if (!fileBase64) return res.status(400).json({ sucesso: false, mensagem: "fileBase64 é obrigatório" });
        const file = Buffer.from(fileBase64, "base64");
        const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(cleanPath, file, {
          contentType,
          upsert
        });
        if (error) throw error;
        return res.status(200).json({ sucesso: true, bucket: STORAGE_BUCKET, path: cleanPath, url: publicStorageUrl(cleanPath) });
      }

      if (action === "signed-upload") {
        const { data, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).createSignedUploadUrl(cleanPath);
        if (error) throw error;
        return res.status(200).json({ sucesso: true, bucket: STORAGE_BUCKET, path: cleanPath, token: data.token, signedUrl: data.signedUrl });
      }

      if (action === "delete") {
        const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([cleanPath]);
        if (error) throw error;
        return res.status(200).json({ sucesso: true, path: cleanPath });
      }

      return res.status(400).json({ sucesso: false, mensagem: "Ação inválida" });
    }

    if (req.method === "GET") {
      const path = sanitizePath(req.query?.path);
      if (!path) return res.status(400).json({ sucesso: false, mensagem: "path é obrigatório" });
      return res.status(200).json({ sucesso: true, bucket: STORAGE_BUCKET, path, url: publicStorageUrl(path) });
    }

    return res.status(405).json({ sucesso: false, mensagem: "Método não permitido" });
  } catch (error) {
    console.error("Supabase Storage:", error);
    return res.status(500).json({ sucesso: false, mensagem: error?.message || "Erro no Supabase Storage" });
  }
}
