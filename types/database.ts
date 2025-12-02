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
      account_deletions: {
        Row: {
          completed_at: string | null
          reason: string | null
          requested_at: string
          scheduled_for: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          reason?: string | null
          requested_at?: string
          scheduled_for?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          reason?: string | null
          requested_at?: string
          scheduled_for?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_timeline: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          occurred_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_timeline_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_recipients: {
        Row: {
          alert_id: string
          created_at: string
          delivery_status: string | null
          failure_reason: string | null
          sent_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          delivery_status?: string | null
          failure_reason?: string | null
          sent_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          delivery_status?: string | null
          failure_reason?: string | null
          sent_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_recipients_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          body: string | null
          body_html: string | null
          body_text: string | null
          created_at: string | null
          created_by: string | null
          fetched_at: string | null
          from_email: string | null
          gmail_id: string
          id: string
          labels: string[] | null
          received_at: string
          scheduled_for: string | null
          snippet: string | null
          starred: boolean | null
          status: string | null
          subject: string | null
          thread_id: string | null
          to_email: string | null
          unread: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          created_by?: string | null
          fetched_at?: string | null
          from_email?: string | null
          gmail_id: string
          id?: string
          labels?: string[] | null
          received_at: string
          scheduled_for?: string | null
          snippet?: string | null
          starred?: boolean | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          to_email?: string | null
          unread?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          created_by?: string | null
          fetched_at?: string | null
          from_email?: string | null
          gmail_id?: string
          id?: string
          labels?: string[] | null
          received_at?: string
          scheduled_for?: string | null
          snippet?: string | null
          starred?: boolean | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          to_email?: string | null
          unread?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_stats_history: {
        Row: {
          metric_name: string
          metric_value: number
          platform: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          metric_name: string
          metric_value: number
          platform: string
          recorded_at?: string
          user_id: string
        }
        Update: {
          metric_name?: string
          metric_value?: number
          platform?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_stats_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_stats_unified: {
        Row: {
          codechef_global_rank: number | null
          codechef_rating: number | null
          codeforces_rating: number | null
          current_level: string | null
          github_contributions: number | null
          hackerrank_badges: number | null
          hackerrank_certificates: number | null
          last_updated_at: string | null
          leetcode_problems: number | null
          total_xp: number | null
          user_id: string
        }
        Insert: {
          codechef_global_rank?: number | null
          codechef_rating?: number | null
          codeforces_rating?: number | null
          current_level?: string | null
          github_contributions?: number | null
          hackerrank_badges?: number | null
          hackerrank_certificates?: number | null
          last_updated_at?: string | null
          leetcode_problems?: number | null
          total_xp?: number | null
          user_id: string
        }
        Update: {
          codechef_global_rank?: number | null
          codechef_rating?: number | null
          codeforces_rating?: number | null
          current_level?: string | null
          github_contributions?: number | null
          hackerrank_badges?: number | null
          hackerrank_certificates?: number | null
          last_updated_at?: string | null
          leetcode_problems?: number | null
          total_xp?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_stats_unified_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          like_count: number | null
          parent_id: string | null
          post_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          like_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          like_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          expires_at: string | null
          export_url: string | null
          id: string
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          expires_at?: string | null
          export_url?: string | null
          id?: string
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          expires_at?: string | null
          export_url?: string | null
          id?: string
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          attachments: Json | null
          body_html: string | null
          body_text: string | null
          created_at: string | null
          id: string
          status: string | null
          subject: string
          to_email: string
        }
        Insert: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          subject: string
          to_email: string
        }
        Update: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      event_analytics: {
        Row: {
          event_id: string
          participants: number | null
          registrations: number | null
          views: number | null
        }
        Insert: {
          event_id: string
          participants?: number | null
          registrations?: number | null
          views?: number | null
        }
        Update: {
          event_id?: string
          participants?: number | null
          registrations?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      event_comments: {
        Row: {
          body: string
          created_at: string | null
          event_id: string | null
          id: string
          parent_id: string | null
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          parent_id?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          parent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "event_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_form_responses: {
        Row: {
          form_id: string | null
          id: string
          response: Json
          submitted_at: string | null
          user_id: string | null
        }
        Insert: {
          form_id?: string | null
          id?: string
          response: Json
          submitted_at?: string | null
          user_id?: string | null
        }
        Update: {
          form_id?: string | null
          id?: string
          response?: Json
          submitted_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      event_forms: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_id: string | null
          id: string
          schema: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          schema: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          schema?: Json
        }
        Relationships: [
          {
            foreignKeyName: "event_forms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reactions: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          reaction: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          reaction: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          reaction?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string | null
          form_response: Json | null
          form_response_id: string | null
          id: string
          registered_at: string | null
          status: string | null
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          event_id?: string | null
          form_response?: Json | null
          form_response_id?: string | null
          id?: string
          registered_at?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          event_id?: string | null
          form_response?: Json | null
          form_response_id?: string | null
          id?: string
          registered_at?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_form_response_id_fkey"
            columns: ["form_response_id"]
            isOneToOne: false
            referencedRelation: "event_form_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          approved: boolean | null
          banner_url: string | null
          capacity: number | null
          category: string | null
          color_block: string | null
          color_theme: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_ts: string | null
          id: string
          image_path: string | null
          is_featured: boolean | null
          location: string | null
          max_team_size: number | null
          min_team_size: number | null
          participants_count: number | null
          participation_type: string | null
          registration_closes_at: string | null
          registration_opens_at: string | null
          registration_type: string | null
          slug: string | null
          start_ts: string
          status: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          venue: string | null
          venue_maps_url: string | null
        }
        Insert: {
          approved?: boolean | null
          banner_url?: string | null
          capacity?: number | null
          category?: string | null
          color_block?: string | null
          color_theme?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_ts?: string | null
          id?: string
          image_path?: string | null
          is_featured?: boolean | null
          location?: string | null
          max_team_size?: number | null
          min_team_size?: number | null
          participants_count?: number | null
          participation_type?: string | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          registration_type?: string | null
          slug?: string | null
          start_ts: string
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          venue?: string | null
          venue_maps_url?: string | null
        }
        Update: {
          approved?: boolean | null
          banner_url?: string | null
          capacity?: number | null
          category?: string | null
          color_block?: string | null
          color_theme?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_ts?: string | null
          id?: string
          image_path?: string | null
          is_featured?: boolean | null
          location?: string | null
          max_team_size?: number | null
          min_team_size?: number | null
          participants_count?: number | null
          participation_type?: string | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          registration_type?: string | null
          slug?: string | null
          start_ts?: string
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          venue?: string | null
          venue_maps_url?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channels: Json | null
          created_at: string
          digest_frequency: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channels?: Json | null
          created_at?: string
          digest_frequency?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channels?: Json | null
          created_at?: string
          digest_frequency?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_flags: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_flags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          attachments: Json | null
          body: string
          comment_count: number | null
          created_at: string
          edited_at: string | null
          id: string
          is_flagged: boolean | null
          is_locked: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          reply_to: string | null
          shares_count: number | null
          space_id: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          attachments?: Json | null
          body: string
          comment_count?: number | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_flagged?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          reply_to?: string | null
          shares_count?: number | null
          space_id?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          attachments?: Json | null
          body?: string
          comment_count?: number | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_flagged?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          reply_to?: string | null
          shares_count?: number | null
          space_id?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      presence: {
        Row: {
          custom_status: string | null
          last_seen: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          custom_status?: string | null
          last_seen?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          custom_status?: string | null
          last_seen?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_achievements: {
        Row: {
          created_at: string | null
          date: string | null
          description: string | null
          display_order: number | null
          id: string
          issuer: string | null
          title: string
          type: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          issuer?: string | null
          title: string
          type?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          issuer?: string | null
          title?: string
          type?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_badges: {
        Row: {
          badge_code: string
          description: string | null
          earned_at: string | null
          icon_url: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          badge_code: string
          description?: string | null
          earned_at?: string | null
          icon_url?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          badge_code?: string
          description?: string | null
          earned_at?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_education: {
        Row: {
          created_at: string | null
          degree: string | null
          description: string | null
          display_order: number | null
          end_date: string | null
          field_of_study: string | null
          grade: string | null
          id: string
          institution: string
          start_date: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          degree?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution: string
          start_date?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          degree?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution?: string
          start_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_experience: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          display_order: number | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          role: string
          start_date: string
          user_id: string | null
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          role: string
          start_date: string
          user_id?: string | null
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          role?: string
          start_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_experience_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_integrations: {
        Row: {
          codechef_username: string | null
          created_at: string | null
          hackerrank_username: string | null
          id: string
          last_synced_at: string | null
          platform: string
          platform_data: Json | null
          user_id: string | null
          username: string
        }
        Insert: {
          codechef_username?: string | null
          created_at?: string | null
          hackerrank_username?: string | null
          id?: string
          last_synced_at?: string | null
          platform: string
          platform_data?: Json | null
          user_id?: string | null
          username: string
        }
        Update: {
          codechef_username?: string | null
          created_at?: string | null
          hackerrank_username?: string | null
          id?: string
          last_synced_at?: string | null
          platform?: string
          platform_data?: Json | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_projects: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          project_url: string | null
          repo_url: string | null
          start_date: string | null
          tech_stack: string[] | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          project_url?: string | null
          repo_url?: string | null
          start_date?: string | null
          tech_stack?: string[] | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          project_url?: string | null
          repo_url?: string | null
          start_date?: string | null
          tech_stack?: string[] | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          category: string | null
          created_at: string | null
          display_order: number | null
          endorsements_count: number | null
          id: string
          proficiency: string | null
          skill_name: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          endorsements_count?: number | null
          id?: string
          proficiency?: string | null
          skill_name: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          endorsements_count?: number | null
          id?: string
          proficiency?: string | null
          skill_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          batch: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          custom_sections: Json | null
          department: string | null
          display_name: string | null
          follower_count: number
          following_count: number
          id: string
          level: string | null
          location: string | null
          resume_url: string | null
          social_links: Json | null
          tagline: string | null
          theme: string | null
          updated_at: string | null
          username: string | null
          visibility: string | null
          website: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          custom_sections?: Json | null
          department?: string | null
          display_name?: string | null
          follower_count?: number
          following_count?: number
          id: string
          level?: string | null
          location?: string | null
          resume_url?: string | null
          social_links?: Json | null
          tagline?: string | null
          theme?: string | null
          updated_at?: string | null
          username?: string | null
          visibility?: string | null
          website?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          custom_sections?: Json | null
          department?: string | null
          display_name?: string | null
          follower_count?: number
          following_count?: number
          id?: string
          level?: string | null
          location?: string | null
          resume_url?: string | null
          social_links?: Json | null
          tagline?: string | null
          theme?: string | null
          updated_at?: string | null
          username?: string | null
          visibility?: string | null
          website?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          event_id: string
          registered_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          registered_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          registered_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      space_channels: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          slug: string
          space_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          slug: string
          space_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          slug?: string
          space_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_channels_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number | null
          space_id: string
          uses: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          space_id: string
          uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          space_id?: string
          uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "space_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_invites_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          notification_settings: Json | null
          role: Database["public"]["Enums"]["space_role"]
          space_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          notification_settings?: Json | null
          role?: Database["public"]["Enums"]["space_role"]
          space_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          notification_settings?: Json | null
          role?: Database["public"]["Enums"]["space_role"]
          space_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      space_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "space_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      space_messages: {
        Row: {
          attachments: Json | null
          author_id: string
          channel_id: string | null
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          mime: string | null
          reply_to: string | null
          space_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          author_id: string
          channel_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          mime?: string | null
          reply_to?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          author_id?: string
          channel_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          mime?: string | null
          reply_to?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "space_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "space_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_messages_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_private: boolean | null
          member_count: number | null
          message_count: number
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          tags: string[] | null
          updated_at: string
          visibility: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          message_count?: number
          name: string
          owner_id: string
          settings?: Json | null
          slug: string
          tags?: string[] | null
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          message_count?: number
          name?: string
          owner_id?: string
          settings?: Json | null
          slug?: string
          tags?: string[] | null
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          email: string
          id: string
          invited_at: string | null
          joined_at: string | null
          name: string
          phone: string | null
          role: string | null
          status: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          email: string
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          name: string
          phone?: string | null
          role?: string | null
          status?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          email?: string
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          code: string
          created_at: string | null
          event_id: string | null
          id: string
          leader_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          leader_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          leader_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          channel_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "space_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp: {
        Row: {
          codechef_xp: number
          codeforces_xp: number
          event_xp: number
          github_xp: number
          hackerrank_xp: number
          last_calculated_at: string
          leetcode_xp: number
          level: string
          level_progress: number
          post_xp: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          codechef_xp?: number
          codeforces_xp?: number
          event_xp?: number
          github_xp?: number
          hackerrank_xp?: number
          last_calculated_at?: string
          leetcode_xp?: number
          level?: string
          level_progress?: number
          post_xp?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          codechef_xp?: number
          codeforces_xp?: number
          event_xp?: number
          github_xp?: number
          hackerrank_xp?: number
          last_calculated_at?: string
          leetcode_xp?: number
          level?: string
          level_progress?: number
          post_xp?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_xp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          access_token: string | null
          avatar: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          google_access_token: string | null
          google_id: string | null
          google_refresh_token: string | null
          id: string
          is_admin: boolean | null
          last_seen: string | null
          last_sync: string | null
          name: string | null
          onboarding_state: string | null
          refresh_token: string | null
          role: string | null
          roles: string[] | null
          token_expiry: number | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          avatar?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          google_access_token?: string | null
          google_id?: string | null
          google_refresh_token?: string | null
          id: string
          is_admin?: boolean | null
          last_seen?: string | null
          last_sync?: string | null
          name?: string | null
          onboarding_state?: string | null
          refresh_token?: string | null
          role?: string | null
          roles?: string[] | null
          token_expiry?: number | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          avatar?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          google_access_token?: string | null
          google_id?: string | null
          google_refresh_token?: string | null
          id?: string
          is_admin?: boolean | null
          last_seen?: string | null
          last_sync?: string | null
          name?: string | null
          onboarding_state?: string | null
          refresh_token?: string | null
          role?: string | null
          roles?: string[] | null
          token_expiry?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      coding_stats_current: {
        Row: {
          codechef_rating: number | null
          codeforces_rating: number | null
          github_contributions: number | null
          github_repos: number | null
          hackerrank_badges: number | null
          last_updated: string | null
          leetcode_ranking: number | null
          leetcode_solved: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coding_stats_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      am_i_admin: { Args: never; Returns: boolean }
      decrement_participant_count: {
        Args: { event_id: string }
        Returns: undefined
      }
      decrement_space_member_count: {
        Args: { space_id: string }
        Returns: undefined
      }
      increment_participant_count: {
        Args: { event_id: string }
        Returns: undefined
      }
      increment_participants: {
        Args: { event_uuid: string }
        Returns: undefined
      }
      increment_space_member_count: {
        Args: { space_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_space_member: {
        Args: { _space_id: string; _user_id: string }
        Returns: boolean
      }
      is_space_moderator: { Args: { space_uuid: string }; Returns: boolean }
      register_for_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      space_role: "owner" | "moderator" | "member"
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
      space_role: ["owner", "moderator", "member"],
    },
  },
} as const
