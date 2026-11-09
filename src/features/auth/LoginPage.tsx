import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, Label, TextField } from '@heroui/react';
import { BookOpen, CalendarDays, Repeat, TriangleAlert } from 'lucide-react';
import { apiBaseUrl, isServerMode } from '@/services';
import { ApiError } from '@/services/http/client';
import { createAuthClient } from '@/services/http/auth';
import { clearSnapshotCache } from '@/services/http/snapshot';

type AuthMode = 'login' | 'register';

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Plan the day',
    copy: 'Tasks, projects, and calendar in one place.',
    tone: 'text-module-tasks',
  },
  {
    icon: Repeat,
    title: 'Keep momentum',
    copy: 'Time boxes and habits that carry the week forward.',
    tone: 'text-module-habits',
  },
  {
    icon: BookOpen,
    title: 'Grow your context',
    copy: 'Knowledge stays linked to the work it belongs to.',
    tone: 'text-module-knowledge',
  },
] as const;

export function LoginPage({ mode = 'login' }: { mode?: AuthMode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  if (!isServerMode) return <Navigate to="/today" replace />;

  const isRegister = mode === 'register';

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    setError(null);
    setIsPending(true);
    try {
      const auth = createAuthClient(apiBaseUrl);
      if (isRegister) {
        await auth.register(name.trim(), email.trim(), password);
      } else {
        await auth.login(email.trim(), password);
      }
      clearSnapshotCache();
      queryClient.clear();
      navigate('/today', { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status !== 0) {
        setError(isRegister || caught.status !== 401 ? caught.message : 'Invalid email or password');
      } else {
        setError('Cannot reach the server');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden min-h-dvh flex-col justify-between overflow-hidden bg-[#071a2b] p-10 text-white lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.3),transparent_36%),radial-gradient(circle_at_88%_82%,rgba(52,168,83,0.24),transparent_42%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          aria-hidden
        />
        <div className="relative">
          <img
            src="/brand/morrow-logo-dark.svg"
            alt="Morrow — Build a Better Tomorrow"
            className="w-[360px] max-w-full"
          />
          <p className="mt-10 max-w-md text-sm leading-relaxed text-white/70">
            One calm home for the work that matters — so the next step is always clear.
          </p>

          <ul className="mt-10 flex max-w-md flex-col gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07]">
                    <Icon className={`size-4 ${feature.tone}`} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">{feature.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-white/55">
                      {feature.copy}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-white/35">
          Your workspace, on your server.
        </p>
      </aside>

      <main className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src="/brand/morrow-mark.svg" alt="" className="size-11 shrink-0" />
            <div>
              <p className="text-xl font-semibold text-foreground">Morrow</p>
              <p className="text-xs text-muted">Build a Better Tomorrow.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="mb-7">
              <p className="section-label">{isRegister ? 'New workspace' : 'Welcome back'}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {isRegister ? 'Create your account' : 'Sign in to Morrow'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {isRegister
                  ? 'Start with an empty workspace and bring your work into focus.'
                  : 'Pick up where you left off.'}
              </p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              {isRegister ? (
                <TextField value={name} onChange={setName}>
                  <Label>Name</Label>
                  <Input autoComplete="name" autoFocus placeholder="Ada Lovelace" />
                </TextField>
              ) : null}

              <TextField value={email} onChange={setEmail} isRequired>
                <Label>Email</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  autoFocus={!isRegister}
                  placeholder="you@example.com"
                />
              </TextField>

              <TextField value={password} onChange={setPassword} isRequired>
                <Label>Password</Label>
                <Input
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                />
              </TextField>

              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs text-danger"
                >
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="mt-1 w-full"
                isPending={isPending}
                isDisabled={isPending || !email || !password}
              >
                {isRegister ? 'Create account' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted">
              {isRegister ? (
                <>
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-accent hover:underline">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  New here?{' '}
                  <Link to="/register" className="font-medium text-accent hover:underline">
                    Create an account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
