export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) return res.status(200).json({ skipped: true, reason: 'no api key' });

    const h = req.headers;
    const fecha  = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    const ip     = (h['x-forwarded-for'] || '').split(',')[0].trim() || 'desconocida';
    const ciudad = h['x-vercel-ip-city'] ? decodeURIComponent(h['x-vercel-ip-city']) : '';
    const pais   = h['x-vercel-ip-country'] || '';
    const lugar  = [ciudad, pais].filter(Boolean).join(', ') || 'desconocido';
    const ua     = (h['user-agent'] || 'desconocido').replace(/</g, '&lt;');

    const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#333;">
        <h2 style="color:#004D2C;margin:0 0 12px;">Alguien entró al panel de investigación</h2>
        <p style="margin:0 0 12px;">Se usó la clave <strong>1234</strong> (modo jurado).</p>
        <table cellpadding="4" style="font-size:13px;">
            <tr><td style="color:#888;">Fecha y hora</td><td><strong>${fecha}</strong></td></tr>
            <tr><td style="color:#888;">Ubicación aprox.</td><td>${lugar}</td></tr>
            <tr><td style="color:#888;">IP</td><td>${ip}</td></tr>
            <tr><td style="color:#888;">Navegador</td><td>${ua}</td></tr>
        </table>
    </div>`;

    const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Diagnóstico Organizacional <onboarding@resend.dev>',
            to: ['santiagomelero1999@gmail.com'],
            subject: `Ingreso al panel de investigación (clave 1234) — ${fecha}`,
            html
        })
    });

    const data = await r.json();
    return res.status(r.ok ? 200 : 500).json(data);
}
