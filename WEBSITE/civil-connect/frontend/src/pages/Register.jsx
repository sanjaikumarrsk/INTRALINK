import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';
import { toast } from 'react-toastify';
import { FiUser, FiPhone, FiLock, FiMapPin, FiHeart, FiCalendar, FiShield } from 'react-icons/fi';

const WARDS = [
  'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
  'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10',
  'Ward 11', 'Ward 12', 'Ward 13', 'Ward 14', 'Ward 15',
];

export default function Register() {
  const [form, setForm] = useState({
    name: '', mobileNumber: '', password: '', confirmPassword: '',
    ward: '', address: '', emergencyContact: '', gender: '', dateOfBirth: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/^\d{10}$/.test(form.mobileNumber.trim())) e.mobileNumber = 'Must be exactly 10 digits';
    if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.ward) e.ward = 'Please select your ward';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        mobileNumber: form.mobileNumber.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        ward: form.ward,
        address: form.address.trim(),
        emergencyContact: form.emergencyContact.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
      };
      const { data } = await register(payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      localStorage.setItem('mobileNumber', data.mobileNumber);
      localStorage.setItem('ward', data.ward || '');
      localStorage.setItem('userId', data.userId || '');

      // Dispatch event so socket hook reconnects
      window.dispatchEvent(new Event('userLoggedIn'));

      const role = data.role.toLowerCase();
      loginUser({ name: data.name, role, mobileNumber: data.mobileNumber, ward: data.ward || '', userId: data.userId || '' });
      toast.success('Registration successful! Welcome to INFRALINK.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${errors[field] ? 'border-red-400 focus:ring-red-300 bg-red-50/40' : 'border-border bg-bg focus:ring-navy/30 focus:border-navy'}`;
  const errText = (field) => errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center text-white font-bold text-xl shadow">IL</div>
          </Link>
          <h1 className="text-2xl font-bold text-navy">Citizen Registration</h1>
          <p className="text-sm text-text-secondary mt-1">Create your account to start reporting issues</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5"><FiUser size={14} /> Full Name *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Enter your full name" className={fieldClass('name')} />
              {errText('name')}
            </div>

            {/* Mobile + Emergency Contact row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5"><FiPhone size={14} /> Mobile Number *</label>
                <input type="tel" value={form.mobileNumber} onChange={set('mobileNumber')} placeholder="9876543210" maxLength={10} className={fieldClass('mobileNumber')} />
                {errText('mobileNumber')}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5"><FiHeart size={14} /> Emergency Contact</label>
                <input type="tel" value={form.emergencyContact} onChange={set('emergencyContact')} placeholder="Optional" maxLength={10} className={fieldClass('emergencyContact')} />
              </div>
            </div>

            {/* Password row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5"><FiLock size={14} /> Password *</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" className={fieldClass('password')} />
                {errText('password')}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5"><FiShield size={14} /> Confirm Password *</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" className={fieldClass('confirmPassword')} />
                {errText('confirmPassword')}
              </div>
            </div>

            {/* Ward + Gender row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5"><FiMapPin size={14} /> Ward *</label>
                <select value={form.ward} onChange={set('ward')} className={fieldClass('ward')}>
                  <option value="">Select your ward</option>
                  {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                {errText('ward')}
              </div>
              <div>
                <label className="text-sm font-medium text-text mb-1.5 block">Gender</label>
                <select value={form.gender} onChange={set('gender')} className={fieldClass('gender')}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* DOB + Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5"><FiCalendar size={14} /> Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={fieldClass('dateOfBirth')} />
              </div>
              <div>
                <label className="text-sm font-medium text-text mb-1.5 block">Address</label>
                <input type="text" value={form.address} onChange={set('address')} placeholder="Your locality / area" className={fieldClass('address')} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-navy text-white font-semibold rounded-lg hover:bg-navy-dark transition-colors text-sm disabled:opacity-60 mt-2">
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Already registered?{' '}
              <Link to="/login" className="text-navy font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>

        {/* Default accounts info */}
        <div className="mt-4 bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-xs font-semibold text-navy mb-2">Demo Accounts (pre-seeded):</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-text-secondary">
            <div><span className="font-medium">Admin:</span><br/>9000000001 / admin123</div>
            <div><span className="font-medium">Ward Auth:</span><br/>9000000002 / ward123</div>
            <div><span className="font-medium">Higher Auth:</span><br/>9000000003 / higher123</div>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          INFRALINK &mdash; Smart Civic & Disaster Governance System
        </p>
      </div>
    </div>
  );
}
