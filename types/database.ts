// TypeScript description of the database in supabase/migrations.
//
// Written by hand to match the migration. Once your Supabase project exists you
// can regenerate it with the Supabase CLI instead:
//   npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
// If you change the SQL, update this file too.

export type AppRole = "attendee" | "organizer" | "admin";
export type OrganizerRequestStatus = "pending" | "approved" | "rejected";
export type EventStatus = "draft" | "published" | "cancelled";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: AppRole;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        // Only full_name is updatable by users (enforced by column grants).
        Update: {
          full_name?: string;
        };
        Relationships: [];
      };
      organizer_requests: {
        Row: {
          id: string;
          user_id: string;
          organization_name: string;
          reason: string;
          status: OrganizerRequestStatus;
          admin_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          organization_name: string;
          reason: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "organizer_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          organizer_id: string;
          title: string;
          description: string;
          category: string;
          venue: string;
          city: string;
          starts_at: string;
          ends_at: string | null;
          capacity: number;
          price_from: number;
          status: EventStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string;
          category: string;
          venue: string;
          city: string;
          starts_at: string;
          ends_at?: string | null;
          capacity: number;
          price_from?: number;
          status?: EventStatus;
        };
        Update: {
          title?: string;
          description?: string;
          category?: string;
          venue?: string;
          city?: string;
          starts_at?: string;
          ends_at?: string | null;
          capacity?: number;
          price_from?: number;
          status?: EventStatus;
        };
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      current_user_role: {
        Args: Record<never, never>;
        Returns: AppRole;
      };
      is_admin: {
        Args: Record<never, never>;
        Returns: boolean;
      };
      review_organizer_request: {
        Args: { request_id: string; approve: boolean; note?: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: AppRole;
      organizer_request_status: OrganizerRequestStatus;
      event_status: EventStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type OrganizerRequest = Database["public"]["Tables"]["organizer_requests"]["Row"];
