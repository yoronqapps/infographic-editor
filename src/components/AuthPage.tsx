import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, LogIn, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthPageProps {
  onBack: () => void;
}

export default function AuthPage({ onBack }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || password.length < 6) {
      setStatus('Enter an email and a password with at least 6 characters.');
      return;
    }

    setBusy(true);
    setStatus('');
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setStatus('Signed in. Opening your studio...');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setStatus(data.session ? 'Account created. Opening your studio...' : 'Check your email to confirm your account.');
      }
      setPassword('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1faf2] text-[#051f20]">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between px-6 py-7 lg:px-12 lg:py-10">
          <button onClick={onBack} className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-[#235347] hover:text-[#051f20]"><ArrowLeft className="h-4 w-4" /> Back to overview</button>
          <div className="max-w-md py-12">
            <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-[#235347] text-[#daf1de]"><Sparkles className="h-5 w-5" /></div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d97706]">Your ideas, in focus</p>
            <h1 className="mt-4 font-['Space_Grotesk'] text-4xl font-bold leading-tight sm:text-5xl">A clearer way to make the point.</h1>
            <p className="mt-5 text-base leading-7 text-[#235347]">Create, refine, and share visual stories from one focused workspace.</p>
            <div className="mt-8 space-y-3 text-sm text-[#235347]"><p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#d97706]" /> Keep every page and revision together</p><p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#d97706]" /> Turn data into editable visual language</p><p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#d97706]" /> Export when the story is ready</p></div>
          </div>
          <p className="text-xs text-[#235347]/60">InfographicStudio · A workspace for visual thinking</p>
        </section>

        <section className="flex items-center justify-center bg-[#163832] px-6 py-12 lg:px-16">
          <div className="w-full max-w-md rounded-2xl bg-[#f1faf2] p-7 shadow-2xl sm:p-9">
            <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d97706]">{mode === 'signin' ? 'Welcome back' : 'Start your workspace'}</p><h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold">{mode === 'signin' ? 'Sign in to continue' : 'Create your account'}</h2><p className="mt-2 text-sm text-[#235347]">{mode === 'signin' ? 'Your canvas is waiting.' : 'Save your work and keep building.'}</p></div>
            {!isSupabaseConfigured ? <p className="rounded border border-[#d97706]/40 bg-[#d97706]/10 p-3 text-xs text-[#235347]">Authentication is not configured for this deployment yet.</p> : <form onSubmit={submit} className="space-y-4">
              <label className="block text-xs font-semibold text-[#235347]">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-1.5 w-full rounded border border-[#235347]/25 bg-white px-3 py-3 text-sm outline-none focus:border-[#235347]" /></label>
              <label className="block text-xs font-semibold text-[#235347]">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className="mt-1.5 w-full rounded border border-[#235347]/25 bg-white px-3 py-3 text-sm outline-none focus:border-[#235347]" /></label>
              <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded bg-[#235347] px-4 py-3 text-sm font-semibold text-[#daf1de] transition hover:bg-[#0b2b26] disabled:opacity-50">{busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'} {!busy && <LogIn className="h-4 w-4" />}</button>
              {status && <p className="text-xs leading-5 text-[#235347]" role="status">{status}</p>}
            </form>}
            <div className="mt-7 border-t border-[#235347]/15 pt-5 text-center text-xs text-[#235347]">{mode === 'signin' ? 'New to InfographicStudio?' : 'Already have an account?'} <button onClick={() => { setMode((current) => current === 'signin' ? 'signup' : 'signin'); setStatus(''); }} className="inline-flex items-center gap-1 font-bold text-[#235347] hover:text-[#051f20]">{mode === 'signin' ? 'Create an account' : 'Sign in'} <ArrowRight className="h-3 w-3" /></button></div>
          </div>
        </section>
      </div>
    </main>
  );
}
