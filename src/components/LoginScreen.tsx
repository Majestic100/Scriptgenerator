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
    <div className="min-h-[100dvh] bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={submit}
          className="bg-surface border border-line rounded-[var(--radius-card)] shadow-[0_1px_2px_rgb(22_24_29/0.05)] p-8 space-y-6"
        >

          <div className="flex items-center gap-2.5">
            <span className="rec-dot" aria-hidden="true" />
            <span className="font-display text-[19px] text-ink">Script Generator</span>
          </div>

          <div>
            <h1 className="font-display text-[24px] leading-tight text-ink">Log ind</h1>
            <p className="field-hint mt-1">
              Kun for teamet. Har du ikke en kode, så spørg den ansvarlige.
            </p>
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Adgangskode
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="control"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-[15px] font-medium text-ink bg-rec-soft border border-rec/40 rounded-[var(--radius-control)] px-3.5 py-2.5"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !password.trim()}
            className="w-full py-3 px-4 bg-rec hover:bg-rec-hover text-white rounded-[var(--radius-control)] text-[16px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            <span>{busy ? 'Logger ind...' : 'Log ind'}</span>
          </button>

        </form>
      </div>
    </div>
  );
};
