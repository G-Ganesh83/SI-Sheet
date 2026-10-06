import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContextBase";
import type { AuthContextValue, UserProfile } from "../types/auth";

const HEARTBEAT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(supabase));
  const [error, setError] = useState<string | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState<boolean>(false);

  const lastHeartbeatRef = useRef<number>(0);
  const isHeartbeatInFlightRef = useRef<boolean>(false);

  const triggerHeartbeat = useCallback(async (forced = false) => {
    if (!supabase) return;
    const now = Date.now();
    if (!forced && now - lastHeartbeatRef.current < HEARTBEAT_COOLDOWN_MS) {
      return;
    }
    if (isHeartbeatInFlightRef.current) {
      return;
    }

    isHeartbeatInFlightRef.current = true;
    try {
      const { error: rpcErr } = await supabase.rpc("touch_user_activity");
      if (rpcErr) {
        if (import.meta.env.DEV) {
          console.warn("[Auth] touch_user_activity notice:", rpcErr.message);
        }
      } else {
        lastHeartbeatRef.current = Date.now();
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.warn("[Auth] touch_user_activity exception:", err);
      }
    } finally {
      isHeartbeatInFlightRef.current = false;
    }
  }, []);

  const showAuthPrompt = useCallback(() => {
    setAuthPromptOpen(true);
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setAuthPromptOpen(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const syncProfile = useCallback(async (authUser: User) => {
    if (!supabase) return;
    try {
      // 1. Fetch user profile if it already exists
      const { data: existingProfile, error: fetchErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (existingProfile) {
        const userProf = existingProfile as UserProfile;
        setProfile(userProf);
        if (userProf.last_seen_at) {
          const profileSeenTime = new Date(userProf.last_seen_at).getTime();
          if (!Number.isNaN(profileSeenTime) && profileSeenTime > lastHeartbeatRef.current) {
            lastHeartbeatRef.current = profileSeenTime;
          }
        }
        return;
      }

      if (fetchErr) {
        console.warn("[Auth] Profile query warning:", fetchErr.message);
      }

      // 2. Profile missing: create with strictly enforced 'user' role
      const newProfile = {
        user_id: authUser.id,
        display_name:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "Learner",
        avatar_url:
          authUser.user_metadata?.avatar_url ||
          authUser.user_metadata?.picture ||
          null,
        role: "user" as const,
      };

      const { data: insertedProfile, error: insertErr } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .maybeSingle();

      if (insertedProfile) {
        setProfile(insertedProfile as UserProfile);
      } else if (insertErr) {
        console.warn("[Auth] Profile creation notice:", insertErr.message);
      }
    } catch (err: unknown) {
      console.error("[Auth] Profile synchronization exception:", err);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    // Check current active session
    supabase.auth
      .getSession()
      .then(async ({ data: { session: currentSession }, error: sessionErr }) => {
        if (!isMounted) return;
        if (sessionErr) {
          setError(sessionErr.message);
        }
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await syncProfile(currentSession.user);
        }
        if (isMounted) {
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error("[Auth] Initial session error:", err);
        setIsLoading(false);
      });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await syncProfile(newSession.user);
      } else {
        lastHeartbeatRef.current = 0;
        setProfile(null);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  // Activity interaction listener: only triggered by genuine user interaction, throttled to 5 minutes
  useEffect(() => {
    if (!user || !supabase) {
      return;
    }

    const handleUserActivity = () => {
      void triggerHeartbeat();
    };

    window.addEventListener("pointerdown", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, [user, triggerHeartbeat]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      if (!supabase) {
        throw new Error("Supabase client is not configured. Please check your environment variables.");
      }
      const { error: signInErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (signInErr) {
        throw signInErr;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in with Google.";
      setError(message);
      console.error("[Auth] Google Sign-In error:", err);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      if (!supabase) return;
      const { error: signOutErr } = await supabase.auth.signOut();
      if (signOutErr) {
        throw signOutErr;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign out.";
      setError(message);
      console.error("[Auth] Sign-out error:", err);
    } finally {
      lastHeartbeatRef.current = 0;
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      isLoading,
      error,
      signInWithGoogle,
      signOut,
      clearError,
      authPromptOpen,
      showAuthPrompt,
      closeAuthPrompt,
    }),
    [session, user, profile, isLoading, error, signInWithGoogle, signOut, clearError, authPromptOpen, showAuthPrompt, closeAuthPrompt]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
