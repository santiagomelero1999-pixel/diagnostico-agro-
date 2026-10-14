export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).end();

    const { to, company, stage, total, dimScores, grupo, grupoBenchmark } = req.body || {};

    // Solo enviar si es un email válido
    if (!to || !to.includes('@') || !to.includes('.')) {
        return res.status(200).json({ skipped: true, reason: 'no valid email' });
    }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
        return res.status(200).json({ skipped: true, reason: 'no api key configured' });
    }

    const stageColors = {
        CONFIANZA: '#E53935', ANÁLISIS: '#FB8C00',
        DELEGACIÓN: '#1565C0', PERSPECTIVA: '#2E7D32'
    };
    const stageColor = stageColors[stage] || '#004D2C';

    const dimRows = (dimScores || []).map(d => {
        const pct = Math.round((d.score / 20) * 100);
        const color = d.score < 8 ? '#E53935' : d.score < 14 ? '#FB8C00' : '#43A047';
        return `
        <tr>
            <td style="padding:6px 12px;font-size:13px;color:#444;width:130px;">${d.name}</td>
            <td style="padding:6px 12px;">
                <div style="background:#eee;border-radius:4px;height:10px;width:200px;">
                    <div style="background:${color};height:10px;border-radius:4px;width:${pct}%;"></div>
                </div>
            </td>
            <td style="padding:6px 12px;font-size:13px;font-weight:700;color:${color};">${d.score}/20</td>
        </tr>`;
    }).join('');

    const groupSection = (grupoBenchmark && grupo) ? `
        <div style="background:#FFF8E1;border:1px solid #F9A825;padding:16px 20px;margin-top:20px;border-radius:4px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F9A825;margin-bottom:8px;">
                Comparativa — Grupo ${grupo}
            </div>
            <p style="margin:0;font-size:14px;color:#555;">
                Tu puntaje: <strong style="color:#333;">${total}/80</strong> &nbsp;·&nbsp;
                Promedio del grupo (n=${grupoBenchmark.n}): <strong style="color:#333;">${grupoBenchmark.avgScore}/80</strong>
            </p>
        </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px;width:100%;">

    <!-- Header -->
    <tr><td style="background:#004D2C;padding:28px 36px;">
        <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:4px;">Diagnóstico de Madurez Organizacional</div>
        <div style="font-size:22px;font-weight:700;color:#fff;">${company || 'Tu empresa'}</div>
    </td></tr>

    <!-- Stage pill -->
    <tr><td style="padding:28px 36px 0;">
        <div style="display:inline-block;background:${stageColor};color:#fff;font-size:11px;font-weight:700;
             letter-spacing:2px;text-transform:uppercase;padding:5px 14px;margin-bottom:16px;">
            ${stage}
        </div>
        <div style="font-size:32px;font-weight:900;color:#004D2C;line-height:1;margin-bottom:8px;">
            ${total} <span style="font-size:18px;font-weight:400;color:#888;">/ 80</span>
        </div>
        <p style="font-size:14px;color:#666;margin:0 0 24px;line-height:1.6;">
            Este es tu diagnóstico de madurez organizacional. Los resultados reflejan el estado actual de tu empresa en las 4 dimensiones clave.
        </p>
    </td></tr>

    <!-- Dimension scores -->
    <tr><td style="padding:0 36px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
             color:#004D2C;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #eee;">
            Resultados por dimensión
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
            ${dimRows}
        </table>
    </td></tr>

    ${groupSection ? `<tr><td style="padding:0 36px 24px;">${groupSection}</td></tr>` : ''}

    <!-- Footer -->
    <tr><td style="background:#f9f9f9;padding:16px 36px;border-top:1px solid #eee;">
        <p style="margin:0;font-size:12px;color:#bbb;line-height:1.6;">
            Diagnóstico de Madurez Organizacional para PyMEs agropecuarias.
        </p>
    </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Diagnóstico Organizacional <onboarding@resend.dev>',
            reply_to: 'santiagomelero1999@gmail.com',
            to: [to],
            subject: `Tu diagnóstico organizacional — ${stage} (${total}/80)`,
            html
        })
    });

    const data = await r.json();
    return res.status(r.ok ? 200 : 500).json(data);
}
