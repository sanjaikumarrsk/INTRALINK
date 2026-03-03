import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence, motion } from 'framer-motion';

import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute, { getRoleHome } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashSidebar from './components/DashSidebar';


import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import ControlRoom from './pages/ControlRoom';
import IssueList from './pages/IssueList';
import IssueDetail from './pages/IssueDetail';
import Analytics from './pages/Analytics';
import Leaderboard from './pages/Leaderboard';
import UserManagement from './pages/UserManagement';
import AuthorityDashboard from './pages/AuthorityDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import MapView from './pages/MapView';
import MyReports from './pages/MyReports';

/* Page transition wrapper */
const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};
function PageTransition({ children }) {
    return (
        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}>
            {children}
        </motion.div>
    );
}

/* Public layout: Navbar + Footer, no sidebar */
function PublicLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}

/* Dashboard layout: Navbar + Sidebar + Footer + SOS */
function DashLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex gap-6">
                <DashSidebar />
                <div className="flex-1 min-w-0">{children}</div>
            </div>
            <Footer />
        </div>
    );
}

/* Auth layout: standalone, no navbar/footer */
function AuthLayout({ children }) {
    return <>{children}</>;
}

/* Catch-all fallback: redirect to role home or login */
function CatchAll() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={getRoleHome(user.role)} replace />;
}

/* Animated routes wrapper */
function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Public pages */}
                <Route path="/" element={<PublicLayout><PageTransition><Home /></PageTransition></PublicLayout>} />
                <Route path="/control-room" element={<DashLayout><PageTransition><ControlRoom /></PageTransition></DashLayout>} />
                <Route path="/leaderboard" element={<DashLayout><PageTransition><Leaderboard /></PageTransition></DashLayout>} />
                <Route path="/issues" element={<DashLayout><PageTransition><IssueList /></PageTransition></DashLayout>} />
                <Route path="/issues/:id" element={<DashLayout><PageTransition><IssueDetail /></PageTransition></DashLayout>} />

                {/* Auth pages */}
                <Route path="/login" element={<AuthLayout><PageTransition><Login /></PageTransition></AuthLayout>} />
                <Route path="/register" element={<AuthLayout><PageTransition><Register /></PageTransition></AuthLayout>} />

                {/* Map — visible to ALL logged-in roles */}
                <Route path="/map" element={<DashLayout><ProtectedRoute roles={['user','ward_authority','admin','higher_authority']}><PageTransition><MapView /></PageTransition></ProtectedRoute></DashLayout>} />

                {/* USER (citizen) routes */}
                <Route path="/dashboard" element={<DashLayout><ProtectedRoute roles={['user','ward_authority','admin','higher_authority']}><PageTransition><Dashboard /></PageTransition></ProtectedRoute></DashLayout>} />
                <Route path="/report" element={<DashLayout><ProtectedRoute roles={['user','ward_authority','admin','higher_authority']}><PageTransition><ReportIssue /></PageTransition></ProtectedRoute></DashLayout>} />
                <Route path="/my-reports" element={<DashLayout><ProtectedRoute roles={['user','ward_authority','admin','higher_authority']}><PageTransition><MyReports /></PageTransition></ProtectedRoute></DashLayout>} />

                {/* Shared: Notifications & Profile (all logged-in roles) */}
                <Route path="/notifications" element={<DashLayout><ProtectedRoute roles={['user','ward_authority','admin','higher_authority']}><PageTransition><Notifications /></PageTransition></ProtectedRoute></DashLayout>} />
                <Route path="/profile" element={<DashLayout><ProtectedRoute roles={['user','ward_authority','admin','higher_authority']}><PageTransition><Profile /></PageTransition></ProtectedRoute></DashLayout>} />

                {/* WARD_AUTHORITY routes */}
                <Route path="/authority" element={<DashLayout><ProtectedRoute roles={['ward_authority','admin','higher_authority']}><PageTransition><AuthorityDashboard /></PageTransition></ProtectedRoute></DashLayout>} />
                <Route path="/control-room" element={<DashLayout><ProtectedRoute roles={['ward_authority','admin','higher_authority']}><PageTransition><ControlRoom /></PageTransition></ProtectedRoute></DashLayout>} />

                {/* HIGHER_AUTHORITY routes */}
                <Route path="/higher" element={<DashLayout><ProtectedRoute roles={['higher_authority','admin']}><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute></DashLayout>} />

                {/* ADMIN routes */}
                <Route path="/admin" element={<DashLayout><ProtectedRoute roles={['admin']}><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute></DashLayout>} />
                <Route path="/analytics" element={<DashLayout><ProtectedRoute roles={['admin','higher_authority']}><PageTransition><Analytics /></PageTransition></ProtectedRoute></DashLayout>} />
                <Route path="/user-management" element={<DashLayout><ProtectedRoute roles={['admin']}><PageTransition><UserManagement /></PageTransition></ProtectedRoute></DashLayout>} />

                {/* CATCH-ALL: prevents white screen for any unknown route */}
                <Route path="*" element={<CatchAll />} />
            </Routes>
        </AnimatePresence>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <BrowserRouter>
                    <ToastContainer theme="light" position="top-right" autoClose={3000} />
                    <AnimatedRoutes />
                </BrowserRouter>
            </NotificationProvider>
        </AuthProvider>
    );
}
