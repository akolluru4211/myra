export * from "./client.ts";
import { createClient } from "./client.ts";
export const supabase = createClient();
export default supabase;
