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
      ac_accounts: {
        Row: {
          active: boolean
          branch_id: string
          created_at: string
          currency: string
          id: string
          kind: string
          name: string
          name_ar: string | null
          notes: string | null
          opening_balance: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          branch_id: string
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          name: string
          name_ar?: string | null
          notes?: string | null
          opening_balance?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          branch_id?: string
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          name?: string
          name_ar?: string | null
          notes?: string | null
          opening_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_accounts_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_ai_agents: {
        Row: {
          agent_type: string
          branch_id: string
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          max_tokens: number
          model: string
          n8n_workflow_id: string | null
          name: string
          name_ar: string | null
          schedule_cron: string | null
          system_prompt: string
          temperature: number
          tools: Json
          trigger_event: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          agent_type?: string
          branch_id: string
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          max_tokens?: number
          model?: string
          n8n_workflow_id?: string | null
          name: string
          name_ar?: string | null
          schedule_cron?: string | null
          system_prompt?: string
          temperature?: number
          tools?: Json
          trigger_event?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          agent_type?: string
          branch_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          max_tokens?: number
          model?: string
          n8n_workflow_id?: string | null
          name?: string
          name_ar?: string | null
          schedule_cron?: string | null
          system_prompt?: string
          temperature?: number
          tools?: Json
          trigger_event?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_ai_agents_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_assessments: {
        Row: {
          assessment_date: string
          branch_id: string
          coach_id: string | null
          created_at: string
          endurance_score: number | null
          id: string
          notes: string | null
          overall_score: number | null
          passed: boolean | null
          skill_level_id: string | null
          speed_score: number | null
          submitted_by: string | null
          technique_score: number | null
          trainee_id: string
          updated_at: string
        }
        Insert: {
          assessment_date?: string
          branch_id: string
          coach_id?: string | null
          created_at?: string
          endurance_score?: number | null
          id?: string
          notes?: string | null
          overall_score?: number | null
          passed?: boolean | null
          skill_level_id?: string | null
          speed_score?: number | null
          submitted_by?: string | null
          technique_score?: number | null
          trainee_id: string
          updated_at?: string
        }
        Update: {
          assessment_date?: string
          branch_id?: string
          coach_id?: string | null
          created_at?: string
          endurance_score?: number | null
          id?: string
          notes?: string | null
          overall_score?: number | null
          passed?: boolean | null
          skill_level_id?: string | null
          speed_score?: number | null
          submitted_by?: string | null
          technique_score?: number | null
          trainee_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_assessments_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_assessments_coach_fk"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "ac_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_assessments_level_fk"
            columns: ["skill_level_id"]
            isOneToOne: false
            referencedRelation: "ac_skill_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_assessments_trainee_fk"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "ac_trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_attachments: {
        Row: {
          branch_id: string
          comment: string | null
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          branch_id: string
          comment?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          branch_id?: string
          comment?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_attachments_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_attendance: {
        Row: {
          branch_id: string
          check_in_at: string
          check_out_at: string | null
          coach_id: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          method: string
          notes: string | null
          schedule_slot_id: string | null
          status: string
          subscription_id: string | null
          trainee_id: string
        }
        Insert: {
          branch_id: string
          check_in_at?: string
          check_out_at?: string | null
          coach_id?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          notes?: string | null
          schedule_slot_id?: string | null
          status?: string
          subscription_id?: string | null
          trainee_id: string
        }
        Update: {
          branch_id?: string
          check_in_at?: string
          check_out_at?: string | null
          coach_id?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          notes?: string | null
          schedule_slot_id?: string | null
          status?: string
          subscription_id?: string | null
          trainee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_attendance_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_attendance_coach_fk"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "ac_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_attendance_slot_fk"
            columns: ["schedule_slot_id"]
            isOneToOne: false
            referencedRelation: "ac_lane_occupancy"
            referencedColumns: ["schedule_slot_id"]
          },
          {
            foreignKeyName: "ac_attendance_slot_fk"
            columns: ["schedule_slot_id"]
            isOneToOne: false
            referencedRelation: "ac_schedule_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_attendance_sub_fk"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "ac_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_attendance_trainee_fk"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "ac_trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          branch_id: string | null
          created_at: string
          id: string
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          branch_id?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          branch_id?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_audit_log_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_custom_roles: {
        Row: {
          allowed_paths: string[]
          created_at: string
          desc_ar: string | null
          desc_en: string | null
          id: string
          key: string
          name_ar: string | null
          name_en: string
          updated_at: string
        }
        Insert: {
          allowed_paths?: string[]
          created_at?: string
          desc_ar?: string | null
          desc_en?: string | null
          id?: string
          key: string
          name_ar?: string | null
          name_en: string
          updated_at?: string
        }
        Update: {
          allowed_paths?: string[]
          created_at?: string
          desc_ar?: string | null
          desc_en?: string | null
          id?: string
          key?: string
          name_ar?: string | null
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      ac_employee_attendance: {
        Row: {
          branch_id: string
          clock_in: string | null
          clock_out: string | null
          created_at: string
          employee_id: string
          hours_worked: number | null
          id: string
          notes: string | null
          status: string
          updated_at: string
          work_date: string
        }
        Insert: {
          branch_id: string
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          work_date?: string
        }
        Update: {
          branch_id?: string
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_empatt_emp_fk"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "ac_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_employee_attendance_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_employees: {
        Row: {
          allowances: number
          base_salary: number
          branch_id: string
          created_at: string
          department: string | null
          email: string | null
          employee_code: string
          full_name: string
          full_name_ar: string | null
          hire_date: string
          id: string
          national_id: string | null
          notes: string | null
          phone: string | null
          profile_id: string | null
          status: string
          termination_date: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          allowances?: number
          base_salary?: number
          branch_id: string
          created_at?: string
          department?: string | null
          email?: string | null
          employee_code: string
          full_name: string
          full_name_ar?: string | null
          hire_date?: string
          id?: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          status?: string
          termination_date?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          allowances?: number
          base_salary?: number
          branch_id?: string
          created_at?: string
          department?: string | null
          email?: string | null
          employee_code?: string
          full_name?: string
          full_name_ar?: string | null
          hire_date?: string
          id?: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          status?: string
          termination_date?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_employees_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_employees_profile_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "ac_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_expense_categories: {
        Row: {
          active: boolean
          branch_id: string
          color: string | null
          created_at: string
          id: string
          kind: string
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          branch_id: string
          color?: string | null
          created_at?: string
          id?: string
          kind?: string
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          branch_id?: string
          color?: string | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_expense_categories_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_groups: {
        Row: {
          active: boolean
          branch_id: string
          category: string | null
          color: string | null
          created_at: string
          id: string
          level: string | null
          max_capacity: number
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          branch_id: string
          category?: string | null
          color?: string | null
          created_at?: string
          id?: string
          level?: string | null
          max_capacity?: number
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          branch_id?: string
          category?: string | null
          color?: string | null
          created_at?: string
          id?: string
          level?: string | null
          max_capacity?: number
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_groups_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_inventory_items: {
        Row: {
          branch_id: string
          category: string | null
          created_at: string
          id: string
          location: string | null
          min_quantity: number
          name: string
          name_ar: string | null
          notes: string | null
          quantity: number
          sku: string | null
          unit: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          min_quantity?: number
          name: string
          name_ar?: string | null
          notes?: string | null
          quantity?: number
          sku?: string | null
          unit?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          min_quantity?: number
          name?: string
          name_ar?: string | null
          notes?: string | null
          quantity?: number
          sku?: string | null
          unit?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_inventory_items_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_inventory_movements: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          item_id: string
          movement_type: string
          notes: string | null
          performed_by: string | null
          quantity: number
          reference: string | null
          unit_cost: number | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          item_id: string
          movement_type: string
          notes?: string | null
          performed_by?: string | null
          quantity: number
          reference?: string | null
          unit_cost?: number | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          item_id?: string
          movement_type?: string
          notes?: string | null
          performed_by?: string | null
          quantity?: number
          reference?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_inventory_movements_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_invmov_item_fk"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ac_inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_invoices: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          discount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          items: Json
          notes: string | null
          paid_amount: number
          status: string
          subscription_id: string | null
          subtotal: number
          tax: number
          total: number
          trainee_id: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          items?: Json
          notes?: string | null
          paid_amount?: number
          status?: string
          subscription_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          trainee_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          items?: Json
          notes?: string | null
          paid_amount?: number
          status?: string
          subscription_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          trainee_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_invoices_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_invoices_sub_fk"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "ac_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_invoices_trainee_fk"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "ac_trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_lanes: {
        Row: {
          branch_id: string
          created_at: string
          default_capacity: number
          id: string
          lane_number: number
          name: string | null
          pool_id: string
          status: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          default_capacity?: number
          id?: string
          lane_number: number
          name?: string | null
          pool_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          default_capacity?: number
          id?: string
          lane_number?: number
          name?: string | null
          pool_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_lanes_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_lanes_pool_fk"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "ac_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_leads: {
        Row: {
          agent: string
          assessment_attended: boolean
          assessment_date: string | null
          branch_id: string
          comments: string
          contact: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          offer: string
          service: string
          source: string
          status: string
          subscription_type: string
          updated_at: string
        }
        Insert: {
          agent?: string
          assessment_attended?: boolean
          assessment_date?: string | null
          branch_id: string
          comments?: string
          contact?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          offer?: string
          service?: string
          source?: string
          status?: string
          subscription_type?: string
          updated_at?: string
        }
        Update: {
          agent?: string
          assessment_attended?: boolean
          assessment_date?: string | null
          branch_id?: string
          comments?: string
          contact?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          offer?: string
          service?: string
          source?: string
          status?: string
          subscription_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_leads_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          branch_id: string
          created_at: string
          days: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id: string
          created_at?: string
          days: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string
          created_at?: string
          days?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_leave_requests_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_leaves_emp_fk"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "ac_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_maintenance_assets: {
        Row: {
          branch_id: string
          category: string | null
          code: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          name_ar: string | null
          notes: string | null
          purchase_date: string | null
          status: string
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          branch_id: string
          category?: string | null
          code?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          name_ar?: string | null
          notes?: string | null
          purchase_date?: string | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          branch_id?: string
          category?: string | null
          code?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          name_ar?: string | null
          notes?: string | null
          purchase_date?: string | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_maintenance_assets_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_maintenance_tickets: {
        Row: {
          asset_id: string | null
          assigned_to: string | null
          branch_id: string
          cost: number | null
          created_at: string
          description: string | null
          id: string
          priority: string
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          assigned_to?: string | null
          branch_id: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          assigned_to?: string | null
          branch_id?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_maintenance_tickets_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_tickets_asset_fk"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "ac_maintenance_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_notifications: {
        Row: {
          body: string | null
          branch_id: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          meta: Json | null
          read_at: string | null
          severity: string
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          branch_id?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          meta?: Json | null
          read_at?: string | null
          severity?: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          branch_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          meta?: Json | null
          read_at?: string | null
          severity?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_notifications_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_page_permissions: {
        Row: {
          allowed_roles: Database["public"]["Enums"]["academy_role"][]
          created_at: string
          id: string
          is_public: boolean
          path: string
          updated_at: string
        }
        Insert: {
          allowed_roles?: Database["public"]["Enums"]["academy_role"][]
          created_at?: string
          id?: string
          is_public?: boolean
          path: string
          updated_at?: string
        }
        Update: {
          allowed_roles?: Database["public"]["Enums"]["academy_role"][]
          created_at?: string
          id?: string
          is_public?: boolean
          path?: string
          updated_at?: string
        }
        Relationships: []
      }
      ac_payroll_items: {
        Row: {
          allowances: number
          base_salary: number
          bonuses: number
          branch_id: string
          created_at: string
          deductions: number
          employee_id: string
          id: string
          net_pay: number
          notes: string | null
          payroll_run_id: string
        }
        Insert: {
          allowances?: number
          base_salary?: number
          bonuses?: number
          branch_id: string
          created_at?: string
          deductions?: number
          employee_id: string
          id?: string
          net_pay?: number
          notes?: string | null
          payroll_run_id: string
        }
        Update: {
          allowances?: number
          base_salary?: number
          bonuses?: number
          branch_id?: string
          created_at?: string
          deductions?: number
          employee_id?: string
          id?: string
          net_pay?: number
          notes?: string | null
          payroll_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_payitem_emp_fk"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "ac_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_payitem_run_fk"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "ac_payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_payroll_items_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_payroll_runs: {
        Row: {
          branch_id: string
          created_at: string
          finalized_at: string | null
          finalized_by: string | null
          id: string
          notes: string | null
          period_month: number
          period_year: number
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_payroll_runs_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_pools: {
        Row: {
          branch_id: string
          created_at: string
          deleted_at: string | null
          depth_m: number | null
          id: string
          length_m: number | null
          name: string
          name_ar: string | null
          notes: string | null
          status: string
          temperature_c: number | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          deleted_at?: string | null
          depth_m?: number | null
          id?: string
          length_m?: number | null
          name: string
          name_ar?: string | null
          notes?: string | null
          status?: string
          temperature_c?: number | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          deleted_at?: string | null
          depth_m?: number | null
          id?: string
          length_m?: number | null
          name?: string
          name_ar?: string | null
          notes?: string | null
          status?: string
          temperature_c?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_pools_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_profiles: {
        Row: {
          birthdate: string | null
          created_at: string
          default_branch_id: string | null
          display_name: string | null
          gender: string | null
          id: string
          medical_notes: string | null
          national_id: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          birthdate?: string | null
          created_at?: string
          default_branch_id?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          medical_notes?: string | null
          national_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          birthdate?: string | null
          created_at?: string
          default_branch_id?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          medical_notes?: string | null
          national_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ac_purchase_order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          item_id: string | null
          line_total: number
          po_id: string
          quantity: number
          received_quantity: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          item_id?: string | null
          line_total?: number
          po_id: string
          quantity?: number
          received_quantity?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          item_id?: string | null
          line_total?: number
          po_id?: string
          quantity?: number
          received_quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "ac_poitem_item_fk"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ac_inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_poitem_po_fk"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "ac_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_purchase_orders: {
        Row: {
          approved_by: string | null
          branch_id: string
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string | null
          status: string
          supplier_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          branch_id: string
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string | null
          status?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          branch_id?: string
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string | null
          status?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_po_supplier_fk"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "ac_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_purchase_orders_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_qr_tokens: {
        Row: {
          branch_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
          trainee_id: string
          used_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          expires_at: string
          id?: string
          token: string
          trainee_id: string
          used_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          trainee_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_qr_tokens_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_qr_trainee_fk"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "ac_trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_schedule_slots: {
        Row: {
          active: boolean
          branch_id: string
          capacity_override: number | null
          coach_id: string | null
          created_at: string
          group_id: string | null
          id: string
          lane_id: string
          notes: string | null
          time_slot_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          branch_id: string
          capacity_override?: number | null
          coach_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          lane_id: string
          notes?: string | null
          time_slot_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          branch_id?: string
          capacity_override?: number | null
          coach_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          lane_id?: string
          notes?: string | null
          time_slot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_schedule_slots_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_slots_coach_fk"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "ac_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_slots_group_fk"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ac_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_slots_lane_fk"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "ac_lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_slots_time_fk"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "ac_time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_skill_levels: {
        Row: {
          branch_id: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          name_ar: string | null
          rank: number
        }
        Insert: {
          branch_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          name_ar?: string | null
          rank?: number
        }
        Update: {
          branch_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "ac_skill_levels_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_subscriptions: {
        Row: {
          branch_id: string
          coach_id: string | null
          created_at: string
          deleted_at: string | null
          end_date: string | null
          group_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          package_name: string
          package_type: string | null
          paid_amount: number
          payment_method: string | null
          price: number
          receipt_number: string | null
          schedule_slot_id: string | null
          start_date: string
          status: string
          time_slot_id: string | null
          total_sessions: number
          trainee_id: string
          updated_at: string
          used_sessions: number
        }
        Insert: {
          branch_id: string
          coach_id?: string | null
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          lane_id?: string | null
          notes?: string | null
          package_name: string
          package_type?: string | null
          paid_amount?: number
          payment_method?: string | null
          price?: number
          receipt_number?: string | null
          schedule_slot_id?: string | null
          start_date?: string
          status?: string
          time_slot_id?: string | null
          total_sessions?: number
          trainee_id: string
          updated_at?: string
          used_sessions?: number
        }
        Update: {
          branch_id?: string
          coach_id?: string | null
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          lane_id?: string | null
          notes?: string | null
          package_name?: string
          package_type?: string | null
          paid_amount?: number
          payment_method?: string | null
          price?: number
          receipt_number?: string | null
          schedule_slot_id?: string | null
          start_date?: string
          status?: string
          time_slot_id?: string | null
          total_sessions?: number
          trainee_id?: string
          updated_at?: string
          used_sessions?: number
        }
        Relationships: [
          {
            foreignKeyName: "ac_subs_coach_fk"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "ac_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_subs_group_fk"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ac_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_subs_lane_fk"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "ac_lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_subs_slot_fk"
            columns: ["schedule_slot_id"]
            isOneToOne: false
            referencedRelation: "ac_lane_occupancy"
            referencedColumns: ["schedule_slot_id"]
          },
          {
            foreignKeyName: "ac_subs_slot_fk"
            columns: ["schedule_slot_id"]
            isOneToOne: false
            referencedRelation: "ac_schedule_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_subs_time_fk"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "ac_time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_subs_trainee_fk"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "ac_trainees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_subscriptions_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_suppliers: {
        Row: {
          active: boolean
          address: string | null
          branch_id: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          branch_id: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          branch_id?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_suppliers_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_time_slots: {
        Row: {
          active: boolean
          branch_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          label: string
          start_time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          branch_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          label: string
          start_time: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          branch_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          label?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_time_slots_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_trainees: {
        Row: {
          active: boolean
          address: string | null
          assigned_coach_id: string | null
          birthdate: string | null
          branch_id: string
          category: string | null
          client_code: string
          created_at: string
          deleted_at: string | null
          email: string | null
          emergency_contact: string | null
          full_name: string
          full_name_ar: string | null
          gender: string | null
          id: string
          medical_notes: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          profile_id: string | null
          skill_level: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          assigned_coach_id?: string | null
          birthdate?: string | null
          branch_id: string
          category?: string | null
          client_code: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name: string
          full_name_ar?: string | null
          gender?: string | null
          id?: string
          medical_notes?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          skill_level?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          assigned_coach_id?: string | null
          birthdate?: string | null
          branch_id?: string
          category?: string | null
          client_code?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          full_name_ar?: string | null
          gender?: string | null
          id?: string
          medical_notes?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          skill_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_trainees_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_trainees_coach_fk"
            columns: ["assigned_coach_id"]
            isOneToOne: false
            referencedRelation: "ac_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_trainees_profile_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "ac_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_transactions: {
        Row: {
          account_id: string | null
          amount: number
          branch_id: string
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          invoice_id: string | null
          kind: string
          payment_method: string | null
          reference: string | null
          subscription_id: string | null
          tx_date: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          branch_id: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          kind: string
          payment_method?: string | null
          reference?: string | null
          subscription_id?: string | null
          tx_date?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          branch_id?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          kind?: string
          payment_method?: string | null
          reference?: string | null
          subscription_id?: string | null
          tx_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_transactions_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_tx_account_fk"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ac_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_tx_cat_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ac_expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_tx_invoice_fk"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "ac_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_tx_sub_fk"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "ac_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_user_roles: {
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
        Relationships: []
      }
      ac_whatsapp_outbox: {
        Row: {
          branch_id: string
          created_at: string
          error: string | null
          id: string
          payload: Json
          provider_message_id: string | null
          rendered_body: string
          sent_at: string | null
          status: string
          template_key: string
          to_phone: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          provider_message_id?: string | null
          rendered_body: string
          sent_at?: string | null
          status?: string
          template_key: string
          to_phone: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          provider_message_id?: string | null
          rendered_body?: string
          sent_at?: string | null
          status?: string
          template_key?: string
          to_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_whatsapp_outbox_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_whatsapp_settings: {
        Row: {
          branch_id: string
          created_at: string
          enabled: boolean
          id: string
          phone_display: string | null
          templates: Json
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          phone_display?: string | null
          templates?: Json
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          phone_display?: string | null
          templates?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_whatsapp_settings_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_notifications: {
        Row: {
          audience: string
          body: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          sent_at: string
          title: string
        }
        Insert: {
          audience?: string
          body?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          sent_at?: string
          title: string
        }
        Update: {
          audience?: string
          body?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          sent_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_notifications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
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
      assessments: {
        Row: {
          assessed_at: string
          branch_id: string
          client_id: string
          coach_id: string | null
          created_at: string
          endurance: number | null
          id: string
          level_id: string | null
          notes: string | null
          overall: number | null
          passed: boolean | null
          speed: number | null
          technique: number | null
        }
        Insert: {
          assessed_at?: string
          branch_id: string
          client_id: string
          coach_id?: string | null
          created_at?: string
          endurance?: number | null
          id?: string
          level_id?: string | null
          notes?: string | null
          overall?: number | null
          passed?: boolean | null
          speed?: number | null
          technique?: number | null
        }
        Update: {
          assessed_at?: string
          branch_id?: string
          client_id?: string
          coach_id?: string | null
          created_at?: string
          endurance?: number | null
          id?: string
          level_id?: string | null
          notes?: string | null
          overall?: number | null
          passed?: boolean | null
          speed?: number | null
          technique?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "skill_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          branch_id: string
          checked_in_at: string
          client_code: string | null
          client_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          method: string
          notes: string | null
          person_name: string | null
          person_type: string
          session_id: string | null
          session_label: string | null
        }
        Insert: {
          branch_id: string
          checked_in_at?: string
          client_code?: string | null
          client_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          person_name?: string | null
          person_type?: string
          session_id?: string | null
          session_label?: string | null
        }
        Update: {
          branch_id?: string
          checked_in_at?: string
          client_code?: string | null
          client_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          person_name?: string | null
          person_type?: string
          session_id?: string | null
          session_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "schedule_sessions"
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      clients: {
        Row: {
          active: boolean
          address: string | null
          age: number | null
          assigned_staff: string | null
          birth_date: string | null
          branch_id: string
          category: string | null
          client_code: string
          coach_id: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          full_name: string
          gender: string | null
          id: string
          level: string | null
          level_id: string | null
          medical_notes: string | null
          membership_id: string | null
          notes: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          age?: number | null
          assigned_staff?: string | null
          birth_date?: string | null
          branch_id: string
          category?: string | null
          client_code?: string
          coach_id?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name: string
          gender?: string | null
          id?: string
          level?: string | null
          level_id?: string | null
          medical_notes?: string | null
          membership_id?: string | null
          notes?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          age?: number | null
          assigned_staff?: string | null
          birth_date?: string | null
          branch_id?: string
          category?: string | null
          client_code?: string
          coach_id?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          level?: string | null
          level_id?: string | null
          medical_notes?: string | null
          membership_id?: string | null
          notes?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "skill_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_evaluations: {
        Row: {
          branch_id: string
          coach_id: string | null
          coach_name: string | null
          communication: number
          created_at: string
          evaluated_at: string
          id: string
          notes: string | null
          punctuality: number
          students: number
          technical: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          coach_id?: string | null
          coach_name?: string | null
          communication?: number
          created_at?: string
          evaluated_at?: string
          id?: string
          notes?: string | null
          punctuality?: number
          students?: number
          technical?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          coach_id?: string | null
          coach_name?: string | null
          communication?: number
          created_at?: string
          evaluated_at?: string
          id?: string
          notes?: string | null
          punctuality?: number
          students?: number
          technical?: number
          updated_at?: string
        }
        Relationships: []
      }
      coach_slots: {
        Row: {
          available: boolean
          branch_id: string
          coach_id: string | null
          coach_name: string | null
          created_at: string
          day_group: string
          id: string
          time_slot: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          branch_id: string
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string
          day_group: string
          id?: string
          time_slot: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          branch_id?: string
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string
          day_group?: string
          id?: string
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          active: boolean
          branch_id: string
          certifications: string | null
          color: string | null
          created_at: string
          day_groups: string[]
          email: string | null
          full_name: string
          id: string
          max_sessions: number | null
          notes: string | null
          phone: string | null
          role: string | null
          specialty: string | null
          updated_at: string
          user_id: string | null
          work_days: string[] | null
        }
        Insert: {
          active?: boolean
          branch_id: string
          certifications?: string | null
          color?: string | null
          created_at?: string
          day_groups?: string[]
          email?: string | null
          full_name: string
          id?: string
          max_sessions?: number | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string | null
          work_days?: string[] | null
        }
        Update: {
          active?: boolean
          branch_id?: string
          certifications?: string | null
          color?: string | null
          created_at?: string
          day_groups?: string[]
          email?: string | null
          full_name?: string
          id?: string
          max_sessions?: number | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string | null
          work_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
      group_types: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          max_capacity: number
          name: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          max_capacity?: number
          name: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          max_capacity?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_attendance: {
        Row: {
          branch_id: string
          check_in: string | null
          check_out: string | null
          created_at: string
          employee_id: string
          hours: number | null
          id: string
          notes: string | null
          work_date: string
        }
        Insert: {
          branch_id: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          employee_id: string
          hours?: number | null
          id?: string
          notes?: string | null
          work_date?: string
        }
        Update: {
          branch_id?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          employee_id?: string
          hours?: number | null
          id?: string
          notes?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_attendance_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          active: boolean
          base_salary: number
          branch_id: string
          created_at: string
          email: string | null
          full_name: string
          hired_at: string | null
          id: string
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          base_salary?: number
          branch_id: string
          created_at?: string
          email?: string | null
          full_name: string
          hired_at?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          base_salary?: number
          branch_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          hired_at?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leaves: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          branch_id: string
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id: string
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leaves_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          branch_id: string
          client_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          invoice_no: string
          status: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          branch_id: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_no?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_no?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
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
      lane_logs: {
        Row: {
          activity: string | null
          branch_id: string
          coach_id: string | null
          created_at: string
          end_at: string | null
          id: string
          notes: string | null
          pool_lane: number
          start_at: string
        }
        Insert: {
          activity?: string | null
          branch_id: string
          coach_id?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          notes?: string | null
          pool_lane: number
          start_at?: string
        }
        Update: {
          activity?: string | null
          branch_id?: string
          coach_id?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          notes?: string | null
          pool_lane?: number
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lane_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lane_logs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          kind: string
          lead_id: string
          note: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind: string
          lead_id: string
          note?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agent_id: string | null
          assigned_staff: string | null
          attended: boolean | null
          branch_id: string
          converted_client_id: string | null
          created_at: string
          email: string | null
          evaluation_date: string | null
          full_name: string
          id: string
          notes: string | null
          offer_amount: number | null
          offer_label: string | null
          phone: string | null
          service: string | null
          source: string | null
          status: string
          subscription_type: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          assigned_staff?: string | null
          attended?: boolean | null
          branch_id: string
          converted_client_id?: string | null
          created_at?: string
          email?: string | null
          evaluation_date?: string | null
          full_name: string
          id?: string
          notes?: string | null
          offer_amount?: number | null
          offer_label?: string | null
          phone?: string | null
          service?: string | null
          source?: string | null
          status?: string
          subscription_type?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          assigned_staff?: string | null
          attended?: boolean | null
          branch_id?: string
          converted_client_id?: string | null
          created_at?: string
          email?: string | null
          evaluation_date?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          offer_amount?: number | null
          offer_label?: string | null
          phone?: string | null
          service?: string | null
          source?: string | null
          status?: string
          subscription_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      payments: {
        Row: {
          address: string | null
          age: number | null
          amount: number
          branch_id: string
          category: string | null
          client_code: string | null
          client_id: string | null
          coach_id: string | null
          coach_name: string | null
          created_at: string
          emergency_contact: string | null
          group_type: string | null
          id: string
          invoice_id: string | null
          level: string | null
          membership_id: string | null
          method: string
          notes: string | null
          paid_at: string
          phone: string | null
          receipt_no: string
          session_time: string | null
          sessions_total: number
          sessions_used: number
          skill_rating: number | null
          status: string
          trainee_name: string | null
          training_days: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          amount?: number
          branch_id: string
          category?: string | null
          client_code?: string | null
          client_id?: string | null
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string
          emergency_contact?: string | null
          group_type?: string | null
          id?: string
          invoice_id?: string | null
          level?: string | null
          membership_id?: string | null
          method?: string
          notes?: string | null
          paid_at?: string
          phone?: string | null
          receipt_no?: string
          session_time?: string | null
          sessions_total?: number
          sessions_used?: number
          skill_rating?: number | null
          status?: string
          trainee_name?: string | null
          training_days?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          amount?: number
          branch_id?: string
          category?: string | null
          client_code?: string | null
          client_id?: string | null
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string
          emergency_contact?: string | null
          group_type?: string | null
          id?: string
          invoice_id?: string | null
          level?: string | null
          membership_id?: string | null
          method?: string
          notes?: string | null
          paid_at?: string
          phone?: string | null
          receipt_no?: string
          session_time?: string | null
          sessions_total?: number
          sessions_used?: number
          skill_rating?: number | null
          status?: string
          trainee_name?: string | null
          training_days?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          allowances: number
          base: number
          created_at: string
          deductions: number
          employee_id: string
          id: string
          net: number
          notes: string | null
          run_id: string
        }
        Insert: {
          allowances?: number
          base?: number
          created_at?: string
          deductions?: number
          employee_id: string
          id?: string
          net?: number
          notes?: string | null
          run_id: string
        }
        Update: {
          allowances?: number
          base?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          id?: string
          net?: number
          notes?: string | null
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_sessions: {
        Row: {
          branch_id: string
          chlorine: number | null
          created_at: string
          id: string
          measured_at: string
          notes: string | null
          ph: number | null
          temperature: number | null
          turbidity: number | null
        }
        Insert: {
          branch_id: string
          chlorine?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          ph?: number | null
          temperature?: number | null
          turbidity?: number | null
        }
        Update: {
          branch_id?: string
          chlorine?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          ph?: number | null
          temperature?: number | null
          turbidity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
      schedule_bookings: {
        Row: {
          branch_id: string
          client_id: string | null
          coach_id: string | null
          coach_name: string | null
          created_at: string
          day_group: string
          group_type_id: string | null
          group_type_name: string | null
          id: string
          student_name: string
          time_slot: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          client_id?: string | null
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string
          day_group: string
          group_type_id?: string | null
          group_type_name?: string | null
          id?: string
          student_name: string
          time_slot: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          client_id?: string | null
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string
          day_group?: string
          group_type_id?: string | null
          group_type_name?: string | null
          id?: string
          student_name?: string
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_sessions: {
        Row: {
          branch_id: string
          capacity: number | null
          coach_id: string | null
          created_at: string
          end_at: string
          id: string
          notes: string | null
          pool_lane: number | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          capacity?: number | null
          coach_id?: string | null
          created_at?: string
          end_at: string
          id?: string
          notes?: string | null
          pool_lane?: number | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          capacity?: number | null
          coach_id?: string | null
          created_at?: string
          end_at?: string
          id?: string
          notes?: string | null
          pool_lane?: number | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
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
      skill_levels: {
        Row: {
          created_at: string
          id: string
          name: string
          name_ar: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_ar: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_ar?: string
          sort_order?: number
        }
        Relationships: []
      }
      staff_hours: {
        Row: {
          branch_id: string
          created_at: string
          day_group: string
          hours: number
          id: string
          staff_name: string
          staff_role: string | null
          time_slot: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          day_group?: string
          hours?: number
          id?: string
          staff_name: string
          staff_role?: string | null
          time_slot: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          day_group?: string
          hours?: number
          id?: string
          staff_name?: string
          staff_role?: string | null
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          assigned_staff: string | null
          branch_id: string
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          name: string | null
          notes: string | null
          paid_amount: number
          plan: string
          price: number
          service_name: string | null
          service_type: string | null
          start_date: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          assigned_staff?: string | null
          branch_id: string
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          paid_amount?: number
          plan: string
          price?: number
          service_name?: string | null
          service_type?: string | null
          start_date: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          assigned_staff?: string | null
          branch_id?: string
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          paid_amount?: number
          plan?: string
          price?: number
          service_name?: string | null
          service_type?: string | null
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_allowlist: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      trainee_evaluations: {
        Row: {
          branch_id: string
          client_code: string | null
          client_id: string | null
          created_at: string
          evaluated_at: string
          evaluator: string | null
          general: number
          id: string
          improvements: string | null
          trainee_name: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          client_code?: string | null
          client_id?: string | null
          created_at?: string
          evaluated_at?: string
          evaluator?: string | null
          general?: number
          id?: string
          improvements?: string | null
          trainee_name?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          client_code?: string | null
          client_id?: string | null
          created_at?: string
          evaluated_at?: string
          evaluator?: string | null
          general?: number
          id?: string
          improvements?: string | null
          trainee_name?: string | null
          updated_at?: string
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
      ac_lane_occupancy: {
        Row: {
          branch_id: string | null
          capacity: number | null
          coach_id: string | null
          day_of_week: number | null
          end_time: string | null
          group_id: string | null
          lane_id: string | null
          lane_number: number | null
          occupied: number | null
          pool_id: string | null
          pool_name: string | null
          schedule_slot_id: string | null
          start_time: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_lanes_pool_fk"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "ac_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_schedule_slots_branch_fk"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_slots_coach_fk"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "ac_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_slots_group_fk"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ac_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_slots_lane_fk"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "ac_lanes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      ac_available_coaches: {
        Args: { _branch_id: string; _time_slot_id: string }
        Returns: {
          department: string
          full_name: string
          id: string
          title: string
        }[]
      }
      ac_available_groups: {
        Args: {
          _branch_id: string
          _category?: string
          _level?: string
          _time_slot_id: string
        }
        Returns: {
          category: string
          color: string
          current_count: number
          id: string
          level: string
          max_capacity: number
          name: string
          name_ar: string
        }[]
      }
      ac_generate_client_code: { Args: never; Returns: string }
      claim_super_admin: { Args: never; Returns: boolean }
      convert_lead_to_client: { Args: { _lead_id: string }; Returns: string }
      gen_client_code: { Args: never; Returns: string }
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
