export type Plan = "free" | "pro" | "scale";

export type AuditStatus = "pending" | "crawling" | "analyzing" | "completed" | "failed";

export type Priority = "high" | "medium" | "low";

export type ImplementationStatus = "not_started" | "in_progress" | "implemented" | "dismissed";

export type IntegrationType = "tracking_sdk" | "ads" | "affiliate";

export type IntegrationStatus = "inactive" | "active" | "error";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          plan: Plan;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_subscription_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          plan?: Plan;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_subscription_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      websites: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          domain: string;
          name: string | null;
          description: string | null;
          category: string | null;
          site_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          domain: string;
          name?: string | null;
          description?: string | null;
          category?: string | null;
          site_key?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["websites"]["Insert"]>;
        Relationships: [];
      };
      audits: {
        Row: {
          id: string;
          website_id: string;
          status: AuditStatus;
          score: number | null;
          analysis: Record<string, unknown>;
          monetization_recommendation: Record<string, unknown>;
          estimated_low: number | null;
          estimated_mid: number | null;
          estimated_high: number | null;
          estimated_currency: string;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          website_id: string;
          status?: AuditStatus;
          score?: number | null;
          analysis?: Record<string, unknown>;
          monetization_recommendation?: Record<string, unknown>;
          estimated_low?: number | null;
          estimated_mid?: number | null;
          estimated_high?: number | null;
          estimated_currency?: string;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["audits"]["Insert"]>;
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          audit_id: string;
          type: string;
          title: string;
          description: string | null;
          priority: Priority;
          estimated_impact: Priority | null;
          implementation_status: ImplementationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          audit_id: string;
          type: string;
          title: string;
          description?: string | null;
          priority?: Priority;
          estimated_impact?: Priority | null;
          implementation_status?: ImplementationStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recommendations"]["Insert"]>;
        Relationships: [];
      };
      integrations: {
        Row: {
          id: string;
          website_id: string;
          type: IntegrationType;
          status: IntegrationStatus;
          config: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          type: IntegrationType;
          status?: IntegrationStatus;
          config?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["integrations"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          website_id: string;
          type: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          type: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
