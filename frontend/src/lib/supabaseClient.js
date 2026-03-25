import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mkklsywuzyunvgtokopz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_40BNxbUKbOhCDPEfpgcrUQ_oZbaAwC3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
