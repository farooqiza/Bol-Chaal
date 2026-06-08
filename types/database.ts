// Hand-maintained Supabase schema types for Bol Chaal.
// Phase 0 covers `profiles`; later phases extend this as tables are added.
// You can later replace this with `supabase gen types typescript`.

export type Profile = {
  id: string;
  display_name: string | null;
  native_lang: string;
  current_level: number;
  total_xp: number;
  hearts: number;
  streak_count: number;
  streak_freeze: number;
  last_active_date: string | null;
  show_script: boolean;
  preferred_voice: string;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  display_name?: string | null;
  native_lang?: string;
  current_level?: number;
  total_xp?: number;
  hearts?: number;
  streak_count?: number;
  streak_freeze?: number;
  last_active_date?: string | null;
  show_script?: boolean;
  preferred_voice?: string;
};

export type ProfileUpdate = Partial<ProfileInsert>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
