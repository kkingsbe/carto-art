// Stub Supabase client for anonymous mode
// This is a no-op implementation since we're removing Supabase

export interface User {
  id: string;
  email: string;
  [key: string]: any;
}

export interface Auth {
  getUser(): Promise<{ data: { user: User | null }; error: any }>;
  signOut(): Promise<{ error: any }>;
  onAuthStateChange(callback: (event: string, session: any) => void): {
    data: { subscription: { unsubscribe: () => void } };
  };
}

export interface SupabaseClient {
  auth: Auth;
}

export function createClient(): SupabaseClient {
  // Return a no-op client for anonymous mode
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (callback) => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
    },
  };
}
