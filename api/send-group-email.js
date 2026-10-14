export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).end();

    const { grupo, members, groupStats, dashboardUrl } = req.body || {};
    const RESEND_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_KEY) return res.status(200).json({ skipped: true, reason: 'no api key' });
    if (!grupo || !Array.isArray(members) || !members.length) {
        return res.status(400).json({ error: 'missing data' });
    }

    const stageColors = {
        CONFIANZA: '#E53935', 'ANÁLISIS': '#FB8C00',
        'DELEGACIÓN': '#1565C0', PERSPECTIVA: '#2E7D32'
    };

    let sent = 0, skipped = 0;

    for (const m of members) {
        if (!m.contact || !m.contact.includes('@') || !m.contact.includes('.')) {
            skipped++; continue;
        }

        const stageColor = stageColors[m.etapa] || '#004D2C';

        // Dimension bars — same as individual email
        const dimRows = (m.dimScores || []).map((score, di) => {
            const names = ['Enfoque', 'Procesos', 'Competencias', 'Proyección'];
            const pct   = Math.round((score / 20) * 100);
            const color = score < 8 ? '#E53935' : score < 14 ? '#FB8C00' : '#43A047';
            return `
            <tr>
                <td style="padding:6px 12px;font-size:13px;color:#444;width:130px;">${names[di]}</td>
                <td style="padding:6px 12px;">
                    <div style="background:#eee;border-radius:4px;height:10px;width:200px;">
                        <div style="background:${color};height:10px;border-radius:4px;width:${pct}%;"></div>
                    </div>
                </td>
                <td style="padding:6px 12px;font-size:13px;font-weight:700;color:${color};">${score}/20</td>
            </tr>`;
        }).join('');

        // Group comparison section — same style as individual email's groupSection
        const diff = m.score - groupStats.avgScore;
        const diffTxt = diff > 0 ? `+${diff} pts por encima del promedio`
                      : diff < 0 ? `${Math.abs(diff)} pts por debajo del promedio`
                      : 'igual al promedio del grupo';

        const groupSection = `
            <div style="background:#FFF8E1;border:1px solid #F9A825;padding:16px 20px;margin-top:20px;border-radius:4px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F9A825;margin-bottom:8px;">
                    Comparativa — Grupo ${grupo}
                </div>
                <p style="margin:0 0 6px;font-size:14px;color:#555;">
                    Tu puntaje: <strong style="color:#333;">${m.score}/80</strong> &nbsp;·&nbsp;
                    Promedio del grupo (n=${groupStats.n}): <strong style="color:#333;">${groupStats.avgScore}/80</strong>
                </p>
                <p style="margin:0;font-size:13px;color:#555;">${diffTxt}</p>
                ${dashboardUrl ? `<p style="margin:8px 0 0;font-size:12px;">
                    <a href="${dashboardUrl}" style="color:#004D2C;font-weight:700;">Ver dashboard completo del grupo →</a>
                </p>` : ''}
            </div>`;

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
        <div style="font-size:22px;font-weight:700;color:#fff;">${m.name || 'Tu empresa'}</div>
    </td></tr>

    <!-- Stage pill + score -->
    <tr><td style="padding:28px 36px 0;">
        <div style="display:inline-block;background:${stageColor};color:#fff;font-size:11px;font-weight:700;
             letter-spacing:2px;text-transform:uppercase;padding:5px 14px;margin-bottom:16px;">
            ${m.etapa}
        </div>
        <div style="font-size:32px;font-weight:900;color:#004D2C;line-height:1;margin-bottom:8px;">
            ${m.score} <span style="font-size:18px;font-weight:400;color:#888;">/ 80</span>
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

    <!-- Group comparison -->
    <tr><td style="padding:0 36px 24px;">${groupSection}</td></tr>

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
                to: [m.contact],
                subject: `Resultados del grupo ${grupo} — ${m.etapa} (${m.score}/80)`,
                html
            })
        });

        if (r.ok) sent++; else skipped++;
    }

    return res.status(200).json({ sent, skipped });
}
