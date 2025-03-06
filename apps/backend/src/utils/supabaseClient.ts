import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
export const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);


// list of tables in supabase\
// const listTables = async () => {
//   try {
//     const { data, error } = await supabase.rpc('sql', {
//       query: `SELECT * ;`
//     });

//     if (error) {
//       console.error('Error fetching table names:', error);
//       return;
//     }

//     console.log('Tables in public schema:', data);
//   } catch (err) {
//     console.error('Error:', err);
//   }
// };

// listTables();