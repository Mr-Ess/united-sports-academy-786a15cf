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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academy_profiles: {
        Row: {
          created_at: string
          default_branch_id: string | null
          full_name: string | null
          language: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_branch_id?: string | null
          full_name?: string | null
          language?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_branch_id?: string | null
          full_name?: string | null
          language?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_profiles_default_branch_id_fkey"
            columns: ["default_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_user_roles: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["academy_role"]
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["academy_role"]
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["academy_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_user_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          branch_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          branch_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          branch_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string | null
          category: string | null
          content: string | null
          content_ar: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          excerpt_ar: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content?: string | null
          content_ar?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_ar?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content?: string | null
          content_ar?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_ar?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          name_ar: string
          phone: string | null
          pool_specs: Json
          settings: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          name_ar: string
          phone?: string | null
          pool_specs?: Json
          settings?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          name_ar?: string
          phone?: string | null
          pool_specs?: Json
          settings?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string
          category_ar: string
          created_at: string
          duration: string | null
          duration_ar: string | null
          end_date: string | null
          featured: boolean | null
          gradient: string | null
          id: string
          instructor: Json | null
          level: string
          mode: string
          original_price: number | null
          price: number
          published: boolean
          rating: number | null
          reviews: Json | null
          reviews_count: number | null
          schedule: string | null
          schedule_ar: string | null
          seats_left: number
          slug: string
          start_date: string | null
          syllabus: Json | null
          title: string
          title_ar: string
          total_seats: number
          updated_at: string
          venue: string | null
          venue_ar: string | null
        }
        Insert: {
          category: string
          category_ar: string
          created_at?: string
          duration?: string | null
          duration_ar?: string | null
          end_date?: string | null
          featured?: boolean | null
          gradient?: string | null
          id?: string
          instructor?: Json | null
          level?: string
          mode?: string
          original_price?: number | null
          price?: number
          published?: boolean
          rating?: number | null
          reviews?: Json | null
          reviews_count?: number | null
          schedule?: string | null
          schedule_ar?: string | null
          seats_left?: number
          slug: string
          start_date?: string | null
          syllabus?: Json | null
          title: string
          title_ar: string
          total_seats?: number
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Update: {
          category?: string
          category_ar?: string
          created_at?: string
          duration?: string | null
          duration_ar?: string | null
          end_date?: string | null
          featured?: boolean | null
          gradient?: string | null
          id?: string
          instructor?: Json | null
          level?: string
          mode?: string
          original_price?: number | null
          price?: number
          published?: boolean
          rating?: number | null
          reviews?: Json | null
          reviews_count?: number | null
          schedule?: string | null
          schedule_ar?: string | null
          seats_left?: number
          slug?: string
          start_date?: string | null
          syllabus?: Json | null
          title?: string
          title_ar?: string
          total_seats?: number
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Relationships: []
      }
      join_submissions: {
        Row: {
          age: number | null
          created_at: string
          email: string
          extra: Json | null
          full_name: string
          gender: string | null
          id: string
          interest: string | null
          message: string | null
          notes: string | null
          phone: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          email: string
          extra?: Json | null
          full_name: string
          gender?: string | null
          id?: string
          interest?: string | null
          message?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string
          extra?: Json | null
          full_name?: string
          gender?: string | null
          id?: string
          interest?: string | null
          message?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          published: boolean
          sort_order: number | null
          thumbnail_url: string | null
          title: string | null
          title_ar: string | null
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          published?: boolean
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          title_ar?: string | null
          type?: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          published?: boolean
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          title_ar?: string | null
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      page_permissions: {
        Row: {
          allowed_roles: Database["public"]["Enums"]["academy_role"][]
          created_at: string
          id: string
          is_public: boolean
          label_ar: string | null
          path: string
          updated_at: string
        }
        Insert: {
          allowed_roles?: Database["public"]["Enums"]["academy_role"][]
          created_at?: string
          id?: string
          is_public?: boolean
          label_ar?: string | null
          path: string
          updated_at?: string
        }
        Update: {
          allowed_roles?: Database["public"]["Enums"]["academy_role"][]
          created_at?: string
          id?: string
          is_public?: boolean
          label_ar?: string | null
          path?: string
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          published: boolean
          sort_order: number | null
          tier: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          published?: boolean
          sort_order?: number | null
          tier?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          published?: boolean
          sort_order?: number | null
          tier?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          gradient: string | null
          icon: string | null
          id: string
          published: boolean
          slug: string
          sort_order: number | null
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          gradient?: string | null
          icon?: string | null
          id?: string
          published?: boolean
          slug: string
          sort_order?: number | null
          title: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          gradient?: string | null
          icon?: string | null
          id?: string
          published?: boolean
          slug?: string
          sort_order?: number | null
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_academy_role: {
        Args: {
          _role: Database["public"]["Enums"]["academy_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_any_academy_role: {
        Args: {
          _roles: Database["public"]["Enums"]["academy_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      academy_role:
        | "super_admin"
        | "top_management"
        | "branch_admin"
        | "finance"
        | "hr"
        | "coach"
        | "receptionist"
        | "warehouse"
        | "procurement"
        | "maintenance"
        | "tenant"
        | "trainee"
      app_role: "admin" | "editor" | "moderator"
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
      academy_role: [
        "super_admin",
        "top_management",
        "branch_admin",
        "finance",
        "hr",
        "coach",
        "receptionist",
        "warehouse",
        "procurement",
        "maintenance",
        "tenant",
        "trainee",
      ],
      app_role: ["admin", "editor", "moderator"],
    },
  },
} as const
