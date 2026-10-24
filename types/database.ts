// TypeScript description of the database in supabase/migrations.
//
// Written by hand to match the migrations. You can regenerate it with the
// Supabase CLI instead:
//   npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
// If you change the SQL, update this file too.

export type AppRole = "attendee" | "organizer" | "admin";
export type OrganizerRequestStatus = "pending" | "approved" | "rejected";
export type EventStatus = "draft" | "published" | "cancelled";
export type ReviewStatus = "not_submitted" | "pending" | "approved" | "rejected";
export type BookingStatus = "held" | "confirmed" | "cancelled" | "expired";

export type CheckInResult = {
  result:
    | "checked_in"
    | "already_checked_in"
    | "invalid"
    | "not_authorized"
    | "ticket_cancelled"
    | "event_cancelled"
    | "event_ended";
  event?: string;
  holder?: string;
  ticket_type?: string;
  checked_in_at?: string;
};

export type PlatformStats = {
  users: number;
  organizers: number;
  events_published: number;
  events_pending: number;
  bookings_confirmed: number;
  tickets_sold: number;
  revenue: number;
  checked_in: number;
};

type Rel<Name extends string, Col extends string, Ref extends string> = {
  foreignKeyName: Name;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

type EventEditable = {
  title?: string;
  description?: string;
  category?: string;
  venue?: string;
  city?: string;
  starts_at?: string;
  ends_at?: string | null;
  capacity?: number;
  price_from?: number;
  is_online?: boolean;
  online_url?: string | null;
  banner_url?: string | null;
};

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
        Update: { full_name?: string };
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
        Insert: { organization_name: string; reason: string };
        Update: never;
        Relationships: [Rel<"organizer_requests_user_id_fkey", "user_id", "profiles">];
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
          review_status: ReviewStatus;
          review_note: string | null;
          is_online: boolean;
          online_url: string | null;
          banner_url: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: EventEditable & {
          title: string;
          category: string;
          venue: string;
          city: string;
          starts_at: string;
          capacity: number;
        };
        Update: EventEditable;
        Relationships: [Rel<"events_organizer_id_fkey", "organizer_id", "profiles">];
      };
      ticket_types: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          price: number;
          quantity: number;
          sold: number;
          held: number;
          sale_starts_at: string | null;
          sale_ends_at: string | null;
          created_at: string;
        };
        Insert: {
          event_id: string;
          name: string;
          price: number;
          quantity: number;
          sale_starts_at?: string | null;
          sale_ends_at?: string | null;
        };
        Update: {
          name?: string;
          price?: number;
          quantity?: number;
          sale_starts_at?: string | null;
          sale_ends_at?: string | null;
        };
        Relationships: [Rel<"ticket_types_event_id_fkey", "event_id", "events">];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          ticket_type_id: string;
          quantity: number;
          unit_price: number;
          total_amount: number;
          status: BookingStatus;
          hold_expires_at: string;
          payment_method: "card" | "upi" | null;
          payment_reference: string | null;
          confirmed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          Rel<"bookings_event_id_fkey", "event_id", "events">,
          Rel<"bookings_ticket_type_id_fkey", "ticket_type_id", "ticket_types">,
          Rel<"bookings_user_id_fkey", "user_id", "profiles">,
        ];
      };
      tickets: {
        Row: {
          id: string;
          booking_id: string;
          event_id: string;
          ticket_type_id: string;
          user_id: string;
          status: "valid" | "cancelled";
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          Rel<"tickets_event_id_fkey", "event_id", "events">,
          Rel<"tickets_ticket_type_id_fkey", "ticket_type_id", "ticket_types">,
          Rel<"tickets_booking_id_fkey", "booking_id", "bookings">,
          Rel<"tickets_user_id_fkey", "user_id", "profiles">,
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: { read_at?: string | null };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      current_user_role: { Args: Record<never, never>; Returns: AppRole };
      is_admin: { Args: Record<never, never>; Returns: boolean };
      review_organizer_request: {
        Args: { request_id: string; approve: boolean; note?: string | null };
        Returns: undefined;
      };
      create_booking_hold: { Args: { p_ticket_type_id: string; p_quantity: number }; Returns: string };
      confirm_booking_payment: { Args: { p_booking_id: string; p_method: string }; Returns: string };
      cancel_booking_hold: { Args: { p_booking_id: string }; Returns: undefined };
      cancel_booking: { Args: { p_booking_id: string }; Returns: string };
      check_in_ticket: { Args: { p_ticket_id: string }; Returns: CheckInResult };
      submit_event_for_review: { Args: { p_event_id: string }; Returns: undefined };
      review_event: { Args: { p_event_id: string; p_approve: boolean; p_note?: string | null }; Returns: undefined };
      cancel_event: { Args: { p_event_id: string; p_reason?: string | null }; Returns: undefined };
      admin_set_user_role: { Args: { p_user_id: string; p_role: AppRole }; Returns: undefined };
      admin_platform_stats: { Args: Record<never, never>; Returns: PlatformStats };
      admin_list_users: {
        Args: Record<never, never>;
        Returns: { id: string; full_name: string; email: string; role: AppRole; created_at: string }[];
      };
      release_expired_holds: { Args: Record<never, never>; Returns: number };
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
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type TicketType = Database["public"]["Tables"]["ticket_types"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
