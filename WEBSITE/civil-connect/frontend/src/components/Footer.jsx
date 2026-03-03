export default function Footer() {
    return (
        <footer className="bg-navy text-blue-100 no-print mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid md:grid-cols-3 gap-8">
                    <div>
                        <h4 className="font-bold text-white mb-2">INFRALINK</h4>
                        <p className="text-sm text-blue-200 leading-relaxed">
                            Smart Civic & Disaster Governance System – empowering citizens
                            and streamlining municipal issue resolution across all wards.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-2">Quick Links</h4>
                        <ul className="text-sm space-y-1">
                            <li><a href="/report" className="hover:text-saffron transition-colors">Report an Issue</a></li>
                            <li><a href="/control-room" className="hover:text-saffron transition-colors">Live Monitoring</a></li>
                            <li><a href="/leaderboard" className="hover:text-saffron transition-colors">Leaderboard</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-2">Contact</h4>
                        <p className="text-sm text-blue-200">
                            Municipal Corporation Office<br />
                            Civic Center, Main Road<br />
                            helpdesk@infralink.gov.in<br />
                            Toll Free: 1800-XXX-XXXX
                        </p>
                    </div>
                </div>
                <div className="border-t border-white/10 mt-6 pt-4 text-center text-xs text-blue-300">
                    © {new Date().getFullYear()} INFRALINK. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
