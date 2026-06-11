import { supabase } from './lib/supabase.js';
const { data: tasks } = await supabase.from('tasks').select('title, points_per_unit, unit_label').order('points_per_unit');
console.log('TASKS:');
tasks?.forEach(t => console.log(`  ${t.title}: ${t.points_per_unit} pts / ${t.unit_label}`));

const { data: rewards } = await supabase.from('rewards').select('title, points_cost').order('points_cost');
console.log('\nREWARDS:');
rewards?.forEach(r => console.log(`  ${r.title}: ${r.points_cost} pts`));

const { data: us } = await supabase.from('user_settings').select('current_points, total_points_earned');
console.log('\nUSER SETTINGS:', us);
