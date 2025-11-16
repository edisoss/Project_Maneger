import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] Starting database migration...")

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Since supabase.rpc doesn't support exec_sql, we'll execute each query separately

    // Step 1: Add project_id column to materials table
    const { error: columnError } = await supabase.rpc("add_project_id_column", {})

    if (columnError && !columnError.message.includes("already exists")) {
      console.error("[v0] Error adding project_id column:", columnError)

      // Try alternative approach: update through REST API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({
          query: `
            ALTER TABLE materials 
            ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
            
            CREATE INDEX IF NOT EXISTS idx_materials_project_id ON materials(project_id);
            
            CREATE TABLE IF NOT EXISTS material_transfers (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
              from_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
              to_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
              quantity DECIMAL(10,2) NOT NULL,
              transfer_type VARCHAR(50) NOT NULL CHECK (transfer_type IN ('assign', 'transfer', 'to_storage', 'from_storage')),
              notes TEXT,
              transferred_by UUID REFERENCES auth.users(id),
              transferred_at TIMESTAMPTZ DEFAULT NOW(),
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_material_transfers_material_id ON material_transfers(material_id);
            CREATE INDEX IF NOT EXISTS idx_material_transfers_from_project ON material_transfers(from_project_id);
            CREATE INDEX IF NOT EXISTS idx_material_transfers_to_project ON material_transfers(to_project_id);
            
            ALTER TABLE material_transfers ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Allow authenticated users to view transfers" ON material_transfers;
            DROP POLICY IF EXISTS "Allow authenticated users to create transfers" ON material_transfers;
            
            CREATE POLICY "Allow authenticated users to view transfers"
              ON material_transfers FOR SELECT
              TO authenticated
              USING (true);
            
            CREATE POLICY "Allow authenticated users to create transfers"
              ON material_transfers FOR INSERT
              TO authenticated
              WITH CHECK (true);
          `,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Migration failed:", error)
        return NextResponse.json(
          {
            error: "Unable to run migration automatically. Please run the SQL script manually in Supabase dashboard.",
            details: error,
          },
          { status: 500 },
        )
      }
    }

    console.log("[v0] Migration completed successfully")
    return NextResponse.json({
      success: true,
      message: "Migration completed successfully. All existing materials are now in Central Storage.",
    })
  } catch (error) {
    console.error("[v0] Migration failed:", error)
    return NextResponse.json(
      {
        error:
          "Migration failed. Please run scripts/006_add_project_materials.sql manually in your Supabase SQL Editor.",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
