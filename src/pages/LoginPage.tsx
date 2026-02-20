import { useState, FormEvent } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onShowSignUp: () => void;
}

function GoogleIcon() {
  return (
    <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function Spinner({ className = '' }: { className?: string }) {
  return <div className={`rounded-full border-2 border-current border-t-transparent animate-spin ${className}`} />;
}

const FEATURES = [
  'AI-powered auto-tagging across PSD & AI files',
  'Full-text search through metadata and tags',
  'Character & property reference linking',
  'NAS agent scanning with live monitoring',
  'Thumbnail generation pipeline',
];

export default function LoginPage({ onShowSignUp }: LoginPageProps) {
  const { signIn, signInWithGoogle, signInWithMicrosoft } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
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
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-slate-900 p-12 xl:p-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_50%,rgba(7,41,70,0.7),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-950/60 to-transparent" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-950">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">POPDAM</span>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-md mt-16">
            <h2 className="text-4xl font-semibold text-white leading-tight mb-5">
              Your creative<br />assets, organised.
            </h2>
            <p className="text-slate-400 text-[15px] leading-relaxed mb-12">
              A centralised digital asset management platform built for design teams working at scale.
            </p>

            <div className="space-y-4">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-600/20 border border-brand-600/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-brand-400" fill="currentColor" viewBox="0 0 8 8">
                      <path d="M6.41 1.59L3 5l-1.41-1.41L0.17 5 3 7.83l4.83-4.83z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-slate-400 leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-slate-800/60">
            <p className="text-xs text-slate-600">Secure access powered by Supabase Auth</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[500px] flex-shrink-0 flex flex-col justify-center px-8 py-12 sm:px-12 bg-slate-950">
        <div className="w-full max-w-[360px] mx-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight">POPDAM</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white mb-1.5">Sign in</h1>
            <p className="text-[13px] text-slate-500">Welcome back — select a method to continue</p>
          </div>

          <div className="space-y-2.5 mb-6">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={anyLoading}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-sm font-medium text-slate-200 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {oauthLoading === 'google' ? <Spinner className="w-[18px] h-[18px] text-slate-400" /> : <GoogleIcon />}
              <span>Continue with Google</span>
              {oauthLoading !== 'google' && (
                <svg className="w-3.5 h-3.5 text-slate-600 ml-auto group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={handleMicrosoft}
              disabled={anyLoading}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-sm font-medium text-slate-200 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {oauthLoading === 'microsoft' ? <Spinner className="w-[18px] h-[18px] text-slate-400" /> : <MicrosoftIcon />}
              <span>Continue with Microsoft</span>
              {oauthLoading !== 'microsoft' && (
                <svg className="w-3.5 h-3.5 text-slate-600 ml-auto group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-950 px-3 text-[11px] font-medium text-slate-600 uppercase tracking-wider">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Email address</label>
              <input
                type="email"
                className="input py-2.5"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input py-2.5 pr-11"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-600 hover:text-slate-400 transition-colors"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-950/50 border border-red-900/60 rounded-xl text-[13px] text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-3 text-[13px]" disabled={anyLoading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <Spinner className="w-4 h-4 text-white/60" />
                  Signing in...
                </span>
              ) : 'Sign in with email'}
            </button>
          </form>

          <p className="mt-7 text-center text-[13px] text-slate-600">
            Have an invitation?{' '}
            <button
              className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
              onClick={onShowSignUp}
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
