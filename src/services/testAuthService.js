// Test signup without profile creation
import { supabase } from '../config/supabase';

export const testAuthService = {
  // Simple signup without profile creation
  async signUpSimple(email, password, userData) {
    try {
      console.log('=== SIMPLE SIGNUP TEST ===');
      
      // Just create auth account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.name,
            username: userData.name,
            user_type: userData.userType,
            phone_number: userData.phone
          }
        }
      });

      console.log('Simple auth result:', { data, error });

      if (error) {
        throw error;
      }

      console.log('=== SIMPLE SIGNUP SUCCESS ===');
      return data;
    } catch (error) {
      console.error('Simple signup error:', error);
      throw error;
    }
  }
};
