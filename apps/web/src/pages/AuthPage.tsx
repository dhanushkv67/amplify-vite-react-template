import { useState, type FormEvent } from 'react';
import { useOptionalAuth } from '../auth/AuthProvider';
import { authApi } from '../lib/api';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Also works standalone for the acceptance page; the shell uses AuthProvider.
  const auth = useOptionalAuth();
  const login = auth?.login ?? (async (address: string, secret: string) => { await authApi.login(address, secret); });
  const signup = auth?.signup ?? (async (address: string, secret: string) => {
    await authApi.signup(address, secret); await authApi.login(address, secret);
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(email, password);
      setPassword('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Authentication failed'); }
    finally { setBusy(false); }
  }
  return <main>
    <h1>{mode === 'login' ? 'Log in' : 'Create account'}</h1>
    <form onSubmit={event => { void submit(event); }}>
      <label htmlFor="auth-email">Email</label>
      <input id="auth-email" type="email" name="email" autoComplete="email" value={email}
        onChange={event => setEmail(event.target.value)} required />
      <label htmlFor="auth-password">Password</label>
      <input id="auth-password" type="password" name="password" minLength={mode === 'signup' ? 12 : undefined}
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password}
        onChange={event => setPassword(event.target.value)} required />
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
    </form>
    <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
      {mode === 'login' ? 'Create an account' : 'Already have an account? Log in'}
    </button>
  </main>;
}
