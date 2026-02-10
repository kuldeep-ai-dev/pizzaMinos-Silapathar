"use server"

import { createClient } from "@/utils/supabase/server"
import { createSession } from "./auth-server"

/**
 * Securely verifies admin credentials on the server.
 */
export async function verifyAdminLogin(username: string, password: string) {
    const supabase = await createClient()

    const { data: usernameData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "admin_username")
        .single()

    const { data: passwordData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "admin_password")
        .single()

    const dbUsername = usernameData?.value || "admin"
    const dbPassword = passwordData?.value || "pizza7870"

    if (username === dbUsername && password === dbPassword) {
        await createSession("pizza_admin_session", "active_" + Date.now())
        return { success: true }
    }

    return { success: false, error: "Unauthorized access denied. Check credentials." }
}

/**
 * Securely verifies MG Dashboard password on the server.
 */
export async function verifyMGLogin(password: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "mg_password")
        .single()

    const correctPass = data?.value || "meny123"

    if (password === correctPass) {
        await createSession("mg_dashboard_session", "active_" + Date.now())
        return { success: true }
    }

    return { success: false, error: "Invalid Master Password" }
}

/**
 * Securely verifies KDS access key on the server.
 */
export async function verifyKDSLogin(password: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "kds_password")
        .single()

    const correctPass = data?.value || "1234"

    if (password === correctPass) {
        await createSession("kds_session", "authorized")
        return { success: true }
    }

    return { success: false, error: "Incorrect Access Key" }
}

/**
 * Logs out the admin by deleting the session cookie and removing active session.
 */
export async function logoutAdmin(sessionId?: string) {
    const { deleteSession } = await import("./auth-server")
    await deleteSession("pizza_admin_session")

    if (sessionId) {
        const supabase = await createClient()
        await supabase.from("admin_sessions").delete().eq("session_id", sessionId)
    }
}

/**
 * Registers a new active admin session with device metadata.
 */
export async function registerAdminSession(metadata: {
    sessionId: string;
    userAgent: string;
    ip: string;
    location: string;
}) {
    const supabase = await createClient();

    // Clean up old sessions (older than 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("admin_sessions").delete().lt("last_active_at", oneDayAgo);

    const { error } = await supabase.from("admin_sessions").upsert({
        session_id: metadata.sessionId,
        user_agent: metadata.userAgent,
        ip_address: metadata.ip,
        location: metadata.location,
        last_active_at: new Date().toISOString()
    }, { onConflict: 'session_id' });

    if (error) console.error("Failed to register session:", error);
    return { success: !error };
}

/**
 * Updates the last active timestamp for an admin session.
 */
export async function pingAdminSession(sessionId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("admin_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("session_id", sessionId);

    if (error) console.error("Ping failed:", error);
    return { success: !error };
}
