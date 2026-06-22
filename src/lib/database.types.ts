export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      hv_classrooms: {
        Row: {
          academic_year: string
          created_at: string
          grade_level: string
          id: string
          room: string | null
          school_id: string | null
          semester: string
          teacher_id: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string
          grade_level: string
          id?: string
          room?: string | null
          school_id?: string | null
          semester: string
          teacher_id?: string | null
          deleted_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["hv_classrooms"]["Insert"]>
        Relationships: []
      }
      hv_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          sort_order: number
          storage_path: string
          visit_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          storage_path: string
          visit_id: string
        }
        Update: Partial<Database["public"]["Tables"]["hv_photos"]["Insert"]>
        Relationships: []
      }
      hv_profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          position: string | null
          role: string
          school_id: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          position?: string | null
          role?: string
          school_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["hv_profiles"]["Insert"]>
        Relationships: []
      }
      hv_schools: {
        Row: {
          area: string | null
          created_at: string
          director_name: string | null
          id: string
          name: string
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          area?: string | null
          created_at?: string
          director_name?: string | null
          id?: string
          name: string
          latitude?: number | null
          longitude?: number | null
        }
        Update: Partial<Database["public"]["Tables"]["hv_schools"]["Insert"]>
        Relationships: []
      }
      hv_students: {
        Row: {
          classroom_id: string
          created_at: string
          full_name: string
          gender: string | null
          id: string
          number: number | null
          prefix: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string
          full_name: string
          gender?: string | null
          id?: string
          number?: number | null
          prefix?: string | null
          deleted_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["hv_students"]["Insert"]>
        Relationships: []
      }
      hv_visits: {
        Row: {
          classroom_id: string
          created_at: string
          created_by: string | null
          data: Json
          guardian_name: string | null
          guardian_relation: string | null
          id: string
          narrative: string | null
          note: string | null
          parent_wish: string | null
          phone: string | null
          student_id: string
          updated_at: string
          visit_date: string | null
          visited: boolean
          latitude: number | null
          longitude: number | null
          checked_in_at: string | null
          road_distance_m: number | null
          road_duration_s: number | null
        }
        Insert: {
          classroom_id: string
          created_at?: string
          created_by?: string | null
          data?: Json
          guardian_name?: string | null
          guardian_relation?: string | null
          id?: string
          narrative?: string | null
          note?: string | null
          parent_wish?: string | null
          phone?: string | null
          student_id: string
          updated_at?: string
          visit_date?: string | null
          visited?: boolean
          latitude?: number | null
          longitude?: number | null
          checked_in_at?: string | null
          road_distance_m?: number | null
          road_duration_s?: number | null
          deleted_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["hv_visits"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      hv_is_admin: { Args: Record<string, never>; Returns: boolean }
      hv_my_school: { Args: Record<string, never>; Returns: string }
      hv_owns_classroom: { Args: { cid: string }; Returns: boolean }
      hv_trash: { Args: Record<string, never>; Returns: Json }
      hv_restore_visit: { Args: { vid: string }; Returns: undefined }
      hv_restore_student: { Args: { sid: string }; Returns: undefined }
      hv_restore_classroom: { Args: { cid: string }; Returns: undefined }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type PublicTables = Database["public"]["Tables"]
export type Row<T extends keyof PublicTables> = PublicTables[T]["Row"]
export type Insert<T extends keyof PublicTables> = PublicTables[T]["Insert"]
export type Update<T extends keyof PublicTables> = PublicTables[T]["Update"]

export type School = Row<"hv_schools">
export type Profile = Row<"hv_profiles">
export type Classroom = Row<"hv_classrooms">
export type Student = Row<"hv_students">
export type Visit = Row<"hv_visits">
export type Photo = Row<"hv_photos">
