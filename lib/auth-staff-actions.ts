"use server";

import { createSession, deleteSession, getSession } from "./auth-server";
import { createClient } from "@/utils/supabase/client";

/**
 * Verifies staff login credentials against the database.
 * @param username Staff username
 * @param password Staff password (plain text for now as per project standard, should be hashed in production)
 */
export async function verifyStaffLogin(username: string, password: string) {
    const supabase = createClient();

    const { data: staff, error } = await supabase
        .from("staff")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

    if (error || !staff) {
        return { success: false, error: "Invalid username or password" };
    }

    // Create a secure session for the staff member
    // Store staff ID and role in the session
    const sessionData = JSON.stringify({
        id: staff.id,
        name: staff.name,
        role: staff.role,
        username: staff.username
    });

    await createSession("captain_session", sessionData);

    // Log the activity
    await logStaffActivity(staff.id, "Logged In");

    return { success: true, staff };
}

/**
 * Logs staff activity to the database.
 */
export async function logStaffActivity(staffId: string, action: string, orderId?: string, details?: any) {
    const supabase = createClient();

    const { error } = await supabase.from("staff_activity").insert({
        staff_id: staffId,
        action: action,
        order_id: orderId,
        details: details || {}
    });

    if (error) {
        console.error("Error logging staff activity:", error);
    }
}

/**
 * Get the current staff session.
 */
export async function getStaffSession() {
    const session = await getSession("captain_session");
    if (!session) return null;
    try {
        return JSON.parse(session);
    } catch (e) {
        return null;
    }
}

/**
 * Logout staff.
 */
export async function logoutStaff() {
    const session = await getStaffSession();
    if (session) {
        await logStaffActivity(session.id, "Logged Out");
    }
    await deleteSession("captain_session");
}
