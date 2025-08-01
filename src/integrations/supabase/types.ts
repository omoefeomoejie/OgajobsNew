export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_direct_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          recipient_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          recipient_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          recipient_email?: string
        }
        Relationships: []
      }
      admin_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          sender_email: string | null
          target_group: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          sender_email?: string | null
          target_group?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          sender_email?: string | null
          target_group?: string | null
        }
        Relationships: []
      }
      artisan_reviews: {
        Row: {
          artisan_id: string | null
          client_email: string
          created_at: string | null
          id: string
          rating: number
          review: string | null
        }
        Insert: {
          artisan_id?: string | null
          client_email: string
          created_at?: string | null
          id?: string
          rating: number
          review?: string | null
        }
        Update: {
          artisan_id?: string | null
          client_email?: string
          created_at?: string | null
          id?: string
          rating?: number
          review?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artisan_reviews_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
        ]
      }
      artisans: {
        Row: {
          category: string | null
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          message: string | null
          phone: string | null
          photo_url: string | null
          profile_url: string | null
          skill: string | null
          slug: string | null
          suspended: boolean | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          photo_url?: string | null
          profile_url?: string | null
          skill?: string | null
          slug?: string | null
          suspended?: boolean | null
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          photo_url?: string | null
          profile_url?: string | null
          skill?: string | null
          slug?: string | null
          suspended?: boolean | null
        }
        Relationships: []
      }
      assignments: {
        Row: {
          artisan_email: string | null
          city: string | null
          client_email: string | null
          id: string
          preferred_date: string | null
          statcreated_atus: string | null
          work_type: string | null
        }
        Insert: {
          artisan_email?: string | null
          city?: string | null
          client_email?: string | null
          id?: string
          preferred_date?: string | null
          statcreated_atus?: string | null
          work_type?: string | null
        }
        Update: {
          artisan_email?: string | null
          city?: string | null
          client_email?: string | null
          id?: string
          preferred_date?: string | null
          statcreated_atus?: string | null
          work_type?: string | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          artisan_id: string | null
          created_at: string | null
          day: string | null
          end_time: string | null
          id: number
          start_time: string | null
        }
        Insert: {
          artisan_id?: string | null
          created_at?: string | null
          day?: string | null
          end_time?: string | null
          id?: number
          start_time?: string | null
        }
        Update: {
          artisan_id?: string | null
          created_at?: string | null
          day?: string | null
          end_time?: string | null
          id?: number
          start_time?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          artisan_email: string | null
          city: string | null
          client_email: string | null
          created_at: string | null
          id: string
          preferred_date: string | null
          work_type: string | null
        }
        Insert: {
          artisan_email?: string | null
          city?: string | null
          client_email?: string | null
          created_at?: string | null
          id?: string
          preferred_date?: string | null
          work_type?: string | null
        }
        Update: {
          artisan_email?: string | null
          city?: string | null
          client_email?: string | null
          created_at?: string | null
          id?: string
          preferred_date?: string | null
          work_type?: string | null
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          target_audience: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          target_audience?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          target_audience?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          artisan_email: string | null
          artisan_id: string | null
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          message: string | null
          phone: string | null
          preferred_date: string | null
          status: string | null
          work_type: string | null
        }
        Insert: {
          artisan_email?: string | null
          artisan_id?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          preferred_date?: string | null
          status?: string | null
          work_type?: string | null
        }
        Update: {
          artisan_email?: string | null
          artisan_id?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          preferred_date?: string | null
          status?: string | null
          work_type?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          artisan_id: string | null
          client_email: string | null
          created_at: string
          id: string
        }
        Insert: {
          artisan_id?: string | null
          client_email?: string | null
          created_at: string
          id?: string
        }
        Update: {
          artisan_id?: string | null
          client_email?: string | null
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      earnings: {
        Row: {
          amount: number | null
          amount_paid: number | null
          artisan_earnings: number | null
          artisan_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          job_id: string | null
          paid_at: string | null
          payment_status: string | null
          payout_status: string | null
          platform_fee: number | null
        }
        Insert: {
          amount?: number | null
          amount_paid?: number | null
          artisan_earnings?: number | null
          artisan_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          paid_at?: string | null
          payment_status?: string | null
          payout_status?: string | null
          platform_fee?: number | null
        }
        Update: {
          amount?: number | null
          amount_paid?: number | null
          artisan_earnings?: number | null
          artisan_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          paid_at?: string | null
          payment_status?: string | null
          payout_status?: string | null
          platform_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "earnings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assignments: {
        Row: {
          admin_notes: string | null
          artisan_id: string | null
          assigned_at: string | null
          client_id: string | null
          id: string
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          artisan_id?: string | null
          assigned_at?: string | null
          client_id?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          artisan_id?: string | null
          assigned_at?: string | null
          client_id?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_assignments_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      job_history: {
        Row: {
          artisan_id: string | null
          client_name: string | null
          id: string
          job_date: string | null
          job_type: string | null
          notes: string | null
          status: string | null
        }
        Insert: {
          artisan_id?: string | null
          client_name?: string | null
          id?: string
          job_date?: string | null
          job_type?: string | null
          notes?: string | null
          status?: string | null
        }
        Update: {
          artisan_id?: string | null
          client_name?: string | null
          id?: string
          job_date?: string | null
          job_type?: string | null
          notes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          action: string | null
          description: string | null
          id: string
          timestamp: string | null
          user_email: string | null
        }
        Insert: {
          action?: string | null
          description?: string | null
          id?: string
          timestamp?: string | null
          user_email?: string | null
        }
        Update: {
          action?: string | null
          description?: string | null
          id?: string
          timestamp?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          artisan_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          status: string | null
        }
        Insert: {
          artisan_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          artisan_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          read: boolean | null
          receiver_email: string
          sender_email: string
        }
        Insert: {
          conversation_id?: string
          created_at: string
          id?: string
          message: string
          read?: boolean | null
          receiver_email: string
          sender_email: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          receiver_email?: string
          sender_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_old: {
        Row: {
          artisan_id: string | null
          created_at: string | null
          id: string
          message: string | null
          sender_email: string | null
        }
        Insert: {
          artisan_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          sender_email?: string | null
        }
        Update: {
          artisan_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          sender_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          target_audience: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          target_audience?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          target_audience?: string | null
          title?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          report_type: string
          reported_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          report_type: string
          reported_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          report_type?: string
          reported_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          artisan_id: string | null
          client_name: string | null
          created_at: string | null
          id: string
          rating: number | null
          review: string | null
        }
        Insert: {
          artisan_id?: string | null
          client_name?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          review?: string | null
        }
        Update: {
          artisan_id?: string | null
          client_name?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          review?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          conversation_id: string | null
          created_at: string | null
          description: string | null
          id: string
          issue_type: string | null
          message: string | null
          sender_email: string | null
          status: string | null
        }
        Insert: {
          admin_reply?: string | null
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          issue_type?: string | null
          message?: string | null
          sender_email?: string | null
          status?: string | null
        }
        Update: {
          admin_reply?: string | null
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          issue_type?: string | null
          message?: string | null
          sender_email?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user: {
        Args: { uid: string }
        Returns: undefined
      }
      get_all_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          role: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
