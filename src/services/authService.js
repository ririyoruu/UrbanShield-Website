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
      // Create the Supabase auth account
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
          
          // Create profile record with ONLY essential fields
          const profileData = {
            id: data.user.id,
            full_name: userData.name,
            username: userData.name + '_' + Date.now(), // Make username unique
            user_type: 'admin' // This matches the constraint: ['resident', 'government', 'admin']
          };
          
          // Only add email if it's not null
          if (email) {
            profileData.email = email;
          }
          
          // Only add phone if provided
          if (userData.phone) {
            profileData.phone_number = userData.phone;
          }
          
          console.log('Profile data to insert:', profileData);
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert(profileData)
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
                .insert({
                  admin_id: data.user.id,
                  email: email,
                  full_name: userData.name,
                  phone: userData.phone || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
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
      // First, check if this email exists in our profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type')
        .eq('email', email)
        .single();

      // If email doesn't exist in profiles table, it might be an old email
      if (profileError && profileError.code === 'PGRST116') {
        throw new Error('Invalid email address. Please use your current email address.');
      }

      if (profileError) {
        console.error('Profile lookup error:', profileError);
        throw new Error('Unable to verify email address. Please try again.');
      }

      // Attempt to sign in with Supabase Auth
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

  // Reset password (admin only)
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
      
      if (profileData.user_type !== 'admin') {
        console.log('Non-admin user attempted reset:', email, profileData.user_type);
        throw new Error('Only administrators can reset their password');
      }
      
      console.log('Admin user verified, sending reset email to:', email);
      console.log('Redirect URL will be:', `${window.location.origin}/reset-password`);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase reset password error:', error);
        throw error;
      }

      console.log('Password reset email sent successfully to admin');
      return data;
    } catch (error) {
      console.error('Reset password error:', error);
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
      return data?.user_type === 'admin';
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }
};

export default authService;
