const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://kweempebrdlubrllfwmm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZWVtcGVicmRsdWJybGxmd21tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg5MzYyNSwiZXhwIjoyMDgxNDY5NjI1fQ.NDlOvEukGTGdjEnJ4_ruYVxD7lt6e9dEYRwCo6wXIO8';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('Creating admin user...');

  // Create admin user
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: 'admin@admin.com',
    password: 'admin123',
    email_confirm: true,
  });

  if (userError) {
    if (userError.message.includes('already been registered')) {
      console.log('User already exists, fetching...');
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.email === 'admin@admin.com');
      if (existingUser) {
        console.log('User ID:', existingUser.id);

        // Update profile to super_admin
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'super_admin', full_name: 'Super Admin' })
          .eq('user_id', existingUser.id);

        if (updateError) {
          console.error('Error updating profile:', updateError.message);
        } else {
          console.log('Profile updated to super_admin');
        }
      }
    } else {
      console.error('Error creating user:', userError.message);
    }
    return;
  }

  console.log('User created with ID:', user.user.id);

  // Update the profile to super_admin
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'super_admin', full_name: 'Super Admin' })
    .eq('user_id', user.user.id);

  if (updateError) {
    console.error('Error updating profile:', updateError.message);
  } else {
    console.log('Profile updated to super_admin');
  }

  console.log('\n✅ Admin account created successfully!');
  console.log('Email: admin@admin.com');
  console.log('Password: admin123');
}

main().catch(console.error);
