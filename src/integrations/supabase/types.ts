export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          no_ghostwriting_accepted: boolean | null
          rubric_id: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          subject: Database["public"]["Enums"]["subject_type"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          no_ghostwriting_accepted?: boolean | null
          rubric_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          subject: Database["public"]["Enums"]["subject_type"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          no_ghostwriting_accepted?: boolean | null
          rubric_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          subject?: Database["public"]["Enums"]["subject_type"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_sessions: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          input_text: string | null
          output_text: string | null
          session_type: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          input_text?: string | null
          output_text?: string | null
          session_type: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          input_text?: string | null
          output_text?: string | null
          session_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          assignment_id: string
          citations: Json | null
          content: string | null
          created_at: string
          id: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          assignment_id: string
          citations?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          assignment_id?: string
          citations?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drafts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      outlines: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          sections: Json
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          sections: Json
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          sections?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outlines_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          assignment_id: string
          audience: string | null
          constraints: string | null
          created_at: string
          id: string
          questions: Json | null
          thesis: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          audience?: string | null
          constraints?: string | null
          created_at?: string
          id?: string
          questions?: Json | null
          thesis?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          audience?: string | null
          constraints?: string | null
          created_at?: string
          id?: string
          questions?: Json | null
          thesis?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          consent_given: boolean | null
          created_at: string
          full_name: string | null
          id: string
          school_name: string | null
          updated_at: string
        }
        Insert: {
          consent_given?: boolean | null
          created_at?: string
          full_name?: string | null
          id: string
          school_name?: string | null
          updated_at?: string
        }
        Update: {
          consent_given?: boolean | null
          created_at?: string
          full_name?: string | null
          id?: string
          school_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          actions: Json | null
          assignment_id: string
          created_at: string
          feedback: Json | null
          id: string
          overall_summary: string | null
          rubric_id: string | null
          scores: Json | null
        }
        Insert: {
          actions?: Json | null
          assignment_id: string
          created_at?: string
          feedback?: Json | null
          id?: string
          overall_summary?: string | null
          rubric_id?: string | null
          scores?: Json | null
        }
        Update: {
          actions?: Json | null
          assignment_id?: string
          created_at?: string
          feedback?: Json | null
          id?: string
          overall_summary?: string | null
          rubric_id?: string | null
          scores?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      rubrics: {
        Row: {
          created_at: string
          created_by: string | null
          criteria: Json
          id: string
          is_default: boolean | null
          name: string
          subject: Database["public"]["Enums"]["subject_type"]
          task_type: Database["public"]["Enums"]["task_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          criteria: Json
          id?: string
          is_default?: boolean | null
          name: string
          subject: Database["public"]["Enums"]["subject_type"]
          task_type: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          criteria?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          subject?: Database["public"]["Enums"]["subject_type"]
          task_type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
      assignment_status:
        | "draft"
        | "planning"
        | "outlining"
        | "writing"
        | "reviewing"
        | "complete"
      subject_type:
        | "lang_a"
        | "lang_b"
        | "history"
        | "economics"
        | "biology"
        | "chemistry"
        | "physics"
        | "math"
        | "tok"
        | "other"
      task_type: "essay" | "commentary" | "tok" | "ia" | "ee" | "other"
      user_role: "student" | "teacher" | "admin" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "teacher", "admin"],
      assignment_status: [
        "draft",
        "planning",
        "outlining",
        "writing",
        "reviewing",
        "complete",
      ],
      subject_type: [
        "lang_a",
        "lang_b",
        "history",
        "economics",
        "biology",
        "chemistry",
        "physics",
        "math",
        "tok",
        "other",
      ],
      task_type: ["essay", "commentary", "tok", "ia", "ee", "other"],
      user_role: ["student", "teacher", "admin", "parent"],
    },
  },
} as const
