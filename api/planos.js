import { sql } from "../lib/db.js";

export default async function handler(req, res) {
    try {

        if (req.method !== "GET") {
            return res.status(405).json({
                sucesso: false,
                mensagem: "Método não permitido"
            });
        }

        const resultado = await sql`
            SELECT
                id,
                nome,
                descricao,
                preco_mensal,
                produtos_limite,
                clientes_limite,
                fornecedores_limite,
                usuarios_limite,
                vendas_mes_limite,
                ativo
            FROM planos
            WHERE ativo = true
            ORDER BY preco_mensal ASC
        `;

        return res.status(200).json({
            sucesso: true,
            planos: resultado.rows
        });

    } catch (erro) {

        console.error(erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno do servidor"
        });
    }
}