import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { prisma } from "./db";

// Session cookie name
const SESSION_COOKIE = "armaso_session";

// Session data type
export interface SessionData {
  userId: string;
  username: string;
  isLoggedIn: boolean;
}

// Simple session encoding/decoding (for production, use proper encryption!)
function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

function decodeSession(encoded: string): SessionData | null {
  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

// Get current session (for checking auth status)
export const getAuthSession = createServerFn().handler(async () => {
  const sessionCookie = getCookie(SESSION_COOKIE);

  if (!sessionCookie) {
    return {
      userId: undefined,
      username: undefined,
      isLoggedIn: false,
    };
  }

  const session = decodeSession(sessionCookie);

  if (!session) {
    return {
      userId: undefined,
      username: undefined,
      isLoggedIn: false,
    };
  }

  return {
    userId: session.userId,
    username: session.username,
    isLoggedIn: session.isLoggedIn,
  };
});

// Login server function
export const login = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { username, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    // Check password (in production, use bcrypt!)
    if (!user || user.password !== password) {
      return { success: false as const, error: "Invalid username or password" };
    }

    // Create session data
    const sessionData: SessionData = {
      userId: user.id,
      username: user.username,
      isLoggedIn: true,
    };

    // Set session cookie
    setCookie(SESSION_COOKIE, encodeSession(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true as const, username: user.username };
  });

// Logout server function
export const logout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(SESSION_COOKIE);
  return { success: true };
});
