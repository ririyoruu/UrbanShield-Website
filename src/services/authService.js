import { supabase, invitationService } from '../config/supabase';

export const authService = {
  // Sign up new user
  async signUp(email, password, userData) {
    try {
      console.log('=== SIGNUP PROCESS START ===');
      console.log('Email:', email);
      console.log('User data:', userData);

      // Validate invitation code is required
      if (!userData.invitationCode) {
        throw new Error('Invitation code is required');
      }

      console.log('Step 1: Testing database connection...');
      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('invitation_codes')
        .select('count')
        .limit(1);
      
      console.log('Database test result:', { testData, testError });
      
      if (testError) {
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      console.log('Step 2: Validating invitation code...');
      // Validate invitation code before creating account
      const { data: invitation, error: inviteError } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', userData.invitationCode)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      console.log('Invitation query result:', { invitation, inviteError });

      if (inviteError) {
        console.error('Invitation validation error:', inviteError);
        if (inviteError.code === 'PGRST116') {
          throw new Error('Invalid invitation code - code not found');
        }
        throw new Error(`Invitation validation failed: ${inviteError.message}`);
      }

      if (!invitation) {
        throw new Error('Invalid or expired invitation code');
      }

      console.log('Step 3: Creating Supabase auth account...');
      // Create the Supabase auth account (no email verification for signup)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.name,
            username: userData.name + '_' + Date.now(), // Make unique
            user_type: 'admin', // Must match constraint: ['resident', 'government', 'admin']
            phone_number: userData.phone || null
          }
        }
      });

      console.log('Auth signup result:', { data, error });

      if (error) {
        console.error('Auth signup error:', error);
        throw error;
      }

      // If signup successful, create profile
      if (data.user) {
        try {
          console.log('Step 4: Creating profile for user:', data.user.id);
          
          // Test profiles table access first
          const { data: profileTest, error: profileTestError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
          
          console.log('Profiles table test:', { profileTest, profileTestError });
          
          if (profileTestError) {
            throw new Error(`Cannot access profiles table: ${profileTestError.message}`);
          }
          
          // Create profile record with ALL required fields for admin
          const profileData = {
            id: data.user.id,
            full_name: userData.name,
            username: userData.name + '_' + Date.now(),
            user_type: 'admin',
            verification_status: 'verified',
            is_verified: true,
            email: email,
            phone_number: userData.phone || null
          };
          
          console.log('Profile data to insert:', profileData);
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })
            .select()
            .single();
            
          console.log('Profile creation result:', { profile, profileError });
            
          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
          
          console.log('Profile created successfully:', profile);

          console.log('Step 5: Marking invitation code as used...');
          // Mark invitation code as used
          const { data: usedInvitation, error: useError } = await supabase
            .from('invitation_codes')
            .update({
              is_used: true,
              used_by: data.user.id,
              used_at: new Date().toISOString()
            })
            .eq('code', userData.invitationCode)
            .select()
            .single();
            
          console.log('Invitation usage result:', { usedInvitation, useError });
          
          if (useError) {
            console.error('Failed to mark invitation as used:', useError);
            // Don't throw error here - user was created successfully
          } else {
            console.log('Invitation code marked as used successfully');
          }

          // Step 6: Create admin_profiles entry for admin users
          if (userData.userType === 'admin') {
            console.log('Step 6: Creating admin profile...');
            try {
              const { data: adminProfile, error: adminProfileError } = await supabase
                .from('admin_profiles')
                .upsert({
                  admin_id: data.user.id,
                  email: email,
                  full_name: userData.name,
                  phone: userData.phone || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, { onConflict: 'admin_id' })
                .select()
                .single();
              
              console.log('Admin profile creation result:', { adminProfile, adminProfileError });
              
              if (adminProfileError) {
                console.warn('Failed to create admin profile:', adminProfileError);
                // Don't fail signup - admin can access system with just profiles table
              } else {
                console.log('Admin profile created successfully');
              }
            } catch (adminError) {
              console.warn('Admin profile creation error:', adminError);
              // Don't fail signup
            }
          }
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          throw new Error(`Failed to create user profile: ${profileError.message}`);
        }
      }

      console.log('=== SIGNUP PROCESS COMPLETE ===');
      return data;
    } catch (error) {
      console.error('=== SIGNUP ERROR ===');
      console.error('Sign up error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      console.error('=== END SIGNUP ERROR ===');
      throw error;
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      // Try to check if email exists in profiles table (optional check)
      let profileExists = false;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, user_type')
          .eq('email', email)
          .single();

        if (!profileError && profileData) {
          profileExists = true;
          console.log('✅ Profile found for email:', email);
        } else if (profileError && profileError.code === 'PGRST116') {
          console.warn('⚠️ No profile found for email:', email, '- will be created after login');
        } else if (profileError) {
          console.warn('⚠️ Profile check failed:', profileError.message, '- continuing with login');
        }
      } catch (profileCheckError) {
        console.warn('⚠️ Profile check error (non-fatal):', profileCheckError.message);
      }

      // Attempt to sign in with Supabase Auth (proceed regardless of profile check)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and confirm your account before signing in.');
        } else {
          throw new Error(`Login failed: ${error.message}`);
        }
      }

      // Verify the signed-in user matches the profile
      if (data.user && data.user.email !== email) {
        console.warn('Email mismatch between auth and profile:', {
          authEmail: data.user.email,
          requestedEmail: email
        });
        throw new Error('Email address has been changed. Please use your current email address.');
      }

      // ADMIN-ONLY CHECK: Verify user has admin access
      if (data.user) {
        console.log('🔍 Checking admin permissions for user:', data.user.id);
        
        // Wait a moment for auth session to fully establish
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('user_type, verification_status, email, full_name')
            .eq('id', data.user.id)
            .single();

          console.log('Profile fetch result:', { userProfile, profileError });

          if (profileError) {
            console.error('❌ Failed to fetch user profile:', profileError);
            console.error('Error details:', {
              code: profileError.code,
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint
            });
            
            // If profile doesn't exist (PGRST116), create it
            if (profileError.code === 'PGRST116') {
              console.log('📝 Profile not found, creating default admin profile...');
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email: data.user.email,
                  full_name: data.user.email.split('@')[0],
                  user_type: 'admin',
                  verification_status: 'verified',
                  is_verified: true
                })
                .select()
                .single();
              
              if (createError) {
                console.error('❌ Failed to create profile:', createError);
                await supabase.auth.signOut();
                throw new Error('Unable to create user profile. Please run the database setup SQL first.');
              }
              
              console.log('✅ Profile created:', newProfile);
              return data; // Allow login with new admin profile
            }
            
            // For other errors, sign out and show error
            await supabase.auth.signOut();
            throw new Error('Unable to verify account permissions. Please ensure the database setup SQL has been run.');
          }

          // Only allow admin users to login
          if (userProfile.user_type !== 'admin' && userProfile.user_type !== 'super_admin') {
            console.warn('❌ Non-admin user attempted login:', { email, user_type: userProfile.user_type });
            await supabase.auth.signOut();
            throw new Error('Access denied. This portal is for administrators only.');
          }

          // Block suspended users
          if (userProfile.verification_status === 'suspended') {
            console.warn('❌ Suspended user attempted login:', { email, status: userProfile.verification_status });
            await supabase.auth.signOut();
            throw new Error('Your account has been suspended. Please contact support.');
          }

          console.log('✅ Admin user verified:', { email, user_type: userProfile.user_type });
        } catch (checkError) {
          // If it's our custom error, re-throw it
          if (checkError.message.includes('Access denied') || 
              checkError.message.includes('Unable to verify') || 
              checkError.message.includes('Unable to create') ||
              checkError.message.includes('suspended')) {
            throw checkError;
          }
          // For unexpected errors, log and block login
          console.error('❌ Unexpected error during admin check:', checkError);
          await supabase.auth.signOut();
          throw new Error('Login verification failed. Please contact support.');
        }
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (user) {
        try {
          // Get additional user data from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it for existing auth user
            const defaultProfile = {
              id: user.id,
              email: user.email,
              full_name: user.email.split('@')[0],
              username: user.email.split('@')[0],
              user_type: 'admin',
              phone_number: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert(defaultProfile)
              .select()
              .single();

            if (createError) {
              console.error('Failed to create profile:', createError);
              return { ...user, profile: null };
            }

            return { ...user, profile: newProfile };
          }

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            return { ...user, profile: null };
          }

          return { ...user, profile };
        } catch (profileError) {
          console.error('Profile fetch error:', profileError);
          return { ...user, profile: null };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Send admin email via Edge Function
  async sendAdminEmail(email, type, urls = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-email-verify', {
        body: {
          email,
          type,
          confirmation_url: urls.confirmation_url,
          reset_url: urls.reset_url
        }
      });

      if (error) {
        console.error('Admin email error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Send admin email error:', error);
      throw error;
    }
  },

  // Reset password (admin only) - sends verification code
  async resetPassword(email) {
    try {
      console.log('Checking admin status for email:', email);
      
      // First check if user is an admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('email', email)
        .single();
      
      if (profileError || !profileData) {
        console.log('User not found:', email);
        throw new Error('No account found with this email address');
      }
      
      if (profileData.user_type !== 'admin' && profileData.user_type !== 'super_admin') {
        console.log('Non-admin user attempted reset:', email, profileData.user_type);
        throw new Error('Only administrators can reset their password');
      }
      
      console.log('Admin user verified, generating verification code');
      
      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code in database first
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      const { error: insertError } = await supabase
        .from('email_verification_codes')
        .insert({
          email: email.toLowerCase().trim(),
          code: code,
          expires_at: expiresAt,
          used: false
        });

      if (insertError) {
        console.error('Error storing verification code:', insertError);
        throw new Error('Failed to generate verification code');
      }
      
      // Send reset code via Edge Function
      const { data, error } = await supabase.functions.invoke('send-reset-code', {
        body: {
          email: email.toLowerCase().trim(),
          code: code
        }
      });

      console.log('Verification code response:', { data, error });

      if (error) {
        console.error('Verification code error:', error);
        // Code is stored, so return success with fallback message
        return {
          success: true,
          message: 'Verification code generated. Email service unavailable - please contact support for your code.',
          requiresCode: true,
          code: code // Return code for testing
        };
      }

      console.log('Verification code sent successfully to admin');
      return {
        success: true,
        message: 'Verification code sent to your email',
        requiresCode: true,
        code: data?.code || code
      };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  // Verify code and reset password
  async verifyCodeAndResetPassword(email, code, newPassword) {
    try {
      console.log('Verifying code for email:', email);
      
      // Check if code exists and is valid
      const { data: codeData, error: codeError } = await supabase
        .from('email_verification_codes')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('code', code)
        .eq('used', false)
        .single();
      
      if (codeError || !codeData) {
        throw new Error('Invalid or expired verification code');
      }
      
      // Check if code is expired
      if (new Date(codeData.expires_at) < new Date()) {
        throw new Error('Verification code has expired');
      }
      
      console.log('Code verified, resetting password');
      
      // Mark code as used
      await supabase
        .from('email_verification_codes')
        .update({ used: true })
        .eq('id', codeData.id);
      
      // Use Supabase's built-in password reset flow
      // First, send a reset email to the user
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?code=${code}&new_password=${encodeURIComponent(newPassword)}`
      });
      
      if (resetError) {
        console.log('Reset email failed, trying direct approach');
        // If email fails, we can't directly reset without admin permissions
        // So we'll return a message that they need to use the reset link
        return {
          success: false,
          message: 'Password reset requires email confirmation. Please check your email for the reset link.',
          requiresEmailReset: true
        };
      }
      
      console.log('Password reset email sent successfully');
      return {
        success: true,
        message: 'Password reset instructions sent to your email'
      };
    } catch (error) {
      console.error('Verify code and reset password error:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Check if user is admin
  async isAdmin(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.user_type === 'admin' || data?.user_type === 'super_admin';
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }
};

export default authService;
