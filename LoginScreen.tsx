import React, { useState, useEffect } from 'react';

interface LoginScreenProps {
  onEmtLogin: (name: string, emtId: string) => void;
  onAdminLogin: () => void;
}

const ADMIN_CREDENTIALS = [{ username: 'admin', password: '979010' }];

const LoginScreen: React.FC<LoginScreenProps> = ({ onEmtLogin, onAdminLogin }) => {
  const [loginMode, setLoginMode] = useState<'emt' | 'admin'>('emt');
  const [emtName, setEmtName] = useState('');
  const [emtId, setEmtId] = useState('');
  const [emtPassword, setEmtPassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('emt_remembered');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.emtName) setEmtName(data.emtName);
        if (data.emtId) setEmtId(data.emtId);
        setRememberMe(true);
      }
    } catch (_e) { /* ignore */ }
  }, []);

  const handleEmtSubmit = () => {
    setError('');
    if (!emtName.trim()) { setError('Please enter your name'); return; }
    if (!emtId.trim()) { setError('Please enter your EMT ID'); return; }
    if (!emtPassword.trim()) { setError('Please enter your password'); return; }
    if (emtPassword.length < 4) { setError('Password must be at least 4 characters'); return; }
    setIsLoading(true);
    setTimeout(() => {
      try {
        const registeredEMTs = JSON.parse(localStorage.getItem('emt_registered_users') || '[]');
        const existingUser = registeredEMTs.find((u: { emtId: string; password: string }) => u.emtId === emtId.trim());
        if (existingUser) {
          if (existingUser.password !== emtPassword) { setError('Incorrect password'); setIsLoading(false); return; }
        } else {
          registeredEMTs.push({ emtName: emtName.trim(), emtId: emtId.trim(), password: emtPassword, registeredAt: new Date().toISOString() });
          localStorage.setItem('emt_registered_users', JSON.stringify(registeredEMTs));
        }
        if (rememberMe) localStorage.setItem('emt_remembered', JSON.stringify({ emtName: emtName.trim(), emtId: emtId.trim() }));
        else localStorage.removeItem('emt_remembered');
        setIsLoading(false);
        onEmtLogin(emtName.trim(), emtId.trim());
      } catch (_e) { setError('An error occurred'); setIsLoading(false); }
    }, 800);
  };

  const handleAdminSubmit = () => {
    setError('');
    if (!adminUsername.trim()) { setError('Please enter username'); return; }
    if (!adminPassword.trim()) { setError('Please enter password'); return; }
    setIsLoading(true);
    setTimeout(() => {
      const valid = ADMIN_CREDENTIALS.some(c => c.username === adminUsername.trim().toLowerCase() && c.password === adminPassword);
      if (!valid) { setError('Invalid username or password'); setIsLoading(false); return; }
      setIsLoading(false);
      onAdminLogin();
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { loginMode === 'emt' ? handleEmtSubmit() : handleAdminSubmit(); }
  };

  return (
    <div className="min-h-screen bg-[#0c1222] text-white flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-teal-600/[0.07] rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/[0.07] rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-cyan-600/[0.04] rounded-full blur-[80px] animate-pulse-glow"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Top bar */}
      <div className={`relative z-10 flex justify-end items-center p-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>v2.0</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8 relative z-10">
        <div className={`w-full max-w-[420px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-5">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500 via-emerald-600 to-green-700 rounded-[28px] flex items-center justify-center shadow-2xl shadow-teal-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                <span className="text-5xl">🏥</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-sm shadow-lg animate-bounce-in" style={{ animationDelay: '0.5s' }}>
                ✚
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-[28px] border-2 border-teal-500/20 animate-pulse-glow"></div>
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-1">
              <span className="text-gradient-teal">EMT Knowledge Test</span>
            </h1>
            <p className="text-sm text-gray-500 font-medium">108 Emergency Medical Assessment</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-teal-500/30"></div>
              <span className="text-teal-500/40 text-xs">●</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-teal-500/30"></div>
            </div>
          </div>

          {/* Login Card */}
          <div className="glass-strong rounded-3xl shadow-2xl overflow-hidden">
            {/* Tab Switcher */}
            <div className="flex p-1.5 bg-white/[0.02] m-3 rounded-2xl">
              <button type="button" onClick={() => { setLoginMode('emt'); setError(''); setShowPassword(false); }}
                className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ${
                  loginMode === 'emt'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/25'
                    : 'text-gray-500 hover:text-gray-300'
                }`}>
                <span className="text-lg">👨‍⚕️</span> EMT Login
              </button>
              <button type="button" onClick={() => { setLoginMode('admin'); setError(''); setShowPassword(false); }}
                className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ${
                  loginMode === 'admin'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/25'
                    : 'text-gray-500 hover:text-gray-300'
                }`}>
                <span className="text-lg">🛡️</span> Admin
              </button>
            </div>

            {/* Form Area */}
            <div className="px-5 pb-5 pt-2" onKeyDown={handleKeyDown}>
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/25 rounded-2xl px-4 py-3 flex items-center gap-2.5 text-sm text-red-300 animate-shake">
                  <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">⚠️</div>
                  <span className="text-xs font-medium">{error}</span>
                </div>
              )}

              {/* EMT Form */}
              {loginMode === 'emt' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/15 rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">🩺</div>
                    <div>
                      <p className="text-xs font-bold text-teal-300">EMT Access Portal</p>
                      <p className="text-[10px] text-teal-400/60">New users auto-registered</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">Full Name</label>
                      <div className="relative group">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-teal-400 transition-colors">👤</span>
                        <input type="text" placeholder="Enter your full name" value={emtName} onChange={(e) => setEmtName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-teal-500/50 focus:bg-teal-500/5 transition-all text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">EMT ID</label>
                      <div className="relative group">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-teal-400 transition-colors">🆔</span>
                        <input type="text" placeholder="e.g., EMT-001" value={emtId} onChange={(e) => setEmtId(e.target.value.toUpperCase())}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-teal-500/50 focus:bg-teal-500/5 transition-all text-sm font-mono tracking-wider" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">Password</label>
                      <div className="relative group">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-teal-400 transition-colors">🔒</span>
                        <input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={emtPassword} onChange={(e) => setEmtPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-12 py-3.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-teal-500/50 focus:bg-teal-500/5 transition-all text-sm" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors p-1">
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <button type="button" onClick={() => setRememberMe(!rememberMe)}
                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                        rememberMe ? 'bg-teal-600 border-teal-500 scale-110' : 'border-gray-700 hover:border-gray-500'
                      }`}>
                      {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className="text-xs text-gray-500">Remember me</span>
                  </div>

                  <button type="button" onClick={handleEmtSubmit} disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-600 via-emerald-500 to-green-500 hover:from-teal-500 hover:via-emerald-400 hover:to-green-400 disabled:opacity-50 rounded-2xl py-4 font-black text-sm transition-all shadow-xl shadow-teal-600/20 flex items-center justify-center gap-2.5 active:scale-[0.98] animate-gradient">
                    {isLoading ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Signing in...</>
                    ) : (
                      <><span className="text-lg">🚀</span> Login & Start</>
                    )}
                  </button>
                </div>
              )}

              {/* Admin Form */}
              {loginMode === 'admin' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/15 rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">🛡️</div>
                    <div>
                      <p className="text-xs font-bold text-amber-300">Admin Access</p>
                      <p className="text-[10px] text-amber-400/60">Training Officers Only</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">Username</label>
                      <div className="relative group">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-400 transition-colors">👤</span>
                        <input type="text" placeholder="Admin username" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/50 focus:bg-amber-500/5 transition-all text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">Password</label>
                      <div className="relative group">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-400 transition-colors">🔒</span>
                        <input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-12 py-3.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/50 focus:bg-amber-500/5 transition-all text-sm" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors p-1">
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="button" onClick={handleAdminSubmit} disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 hover:from-amber-500 hover:via-orange-400 hover:to-yellow-400 disabled:opacity-50 rounded-2xl py-4 font-black text-sm transition-all shadow-xl shadow-amber-600/20 flex items-center justify-center gap-2.5 active:scale-[0.98] animate-gradient">
                    {isLoading ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Verifying...</>
                    ) : (
                      <><span className="text-lg">🛡️</span> Admin Login</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={`text-center mt-8 transition-all duration-700 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-center gap-4 text-[11px] text-gray-700 mb-2">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full"></span>108 EMS</span>
              <span>•</span>
              <span>🔒 Secure</span>
              <span>•</span>
              <span>📱 Mobile Ready</span>
            </div>
            <p className="text-[10px] text-gray-800">© 2024 EMT Knowledge Test System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
