import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Test Environment Variables
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            return NextResponse.json({
                status: "error",
                message: "Missing environment variables on Vercel.",
                url_exists: !!url,
                key_exists: !!key
            }, { status: 500 });
        }

        // 2. Test Basic Connectivity / Read Access
        const { data, error, status } = await supabase
            .from("menu_categories")
            .select("*")
            .limit(1);

        if (error) {
            return NextResponse.json({
                status: "error",
                message: "Supabase Query Failed",
                supabase_status: status,
                error_details: error
            }, { status: 500 });
        }

        // 3. Success
        return NextResponse.json({
            status: "success",
            message: "Successfully connected and fetched from Supabase",
            data_sample: data,
            supabase_status: status
        });

    } catch (e: any) {
        return NextResponse.json({
            status: "critical_error",
            message: e.message,
            stack: e.stack
        }, { status: 500 });
    }
}
