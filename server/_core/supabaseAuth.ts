import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import { ForbiddenError } from "@shared/_core/errors";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type AuthenticatedUser = User;

// Service-role client used only to validate bearer tokens issued by Supabase
// Auth (`auth.getUser`) — never exposed to the browser.
const supabaseAdmin =
  ENV.supabaseUrl && ENV.supabaseServiceRoleKey
    ? createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

function getBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return undefined;
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedUser> {
  if (!supabaseAdmin) {
    throw ForbiddenError("Supabase auth is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }

  const token = getBearerToken(req);
  if (!token) throw ForbiddenError("Missing bearer token");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw ForbiddenError("Invalid or expired session");

  const supabaseUser = data.user;
  const signedInAt = new Date();
  let user = await db.getUserByOpenId(supabaseUser.id);

  if (!user) {
    await db.upsertUser({
      openId: supabaseUser.id,
      name: typeof supabaseUser.user_metadata?.full_name === "string" ? supabaseUser.user_metadata.full_name : null,
      email: supabaseUser.email ?? null,
      loginMethod: typeof supabaseUser.app_metadata?.provider === "string" ? supabaseUser.app_metadata.provider : null,
      lastSignedIn: signedInAt,
    });
    user = await db.getUserByOpenId(supabaseUser.id);
  } else {
    await db.upsertUser({ openId: supabaseUser.id, lastSignedIn: signedInAt });
  }

  if (!user) throw ForbiddenError("User not found");
  return user;
}
