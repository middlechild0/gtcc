export type {
  CompositeTypes,
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./db";
export type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Client = SupabaseClient<Database>;
