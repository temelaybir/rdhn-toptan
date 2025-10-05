import { ProductSpecifications, ProductDimensions, HomepageItems, HomepageConfig } from './admin/product'

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          parent_id: number | null
          image_url: string | null
          is_active: boolean
          display_order: number | null
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          parent_id?: number | null
          image_url?: string | null
          is_active?: boolean
          display_order?: number | null
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          parent_id?: number | null
          image_url?: string | null
          is_active?: boolean
          display_order?: number | null
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          short_description: string | null
          price: number
          discounted_price: number | null
          cost: number | null
          sku: string | null
          barcode: string | null
          stock_quantity: number
          is_active: boolean
          is_featured: boolean
          category_id: number | null
          brand: string | null
          images: string[] | null
          specifications: ProductSpecifications | null
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string | null
          tags: string[] | null
          weight: number | null
          dimensions: ProductDimensions | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          price: number
          discounted_price?: number | null
          cost?: number | null
          sku?: string | null
          barcode?: string | null
          stock_quantity?: number
          is_active?: boolean
          is_featured?: boolean
          category_id?: number | null
          brand?: string | null
          images?: string[] | null
          specifications?: ProductSpecifications | null
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          tags?: string[] | null
          weight?: number | null
          dimensions?: ProductDimensions | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          price?: number
          discounted_price?: number | null
          cost?: number | null
          sku?: string | null
          barcode?: string | null
          stock_quantity?: number
          is_active?: boolean
          is_featured?: boolean
          category_id?: number | null
          brand?: string | null
          images?: string[] | null
          specifications?: ProductSpecifications | null
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          tags?: string[] | null
          weight?: number | null
          dimensions?: ProductDimensions | null
          created_at?: string
          updated_at?: string
        }
      }
      homepage_features: {
        Row: {
          id: number
          type: string
          title: string
          subtitle: string | null
          items: HomepageItems | null
          config: HomepageConfig | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          type: string
          title: string
          subtitle?: string | null
          items?: HomepageItems | null
          config?: HomepageConfig | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          type?: string
          title?: string
          subtitle?: string | null
          items?: HomepageItems | null
          config?: HomepageConfig | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never