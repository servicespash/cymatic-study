export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          about_app: string | null;
          created_at: string | null;
          id: string;
          merchant_id: string | null;
          mobile_money_details: string | null;
          support_email: string | null;
          support_price: string | null;
          updated_at: string | null;
          whatsapp_number: string | null;
        };
        Insert: {
          about_app?: string | null;
          created_at?: string | null;
          id?: string;
          merchant_id?: string | null;
          mobile_money_details?: string | null;
          support_email?: string | null;
          support_price?: string | null;
          updated_at?: string | null;
          whatsapp_number?: string | null;
        };
        Update: {
          about_app?: string | null;
          created_at?: string | null;
          id?: string;
          merchant_id?: string | null;
          mobile_money_details?: string | null;
          support_email?: string | null;
          support_price?: string | null;
          updated_at?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      content: {
        Row: {
          body: string;
          category: string | null;
          id: string;
          is_active: boolean | null;
          is_ad: boolean | null;
          media_type: string | null;
          media_url: string | null;
          priority: string | null;
          published_at: string | null;
          title: string;
        };
        Insert: {
          body: string;
          category?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_ad?: boolean | null;
          media_type?: string | null;
          media_url?: string | null;
          priority?: string | null;
          published_at?: string | null;
          title: string;
        };
        Update: {
          body?: string;
          category?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_ad?: boolean | null;
          media_type?: string | null;
          media_url?: string | null;
          priority?: string | null;
          published_at?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      content_comments: {
        Row: {
          content: string;
          content_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          content_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          content_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      daily_challenges: {
        Row: {
          assigned_date: string;
          completed_at: string | null;
          created_at: string;
          earned_points: number;
          id: string;
          is_completed: boolean;
          target_points: number;
          user_id: string;
        };
        Insert: {
          assigned_date?: string;
          completed_at?: string | null;
          created_at?: string;
          earned_points?: number;
          id?: string;
          is_completed?: boolean;
          target_points?: number;
          user_id: string;
        };
        Update: {
          assigned_date?: string;
          completed_at?: string | null;
          created_at?: string;
          earned_points?: number;
          id?: string;
          is_completed?: boolean;
          target_points?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      daily_tasks: {
        Row: {
          assigned_date: string;
          created_at: string;
          description: string;
          id: string;
          is_completed: boolean;
          reference_id: string | null;
          task_type: string;
          user_id: string;
        };
        Insert: {
          assigned_date?: string;
          created_at?: string;
          description: string;
          id?: string;
          is_completed?: boolean;
          reference_id?: string | null;
          task_type: string;
          user_id: string;
        };
        Update: {
          assigned_date?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_completed?: boolean;
          reference_id?: string | null;
          task_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      dashboard_tasks: {
        Row: {
          id: string;
          title: string;
          subject: string;
          description: string;
          task_type: string;
          points: number;
          tutor_explanation: string | null;
          created_by: string | null;
          organization_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subject: string;
          description: string;
          task_type: string;
          points?: number;
          tutor_explanation?: string | null;
          created_by?: string | null;
          organization_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subject?: string;
          description?: string;
          task_type?: string;
          points?: number;
          tutor_explanation?: string | null;
          created_by?: string | null;
          organization_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_submissions: {
        Row: {
          id: string;
          student_id: string;
          project_data: Json;
          status: Database["public"]["Enums"]["submission_status"];
          teacher_id: string | null;
          teacher_name: string | null;
          teacher_license: string | null;
          school_key: string | null;
          phase1_score: number | null;
          phase2_score: number | null;
          phase3_score: number | null;
          phase4_score: number | null;
          total_competency_score: number | null;
          teacher_comments: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          project_data?: Json;
          status?: Database["public"]["Enums"]["submission_status"];
          teacher_id?: string | null;
          teacher_name?: string | null;
          teacher_license?: string | null;
          school_key?: string | null;
          phase1_score?: number | null;
          phase2_score?: number | null;
          phase3_score?: number | null;
          phase4_score?: number | null;
          teacher_comments?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          project_data?: Json;
          status?: Database["public"]["Enums"]["submission_status"];
          teacher_id?: string | null;
          teacher_name?: string | null;
          teacher_license?: string | null;
          school_key?: string | null;
          phase1_score?: number | null;
          phase2_score?: number | null;
          phase3_score?: number | null;
          phase4_score?: number | null;
          teacher_comments?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      engagement_logs: {
        Row: {
          action: string;
          content_id: string | null;
          created_at: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          content_id?: string | null;
          created_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          content_id?: string | null;
          created_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "engagement_logs_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "news_broadcasts";
            referencedColumns: ["id"];
          },
        ];
      };
      hub_topics: {
        Row: {
          class_level: string;
          created_at: string;
          id: string;
          subject: string;
          title: string;
        };
        Insert: {
          class_level: string;
          created_at?: string;
          id?: string;
          subject: string;
          title: string;
        };
        Update: {
          class_level?: string;
          created_at?: string;
          id?: string;
          subject?: string;
          title?: string;
        };
        Relationships: [];
      };
      news_broadcasts: {
        Row: {
          body: string;
          category: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          is_ad: boolean;
          is_curriculum_update: boolean | null;
          media_provider: string | null;
          media_type: string | null;
          media_url: string | null;
          priority: string | null;
          published_at: string;
          title: string;
        };
        Insert: {
          body: string;
          category?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          is_ad?: boolean;
          is_curriculum_update?: boolean | null;
          media_provider?: string | null;
          media_type?: string | null;
          media_url?: string | null;
          priority?: string | null;
          published_at?: string;
          title: string;
        };
        Update: {
          body?: string;
          category?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          is_ad?: boolean;
          is_curriculum_update?: boolean | null;
          media_provider?: string | null;
          media_type?: string | null;
          media_url?: string | null;
          priority?: string | null;
          published_at?: string;
          title?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          created_at: string | null;
          creator_user_id: string | null;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          school_key: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_user_id?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          school_key?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_user_id?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          school_key?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          current_mood: string | null;
          display_name: string | null;
          id: string;
          org_id: string | null;
          phone: string | null;
          referral_code: string | null;
          role: string | null;
          school_name: string | null;
          tutor_persona: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_mood?: string | null;
          display_name?: string | null;
          id?: string;
          org_id?: string | null;
          phone?: string | null;
          referral_code?: string | null;
          role?: string | null;
          school_name?: string | null;
          tutor_persona?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_mood?: string | null;
          display_name?: string | null;
          id?: string;
          org_id?: string | null;
          phone?: string | null;
          referral_code?: string | null;
          role?: string | null;
          school_name?: string | null;
          tutor_persona?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_questions: {
        Row: {
          correct_index: number;
          created_at: string;
          explanation: string | null;
          id: string;
          options: string[];
          question: string;
          topic_id: string;
        };
        Insert: {
          correct_index: number;
          created_at?: string;
          explanation?: string | null;
          id: string;
          options: string[];
          question: string;
          topic_id: string;
        };
        Update: {
          correct_index?: number;
          created_at?: string;
          explanation?: string | null;
          id?: string;
          options?: string[];
          question?: string;
          topic_id?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          content_id: string;
          created_at: string;
          id: string;
          type: string;
          user_id: string;
        };
        Insert: {
          content_id: string;
          created_at?: string;
          id?: string;
          type: string;
          user_id: string;
        };
        Update: {
          content_id?: string;
          created_at?: string;
          id?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      referrals: {
        Row: {
          id: string;
          is_verified: boolean;
          referred_at: string;
          referred_user_id: string;
          referrer_id: string;
        };
        Insert: {
          id?: string;
          is_verified?: boolean;
          referred_at?: string;
          referred_user_id: string;
          referrer_id: string;
        };
        Update: {
          id?: string;
          is_verified?: boolean;
          referred_at?: string;
          referred_user_id?: string;
          referrer_id?: string;
        };
        Relationships: [];
      };
      study_guides: {
        Row: {
          content_markdown: string;
          created_at: string | null;
          id: string;
          is_offline_ready: boolean | null;
          reading_time_mins: number | null;
          topic_id: string;
        };
        Insert: {
          content_markdown: string;
          created_at?: string | null;
          id?: string;
          is_offline_ready?: boolean | null;
          reading_time_mins?: number | null;
          topic_id: string;
        };
        Update: {
          content_markdown?: string;
          created_at?: string | null;
          id?: string;
          is_offline_ready?: boolean | null;
          reading_time_mins?: number | null;
          topic_id?: string;
        };
        Relationships: [];
      };
      task_attempts: {
        Row: {
          answers: Json | null;
          created_at: string;
          id: string;
          passed: boolean;
          score_pct: number;
          topic_id: string;
          user_id: string;
        };
        Insert: {
          answers?: Json | null;
          created_at?: string;
          id?: string;
          passed: boolean;
          score_pct: number;
          topic_id: string;
          user_id: string;
        };
        Update: {
          answers?: Json | null;
          created_at?: string;
          id?: string;
          passed?: boolean;
          score_pct?: number;
          topic_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tutor_content: {
        Row: {
          content_key: string;
          content_value: string;
          language: string | null;
        };
        Insert: {
          content_key: string;
          content_value: string;
          language?: string | null;
        };
        Update: {
          content_key?: string;
          content_value?: string;
          language?: string | null;
        };
        Relationships: [];
      };
      tutor_sessions: {
        Row: {
          current_state: Json | null;
          history: Json | null;
          last_updated: string | null;
          session_id: string;
          user_id: string;
        };
        Insert: {
          current_state?: Json | null;
          history?: Json | null;
          last_updated?: string | null;
          session_id?: string;
          user_id: string;
        };
        Update: {
          current_state?: Json | null;
          history?: Json | null;
          last_updated?: string | null;
          session_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_points: {
        Row: {
          created_at: string;
          id: string;
          meta: Json | null;
          points: number;
          source: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          meta?: Json | null;
          points?: number;
          source: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          meta?: Json | null;
          points?: number;
          source?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          category_id: string;
          created_at: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          is_verified: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_verified?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_verified?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      view_table_stats: {
        Row: {
          column_count: number | null;
          table_name: unknown;
        };
        Relationships: [];
      };
    };
    Functions: {
      _auth_uid: { Args: never; Returns: string };
      dblink: { Args: { "": string }; Returns: Record<string, unknown>[] };
      dblink_cancel_query: { Args: { "": string }; Returns: string };
      dblink_close: { Args: { "": string }; Returns: string };
      dblink_connect: { Args: { "": string }; Returns: string };
      dblink_connect_u: { Args: { "": string }; Returns: string };
      dblink_current_query: { Args: never; Returns: string };
      dblink_disconnect:
        { Args: never; Returns: string } | { Args: { "": string }; Returns: string };
      dblink_error_message: { Args: { "": string }; Returns: string };
      dblink_exec: { Args: { "": string }; Returns: string };
      dblink_fdw_validator: {
        Args: { catalog: unknown; options: string[] };
        Returns: undefined;
      };
      dblink_get_connections: { Args: never; Returns: string[] };
      dblink_get_notify:
        | { Args: { conname: string }; Returns: Record<string, unknown>[] }
        | { Args: never; Returns: Record<string, unknown>[] };
      dblink_get_pkey: {
        Args: { "": string };
        Returns: Database["public"]["CompositeTypes"]["dblink_pkey_results"][];
        SetofOptions: {
          from: "*";
          to: "dblink_pkey_results";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      dblink_get_result: {
        Args: { "": string };
        Returns: Record<string, unknown>[];
      };
      dblink_is_busy: { Args: { "": string }; Returns: number };
      generate_school_key: { Args: { _name: string }; Returns: string };
      get_or_create_daily_task: { Args: never; Returns: Json };
      get_user_streak: { Args: { uid: string }; Returns: number };
      has_role: {
        Args: {
          requested_role: Database["public"]["Enums"]["app_role"];
          uid: string;
        };
        Returns: boolean;
      };
      record_referral: {
        Args: { new_user_id: string; referrer_code: string };
        Returns: undefined;
      };
      register_institution: {
        Args: { _email: string; _name: string; _phone?: string };
        Returns: Json;
      };
      resolve_identifier: { Args: { identifier: string }; Returns: string };
      submit_quiz_attempt:
        | { Args: { _answers: Json; _topic_id: string }; Returns: Json }
        | { Args: { _score_pct: number; _topic_id: string }; Returns: Json };
    };
    Enums: {
      app_role: "admin" | "student" | "teacher";
      submission_status: "draft" | "pending" | "verified";
    };
    CompositeTypes: {
      dblink_pkey_results: {
        position: number | null;
        colname: string | null;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "student", "teacher"],
      submission_status: ["draft", "pending", "verified"],
    },
  },
} as const;
