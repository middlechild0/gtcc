export type { SupabaseClient } from "@supabase/supabase-js";
export type {
  CompositeTypes,
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./db";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db";

export type Client = SupabaseClient<Database>;
