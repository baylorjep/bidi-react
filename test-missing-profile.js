// Test script to verify missing profile detection
// This simulates the scenario where a user signs in with Google OAuth but doesn't have a profile

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your own credentials)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMissingProfile() {
  console.log('Testing missing profile detection...');
  
  try {
    // Test 1: Check if a user exists in auth but not in profiles
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return;
    }
    
    if (!user) {
      console.log('No authenticated user found. Please sign in first.');
      return;
    }
    
    console.log('Authenticated user:', user.id);
    
    // Test 2: Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log('✅ SUCCESS: User is authenticated but has no profile (missing profile scenario detected)');
        console.log('This is the exact scenario we want to handle with MissingProfileModal');
      } else {
        console.error('❌ ERROR: Unexpected error checking profile:', profileError);
      }
    } else {
      console.log('✅ User has a profile:', profile);
    }
    
    // Test 3: Check individual profile
    const { data: individualProfile, error: individualError } = await supabase
      .from('individual_profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (individualError) {
      if (individualError.code === 'PGRST116') {
        console.log('✅ SUCCESS: User has no individual profile');
      } else {
        console.error('❌ ERROR: Unexpected error checking individual profile:', individualError);
      }
    } else {
      console.log('✅ User has individual profile:', individualProfile);
    }
    
    // Test 4: Check business profile
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (businessError) {
      if (businessError.code === 'PGRST116') {
        console.log('✅ SUCCESS: User has no business profile');
      } else {
        console.error('❌ ERROR: Unexpected error checking business profile:', businessError);
      }
    } else {
      console.log('✅ User has business profile:', businessProfile);
    }
    
  } catch (error) {
    console.error('❌ ERROR: Test failed:', error);
  }
}

// Run the test
testMissingProfile();
