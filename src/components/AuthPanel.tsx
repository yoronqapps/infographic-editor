import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { LogIn, LogOut, UserCircle2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AuthMode = 'signin' | 'signup';

export default function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let active = true;

    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      setUser(session?.user ?? null);
    };

    void loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      if (session) {
        setStatus('Signed in');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setStatus('Enter both email and password');
      return;
    }

    try {
      setStatus('Authenticating...');

      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus('Signed in successfully');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setStatus('Check your inbox to confirm the account');
      }

      setPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      setStatus(message);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setStatus(error.message);
      return;
    }

    setUser(null);
    setStatus('Signed out');
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-100">
        Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to enable auth.
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5">
        <UserCircle2 className="h-4 w-4 text-blue-300" />
        <span className="max-w-[150px] truncate text-[11px] text-slate-200">{user.email ?? 'Signed in'}</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1 rounded border border-slate-600 bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-100 transition hover:bg-slate-600"
        >
          <LogOut className="h-3 w-3" />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-36 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-[11px] text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-28 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-[11px] text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 font-medium text-white transition hover:bg-blue-500"
        >
          <LogIn className="h-3 w-3" />
          {mode === 'signin' ? 'Sign in' : 'Create'}
        </button>
        <button
          type="button"
          onClick={() => setMode((current) => (current === 'signin' ? 'signup' : 'signin'))}
          className="rounded border border-slate-600 px-2 py-1.5 text-[10px] text-slate-200 transition hover:bg-slate-800"
        >
          {mode === 'signin' ? 'Need account?' : 'Back to login'}
        </button>
      </form>
      {status ? <span className="max-w-[180px] text-[10px] text-slate-300">{status}</span> : null}
    </div>
  );
}
