// Tipos do banco no formato gerado pelo Supabase CLI.
// Depois de linkar o projeto, regenere com:  npm run db:types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type FK<Name extends string, Col extends string, Ref extends string> = {
  foreignKeyName: Name;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      admin_users: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
        Relationships: [];
      };
      categories: {
        Row: { id: string; name: string; slug: string; description: string | null; sort_order: number; created_at: string };
        Insert: { id?: string; name: string; slug: string; description?: string | null; sort_order?: number; created_at?: string };
        Update: { id?: string; name?: string; slug?: string; description?: string | null; sort_order?: number; created_at?: string };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          current_price: number | null;
          previous_price: number | null;
          previous_price_confirmed: boolean;
          discount_percent: number | null;
          image_url: string | null;
          affiliate_url: string;
          category_id: string | null;
          status: Database["public"]["Enums"]["product_status"];
          is_featured: boolean;
          shopee_item_key: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          current_price?: number | null;
          previous_price?: number | null;
          previous_price_confirmed?: boolean;
          image_url?: string | null;
          affiliate_url: string;
          category_id?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          is_featured?: boolean;
          shopee_item_key?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          current_price?: number | null;
          previous_price?: number | null;
          previous_price_confirmed?: boolean;
          image_url?: string | null;
          affiliate_url?: string;
          category_id?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          is_featured?: boolean;
          shopee_item_key?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [FK<"products_category_id_fkey", "category_id", "categories">];
      };
      product_images: {
        Row: { id: string; product_id: string; url: string; alt: string | null; sort_order: number; created_at: string };
        Insert: { id?: string; product_id: string; url: string; alt?: string | null; sort_order?: number; created_at?: string };
        Update: { id?: string; product_id?: string; url?: string; alt?: string | null; sort_order?: number; created_at?: string };
        Relationships: [FK<"product_images_product_id_fkey", "product_id", "products">];
      };
      product_history: {
        Row: { id: number; product_id: string; changed_by: string | null; action: string; changes: Json; created_at: string };
        Insert: { id?: never; product_id: string; changed_by?: string | null; action: string; changes?: Json; created_at?: string };
        Update: { id?: never; product_id?: string; changed_by?: string | null; action?: string; changes?: Json; created_at?: string };
        Relationships: [FK<"product_history_product_id_fkey", "product_id", "products">];
      };
      clicks: {
        Row: { id: number; product_id: string; source: string; created_at: string };
        Insert: { id?: never; product_id: string; source?: string; created_at?: string };
        Update: { id?: never; product_id?: string; source?: string; created_at?: string };
        Relationships: [FK<"clicks_product_id_fkey", "product_id", "products">];
      };
      caption_styles: {
        Row: { id: string; name: string; description: string | null; is_active: boolean; sort_order: number; created_at: string };
        Insert: { id?: string; name: string; description?: string | null; is_active?: boolean; sort_order?: number; created_at?: string };
        Update: { id?: string; name?: string; description?: string | null; is_active?: boolean; sort_order?: number; created_at?: string };
        Relationships: [];
      };
      captions: {
        Row: { id: string; product_id: string; style_id: string | null; style: string; format: string; length: string; content: string; created_at: string };
        Insert: { id?: string; product_id: string; style_id?: string | null; style: string; format?: string; length?: string; content: string; created_at?: string };
        Update: { id?: string; product_id?: string; style_id?: string | null; style?: string; format?: string; length?: string; content?: string; created_at?: string };
        Relationships: [
          FK<"captions_product_id_fkey", "product_id", "products">,
          FK<"captions_style_id_fkey", "style_id", "caption_styles">,
        ];
      };
      ai_usage: {
        Row: { id: number; model: string; input_tokens: number; output_tokens: number; product_id: string | null; created_at: string };
        Insert: { id?: never; model: string; input_tokens?: number; output_tokens?: number; product_id?: string | null; created_at?: string };
        Update: { id?: never; model?: string; input_tokens?: number; output_tokens?: number; product_id?: string | null; created_at?: string };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: number;
          hero_title: string;
          hero_subtitle: string;
          whatsapp_channel_url: string | null;
          instagram_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          hero_title?: string;
          hero_subtitle?: string;
          whatsapp_channel_url?: string | null;
          instagram_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          hero_title?: string;
          hero_subtitle?: string;
          whatsapp_channel_url?: string | null;
          instagram_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
      register_click: { Args: { p_slug: string; p_source?: string }; Returns: string | null };
      top_clicked_products: {
        Args: { p_days?: number; p_limit?: number };
        Returns: {
          product_id: string;
          name: string;
          slug: string;
          status: Database["public"]["Enums"]["product_status"];
          clicks: number;
        }[];
      };
      clicks_by_day: { Args: { p_days?: number }; Returns: { day: string; clicks: number }[] };
      admin_save_product: {
        Args: { p_id: string | null; p_data: Json; p_images?: Json };
        Returns: Database["public"]["Tables"]["products"]["Row"];
      };
      admin_similar_products: {
        Args: { p_name: string; p_exclude?: string | null };
        Returns: { id: string; name: string; slug: string; status: Database["public"]["Enums"]["product_status"]; similarity: number }[];
      };
      admin_category_counts: {
        Args: never;
        Returns: { category_id: string; total: number; published: number }[];
      };
    };
    Enums: { product_status: "draft" | "published" | "archived" };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type ProductStatus = Database["public"]["Enums"]["product_status"];
