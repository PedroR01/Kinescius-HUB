interface EmailLugarDisponibleParams {
  nombre: string;
  apellido: string;
  tipoClase: string;
  fecha: string;
  hora: string;
  claseId: number;
  clienteId: number;
  token: string;
  baseUrl: string;
  montosenia: number;
}

export function emailLugarDisponible(params: EmailLugarDisponibleParams): string {
  const {
    nombre,
    apellido,
    tipoClase,
    fecha,
    hora,
    claseId,
    clienteId,
    token,
    baseUrl,
    montosenia,
  } = params;

const confirmarUrl = `${baseUrl}/confirmar-turno?token=${token}&claseId=${claseId}&clienteId=${clienteId}`;
  const fechaFormateada = new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const horaFormateada = hora.substring(0, 5);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Lugar disponible – Kinescius</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background-color:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a6b4a;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
                Kinescius
              </h1>
              <p style="margin:8px 0 0;color:#a8d5c2;font-size:14px;">Centro de Kinesiología</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;color:#333333;font-size:16px;">
                Hola, <strong>${nombre} ${apellido}</strong>
              </p>
              <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;">
                ¡Buenas noticias! Se liberó un lugar en la clase a la que querías asistir.
                Tenés <strong>24 horas</strong> para confirmar tu turno abonando la seña.
              </p>

              <!-- Info de la clase -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#f0f7f4;border-left:4px solid #1a6b4a;
                            border-radius:6px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;color:#1a6b4a;font-size:13px;
                               font-weight:600;text-transform:uppercase;">
                      Detalle de la clase
                    </p>
                    <p style="margin:0 0 4px;color:#333333;font-size:15px;">
                      <strong>Tipo:</strong> ${tipoClase}
                    </p>
                    <p style="margin:0 0 4px;color:#333333;font-size:15px;">
                      <strong>Fecha:</strong> ${fechaFormateada}
                    </p>
                    <p style="margin:0;color:#333333;font-size:15px;">
                      <strong>Horario:</strong> ${horaFormateada} hs
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Monto seña -->
              <p style="margin:0 0 28px;color:#555555;font-size:15px;line-height:1.6;">
                Para reservar tu lugar debés abonar una seña de
                <strong style="color:#1a6b4a;font-size:16px;">
                  $${montosenia.toLocaleString('es-AR')}
                </strong>
                (50% del valor de la clase).
              </p>

              <!-- Botón -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${confirmarUrl}"
                       style="display:inline-block;background-color:#1a6b4a;color:#ffffff;
                              text-decoration:none;font-size:16px;font-weight:600;
                              padding:14px 36px;border-radius:8px;">
                      Confirmar turno
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#888888;font-size:13px;text-align:center;line-height:1.5;">
                Si el botón no funciona, copiá este enlace:<br/>
                <a href="${confirmarUrl}" style="color:#1a6b4a;word-break:break-all;">
                  ${confirmarUrl}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f4f6f9;padding:20px 40px;text-align:center;
                       border-top:1px solid #e8ecf0;">
              <p style="margin:0;color:#aaaaaa;font-size:12px;line-height:1.6;">
                Este email fue enviado automáticamente por Kinescius.<br/>
                Si no solicitaste este turno, podés ignorar este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}