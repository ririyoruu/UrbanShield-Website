// Edge Function to send admin email verification via Gmail SMTP
// Deploy: supabase functions deploy admin-email-verify

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
    const { email, type, confirmation_url, reset_url } = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing email or type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let subject = '';
    let emailHtml = '';

    if (type === 'signup_confirmation') {
      subject = 'Verify Your UrbanShield Admin Account';
      emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Admin Account - UrbanShield</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #e2e8f0; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a;">
  <div style="background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 1px solid rgba(148, 163, 184, 0.2);">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px; text-align: center; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: #dc2626; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: white;">🛡️</div>
      <h1 style="margin: 0; font-size: 28px; font-weight: 700;">UrbanShield Admin</h1>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #f1f5f9; margin-top: 0;">Verify Your Admin Account</h2>
      <p style="color: #94a3b8;">Welcome to UrbanShield! Your admin account has been created and requires email verification before you can access the dashboard.</p>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0;">
        <div style="background: rgba(30, 41, 59, 0.5); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid rgba(148, 163, 184, 0.1);">
          <div style="font-size: 24px; font-weight: 700; color: #dc2626; margin-bottom: 8px;">24/7</div>
          <div style="font-size: 14px; color: #94a3b8;">Monitoring</div>
        </div>
        <div style="background: rgba(30, 41, 59, 0.5); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid rgba(148, 163, 184, 0.1);">
          <div style="font-size: 24px; font-weight: 700; color: #dc2626; margin-bottom: 8px;">Real-time</div>
          <div style="font-size: 14px; color: #94a3b8;">Response</div>
        </div>
        <div style="background: rgba(30, 41, 59, 0.5); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid rgba(148, 163, 184, 0.1);">
          <div style="font-size: 24px; font-weight: 700; color: #dc2626; margin-bottom: 8px;">Secure</div>
          <div style="font-size: 14px; color: #94a3b8;">Platform</div>
        </div>
      </div>
      
      <p style="color: #94a3b8;">Click the button below to verify your email address and activate your admin access:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmation_url}" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
          Verify Admin Account
        </a>
      </div>
      
      <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="color: #fca5a5; font-size: 14px; margin: 0;"><strong>🔐 Admin Security Notice:</strong> This link grants administrative access to UrbanShield. Only verify if you are an authorized administrator.</p>
      </div>
      
      <p style="color: #64748b; font-size: 14px; text-align: center;">This link will expire in 24 hours. If you didn't request admin access, please contact your system administrator immediately.</p>
    </div>
    <div style="background: #0f172a; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(148, 163, 184, 0.1);">
      <p style="margin: 0;">© ${new Date().getFullYear()} UrbanShield Admin System. All rights reserved.</p>
      <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
      `;
    } else if (type === 'reset_password') {
      subject = 'Reset Your UrbanShield Admin Password';
      emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Admin Password - UrbanShield</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #e2e8f0; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a;">
  <div style="background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 1px solid rgba(148, 163, 184, 0.2);">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px; text-align: center; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: #dc2626; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: white;">🛡️</div>
      <h1 style="margin: 0; font-size: 28px; font-weight: 700;">UrbanShield Admin</h1>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #f1f5f9; margin-top: 0;">Reset Admin Password</h2>
      <p style="color: #94a3b8;">We received a request to reset your UrbanShield admin password.</p>
      
      <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="color: #fca5a5; font-size: 14px; margin: 0;"><strong>🔐 Security Notice:</strong> Only administrators can reset passwords. If you didn't request this, please secure your account immediately.</p>
      </div>
      
      <p style="color: #94a3b8;">Click the button below to reset your password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${reset_url}" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
          Reset Admin Password
        </a>
      </div>
      
      <p style="color: #64748b; font-size: 14px; text-align: center;">This link will expire in 1 hour for security reasons. If you didn't request this password reset, please contact your system administrator immediately.</p>
    </div>
    <div style="background: #0f172a; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(148, 163, 184, 0.1);">
      <p style="margin: 0;">© ${new Date().getFullYear()} UrbanShield Admin System. All rights reserved.</p>
      <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
      `;
    }

    // Use Gmail SMTP for sending emails
    const smtpUser = Deno.env.get('GMAIL_SMTP_USER');
    const smtpPassword = Deno.env.get('GMAIL_SMTP_PASSWORD');
    const fromEmail = smtpUser || 'admin@urbanshield.com';

    console.log('🔍 Admin Email Config Check:', { 
      smtpUserSet: smtpUser ? 'SET' : 'NOT SET',
      fromEmail,
      email,
      type
    });

    if (!smtpUser || !smtpPassword) {
      console.error('❌ Gmail SMTP not configured for admin emails');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Gmail SMTP not configured'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gmail SMTP implementation
    try {
      const smtpHost = 'smtp.gmail.com';
      const smtpPort = 465; // SSL port
      
      const conn = await Promise.race([
        Deno.connectTls({ hostname: smtpHost, port: smtpPort }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('SMTP connection timeout')), 10000)
        )
      ]);

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const readWithTimeout = async (timeout = 5000): Promise<string> => {
        const buffer = new Uint8Array(4096);
        const readPromise = conn.read(buffer);
        const timeoutPromise = new Promise<number | null>((_, reject) => 
          setTimeout(() => reject(new Error('Read timeout')), timeout)
        );
        
        const bytesRead = await Promise.race([readPromise, timeoutPromise]) as number | null;
        if (bytesRead === null || bytesRead === 0) return '';
        return decoder.decode(buffer.subarray(0, bytesRead)).trim();
      };

      // SMTP handshake
      await readWithTimeout();
      await conn.write(encoder.encode(`EHLO ${smtpHost}\r\n`));
      await readWithTimeout();
      
      // Auth
      await conn.write(encoder.encode('AUTH LOGIN\r\n'));
      await readWithTimeout();
      await conn.write(encoder.encode(`${btoa(smtpUser)}\r\n`));
      await readWithTimeout();
      await conn.write(encoder.encode(`${btoa(smtpPassword)}\r\n`));
      const authResp = await readWithTimeout();
      
      if (!authResp.includes('235')) {
        conn.close();
        throw new Error(`SMTP auth failed: ${authResp}`);
      }

      // Send email
      await conn.write(encoder.encode(`MAIL FROM:<${fromEmail}>\r\n`));
      await readWithTimeout();
      await conn.write(encoder.encode(`RCPT TO:<${email}>\r\n`));
      await readWithTimeout();
      await conn.write(encoder.encode('DATA\r\n'));
      await readWithTimeout();
      
      const message = [
        `From: UrbanShield Admin <${fromEmail}>`,
        `To: ${email}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        emailHtml
      ].join('\r\n');
      
      await conn.write(encoder.encode(message + '\r\n.\r\n'));
      const sendResp = await readWithTimeout();
      
      if (!sendResp.includes('250')) {
        conn.close();
        throw new Error(`SMTP send failed: ${sendResp}`);
      }

      await conn.write(encoder.encode('QUIT\r\n'));
      conn.close();
      
      console.log(`✅ Admin email sent successfully via SMTP to ${email}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin email sent successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('❌ Admin SMTP Error:', error?.message || error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send admin email',
          message: error.message || 'SMTP error occurred'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('❌ Error in admin-email-verify:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process admin email',
        message: error.message || 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
});
