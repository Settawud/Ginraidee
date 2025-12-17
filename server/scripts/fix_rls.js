const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Adjust path to root

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function fixRLS() {
    try {
        console.log('🔒 Enabling RLS on public.admins...');

        await pool.query(`
            ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
            
            -- Policy: Allow all access for the service_role (standard bypass)
            -- But effectively deny anon access since no other policies exist yet for them.
            -- Actually, we should add a policy to allow authenticated admins to see themselves if needed, 
            -- but for now, just enabling RLS blocks public access which is the urgent fix.
            
            -- Optional: Add policy for admin read access if using Supabase client
            -- CREATE POLICY "Enable read access for authenticated admins" ON public.admins
            -- FOR SELECT TO authenticated
            -- USING ((auth.jwt() ->> 'user_role') = 'admin');
        `);

        console.log('✅ RLS Enabled successfully.');
    } catch (err) {
        console.error('❌ Error enabling RLS:', err);
    } finally {
        await pool.end();
    }
}

fixRLS();
