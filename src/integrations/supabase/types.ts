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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ambulance_movement: {
        Row: {
          created_at: string | null
          driver_contact: string | null
          driver_name: string | null
          drop_location: string
          emergency_id: string | null
          id: string
          patient_name: string
          pickup_location: string
          remarks: string | null
          vehicle_number: string
        }
        Insert: {
          created_at?: string | null
          driver_contact?: string | null
          driver_name?: string | null
          drop_location: string
          emergency_id?: string | null
          id?: string
          patient_name: string
          pickup_location: string
          remarks?: string | null
          vehicle_number: string
        }
        Update: {
          created_at?: string | null
          driver_contact?: string | null
          driver_name?: string | null
          drop_location?: string
          emergency_id?: string | null
          id?: string
          patient_name?: string
          pickup_location?: string
          remarks?: string | null
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_movement_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergency_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      biomedical_waste: {
        Row: {
          collected_by: string | null
          created_at: string | null
          id: string
          logged_by: string | null
          quantity: number | null
          remarks: string | null
          unit: string | null
          waste_type: string | null
        }
        Insert: {
          collected_by?: string | null
          created_at?: string | null
          id?: string
          logged_by?: string | null
          quantity?: number | null
          remarks?: string | null
          unit?: string | null
          waste_type?: string | null
        }
        Update: {
          collected_by?: string | null
          created_at?: string | null
          id?: string
          logged_by?: string | null
          quantity?: number | null
          remarks?: string | null
          unit?: string | null
          waste_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biomedical_waste_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_cases: {
        Row: {
          action_taken: string | null
          ambulance_used: boolean | null
          case_status: string | null
          created_at: string | null
          escalated_to: string | null
          id: string
          incident_description: string | null
          incident_type: string | null
          severity: string | null
          walkin_id: string | null
        }
        Insert: {
          action_taken?: string | null
          ambulance_used?: boolean | null
          case_status?: string | null
          created_at?: string | null
          escalated_to?: string | null
          id?: string
          incident_description?: string | null
          incident_type?: string | null
          severity?: string | null
          walkin_id?: string | null
        }
        Update: {
          action_taken?: string | null
          ambulance_used?: boolean | null
          case_status?: string | null
          created_at?: string | null
          escalated_to?: string | null
          id?: string
          incident_description?: string | null
          incident_type?: string | null
          severity?: string | null
          walkin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_cases_walkin_id_fkey"
            columns: ["walkin_id"]
            isOneToOne: false
            referencedRelation: "walkin_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          age: number | null
          blood_group: string | null
          company_name: string
          consent_given: boolean | null
          consent_timestamp: string | null
          created_at: string | null
          department: string | null
          email: string
          employee_id: string
          full_name: string
          id: string
          mobile: string
        }
        Insert: {
          age?: number | null
          blood_group?: string | null
          company_name: string
          consent_given?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          employee_id: string
          full_name: string
          id?: string
          mobile: string
        }
        Update: {
          age?: number | null
          blood_group?: string | null
          company_name?: string
          consent_given?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id?: string
          full_name?: string
          id?: string
          mobile?: string
        }
        Relationships: []
      }
      medicine_dispensation: {
        Row: {
          dispensed_at: string | null
          dosage: string | null
          employee_id: string | null
          id: string
          medicine_id: string | null
          prescribed_by: string | null
          quantity: number
          walkin_id: string | null
        }
        Insert: {
          dispensed_at?: string | null
          dosage?: string | null
          employee_id?: string | null
          id?: string
          medicine_id?: string | null
          prescribed_by?: string | null
          quantity: number
          walkin_id?: string | null
        }
        Update: {
          dispensed_at?: string | null
          dosage?: string | null
          employee_id?: string | null
          id?: string
          medicine_id?: string | null
          prescribed_by?: string | null
          quantity?: number
          walkin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_dispensation_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_dispensation_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicine_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_dispensation_prescribed_by_fkey"
            columns: ["prescribed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_dispensation_walkin_id_fkey"
            columns: ["walkin_id"]
            isOneToOne: false
            referencedRelation: "walkin_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_inventory: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          medicine_name: string
          min_stock_level: number | null
          quantity: number
          sku: string
          unit: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          medicine_name: string
          min_stock_level?: number | null
          quantity: number
          sku: string
          unit?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          medicine_name?: string
          min_stock_level?: number | null
          quantity?: number
          sku?: string
          unit?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          advice: string | null
          created_by: string | null
          diagnosis: string
          id: string
          medicines: string
          patient_id: string | null
          send_via: string | null
          sent_at: string | null
          walkin_id: string | null
        }
        Insert: {
          advice?: string | null
          created_by?: string | null
          diagnosis: string
          id?: string
          medicines: string
          patient_id?: string | null
          send_via?: string | null
          sent_at?: string | null
          walkin_id?: string | null
        }
        Update: {
          advice?: string | null
          created_by?: string | null
          diagnosis?: string
          id?: string
          medicines?: string
          patient_id?: string | null
          send_via?: string | null
          sent_at?: string | null
          walkin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_walkin_id_fkey"
            columns: ["walkin_id"]
            isOneToOne: false
            referencedRelation: "walkin_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      specialist_consultations: {
        Row: {
          appointment_date: string
          created_at: string | null
          created_by: string | null
          employee_id: string | null
          hospital_clinic: string | null
          id: string
          notes: string | null
          referral_reason: string | null
          specialist_name: string
          speciality: string | null
        }
        Insert: {
          appointment_date: string
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          hospital_clinic?: string | null
          id?: string
          notes?: string | null
          referral_reason?: string | null
          specialist_name: string
          speciality?: string | null
        }
        Update: {
          appointment_date?: string
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          hospital_clinic?: string | null
          id?: string
          notes?: string | null
          referral_reason?: string | null
          specialist_name?: string
          speciality?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specialist_consultations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_consultations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      walkin_consultations: {
        Row: {
          bp: string | null
          chief_complaint: string | null
          consultation_type: string | null
          created_at: string | null
          created_by: string | null
          diagnosis: string | null
          employee_id: string | null
          id: string
          is_emergency: boolean | null
          pulse: number | null
          spo2: number | null
          temp: number | null
          weight: number | null
        }
        Insert: {
          bp?: string | null
          chief_complaint?: string | null
          consultation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          diagnosis?: string | null
          employee_id?: string | null
          id?: string
          is_emergency?: boolean | null
          pulse?: number | null
          spo2?: number | null
          temp?: number | null
          weight?: number | null
        }
        Update: {
          bp?: string | null
          chief_complaint?: string | null
          consultation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          diagnosis?: string | null
          employee_id?: string | null
          id?: string
          is_emergency?: boolean | null
          pulse?: number | null
          spo2?: number | null
          temp?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "walkin_consultations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walkin_consultations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
