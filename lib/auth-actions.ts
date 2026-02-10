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
 * Logs out the admin by deleting the session cookie.
 */
export async function logoutAdmin() {
    const { deleteSession } = await import("./auth-server")
    await deleteSession("pizza_admin_session")
}
