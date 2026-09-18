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
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          detail: string | null
          entity: string
          entity_id: string | null
          entity_label: string | null
          field: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          detail?: string | null
          entity: string
          entity_id?: string | null
          entity_label?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          detail?: string | null
          entity?: string
          entity_id?: string | null
          entity_label?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          emoji: string | null
          experience: string | null
          id: string
          image_url: string | null
          name: string
          name_ta: string | null
          slug: string
          sort: number
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          experience?: string | null
          id?: string
          image_url?: string | null
          name: string
          name_ta?: string | null
          slug: string
          sort?: number
        }
        Update: {
          created_at?: string
          emoji?: string | null
          experience?: string | null
          id?: string
          image_url?: string | null
          name?: string
          name_ta?: string | null
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      combo_items: {
        Row: {
          combo_id: string
          id: string
          product_id: string
          qty: number
        }
        Insert: {
          combo_id: string
          id?: string
          product_id: string
          qty?: number
        }
        Update: {
          combo_id?: string
          id?: string
          product_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "combo_items_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      combos: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          indicative_price: number
          slug: string
          title: string
          title_ta: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          indicative_price?: number
          slug: string
          title: string
          title_ta?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          indicative_price?: number
          slug?: string
          title?: string
          title_ta?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          expires_at: string | null
          id: string
          label: string | null
          max_discount: number | null
          min_value: number
          updated_at: string
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          id?: string
          label?: string | null
          max_discount?: number | null
          min_value?: number
          updated_at?: string
          used_count?: number
          value?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          id?: string
          label?: string | null
          max_discount?: number | null
          min_value?: number
          updated_at?: string
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          address: string | null
          city: string
          contact_method: string | null
          coupon_code: string | null
          created_at: string
          delivery_charge: number
          discount_amount: number
          estimated_value: number
          final_amount: number | null
          follow_up_at: string | null
          free_text: string | null
          fulfilment: string | null
          id: string
          item_count: number
          message: string | null
          mobile: string
          name: string
          pincode: string | null
          ref: string | null
          seen_at: string | null
          source: string
          state: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city: string
          contact_method?: string | null
          coupon_code?: string | null
          created_at?: string
          delivery_charge?: number
          discount_amount?: number
          estimated_value?: number
          final_amount?: number | null
          follow_up_at?: string | null
          free_text?: string | null
          fulfilment?: string | null
          id?: string
          item_count?: number
          message?: string | null
          mobile: string
          name: string
          pincode?: string | null
          ref?: string | null
          seen_at?: string | null
          source?: string
          state?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string
          contact_method?: string | null
          coupon_code?: string | null
          created_at?: string
          delivery_charge?: number
          discount_amount?: number
          estimated_value?: number
          final_amount?: number | null
          follow_up_at?: string | null
          free_text?: string | null
          fulfilment?: string | null
          id?: string
          item_count?: number
          message?: string | null
          mobile?: string
          name?: string
          pincode?: string | null
          ref?: string | null
          seen_at?: string | null
          source?: string
          state?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
        }
        Relationships: []
      }
      enquiry_items: {
        Row: {
          enquiry_id: string
          id: string
          product_code: string | null
          product_id: string | null
          product_name: string
          qty: number
          removed: boolean
          unit_price: number
        }
        Insert: {
          enquiry_id: string
          id?: string
          product_code?: string | null
          product_id?: string | null
          product_name: string
          qty?: number
          removed?: boolean
          unit_price?: number
        }
        Update: {
          enquiry_id?: string
          id?: string
          product_code?: string | null
          product_id?: string | null
          product_name?: string
          qty?: number
          removed?: boolean
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "enquiry_items_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiry_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiry_notes: {
        Row: {
          created_at: string
          enquiry_id: string
          id: string
          note: string
        }
        Insert: {
          created_at?: string
          enquiry_id: string
          id?: string
          note: string
        }
        Update: {
          created_at?: string
          enquiry_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiry_notes_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          enquiry_id: string
          id: string
          method: string
          note: string | null
          paid_at: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          enquiry_id: string
          id?: string
          method?: string
          note?: string | null
          paid_at?: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          enquiry_id?: string
          id?: string
          method?: string
          note?: string | null
          paid_at?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          addon_rank: number | null
          availability: Database["public"]["Enums"]["availability_status"]
          category_id: string | null
          code: string
          created_at: string
          deal_price: number | null
          deal_rank: number | null
          id: string
          image_url: string | null
          mrp: number | null
          name: string
          name_ta: string | null
          pack: string | null
          popular_rank: number | null
          price: number
          tags: string[]
        }
        Insert: {
          active?: boolean
          addon_rank?: number | null
          availability?: Database["public"]["Enums"]["availability_status"]
          category_id?: string | null
          code: string
          created_at?: string
          deal_price?: number | null
          deal_rank?: number | null
          id?: string
          image_url?: string | null
          mrp?: number | null
          name: string
          name_ta?: string | null
          pack?: string | null
          popular_rank?: number | null
          price?: number
          tags?: string[]
        }
        Update: {
          active?: boolean
          addon_rank?: number | null
          availability?: Database["public"]["Enums"]["availability_status"]
          category_id?: string | null
          code?: string
          created_at?: string
          deal_price?: number | null
          deal_rank?: number | null
          id?: string
          image_url?: string | null
          mrp?: number | null
          name?: string
          name_ta?: string | null
          pack?: string | null
          popular_rank?: number | null
          price?: number
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          path: string | null
          product_id: string | null
          product_name: string | null
          qty: number
          session_id: string
          source: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          path?: string | null
          product_id?: string | null
          product_name?: string | null
          qty?: number
          session_id: string
          source?: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          path?: string | null
          product_id?: string | null
          product_name?: string | null
          qty?: number
          session_id?: string
          source?: string
          value?: number
        }
        Relationships: []
      }
      sticky_notes: {
        Row: {
          body: string
          color: string
          created_at: string
          id: string
          pinned: boolean
          updated_at: string
        }
        Insert: {
          body?: string
          color?: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Update: {
          body?: string
          color?: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      availability_status:
        | "available"
        | "limited"
        | "unavailable"
        | "enquiry_only"
      enquiry_status:
        | "new"
        | "contact_required"
        | "contacted"
        | "discussion"
        | "confirmed"
        | "ready"
        | "completed"
        | "not_converted"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      availability_status: [
        "available",
        "limited",
        "unavailable",
        "enquiry_only",
      ],
      enquiry_status: [
        "new",
        "contact_required",
        "contacted",
        "discussion",
        "confirmed",
        "ready",
        "completed",
        "not_converted",
      ],
    },
  },
} as const
