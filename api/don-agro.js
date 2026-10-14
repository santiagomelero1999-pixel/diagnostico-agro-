/**
 * Don Agro — proxy del asistente conversacional.
 *
 * La clave de Groq vive como variable de entorno en Vercel y nunca viaja
 * al navegador. El cliente manda la pregunta y el contexto agregado; esta
 * funcion le agrega la credencial y reenvia el pedido a Groq.
 *
 * Configurar en Vercel: Settings -> Environment Variables -> GROQ_API_KEY
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Método no permitido' } });
    }

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
        return res.status(500).json({
            error: { message: 'Falta configurar GROQ_API_KEY en las variables de entorno de Vercel.' }
        });
    }

    try {
        const { systemMsg, question, model, max_tokens } = req.body || {};
        if (!question) {
            return res.status(400).json({ error: { message: 'Falta la pregunta.' } });
        }

        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + GROQ_KEY
            },
            body: JSON.stringify({
                model: model || 'openai/gpt-oss-120b',
                messages: [
                    { role: 'system', content: systemMsg || 'Sos un experto en organizaciones agropecuarias argentinas.' },
                    { role: 'user',   content: question }
                ],
                max_tokens: max_tokens || 900
            })
        });

        const data = await r.json();
        return res.status(r.ok ? 200 : r.status).json(data);
    } catch (e) {
        return res.status(500).json({ error: { message: 'No se pudo consultar al modelo: ' + e.message } });
    }
}
