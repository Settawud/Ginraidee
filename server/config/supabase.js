const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://rdtrhkedrthrkvvulumq.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
    console.error('⚠️ SUPABASE_KEY is not set in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
