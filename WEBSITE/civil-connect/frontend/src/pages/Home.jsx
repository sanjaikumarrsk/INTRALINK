import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiFileText, FiMapPin, FiShield, FiTrendingUp, FiCheckCircle, FiClock } from 'react-icons/fi';

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-bg">
            {/* Hero Section */}
            <section className="bg-navy text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-navy opacity-90" />
                <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron/20 text-saffron text-xs font-semibold mb-6 tracking-wide uppercase">
                                Smart Civic & Disaster Governance
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                                INFRALINK
                            </h1>
                            <h2 className="text-xl md:text-2xl text-blue-200 font-medium mb-6">
                                Smart Civic & Disaster Governance System
                            </h2>
                            <p className="text-blue-100 text-base leading-relaxed mb-8 max-w-lg">
                                Empowering citizens to report civic issues in real-time. Track complaints,
                                monitor resolutions, and hold local authorities accountable — all from one platform.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {user ? (
                                    <>
                                        <Link to="/dashboard" className="px-6 py-3 bg-saffron text-navy font-semibold rounded-lg hover:bg-saffron-dark transition-colors shadow-lg">
                                            Go to Dashboard
                                        </Link>
                                        <Link to="/report" className="px-6 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
                                            Report an Issue
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/register" className="px-6 py-3 bg-saffron text-navy font-semibold rounded-lg hover:bg-saffron-dark transition-colors shadow-lg">
                                            Register as Citizen
                                        </Link>
                                        <Link to="/login" className="px-6 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
                                            Login
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center">
                            <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                                <img src="/background.jpeg" alt="INFRALINK" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h3 className="text-2xl font-bold text-navy mb-2">About INFRALINK</h3>
                    <div className="w-16 h-1 bg-saffron mx-auto rounded mb-4" />
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        A transparent platform bridging the gap between citizens and municipal authorities.
                        Report issues, track progress, and ensure accountability at every level.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { icon: <FiFileText size={28} />, title: 'Report Issues', desc: 'Submit civic complaints with photos, auto-detected GPS location, and category classification. Every complaint gets a unique tracking ID.' },
                        { icon: <FiMapPin size={28} />, title: 'Live Monitoring', desc: 'Real-time map of all reported issues across wards. Track status updates live with color-coded markers and statistics.' },
                        { icon: <FiShield size={28} />, title: 'Accountability', desc: 'Auto-escalation if issues are not resolved within 3 days. Ward authorities are held to measurable performance standards.' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-navy/10 text-navy rounded-lg flex items-center justify-center mb-4">
                                {item.icon}
                            </div>
                            <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                            <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-white border-y border-border">
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <div className="text-center mb-12">
                        <h3 className="text-2xl font-bold text-navy mb-2">How Citizens Can Report</h3>
                        <div className="w-16 h-1 bg-green-gov mx-auto rounded mb-4" />
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { step: '01', title: 'Register', desc: 'Create your citizen account with basic details', icon: <FiTrendingUp size={22} /> },
                            { step: '02', title: 'Report', desc: 'Submit issue with photo, location & category', icon: <FiFileText size={22} /> },
                            { step: '03', title: 'Track', desc: 'Monitor real-time status updates on your complaint', icon: <FiClock size={22} /> },
                            { step: '04', title: 'Resolved', desc: 'Get notified when your issue is resolved', icon: <FiCheckCircle size={22} /> },
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="w-14 h-14 bg-navy text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow">
                                    {item.step}
                                </div>
                                <h4 className="font-semibold mb-1">{item.title}</h4>
                                <p className="text-sm text-text-secondary">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Wards', value: '50+', color: 'text-navy' },
                        { label: 'Issues Reported', value: '10,000+', color: 'text-saffron' },
                        { label: 'Resolved', value: '8,500+', color: 'text-green-gov' },
                        { label: 'Citizens Registered', value: '25,000+', color: 'text-navy' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl border border-border p-6 text-center">
                            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
                            <div className="text-sm text-text-secondary">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-navy text-white">
                <div className="max-w-7xl mx-auto px-4 py-12 text-center">
                    <h3 className="text-2xl font-bold mb-3">Ready to Make a Difference?</h3>
                    <p className="text-blue-200 mb-6 max-w-lg mx-auto">
                        Join thousands of citizens using INFRALINK to improve their communities.
                    </p>

                </div>
            </section>
        </div>
    );
}
