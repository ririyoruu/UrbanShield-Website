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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SR_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SR_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Supabase environment variables are missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Internal configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { email, newPassword, userId } = await req.json();

    if (!newPassword || (!email && !userId)) {
      return new Response(
        JSON.stringify({ error: 'Missing information (email/userId or newPassword)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetUserId = userId;

    // If userId not provided, try to find it via email
    if (!targetUserId && email) {
      console.log(`🔍 Looking for user with email: ${email}`);
      const trimmedEmail = email.toLowerCase().trim();

      // 1. First try profiles table (it's faster)
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', trimmedEmail)
        .single();

      if (!profileError && profile?.id) {
        targetUserId = profile.id;
        console.log(`✅ Found userId ${targetUserId} in profiles table`);
      } else {
        // 2. Fallback: list users from auth.admin
        console.log('⚠️ Profile not found in profiles, checking auth.users...');
        const { data, error: userError } = await supabaseAdmin.auth.admin.listUsers();

        if (userError) {
          console.error(`❌ Error listing users: ${userError.message}`);
          throw userError;
        }

        if (!data || !data.users) {
          console.error('❌ No user data returned from auth.admin.listUsers()');
          throw new Error('Failed to fetch user list');
        }

        const user = data.users.find(u => u.email === trimmedEmail);

        if (!user) {
          console.error(`❌ No user found with email ${trimmedEmail}`);
          return new Response(
            JSON.stringify({ success: false, error: 'User not found in system' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        targetUserId = user.id;
        console.log(`✅ Found userId ${targetUserId} in auth.users`);
      }
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not determine user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the password
    console.log(`🔐 Updating password for userId: ${targetUserId}`);
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (updateError) {
      console.error(`❌ Failed to update password for ${targetUserId}: ${updateError.message}`);
      throw updateError;
    }

    console.log(`✅ Password successfully reset for ${email || targetUserId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Edge Function caught error:', error.message || error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Failed to reset password',
        details: error?.details || null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
