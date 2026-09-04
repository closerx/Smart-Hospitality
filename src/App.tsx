/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Stats from './components/Stats';
import Services from './components/Services';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import CTA from './components/CTA';
// import Partners from './components/Partners';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import VideoLoader from './components/VideoLoader';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import TenantDashboard from './pages/TenantDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import CleanerDashboard from './pages/CleanerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PropertyRoomsManagement from './pages/PropertyRoomsManagement';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function DashboardRedirect() {
  const { currentUser, userProfile, role, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0B1B3D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!currentUser) return <Navigate to="/login" replace />;
  const effectiveRole = userProfile?.role || role;
  if (isAdmin || effectiveRole === 'admin') return <Navigate to="/admin" replace />;
  if (effectiveRole === 'owner') return <Navigate to="/owner-dashboard" replace />;
  if (effectiveRole === 'cleaner') return <Navigate to="/cleaner-dashboard" replace />;
  return <Navigate to="/tenant-dashboard" replace />;
}

function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();

  const handleLoaderComplete = () => {
    setIsLoading(false);
  };

  const isRtl = i18n.language === 'ar';

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="video-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[100]"
          >
            <VideoLoader onComplete={handleLoaderComplete} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir={isRtl ? "rtl" : "ltr"}>
        <Header />
        <main>
          <Hero />
          <About />
          <Stats />
          <Services />
          <Features />
          <HowItWorks />
          <CTA />
          {/* <Partners /> */}
          <FAQ />
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </>
  );
}

export default function App() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp initialType="tenant" />} />
          <Route path="/signup/guest" element={<SignUp initialType="tenant" />} />
          <Route path="/signup/cleaner" element={<SignUp initialType="cleaner" />} />
          <Route path="/signup/cleaner/complete" element={<SignUp initialType="cleaner" initialStep={2} />} />
          <Route path="/signup/owner" element={<SignUp initialType="owner" />} />
          <Route path="/signup/owner/complete" element={<SignUp initialType="owner" initialStep={2} />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/tenant-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['tenant']}>
                <TenantDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cleaner-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['cleaner']}>
                <CleanerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/property/:propertyId/rooms" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PropertyRoomsManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/properties/:propertyId/rooms" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PropertyRoomsManagement />
              </ProtectedRoute>
            } 
          />
          <Route path="/dashboard" element={<DashboardRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
