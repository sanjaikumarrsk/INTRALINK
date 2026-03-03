import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { toast } from 'react-toastify';

export default function Login() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { mobileNumber: mobileNumber.trim(), password };
    try {
      const { data } = await login(payload);

      // Persist auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      localStorage.setItem('mobileNumber', data.mobileNumber);
      localStorage.setItem('ward', data.ward || '');
      localStorage.setItem('userId', data.userId || '');

      // Update context (normalize role to lowercase for frontend)
      const role = data.role.toLowerCase();
      loginUser({ name: data.name, role, mobileNumber: data.mobileNumber, ward: data.ward || '', userId: data.userId || '' });

      // Dispatch event so socket hook reconnects and NotificationContext re-fetches
      window.dispatchEvent(new Event('userLoggedIn'));

      toast.success('Welcome back, ' + data.name);

      // Redirect based on role — each role has its own home
      const roleRouteMap = {
        admin: '/admin',
        higher_authority: '/higher',
        ward_authority: '/authority',
        user: '/dashboard',
      };

      // Use setTimeout to ensure React state (auth context) has settled before navigation
      setTimeout(() => {
        navigate(roleRouteMap[role] || '/dashboard', { replace: true });
      }, 50);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (mobile, pass) => { setMobileNumber(mobile); setPassword(pass); };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center text-white font-bold text-xl shadow">IL</div>
          </Link>
          <h1 className="text-2xl font-bold text-navy">Sign In</h1>
          <p className="text-sm text-text-secondary mt-1">Enter your credentials to continue</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-border p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Mobile Number</label>
              <input type="text" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)}
                placeholder="Enter your mobile number" required maxLength={10}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-navy text-white font-semibold rounded-lg hover:bg-navy-dark transition-colors text-sm disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-navy font-medium hover:underline">Register here</Link>
            </p>
          </div>
        </div>

        {/* Quick-fill demo accounts */}
        <div className="mt-4 bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-xs font-semibold text-navy mb-2">Quick Login (Demo Accounts):</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => fillDemo('9000000001', 'admin123')} className="text-xs px-3 py-1.5 rounded-full bg-white border border-blue-200 hover:bg-blue-100 transition-colors text-navy font-medium">Admin</button>
            <button onClick={() => fillDemo('9000000002', 'authority123')} className="text-xs px-3 py-1.5 rounded-full bg-white border border-blue-200 hover:bg-blue-100 transition-colors text-navy font-medium">Ward Authority</button>
            <button onClick={() => fillDemo('9000000003', 'higher123')} className="text-xs px-3 py-1.5 rounded-full bg-white border border-blue-200 hover:bg-blue-100 transition-colors text-navy font-medium">Higher Authority</button>
            <button onClick={() => fillDemo('9000000004', 'user123')} className="text-xs px-3 py-1.5 rounded-full bg-white border border-blue-200 hover:bg-blue-100 transition-colors text-navy font-medium">Citizen</button>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          INFRALINK &mdash; Smart Civic & Disaster Governance System
        </p>
      </div>
    </div>
  );
}
