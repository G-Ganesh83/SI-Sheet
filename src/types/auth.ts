import type { Session, User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  /** Open the inline sign-in prompt modal (no page navigation). */
  showAuthPrompt: () => void;
  /** Close the inline sign-in prompt modal. */
  closeAuthPrompt: () => void;
  authPromptOpen: boolean;
}
