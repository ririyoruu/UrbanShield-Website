// Edge Function to send reset code email via Resend or Gmail SMTP
// Deploy: supabase functions deploy send-reset-code

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Missing email or code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('email', email.toLowerCase().trim())
      .single();

    const userName = profile?.full_name || 'User';

    // =========================
    // DARK BLUE EMAIL TEMPLATE
    // =========================
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - UrbanShield</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px; background-color:#0f172a;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111c3a; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.4);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding:35px; text-align:center;">
              <h1 style="margin:0; font-size:28px; font-weight:700; color:#ffffff; letter-spacing:0.5px;">
                🛡️ UrbanShield
              </h1>
              <p style="margin:8px 0 0 0; font-size:14px; color:#cbd5e1;">
                Account Security Notification
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 35px; color:#e2e8f0;">

              <h2 style="margin-top:0; font-size:22px; color:#ffffff;">
                Reset Your Password
              </h2>

              <p style="font-size:15px; line-height:1.6;">
                Hello ${userName},
              </p>

              <p style="font-size:15px; line-height:1.6; color:#cbd5e1;">
                We received a request to reset your password. Use the secure verification code below to continue in the app.
              </p>

              <!-- Code Box -->
              <div style="margin:35px 0; text-align:center;">
                <div style="
                  display:inline-block;
                  background:#0b1225;
                  border:1px solid #2563eb;
                  border-radius:10px;
                  padding:25px 40px;
                ">
                  <div style="
                    font-size:38px;
                    font-weight:bold;
                    letter-spacing:10px;
                    color:#3b82f6;
                    font-family:'Courier New', monospace;
                  ">
                    ${code}
                  </div>
                </div>
              </div>

              <p style="text-align:center; font-size:13px; color:#94a3b8; margin-top:-15px;">
                This code expires in 15 minutes.
              </p>

              <!-- Security Notice -->
              <div style="
                margin-top:30px;
                padding:15px 18px;
                background:#1e293b;
                border-left:4px solid #3b82f6;
                border-radius:6px;
              ">
                <p style="margin:0; font-size:13px; color:#cbd5e1;">
                  <strong style="color:#ffffff;">Security Notice:</strong>
                  If you did not request this password reset, please ignore this email. 
                  Your account remains protected.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0b1225; padding:20px; text-align:center; font-size:12px; color:#64748b;">
              <p style="margin:0;">
                © ${new Date().getFullYear()} UrbanShield. All rights reserved.
              </p>
              <p style="margin:6px 0 0 0;">
                This is an automated message. Please do not reply.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    const emailText = `
UrbanShield - Reset Your Password

Hello ${userName},

We received a request to reset your password.

Your verification code is:

${code}

This code expires in 15 minutes.

If you did not request this reset, you can safely ignore this email.

© ${new Date().getFullYear()} UrbanShield
    `;

    // =========================
    // RESEND (Primary)
    // =========================
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail =
      Deno.env.get('RESEND_FROM_EMAIL') ||
      Deno.env.get('GMAIL_SMTP_USER') ||
      'noreply@urbanshield.com';
    const fromName = Deno.env.get('RESEND_FROM_NAME') || 'UrbanShield';

    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: email,
            subject: 'Reset Your UrbanShield Password',
            html: emailHtml,
            text: emailText,
          }),
        });

        const resendData = await resendResponse.json();

        if (resendResponse.ok && resendData.id) {
          return new Response(
            JSON.stringify({ success: true, message: 'Reset code email sent successfully' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error(resendData.message || 'Resend API failed');
        }
      } catch (err) {
        console.error('Resend failed:', err);
      }
    }

    // =========================
    // GMAIL SMTP FALLBACK
    // =========================
    const smtpUser = Deno.env.get('GMAIL_SMTP_USER');
    const smtpPassword = Deno.env.get('GMAIL_SMTP_PASSWORD');

    if (!smtpUser || !smtpPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'No email service configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const conn = await Deno.connectTls({ hostname: 'smtp.gmail.com', port: 465 });

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const read = async () => {
        const buffer = new Uint8Array(4096);
        const bytes = await conn.read(buffer);
        return decoder.decode(buffer.subarray(0, bytes || 0));
      };

      await read();
      await conn.write(encoder.encode(`EHLO smtp.gmail.com\r\n`));
      await read();

      await conn.write(encoder.encode(`AUTH LOGIN\r\n`));
      await read();
      await conn.write(encoder.encode(`${btoa(smtpUser)}\r\n`));
      await read();
      await conn.write(encoder.encode(`${btoa(smtpPassword)}\r\n`));
      await read();

      await conn.write(encoder.encode(`MAIL FROM:<${fromEmail}>\r\n`));
      await read();
      await conn.write(encoder.encode(`RCPT TO:<${email}>\r\n`));
      await read();
      await conn.write(encoder.encode(`DATA\r\n`));
      await read();

      const message = [
        `From: ${fromName} <${fromEmail}>`,
        `To: ${email}`,
        `Subject: Reset Your UrbanShield Password`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        emailHtml
      ].join('\r\n');

      await conn.write(encoder.encode(message + '\r\n.\r\n'));
      await read();

      await conn.write(encoder.encode(`QUIT\r\n`));
      conn.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Reset code email sent successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('SMTP error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Email sending failed.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
