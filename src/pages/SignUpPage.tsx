import { useState, FormEvent } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignUpPageProps {
  onShowLogin: () => void;
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 23 23" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

function Divider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-800" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-slate-950 px-3 text-xs text-slate-600">or register with email</span>
      </div>
    </div>
  );
}

export default function SignUpPage({ onShowLogin }: SignUpPageProps) {
  const { signUp, signInWithGoogle, signInWithMicrosoft } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationId, setInvitationId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, invitationId.trim());
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError('');
    setOauthLoading('google');
    const { error } = await signInWithGoogle();
    if (error) { setError(error); setOauthLoading(null); }
  }

  async function handleMicrosoft() {
    setError('');
    setOauthLoading('microsoft');
    const { error } = await signInWithMicrosoft();
    if (error) { setError(error); setOauthLoading(null); }
  }

  const anyLoading = loading || oauthLoading !== null;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 items-center justify-center p-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(12,143,225,0.07),transparent_65%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-800/40 to-transparent" />
        <div className="relative z-10 max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-950/60">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-2xl font-semibold tracking-tight">POPDAM</span>
          </div>
          <h2 className="text-3xl font-semibold text-slate-100 leading-snug mb-4">
            Join your team's<br />asset library.
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            You'll need a valid invitation to register. Once you're in, you can browse, search, and manage your team's creative files.
          </p>
          <div className="mt-10 p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl">
            <p className="text-xs font-medium text-slate-300 mb-1">How registration works</p>
            <ol className="space-y-1.5 text-xs text-slate-500 list-decimal list-inside">
              <li>An admin creates an invitation for your email</li>
              <li>You receive the invitation ID to use here</li>
              <li>Register with the matching email address</li>
              <li>Or use Google / Microsoft SSO with the same email</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[480px] flex-shrink-0 flex items-center justify-center p-8 bg-slate-950 lg:border-l lg:border-slate-900">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight">POPDAM</span>
          </div>

          {success ? (
            <div className="text-center animate-slide-up">
              <div className="w-16 h-16 bg-emerald-900/30 border border-emerald-800/40 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Account created</h2>
              <p className="text-sm text-slate-400 mb-8">You can now sign in with your credentials.</p>
              <button className="btn-primary w-full py-2.5" onClick={onShowLogin}>
                Go to sign in
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold mb-1">Create account</h1>
              <p className="text-sm text-slate-500 mb-8">You'll need a valid invitation to register</p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={anyLoading}
                  className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-sm font-medium text-slate-200 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {oauthLoading === 'google' ? (
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
                  ) : <GoogleIcon />}
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleMicrosoft}
                  disabled={anyLoading}
                  className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-sm font-medium text-slate-200 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {oauthLoading === 'microsoft' ? (
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
                  ) : <MicrosoftIcon />}
                  Microsoft
                </button>
              </div>

              <Divider />

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Invitation ID</label>
                  <input
                    type="text"
                    className="input font-mono text-xs tracking-wide"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={invitationId}
                    onChange={e => setInvitationId(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-sm text-red-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-2.5 text-sm" disabled={anyLoading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : 'Create account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <button
                  className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
                  onClick={onShowLogin}
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
