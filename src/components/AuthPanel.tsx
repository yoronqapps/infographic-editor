import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { LogIn, LogOut, UserCircle2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AuthMode = 'signin' | 'signup';

interface AuthPanelProps {
  compact?: boolean;
}

export default function AuthPanel({ compact = false }: AuthPanelProps) {
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
    if (compact) return <span title="Authentication is not configured" className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 text-amber-200"><UserCircle2 className="h-5 w-5" /></span>;
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-100">
        Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to enable auth.
      </div>
    );
  }

  if (user) {
    if (compact) {
      return <details className="relative">
        <summary title="Profile settings" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"><UserCircle2 className="h-5 w-5" /></summary>
        <div className="absolute bottom-12 left-0 z-50 w-56 rounded-xl border border-slate-700 bg-slate-900 p-3 text-white shadow-2xl">
          <p className="truncate text-xs font-semibold">{user.email ?? 'Signed in'}</p>
          <p className="mt-1 text-[10px] text-slate-400">Your account</p>
          <button type="button" onClick={handleSignOut} className="mt-3 flex w-full items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>
      </details>;
    }
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

  if (compact) {
    return <details className="relative">
      <summary title="Sign in or create account" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"><UserCircle2 className="h-5 w-5" /></summary>
      <div className="absolute bottom-12 left-0 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900 p-3 text-white shadow-2xl">
        <p className="mb-3 text-xs font-semibold">Sign in to your studio</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="rounded border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-white outline-none focus:border-blue-400" />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="rounded border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-white outline-none focus:border-blue-400" />
          <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">{mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>
        <button type="button" onClick={() => setMode((current) => current === 'signin' ? 'signup' : 'signin')} className="mt-2 text-[10px] text-slate-300 hover:text-white">{mode === 'signin' ? 'Need an account?' : 'Back to sign in'}</button>
        {status && <p className="mt-2 text-[10px] leading-4 text-slate-300">{status}</p>}
      </div>
    </details>;
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
