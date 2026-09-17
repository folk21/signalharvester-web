import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { ErrorState, LoadingState } from '../../components/AsyncState';
import {
  canAccessPath,
  defaultRouteForPrincipal,
  useAuthSession,
} from './AuthSession';

interface LoginLocationState {
  from?: string;
}

export function LoginPage() {
  const auth = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const requestedPath = (location.state as LoginLocationState | null)?.from;

  if (auth.status === 'loading') {
    return <AuthFrame><LoadingState label="Checking authentication…" /></AuthFrame>;
  }

  if (auth.status === 'error') {
    return (
      <AuthFrame>
        <ErrorState
          error={auth.error}
          action={<button className="button button--ghost" type="button" onClick={() => void auth.refresh()}>Retry</button>}
        />
      </AuthFrame>
    );
  }

  if (auth.principal) {
    const destination = requestedPath && canAccessPath(auth.principal, pathOnly(requestedPath))
      ? requestedPath
      : defaultRouteForPrincipal(auth.principal);
    return <Navigate to={destination} replace />;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    auth.clearLoginError();

    try {
      const principal = await auth.login({ username: username.trim(), password });
      setPassword('');
      const destination = requestedPath && canAccessPath(principal, pathOnly(requestedPath))
        ? requestedPath
        : defaultRouteForPrincipal(principal);
      navigate(destination, { replace: true });
    } catch {
      // The mutation exposes the request error through auth.loginError.
    }
  }

  const loginError = auth.loginError instanceof ApiError && auth.loginError.status === 401
    ? 'Invalid username or password, or the account is disabled.'
    : auth.loginError instanceof Error
      ? auth.loginError.message
      : auth.loginError
        ? 'Authentication failed.'
        : null;

  return (
    <AuthFrame>
      <section className="auth-card" aria-labelledby="login-title">
        <div className="brand auth-card__brand">
          <div className="brand__mark">SH</div>
          <div>
            <strong>SignalHarvester</strong>
            <span>Secure access</span>
          </div>
        </div>
        <div className="auth-card__intro">
          <div className="eyebrow">Authentication</div>
          <h1 id="login-title">Sign in</h1>
          <p>Use an enabled SignalHarvester identity. Access after sign-in depends on explicit backend roles.</p>
        </div>
        <form className="auth-form" aria-label="Sign in" onSubmit={submit}>
          <label>
            <span>Username</span>
            <input
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                auth.clearLoginError();
              }}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              required
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                auth.clearLoginError();
              }}
            />
          </label>
          {loginError ? <div className="form-error" role="alert">{loginError}</div> : null}
          <button className="button button--primary" disabled={auth.loginPending} type="submit">
            {auth.loginPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </AuthFrame>
  );
}

function AuthFrame({ children }: { children: React.ReactNode }) {
  return <main className="auth-page">{children}</main>;
}

function pathOnly(value: string): string {
  const queryIndex = value.indexOf('?');
  const hashIndex = value.indexOf('#');
  const boundary = [queryIndex, hashIndex].filter((index) => index >= 0).sort((a, b) => a - b)[0];
  return boundary === undefined ? value : value.slice(0, boundary);
}
