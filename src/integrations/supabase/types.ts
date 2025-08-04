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
      agent_referrals: {
        Row: {
          agent_id: string | null
          artisan_id: string | null
          commission_status: string | null
          created_at: string | null
          id: string
          onboarding_date: string | null
          referral_code: string | null
          total_commission_generated: number | null
          total_jobs_completed: number | null
          verification_status: string | null
        }
        Insert: {
          agent_id?: string | null
          artisan_id?: string | null
          commission_status?: string | null
          created_at?: string | null
          id?: string
          onboarding_date?: string | null
          referral_code?: string | null
          total_commission_generated?: number | null
          total_jobs_completed?: number | null
          verification_status?: string | null
        }
        Update: {
          agent_id?: string | null
          artisan_id?: string | null
          commission_status?: string | null
          created_at?: string | null
          id?: string
          onboarding_date?: string | null
          referral_code?: string | null
          total_commission_generated?: number | null
          total_jobs_completed?: number | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_referrals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "pos_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_referrals_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
        ]
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
          artisan_id: string | null
          budget: number | null
          city: string | null
          client_email: string | null
          completion_date: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_status: string | null
          preferred_date: string | null
          status: string | null
          updated_at: string | null
          urgency: string | null
          work_type: string | null
        }
        Insert: {
          artisan_email?: string | null
          artisan_id?: string | null
          budget?: number | null
          city?: string | null
          client_email?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_status?: string | null
          preferred_date?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
          work_type?: string | null
        }
        Update: {
          artisan_email?: string | null
          artisan_id?: string | null
          budget?: number | null
          city?: string | null
          client_email?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_status?: string | null
          preferred_date?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
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
      commission_transactions: {
        Row: {
          agent_id: string | null
          amount: number
          artisan_id: string | null
          base_amount: number | null
          booking_id: string | null
          commission_rate: number | null
          created_at: string | null
          id: string
          payment_date: string | null
          status: string | null
          transaction_type: string
        }
        Insert: {
          agent_id?: string | null
          amount: number
          artisan_id?: string | null
          base_amount?: number | null
          booking_id?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          status?: string | null
          transaction_type: string
        }
        Update: {
          agent_id?: string | null
          amount?: number
          artisan_id?: string | null
          base_amount?: number | null
          booking_id?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          status?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "pos_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_transactions_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      dispute_activities: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          dispute_id: string
          id: string
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          dispute_id: string
          id?: string
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          dispute_id?: string
          id?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_activities_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_evidence: {
        Row: {
          created_at: string
          description: string | null
          dispute_id: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dispute_id: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dispute_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          created_at: string
          dispute_id: string
          id: string
          is_internal: boolean | null
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          id?: string
          is_internal?: boolean | null
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          id?: string
          is_internal?: boolean | null
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_notes: string | null
          booking_id: string | null
          category: Database["public"]["Enums"]["dispute_category"]
          complainant_id: string
          created_at: string
          description: string
          id: string
          priority: number | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          respondent_id: string
          status: Database["public"]["Enums"]["dispute_status"]
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          booking_id?: string | null
          category: Database["public"]["Enums"]["dispute_category"]
          complainant_id: string
          created_at?: string
          description: string
          id?: string
          priority?: number | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          respondent_id: string
          status?: Database["public"]["Enums"]["dispute_status"]
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string | null
          category?: Database["public"]["Enums"]["dispute_category"]
          complainant_id?: string
          created_at?: string
          description?: string
          id?: string
          priority?: number | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          respondent_id?: string
          status?: Database["public"]["Enums"]["dispute_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      escrow_payments: {
        Row: {
          amount: number
          artisan_amount: number
          artisan_id: string | null
          auto_release_date: string | null
          booking_id: string | null
          client_id: string | null
          created_at: string | null
          dispute_reason: string | null
          id: string
          platform_fee: number
          release_date: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          artisan_amount: number
          artisan_id?: string | null
          auto_release_date?: string | null
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          dispute_reason?: string | null
          id?: string
          platform_fee: number
          release_date?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          artisan_amount?: number
          artisan_id?: string | null
          auto_release_date?: string | null
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          dispute_reason?: string | null
          id?: string
          platform_fee?: number
          release_date?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          address: string | null
          artisan_id: string | null
          created_at: string | null
          date_of_birth: string | null
          document_image_url: string | null
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          expires_at: string | null
          full_name: string
          id: string
          selfie_url: string | null
          updated_at: string | null
          verification_notes: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          artisan_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          document_image_url?: string | null
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          expires_at?: string | null
          full_name: string
          id?: string
          selfie_url?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          artisan_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          document_image_url?: string | null
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          expires_at?: string | null
          full_name?: string
          id?: string
          selfie_url?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      payment_transactions: {
        Row: {
          amount: number
          artisan_earnings: number | null
          artisan_id: string | null
          booking_id: string | null
          client_id: string | null
          created_at: string | null
          currency: string | null
          escrow_status: string | null
          id: string
          payment_status: string | null
          paystack_reference: string | null
          platform_fee: number | null
          transaction_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          artisan_earnings?: number | null
          artisan_id?: string | null
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          escrow_status?: string | null
          id?: string
          payment_status?: string | null
          paystack_reference?: string | null
          platform_fee?: number | null
          transaction_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          artisan_earnings?: number | null
          artisan_id?: string | null
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          escrow_status?: string | null
          id?: string
          payment_status?: string | null
          paystack_reference?: string | null
          platform_fee?: number | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      portfolio_analytics: {
        Row: {
          booking_requests: number | null
          contact_clicks: number | null
          created_at: string | null
          id: string
          package_views: Json | null
          portfolio_id: string
          project_views: Json | null
          referrer_sources: Json | null
          total_views: number | null
          view_date: string
        }
        Insert: {
          booking_requests?: number | null
          contact_clicks?: number | null
          created_at?: string | null
          id?: string
          package_views?: Json | null
          portfolio_id: string
          project_views?: Json | null
          referrer_sources?: Json | null
          total_views?: number | null
          view_date?: string
        }
        Update: {
          booking_requests?: number | null
          contact_clicks?: number | null
          created_at?: string | null
          id?: string
          package_views?: Json | null
          portfolio_id?: string
          project_views?: Json | null
          referrer_sources?: Json | null
          total_views?: number | null
          view_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_analytics_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_projects: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          category: string
          client_name: string | null
          completion_date: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          materials_used: string[] | null
          portfolio_id: string
          project_cost: number | null
          project_duration: string | null
          project_images: string[] | null
          title: string
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          category: string
          client_name?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          materials_used?: string[] | null
          portfolio_id: string
          project_cost?: number | null
          project_duration?: string | null
          project_images?: string[] | null
          title: string
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          category?: string
          client_name?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          materials_used?: string[] | null
          portfolio_id?: string
          project_cost?: number | null
          project_duration?: string | null
          project_images?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_projects_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_skills: {
        Row: {
          certification_authority: string | null
          certification_date: string | null
          certification_expiry: string | null
          certification_name: string | null
          certification_url: string | null
          created_at: string | null
          id: string
          portfolio_id: string
          skill_level: number | null
          skill_name: string
          years_experience: number | null
        }
        Insert: {
          certification_authority?: string | null
          certification_date?: string | null
          certification_expiry?: string | null
          certification_name?: string | null
          certification_url?: string | null
          created_at?: string | null
          id?: string
          portfolio_id: string
          skill_level?: number | null
          skill_name: string
          years_experience?: number | null
        }
        Update: {
          certification_authority?: string | null
          certification_date?: string | null
          certification_expiry?: string | null
          certification_name?: string | null
          certification_url?: string | null
          created_at?: string | null
          id?: string
          portfolio_id?: string
          skill_level?: number | null
          skill_name?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_skills_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_testimonials: {
        Row: {
          client_avatar_url: string | null
          client_name: string
          completion_date: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          portfolio_id: string
          project_title: string | null
          rating: number | null
          testimonial: string
        }
        Insert: {
          client_avatar_url?: string | null
          client_name: string
          completion_date?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          portfolio_id: string
          project_title?: string | null
          rating?: number | null
          testimonial: string
        }
        Update: {
          client_avatar_url?: string | null
          client_name?: string
          completion_date?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          portfolio_id?: string
          project_title?: string | null
          rating?: number | null
          testimonial?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_testimonials_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          artisan_id: string
          availability_status: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string | null
          featured: boolean | null
          hourly_rate: number | null
          id: string
          is_public: boolean | null
          location: Json | null
          portfolio_views: number | null
          profile_image_url: string | null
          specialties: string[] | null
          title: string
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          artisan_id: string
          availability_status?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          featured?: boolean | null
          hourly_rate?: number | null
          id?: string
          is_public?: boolean | null
          location?: Json | null
          portfolio_views?: number | null
          profile_image_url?: string | null
          specialties?: string[] | null
          title: string
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          artisan_id?: string
          availability_status?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          featured?: boolean | null
          hourly_rate?: number | null
          id?: string
          is_public?: boolean | null
          location?: Json | null
          portfolio_views?: number | null
          profile_image_url?: string | null
          specialties?: string[] | null
          title?: string
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      pos_agents: {
        Row: {
          agent_code: string
          commission_rate: number | null
          created_at: string | null
          id: string
          location: Json | null
          phone: string
          status: string | null
          total_artisans_onboarded: number | null
          total_commission_earned: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_code: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          location?: Json | null
          phone: string
          status?: string | null
          total_artisans_onboarded?: number | null
          total_commission_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_code?: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          location?: Json | null
          phone?: string
          status?: string | null
          total_artisans_onboarded?: number | null
          total_commission_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_verified: boolean | null
          role: string | null
          skills_verified: boolean | null
          trust_score: number | null
          verification_level: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_verified?: boolean | null
          role?: string | null
          skills_verified?: boolean | null
          trust_score?: number | null
          verification_level?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_verified?: boolean | null
          role?: string | null
          skills_verified?: boolean | null
          trust_score?: number | null
          verification_level?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
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
      service_packages: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          duration: string | null
          id: string
          includes: string[] | null
          is_popular: boolean | null
          package_name: string
          portfolio_id: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          id?: string
          includes?: string[] | null
          is_popular?: boolean | null
          package_name: string
          portfolio_id: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          id?: string
          includes?: string[] | null
          is_popular?: boolean | null
          package_name?: string
          portfolio_id?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      service_pricing: {
        Row: {
          average_price: number
          city: string
          id: string
          last_updated: string | null
          max_price: number
          min_price: number
          price_factors: Json | null
          recommended_price: number
          service_category: string
          service_subcategory: string
          updated_by: string | null
        }
        Insert: {
          average_price: number
          city: string
          id?: string
          last_updated?: string | null
          max_price: number
          min_price: number
          price_factors?: Json | null
          recommended_price: number
          service_category: string
          service_subcategory: string
          updated_by?: string | null
        }
        Update: {
          average_price?: number
          city?: string
          id?: string
          last_updated?: string | null
          max_price?: number
          min_price?: number
          price_factors?: Json | null
          recommended_price?: number
          service_category?: string
          service_subcategory?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_pricing_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_certifications: {
        Row: {
          artisan_id: string | null
          certificate_url: string | null
          certification_level: string
          certification_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          skill_name: string
          updated_at: string | null
          verification_score: number | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          artisan_id?: string | null
          certificate_url?: string | null
          certification_level: string
          certification_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          skill_name: string
          updated_at?: string | null
          verification_score?: number | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          artisan_id?: string | null
          certificate_url?: string | null
          certification_level?: string
          certification_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          skill_name?: string
          updated_at?: string | null
          verification_score?: number | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_certifications_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_certifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      trust_metrics: {
        Row: {
          artisan_id: string | null
          average_rating: number | null
          dispute_rate: number | null
          id: string
          identity_verified: boolean | null
          last_updated: string | null
          on_time_completion_rate: number | null
          repeat_client_rate: number | null
          response_time_hours: number | null
          skills_verified: number | null
          total_jobs_completed: number | null
          trust_score: number | null
          verified_since: string | null
        }
        Insert: {
          artisan_id?: string | null
          average_rating?: number | null
          dispute_rate?: number | null
          id?: string
          identity_verified?: boolean | null
          last_updated?: string | null
          on_time_completion_rate?: number | null
          repeat_client_rate?: number | null
          response_time_hours?: number | null
          skills_verified?: number | null
          total_jobs_completed?: number | null
          trust_score?: number | null
          verified_since?: string | null
        }
        Update: {
          artisan_id?: string | null
          average_rating?: number | null
          dispute_rate?: number | null
          id?: string
          identity_verified?: boolean | null
          last_updated?: string | null
          on_time_completion_rate?: number | null
          repeat_client_rate?: number | null
          response_time_hours?: number | null
          skills_verified?: number | null
          total_jobs_completed?: number | null
          trust_score?: number | null
          verified_since?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_metrics_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          booking_updates: boolean
          created_at: string
          email_notifications: boolean
          id: string
          marketing_emails: boolean
          message_alerts: boolean
          payment_notifications: boolean
          push_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_updates?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          message_alerts?: boolean
          payment_notifications?: boolean
          push_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_updates?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          message_alerts?: boolean
          payment_notifications?: boolean
          push_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_name: string
          amount: number
          artisan_id: string | null
          bank_account_number: string
          bank_code: string
          created_at: string | null
          id: string
          paystack_transfer_code: string | null
          processed_at: string | null
          status: string | null
        }
        Insert: {
          account_name: string
          amount: number
          artisan_id?: string | null
          bank_account_number: string
          bank_code: string
          created_at?: string | null
          id?: string
          paystack_transfer_code?: string | null
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          account_name?: string
          amount?: number
          artisan_id?: string | null
          bank_account_number?: string
          bank_code?: string
          created_at?: string | null
          id?: string
          paystack_transfer_code?: string | null
          processed_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_artisan_earnings: {
        Args: { amount: number }
        Returns: number
      }
      calculate_platform_fee: {
        Args: { amount: number }
        Returns: number
      }
      calculate_trust_score: {
        Args: { artisan_user_id: string }
        Returns: number
      }
      complete_booking: {
        Args: { booking_id_param: string; completed_by_param: string }
        Returns: Json
      }
      delete_user: {
        Args: { uid: string }
        Returns: undefined
      }
      get_agent_dashboard_stats: {
        Args: { p_agent_user_id: string }
        Returns: Json
      }
      get_all_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          role: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      increment_portfolio_views: {
        Args: { portfolio_id_param: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_dispute_activity: {
        Args: {
          dispute_id_param: string
          action_param: string
          performed_by_param: string
          details_param?: Json
        }
        Returns: undefined
      }
      onboard_artisan_by_agent: {
        Args: {
          p_agent_user_id: string
          p_artisan_name: string
          p_artisan_phone: string
          p_artisan_email: string
          p_service_category: string
          p_location: Json
          p_referral_code?: string
        }
        Returns: Json
      }
      setup_admin_user: {
        Args: { admin_email: string; admin_user_id: string }
        Returns: undefined
      }
      update_dispute_status: {
        Args: {
          dispute_id_param: string
          new_status_param: Database["public"]["Enums"]["dispute_status"]
          resolution_param?: string
          admin_notes_param?: string
        }
        Returns: undefined
      }
      update_verification_level: {
        Args: { artisan_user_id: string }
        Returns: string
      }
    }
    Enums: {
      dispute_category:
        | "quality_of_work"
        | "payment_issues"
        | "communication_problems"
        | "incomplete_work"
        | "property_damage"
        | "schedule_conflicts"
        | "safety_concerns"
        | "billing_disputes"
        | "contract_violations"
        | "other"
      dispute_status:
        | "open"
        | "under_review"
        | "awaiting_response"
        | "resolved"
        | "closed"
      document_type:
        | "nin"
        | "voters_card"
        | "drivers_license"
        | "international_passport"
        | "business_registration"
      verification_status: "pending" | "verified" | "rejected" | "expired"
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
      dispute_category: [
        "quality_of_work",
        "payment_issues",
        "communication_problems",
        "incomplete_work",
        "property_damage",
        "schedule_conflicts",
        "safety_concerns",
        "billing_disputes",
        "contract_violations",
        "other",
      ],
      dispute_status: [
        "open",
        "under_review",
        "awaiting_response",
        "resolved",
        "closed",
      ],
      document_type: [
        "nin",
        "voters_card",
        "drivers_license",
        "international_passport",
        "business_registration",
      ],
      verification_status: ["pending", "verified", "rejected", "expired"],
    },
  },
} as const
