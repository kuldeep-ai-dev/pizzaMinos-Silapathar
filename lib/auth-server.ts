"use server"

import { cookies } from "next/headers"

const SESSION_EXPIRY = 60 * 60 * 24 * 7 // 7 days in seconds

/**
 * Creates a secure, HTTP-only session cookie.
 * @param sessionName - The name of the cookie (e.g., 'pizza_admin_session')
 * @param value - The session value (e.g., 'active' or a token)
 */
export async function createSession(sessionName: string, value: string) {
    const cookieStore = await cookies()

    cookieStore.set(sessionName, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_EXPIRY,
    })
}

/**
 * Checks if a session exists and is valid.
 */
export async function getSession(sessionName: string) {
    const cookieStore = await cookies()
    return cookieStore.get(sessionName)?.value
}

/**
 * Deletes the session cookie.
 */
export async function deleteSession(sessionName: string) {
    const cookieStore = await cookies()
    cookieStore.delete(sessionName)
}
