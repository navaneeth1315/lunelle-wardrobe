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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      outfit_items: {
        Row: {
          id: string
          outfit_id: string
          wardrobe_item_id: string
        }
        Insert: {
          id?: string
          outfit_id: string
          wardrobe_item_id: string
        }
        Update: {
          id?: string
          outfit_id?: string
          wardrobe_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_items_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_items_wardrobe_item_id_fkey"
            columns: ["wardrobe_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          color_harmony: string | null
          created_at: string
          explanation: string | null
          id: string
          name: string
          occasion: string | null
          style: string | null
          styling_tip: string | null
          user_id: string
          weather: string | null
        }
        Insert: {
          color_harmony?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          name: string
          occasion?: string | null
          style?: string | null
          styling_tip?: string | null
          user_id?: string
          weather?: string | null
        }
        Update: {
          color_harmony?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          name?: string
          occasion?: string | null
          style?: string | null
          styling_tip?: string | null
          user_id?: string
          weather?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_weather: string | null
          email: string | null
          id: string
          location: string | null
          name: string | null
          notifications: boolean
          onboarded: boolean
          preferred_occasions: string[]
          preferred_styles: string[]
          style_gender: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_weather?: string | null
          email?: string | null
          id: string
          location?: string | null
          name?: string | null
          notifications?: boolean
          onboarded?: boolean
          preferred_occasions?: string[]
          preferred_styles?: string[]
          style_gender?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_weather?: string | null
          email?: string | null
          id?: string
          location?: string | null
          name?: string | null
          notifications?: boolean
          onboarded?: boolean
          preferred_occasions?: string[]
          preferred_styles?: string[]
          style_gender?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_outfits: {
        Row: {
          created_at: string
          id: string
          outfit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          outfit_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          outfit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_outfits_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      style_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_colors: string[]
          preferred_occasions: string[]
          preferred_styles: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_colors?: string[]
          preferred_occasions?: string[]
          preferred_styles?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_colors?: string[]
          preferred_occasions?: string[]
          preferred_styles?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          brand: string | null
          category: string
          color: string | null
          created_at: string
          formality: string | null
          id: string
          image_path: string | null
          image_url: string | null
          is_favorite: boolean
          material: string | null
          name: string
          notes: string | null
          pattern: string | null
          season: string | null
          subcategory: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string
          color?: string | null
          created_at?: string
          formality?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_favorite?: boolean
          material?: string | null
          name: string
          notes?: string | null
          pattern?: string | null
          season?: string | null
          subcategory?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          brand?: string | null
          category?: string
          color?: string | null
          created_at?: string
          formality?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_favorite?: boolean
          material?: string | null
          name?: string
          notes?: string | null
          pattern?: string | null
          season?: string | null
          subcategory?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_my_account: { Args: never; Returns: undefined }
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
    Enums: {},
  },
} as const
