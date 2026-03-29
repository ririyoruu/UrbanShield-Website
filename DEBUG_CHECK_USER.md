# Debug Steps to Check Your Admin User

## Step 1: Check Your Current User's Profile

Open your browser console and run this:

```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user ID:', user.id);

// Check profile
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

console.log('Profile:', profile);
console.log('user_type:', profile?.user_type);
```

## Step 2: What to Look For

The output should show:
- `user_type: "admin"` (exactly this, lowercase)

If it shows anything else (like `"Admin"`, `"administrator"`, `null`, etc.), that's the problem.

## Step 3: If user_type is Wrong

Run this in Supabase SQL Editor:

```sql
-- Replace YOUR_USER_ID with the actual user ID from Step 1
UPDATE profiles 
SET user_type = 'admin'
WHERE id = 'YOUR_USER_ID';
```

## Step 4: Alternative - Check RLS Policy

If user_type is correct, the RLS policy might not exist. Run this in Supabase SQL Editor:

```sql
-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'incidents';
```

This will show all policies on the incidents table. You should see:
- "Admins can update incidents" with cmd = 'UPDATE'
- "Admins can view all incidents" with cmd = 'SELECT'
- "Admins can delete incidents" with cmd = 'DELETE'

If these don't exist, re-run the SQL I provided earlier.
