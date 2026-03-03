
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiPhone, FiShield, FiMapPin, FiAward, FiSave, FiLock } from 'react-icons/fi';

const RL = { user: 'Citizen', ward_authority: 'Ward Authority', admin: 'Admin', higher_authority: 'Higher Authority' };
const RC = { user: 'bg-gray-100 text-text-secondary', ward_authority: 'bg-blue-50 text-navy', admin: 'bg-saffron/10 text-saffron-dark', higher_authority: 'bg-green-50 text-green-gov' };

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || '',
        mobile: user?.mobile || '',
    });
    const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });

    if (!user) return null;

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        updateUser({ name: form.name, mobile: form.mobile });
        toast.success('Profile updated (simulation)');
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        if (pw.newPw !== pw.confirm) {
            toast.error('Passwords do not match');
            return;
        }
        toast.success('Password changed (simulation)');
        setPw({ current: '', newPw: '', confirm: '' });
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-navy">My Profile</h1>
                <p className="text-sm text-text-secondary mt-1">View and update your account information</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-white rounded-xl border border-border shadow-sm p-6 text-center">
                    <div className="w-20 h-20 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiUser size={32} className="text-navy" />
                    </div>
                    <h2 className="text-lg font-bold text-text">{user.name}</h2>
                    <span className={`inline-block mt-1 px-3 py-0.5 rounded text-xs font-semibold ${RC[user.role] || RC.user}`}>
                        {RL[user.role] || user.role}
                    </span>
                    <div className="mt-5 space-y-3 text-sm text-left">
                        <div className="flex items-center gap-3 text-text-secondary">
                            <FiPhone size={14} className="text-navy" />
                            <span>{user.mobile || 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-text-secondary">
                            <FiShield size={14} className="text-navy" />
                            <span>{RL[user.role]}</span>
                        </div>
                        <div className="flex items-center gap-3 text-text-secondary">
                            <FiMapPin size={14} className="text-navy" />
                            <span>Ward {user.ward || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-text-secondary">
                            <FiAward size={14} className="text-saffron" />
                            <span className="font-semibold text-saffron-dark">{user.points || 0} points</span>
                        </div>
                    </div>
                </div>

                {/* Edit Forms */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Update Profile */}
                    <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                        <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                            <FiUser size={16} /> Update Profile
                        </h3>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1.5">Full Name</label>
                                <input type="text" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1.5">Mobile Number</label>
                                <input type="tel" value={form.mobile}
                                    onChange={e => setForm({ ...form, mobile: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors" />
                            </div>
                            <button type="submit"
                                className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white font-semibold rounded-lg hover:bg-navy-dark transition-colors text-sm">
                                <FiSave size={14} /> Update Profile
                            </button>
                        </form>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                        <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                            <FiLock size={16} /> Change Password
                        </h3>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1.5">Current Password</label>
                                <input type="password" value={pw.current}
                                    onChange={e => setPw({ ...pw, current: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors"
                                    placeholder="Enter current password" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1.5">New Password</label>
                                <input type="password" value={pw.newPw}
                                    onChange={e => setPw({ ...pw, newPw: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors"
                                    placeholder="Enter new password" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1.5">Confirm New Password</label>
                                <input type="password" value={pw.confirm}
                                    onChange={e => setPw({ ...pw, confirm: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors"
                                    placeholder="Confirm new password" />
                            </div>
                            <button type="submit"
                                className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white font-semibold rounded-lg hover:bg-navy-dark transition-colors text-sm">
                                <FiLock size={14} /> Change Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
