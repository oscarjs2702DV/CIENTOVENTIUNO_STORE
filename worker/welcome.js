// Correo de bienvenida. Se envía con Resend solo si están los secretos
// RESEND_API_KEY y MAIL_FROM (p. ej. "CIENTOVENTIUNO <hola@tudominio.com>").
// Sin ellos no se envía nada y el registro funciona igual.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function welcomeHtml(name, origin) {
  const hola = name ? `Hola, ${esc(name)}` : 'Hola'
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><title>Bienvenido a CIENTOVENTIUNO</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#121212;border:1px solid #2a2a2a;">
    <tr><td align="center" style="padding:32px 24px 8px;">
      <img src="${origin}/assets/logo-correo.png" width="160" height="80" alt="CIENTOVENTIUNO" style="display:block;border:0;">
    </td></tr>
    <tr><td align="center" style="padding:16px 32px 0;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0;color:#8A2BE2;font-size:13px;letter-spacing:3px;text-transform:uppercase;">${hola}</p>
      <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;line-height:1.3;letter-spacing:1px;">
        Te has registrado exitosamente en CIENTOVENTIUNO
      </h1>
      <p style="margin:16px 0 0;color:#bdbdbd;font-size:15px;line-height:1.6;">
        Gracias por unirte. Ya puedes guardar tus datos, completar tu perfil y recibir
        sugerencias pensadas para ti.
      </p>
    </td></tr>
    <tr><td align="center" style="padding:28px 32px 36px;">
      <a href="${origin}/" style="display:inline-block;background:#8A2BE2;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;">
        Ir a la tienda
      </a>
    </td></tr>
  </table>
  <p style="margin:20px 0 0;color:#666666;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
    Recibes este correo porque creaste una cuenta en CIENTOVENTIUNO.
  </p>
</td></tr></table>
</body></html>`
}

export function sendWelcome(env, ctx, { name, email, origin }) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return
  const job = fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [email],
      subject: 'Te has registrado exitosamente en CIENTOVENTIUNO',
      html: welcomeHtml(name, origin),
      text: `${name ? `Hola, ${name}. ` : ''}Te has registrado exitosamente en CIENTOVENTIUNO. Visítanos en ${origin}/`,
    }),
  }).then(async (r) => { if (!r.ok) console.error('Correo de bienvenida falló', r.status, await r.text()) })
    .catch((err) => console.error('Correo de bienvenida falló', err))
  // El envío sigue después de responder, para no hacer esperar al cliente.
  if (ctx?.waitUntil) ctx.waitUntil(job)
  return job
}
