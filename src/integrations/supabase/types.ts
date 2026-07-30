export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          id: number;
          merchant_id: string | null;
          support_email: string | null;
          support_price: string | null;
          updated_at: string;
          whatsapp_number: string | null;
        };
        Insert: {
          id?: number;
          merchant_id?: string | null;
          support_email?: string | null;
          support_price?: string | null;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Update: {
          id?: number;
          merchant_id?: string | null;
          support_email?: string | null;
          support_price?: string | null;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          content: string | null;
          created_at: string;
          file_name: string | null;
          file_type: string | null;
          file_url: string | null;
          id: string;
          level: string | null;
          org_id: string | null;
          user_id: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          file_name?: string | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          level?: string | null;
          org_id?: string | null;
          user_id: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          file_name?: string | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          level?: string | null;
          org_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      content_comments: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_tasks: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_completed: boolean;
          task_date: string;
          task_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          is_completed?: boolean;
          task_date?: string;
          task_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_completed?: boolean;
          task_date?: string;
          task_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      news_broadcasts: {
        Row: {
          body: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          is_ad: boolean;
          media_type: string | null;
          media_url: string | null;
          published_at: string;
          title: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          is_ad?: boolean;
          media_type?: string | null;
          media_url?: string | null;
          published_at?: string;
          title: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          is_ad?: boolean;
          media_type?: string | null;
          media_url?: string | null;
          published_at?: string;
          title?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          created_at: string;
          creator_user_id: string | null;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          school_key: string | null;
        };
        Insert: {
          created_at?: string;
          creator_user_id?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          school_key?: string | null;
        };
        Update: {
          created_at?: string;
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
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          full_name: string | null;
          id: string;
          is_verified: boolean;
          level: string | null;
          org_id: string | null;
          phone: string | null;
          role: string | null;
          school_name: string | null;
          teacher_license_id: string | null;
          updated_at: string;
          user_id: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          full_name?: string | null;
          id: string;
          is_verified?: boolean;
          level?: string | null;
          org_id?: string | null;
          phone?: string | null;
          role?: string | null;
          school_name?: string | null;
          teacher_license_id?: string | null;
          updated_at?: string;
          user_id: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          full_name?: string | null;
          id?: string;
          is_verified?: boolean;
          level?: string | null;
          org_id?: string | null;
          phone?: string | null;
          role?: string | null;
          school_name?: string | null;
          teacher_license_id?: string | null;
          updated_at?: string;
          user_id?: string;
          username?: string | null;
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
      project_submissions: {
        Row: {
          student_name: string | null;
          student_id: string | null;
          level: string | null;
          stream: string | null;
          subject: string | null;
          project_title: string | null;
          project_description: string | null;
          score: number | null;
          feedback: string | null;
          awarded_grade: string | null;
          awarded_score: number | null;
          created_at: string;
          id: string;
          is_verified: boolean;
          marked_by: string | null;
          marking_token: string | null;
          org_id: string | null;
          phase1_score: number | null;
          phase2_score: number | null;
          phase3_score: number | null;
          phase4_score: number | null;
          project_data: Json | null;
          project_id: string | null;
          project_payload: Json | null;
          remarks: string | null;
          school_key: string | null;
          school_reference_key: string | null;
          status: string;
          student_email: string | null;
          submitted_at: string | null;
          teacher_comments: string | null;
          teacher_id: string | null;
          teacher_license: string | null;
          teacher_license_id: string | null;
          teacher_name: string | null;
          teacher_title: string | null;
          teacher_token: string;
          total_competency_score: number | null;
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          student_name?: string | null;
          student_id?: string | null;
          level?: string | null;
          stream?: string | null;
          subject?: string | null;
          project_title?: string | null;
          project_description?: string | null;
          score?: number | null;
          feedback?: string | null;
          awarded_grade?: string | null;
          awarded_score?: number | null;
          created_at?: string;
          id?: string;
          is_verified?: boolean;
          marked_by?: string | null;
          marking_token?: string | null;
          org_id?: string | null;
          phase1_score?: number | null;
          phase2_score?: number | null;
          phase3_score?: number | null;
          phase4_score?: number | null;
          project_data?: Json | null;
          project_id?: string | null;
          project_payload?: Json | null;
          remarks?: string | null;
          school_key?: string | null;
          school_reference_key?: string | null;
          status?: string;
          student_email?: string | null;
          submitted_at?: string | null;
          teacher_comments?: string | null;
          teacher_id?: string | null;
          teacher_license?: string | null;
          teacher_license_id?: string | null;
          teacher_name?: string | null;
          teacher_title?: string | null;
          teacher_token?: string;
          total_competency_score?: number | null;
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          student_name?: string | null;
          student_id?: string | null;
          level?: string | null;
          stream?: string | null;
          subject?: string | null;
          project_title?: string | null;
          project_description?: string | null;
          score?: number | null;
          feedback?: string | null;
          awarded_grade?: string | null;
          awarded_score?: number | null;
          created_at?: string;
          id?: string;
          is_verified?: boolean;
          marked_by?: string | null;
          marking_token?: string | null;
          org_id?: string | null;
          phase1_score?: number | null;
          phase2_score?: number | null;
          phase3_score?: number | null;
          phase4_score?: number | null;
          project_data?: Json | null;
          project_id?: string | null;
          project_payload?: Json | null;
          remarks?: string | null;
          school_key?: string | null;
          school_reference_key?: string | null;
          status?: string;
          student_email?: string | null;
          submitted_at?: string | null;
          teacher_comments?: string | null;
          teacher_id?: string | null;
          teacher_license?: string | null;
          teacher_license_id?: string | null;
          teacher_name?: string | null;
          teacher_title?: string | null;
          teacher_token?: string;
          total_competency_score?: number | null;
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      registry_members: {
        Row: {
          id: string;
          org_id: string;
          full_name: string;
          email: string;
          role: string;
          level: string | null;
          registry_code: string;
          status: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          full_name: string;
          email: string;
          role: string;
          level?: string | null;
          registry_code: string;
          status: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          full_name?: string;
          email?: string;
          role?: string;
          level?: string | null;
          registry_code?: string;
          status?: string;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          answers: Json;
          created_at: string;
          id: string;
          score: number;
          topic_id: string;
          total: number;
          user_id: string;
        };
        Insert: {
          answers?: Json;
          created_at?: string;
          id?: string;
          score?: number;
          topic_id: string;
          total?: number;
          user_id: string;
        };
        Update: {
          answers?: Json;
          created_at?: string;
          id?: string;
          score?: number;
          topic_id?: string;
          total?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          type: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          type: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          type?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      engagement_logs: {
        Row: {
          id: string;
          user_id: string | null;
          content_id: string | null;
          action: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          content_id?: string | null;
          action: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          content_id?: string | null;
          action?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      user_bookmarks: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      user_feedback: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          section: string;
          status: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          section: string;
          status?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          section?: string;
          status?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_points: {
        Row: {
          created_at: string;
          id: string;
          points: number;
          reason: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          points?: number;
          reason?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          points?: number;
          reason?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      enroll_self_in_school: {
        Args: { _level: string; _phone?: string; _school_key: string };
        Returns: Json;
      };
      generate_school_key: { Args: { _name: string }; Returns: string };
      get_or_create_daily_task: {
        Args: never;
        Returns: {
          created_at: string;
          description: string;
          id: string;
          is_completed: boolean;
          task_date: string;
          task_type: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "daily_tasks";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_submission_by_token: { Args: { _token: string }; Returns: Json };
      get_user_streak: { Args: { uid: string }; Returns: number };
      has_role: {
        Args: { requested_role: string; uid: string };
        Returns: boolean;
      };
      lookup_organization_by_key: {
        Args: { _school_key: string };
        Returns: {
          id: string;
          name: string;
        }[];
      };
      register_institution: {
        Args: { _email: string; _name: string; _phone?: string };
        Returns: Json;
      };
      resolve_identifier: { Args: { identifier: string }; Returns: string };
      submit_evaluation_by_token: {
        Args: {
          _phase1: number;
          _phase2: number;
          _phase3: number;
          _phase4: number;
          _remarks: string;
          _teacher_license?: string;
          _teacher_name: string;
          _teacher_title?: string;
          _token: string;
        };
        Returns: Json;
      };
      submit_quiz_attempt: {
        Args: { _answers: Json; _topic_id: string };
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
  public: {
    Enums: {},
  },
} as const;
