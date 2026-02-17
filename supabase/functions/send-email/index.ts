import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, email, data } = await req.json()
    
    let subject = ''
    let html = ''
    
    if (type === 'signup_confirmation') {
      subject = 'Welcome to UrbanShield - Verify Your Email'
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your UrbanShield Account</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #0f172a;
              color: #e2e8f0;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #1e293b;
              border-radius: 16px;
              overflow: hidden;
              border: 1px solid rgba(148, 163, 184, 0.2);
            }
            .header {
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 40px 30px;
              text-align: center;
              border-bottom: 1px solid rgba(148, 163, 184, 0.1);
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background: #dc2626;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              font-weight: bold;
              color: white;
            }
            .title {
              font-size: 28px;
              font-weight: 700;
              margin: 0;
              color: #f1f5f9;
            }
            .content {
              padding: 40px 30px;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 30px;
              color: #94a3b8;
            }
            .button {
              display: inline-block;
              background: #dc2626;
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              transition: all 0.3s ease;
            }
            .button:hover {
              background: #b91c1c;
              transform: translateY(-2px);
            }
            .footer {
              background: #0f172a;
              padding: 20px 30px;
              text-align: center;
              border-top: 1px solid rgba(148, 163, 184, 0.1);
            }
            .footer-text {
              font-size: 14px;
              color: #64748b;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin: 30px 0;
            }
            .stat {
              background: rgba(30, 41, 59, 0.5);
              padding: 20px;
              border-radius: 12px;
              text-align: center;
              border: 1px solid rgba(148, 163, 184, 0.1);
            }
            .stat-number {
              font-size: 24px;
              font-weight: 700;
              color: #dc2626;
              margin-bottom: 8px;
            }
            .stat-label {
              font-size: 14px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛡️</div>
              <h1 class="title">UrbanShield</h1>
            </div>
            
            <div class="content">
              <p class="message">
                Welcome to UrbanShield! You're one step away from accessing the incident management dashboard.
              </p>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-number">24/7</div>
                  <div class="stat-label">Monitoring</div>
                </div>
                <div class="stat">
                  <div class="stat-number">Real-time</div>
                  <div class="stat-label">Response</div>
                </div>
                <div class="stat">
                  <div class="stat-number">Secure</div>
                  <div class="stat-label">Platform</div>
                </div>
              </div>
              
              <p class="message">
                Click the button below to verify your email address and activate your admin account:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.confirmation_url}" class="button">
                  Verify Email Address
                </a>
              </div>
              
              <p class="message">
                This link will expire in 24 hours. If you didn't request this verification, you can safely ignore this email.
              </p>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                © 2024 UrbanShield. Keeping communities safe, together.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    } else if (type === 'reset_password') {
      subject = 'Reset Your UrbanShield Password'
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your UrbanShield Password</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #0f172a;
              color: #e2e8f0;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #1e293b;
              border-radius: 16px;
              overflow: hidden;
              border: 1px solid rgba(148, 163, 184, 0.2);
            }
            .header {
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 40px 30px;
              text-align: center;
              border-bottom: 1px solid rgba(148, 163, 184, 0.1);
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background: #dc2626;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              font-weight: bold;
              color: white;
            }
            .title {
              font-size: 28px;
              font-weight: 700;
              margin: 0;
              color: #f1f5f9;
            }
            .content {
              padding: 40px 30px;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 30px;
              color: #94a3b8;
            }
            .button {
              display: inline-block;
              background: #dc2626;
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              transition: all 0.3s ease;
            }
            .button:hover {
              background: #b91c1c;
              transform: translateY(-2px);
            }
            .footer {
              background: #0f172a;
              padding: 20px 30px;
              text-align: center;
              border-top: 1px solid rgba(148, 163, 184, 0.1);
            }
            .footer-text {
              font-size: 14px;
              color: #64748b;
            }
            .warning {
              background: rgba(220, 38, 38, 0.1);
              border: 1px solid rgba(220, 38, 38, 0.2);
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
            .warning-text {
              color: #fca5a5;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛡️</div>
              <h1 class="title">UrbanShield</h1>
            </div>
            
            <div class="content">
              <p class="message">
                We received a request to reset your UrbanShield admin password.
              </p>
              
              <div class="warning">
                <p class="warning-text">
                  <strong>Security Notice:</strong> Only administrators can reset passwords. If you didn't request this, please contact your system administrator immediately.
                </p>
              </div>
              
              <p class="message">
                Click the button below to reset your password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.reset_url}" class="button">
                  Reset Password
                </a>
              </div>
              
              <p class="message">
                This link will expire in 1 hour for security reasons. If you didn't request this password reset, please secure your account immediately.
              </p>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                © 2024 UrbanShield. Keeping communities safe, together.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Send email using Supabase's built-in email (you can replace with Gmail SMTP later)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabase.auth.admin.sendEmail({
      to: email,
      subject,
      html,
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
