import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface LoginScreenProps {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Forkert adgangskode.');
      }
    } catch {
      setError('Kunne ikke logge ind. Prøv igen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-studio flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 space-y-6">

          <div className="flex items-center gap-3">
            <span className="rec-dot" aria-hidden="true" />
            <span className="font-display text-xl uppercase tracking-wide text-ink">
              Script Generator
            </span>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-lg font-bold text-ink">
              Adgangskode
            </label>
            <p className="text-base text-slate-500">
              Kun for teamet. Har du ikke en kode, så spørg den ansvarlige.
            </p>
            <input
              id="password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rec/20 focus:border-rec rounded-md px-4 py-3 text-lg text-ink transition-all"
            />
          </div>

          {error && (
            <p className="text-base font-semibold text-rec bg-red-50 border border-red-200 rounded-md px-3.5 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !password.trim()}
            className="w-full py-3.5 px-4 bg-rec hover:bg-[#c81e22] text-white rounded-md text-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-5 h-5" />
            <span>{busy ? 'Logger ind...' : 'Log ind'}</span>
          </button>

        </form>
      </div>
    </div>
  );
};
