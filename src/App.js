// App Imports
import "./index.css";
import "./App.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./i18n";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { HelmetProvider } from "react-helmet-async";


// Supabase Imports
import { supabase } from "./supabaseClient";
import { SupabaseStatusProvider } from './context/SupabaseStatusProvider';
import SupabaseDownModal from './components/Modals/SupabaseDownModal';

// Layout Imports
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import PrivacyPolicy from "./components/Layout/PrivacyPolicy";
import TermsOfUse from "./components/Layout/TermsOfUse";
import AboutAndContact from "./components/AboutAndContact";

// Admin Imports
import AdminDashboard from "./components/admin/AdminDashboard";

// Bid Imports
import SubmitBid from "./components/Request/SubmitBid";
import BidSuccess from "./components/Bid/BidSuccess";
import BidAccepted from "./components/Bid/BidAccepted";

// Request Imports
import RequestCategories from "./components/Request/RequestCategories";
import SuccessRequest from "./components/Request/SuccessRequest";
import OpenRequests from "./components/Request/OpenRequests";
import PhotographyRequest from "./components/Request/Photography/PhotographyRequest";
import VideographyRequest from "./components/Request/Videography/VideographyRequest";
import DjRequest from "./components/Request/DJ/DjRequest";
import HairAndMakeUpRequest from "./components/Request/Beauty/HairAndMakeUpRequest";
import FloristRequest from "./components/Request/Florist/FloristRequest";
import CateringRequest from "./components/Request/Catering/CateringRequest";
import MasterRequestFlow from "./components/Request/MasterRequestFlow"; // Import the MasterRequestFlow component

// New staged request imports
import MultiStepRequestForm from "./components/Request/general requests/MultiStepRequestForm";

// test email imports
import TestEmail from "./components/TestEmail";

// Event Imports
import SelectEvent from "./components/Request/Event/SelectEvent";
import EventDetails from "./components/Request/Event/EventDetails";
import EventPhotos from "./components/Request/Event/UploadPictures";
import PersonalDetails from "./components/Request/Event/PersonalDetails";
import EventSummary from "./components/Request/Event/EventSummary";

// Profile Imports
import Signup from "./components/Profile/Signup";
import SignIn from "./components/Profile/SignIn";
import CreateAccount from "./components/Profile/CreateAccount";
import ChoosePricingPlan from "./components/Profile/ChoosePricingPlan";
import SuccessSignup from "./components/Profile/SuccessSignup";
import ResetPassword from "./components/Profile/ResetPassword";
import UpdatePassword from "./components/Profile/UpdatePassword";
import ProfilePage from "./components/Profile/Profile";
import AuthCallback from "./components/AuthCallback";

// Individual Imports

import MyRequests from "./components/Individual/MyRequests";

import IndividualDashboard from "./components/Individual/IndividualDashboard";
//
// Business Imports
import BusinessDashboard from "./components/Business/BusinessDashboard";
import EditBid from "./components/Business/EditBid";
import Portfolio from "./components/Business/Portfolio/Portfolio";
import Gallery from "./components/Business/Portfolio/Gallery";
import VerificationApplication from "./components/Business/VerificationApplication";
import VendorHomepage from "./components/VendorHomepage";
import ContractTemplateEditor from "./components/Business/ContractTemplateEditor";
import GoogleBusinessCallback from "./components/Business/GoogleBusinessCallback";
import GoogleBusinessSuccess from './components/Business/GoogleBusinessSuccess';
import GoogleBusinessError from './components/Business/GoogleBusinessError';
import AutobidTrainer from "./pages/Dashboard/AutobidTrainer";
import PricingSetup from "./components/Business/PricingSetup";
import SetupProgressPopup from "./components/Business/SetupProgressPopup";

// Misc Imports
import Homepage from "./components/Homepage";
import CorporateHomepage from "./components/CorporateHomepage";
import WeddingPlannerHomepage from "./components/WeddingPlannerHomepage";
import ContactForm from "./components/ContactForm";
import AboutUs from "./components/AboutUs";

// Messaging imports
import MessagingView from "./components/Messaging/MessagingView";
import ChatInterface from "./components/Messaging/ChatInterface";
import MobileChatList from "./components/Messaging/MobileChatList";
import MessagingViewWrapper from "./components/Messaging/MessagingViewWrapper";

// Spanish imports
import HomepageES from "./components/HomepageES";
import ContactFormES from "./components/ContactFormES";

// Stripe imports
import EnhancedStripeOnboarding from "./components/Stripe/EnhancedStripeOnboarding";
import EmbeddedCheckoutForm from "./components/Stripe/EmbeddedCheckoutForm";
import PaymentCancelled from "./components/Stripe/PaymentCancelled";
import SuccessPayment from "./components/Stripe/SuccessfulPayment";
import PaymentStatus from "./components/Stripe/PaymentStatus";
import PaymentSuccess from "./components/Payment/PaymentSuccess";

// ScrollToTop import
import ScrollToTop from "./components/ScrollToTop";

// Add this import
import BidsPage from "./components/Individual/BidsPage";
import PrivateRoute from "./components/PrivateRoute";
import ArticleNavigation from "./components/Article/ArticleNavigation";
import ArticleDetail from "./components/Article/ArticleDetail";
import WeddingPhotographerCostGuide from "./components/Article/WeddingPhotographerCostGuide";
import WeddingVideographerCostGuide from "./components/Article/WeddingVideographerCostGuide";
import WeddingCateringCostGuide from "./components/Article/WeddingCateringCostGuide";
import WeddingFloristCostGuide from "./components/Article/WeddingFloristCostGuide";
import WeddingDJCostGuide from "./components/Article/WeddingDJCostGuide";
import WeddingHairMakeupCostGuide from "./components/Article/WeddingHairMakeupCostGuide";
import UtahPhotographyCostGuide from "./components/Article/UtahPhotographyCostGuide";
import NewsletterLanding from "./components/NewsletterLanding";
import Unsubscribe from "./components/Unsubscribe";
import LocationBanner from "./components/LocationBanner/LocationBanner";
import UtahWeddingVideographerGuide from "./components/Article/UtahWeddingVideographerGuide";
import WeddingMarketGuide from "./components/WeddingGuide/WeddingMarketGuide";
import VendorList from "./components/VendorList/VendorList";
import VendorListWithFilters from "./components/VendorListWithFilters/VendorListWithFilters";
import LocationBasedVendors from "./pages/LocationBasedVendors";
import WeddingVibeQuizPage from "./pages/WeddingVibeQuiz";
import UtahCateringCosts from "./components/Article/UtahCateringCosts";
import UtahDJCosts from "./components/Article/UtahDJCosts";
import RelatedArticles from "./components/Article/RelatedArticles";
import WeddingVibeQuiz from "./pages/WeddingVibeQuiz";
import { subscribeToPush } from './hooks/usePushNotification';
import NotificationPermissionPrompt from './components/NotificationPermissionPrompt';
import WeddingPlannerDashboard from "./components/WeddingPlanner/WeddingPlannerDashboard";
import PWAInstallPrompt from './components/PWAInstallPrompt';
import VendorSelection from "./components/Request/VendorSelection";
import WrongWithWeddings from "./components/Article/WrongWithWeddings";
import ErrorPage from "./components/ErrorPage";
import PartnershipLanding from "./components/PartnershipLanding";
import NoGhostingGuarantee from "./components/NoGhostingGuarantee";
import WeddingInspiration from "./components/WeddingInspiration";

//wedding planner dashboard imports
import WeddingPlanningDashboard from "./components/WeddingPlanner/WeddingPlanningDashboard";
import SharedTimelineView from "./components/WeddingPlanner/SharedTimelineView";

// Public RSVP import
import PublicRSVP from "./pages/PublicRSVP";

// Create a wrapper component to use useLocation
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setUserId(user.id);
        // Fetch user role from profiles
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('id', user.id)
          .single();
        
        const { data: individualProfile } = await supabase
          .from('individual_profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (businessProfile && individualProfile) {
          setUserRole('both');
        } else if (businessProfile) {
          setUserRole('business');
        } else if (individualProfile) {
          setUserRole('individual');
        }
        
        // Debug logging
        console.log('User role detection:', {
          userId: user.id,
          businessProfile: !!businessProfile,
          individualProfile: !!individualProfile,
          userRole: businessProfile && individualProfile ? 'both' : businessProfile ? 'business' : individualProfile ? 'individual' : 'none'
        });
      }
    };
    getUser();
  }, []);
  
  // Debug logging for user state changes
  useEffect(() => {
    console.log('User state changed:', { user, userRole, userId });
  }, [user, userRole, userId]);

  // Function to check if current route is a dashboard
  const isDashboardRoute = () => {
    // Get the first segment of the path (e.g., /individual-dashboard/something -> individual-dashboard)
    const pathSegment = location.pathname.split('/')[1];
    
    // Define dashboard route patterns
    const dashboardPatterns = [
      'individual-dashboard',
      'business-dashboard',
      'wedding-planner',
      'messages',
      'bids'
    ];
    
    // Special cases to exclude
    if (location.pathname === '/wedding-planner-homepage') {
      return false;
    }
    
    // Check if the first path segment matches any dashboard pattern
    // Also check if the path starts with any of the patterns
    return dashboardPatterns.some(pattern => location.pathname.startsWith(`/${pattern}`));
  };

  // Debug logging for App.js
  console.log('App.js Debug:', {
    pathname: location.pathname,
    isDashboardRoute: isDashboardRoute(),
    shouldShowNavbar: !isDashboardRoute()
  });

  return (
    <div className="app-container">
      <SupabaseDownModal />
      <LocationBanner />
      {!isDashboardRoute() && <Navbar />}
      <div className="content-wrapper">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/corporate-homepage" element={<CorporateHomepage />} />
          <Route path="/wedding-planner-homepage" element={<WeddingPlannerHomepage />} />
          <Route path="/partnership/:partnerName" element={<PartnershipLanding />} />
          <Route path="/for-vendors" element={<VendorHomepage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/about" element={<AboutAndContact />} />
          <Route path="/no-ghosting-guarantee" element={<NoGhostingGuarantee />} />
          {/* Bid Routes */}
          <Route path="/submit-bid/:requestId" element={<SubmitBid />} />
          <Route path="/bid-accepted" element={<BidAccepted />} />
          <Route path="/bid-success" element={<BidSuccess />} />
          {/* Request Routes */}
          <Route
            path="/request-categories"
            element={<RequestCategories />}
          />
          <Route path="/success-request" element={<SuccessRequest />} />

          <Route
            path="/master-request-flow"
            element={<MasterRequestFlow />}
          />
          {/* New Staged Request Routes */}
          <Route path="/request-form" element={<MultiStepRequestForm />} />
          <Route path="/success-request" element={<SuccessRequest />} />
          {/* Event Routes */}
          <Route
            path="/select-event"
            element={<SelectEvent setEventType={setEventType} />}
          />
          <Route
            path="/event-details"
            element={
              <EventDetails
                eventType={eventType}
                setEventDetails={setEventDetails}
              />
            }
          />
          <Route
            path="/event-photos"
            element={
              <EventPhotos
                eventType={eventType}
                setEventDetails={setEventDetails}
              />
            }
          />
          <Route
            path="/personal-details"
            element={
              <PersonalDetails
                eventType={eventType}
                setEventDetails={setEventDetails}
              />
            }
          />
          <Route
            path="/event-summary"
            element={
              <EventSummary
                eventType={eventType}
                eventDetails={eventDetails}
              />
            }
          />
          {/* Profile Routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/success-signup" element={<SuccessSignup />} />
          <Route
            path="/choose-pricing-plan"
            element={<ChoosePricingPlan />}
          />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/request-password-reset"
            element={<ResetPassword />}
          />
          <Route path="/reset-password" element={<UpdatePassword />} />
          <Route path="/createaccount" element={<CreateAccount />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          
          {/* Dashboard Routes */}
          <Route path="/individual-dashboard/*" element={
            <PrivateRoute>
              <IndividualDashboard />
            </PrivateRoute>
          } />
          <Route path="/business-dashboard/*" element={
            <PrivateRoute>
              <BusinessDashboard />
            </PrivateRoute>
          } />
          <Route path="/wedding-planner/*" element={
            <PrivateRoute>
              <WeddingPlanningDashboard />
            </PrivateRoute>
          } />

          <Route path="/wedding-planner-dashboard/:activeSection" element={
              <PrivateRoute>
                <WeddingPlannerDashboard />
              </PrivateRoute>
            } />
          
          {/* Individual Routes */}
          <Route path="/my-requests" element={<MyRequests />} />
          {/* Test API Routes */}
          <Route path="/test-email" element={<TestEmail />} />
          {/* Business Routes */}
          <Route path="/open-requests" element={<OpenRequests />} />
          <Route
            path="/edit-bid/:requestId/:bidId"
            element={<EditBid />}
          />
          <Route
            path="/verification-application"
            element={<VerificationApplication />}
          />
          <Route
            path="/contract-template"
            element={
              <PrivateRoute>
                <ContractTemplateEditor />
              </PrivateRoute>
            }
          />
          <Route
            path="/autobid-trainer"
            element={
              <PrivateRoute>
                <AutobidTrainer />
              </PrivateRoute>
            }
          />
          <Route
            path="/pricing-setup"
            element={
              <PrivateRoute>
                <PricingSetup />
              </PrivateRoute>
            }
          />
          <Route
            path="/google-business-callback"
            element={<GoogleBusinessCallback />}
          />
          <Route path="/business-profile/success" element={<GoogleBusinessSuccess />} />
          <Route path="/business-profile/error" element={<GoogleBusinessError />} />
          {/* Dynamic URL for viewing portfolio */}
          <Route path="/portfolio/:businessId/:businessName" element={<Portfolio />} />
          <Route path="/portfolio/:businessId/:businessName/gallery" element={<Gallery />} />
          {/* Misc Routes */}
          <Route path="/contact-us" element={<ContactForm />} />
          <Route path="/about-us" element={<Navigate to="/about" replace />} />
          {/* Messaging Routes */}
          <Route path="/messages" element={
            <PrivateRoute>
              <MessagingViewWrapper currentUserId={userId} userType={userType} />
            </PrivateRoute>
          } />
          <Route path="/messages/:businessId" element={
            <PrivateRoute>
              <MessagingViewWrapper currentUserId={userId} userType={userType} />
            </PrivateRoute>
          } />

          {/* Spanish Routes */}
          <Route path="/inicio" element={<HomepageES />} />
          <Route path="/contactenos" element={<ContactFormES />} />
          {/* Stripe Routes */}
          <Route path="/stripe-setup" element={
            <PrivateRoute>
              <EnhancedStripeOnboarding />
            </PrivateRoute>
          } />
          <Route path="/checkout" element={<EmbeddedCheckoutForm />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-status" element={<PaymentStatus />} />
          {/* Admin Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          {/* Combined Bids Route */}
          <Route
            path="/bids"
            element={
              <PrivateRoute>
                <IndividualDashboard />
              </PrivateRoute>
            }
          />

          {/* Wedding Planner Routes */}
          <Route path="/wedding-planner" element={<WeddingPlanningDashboard />} />
          <Route path="/wedding-planner/:activeTab" element={<WeddingPlanningDashboard />} />
          <Route path="/shared-timeline/:shareId" element={<SharedTimelineView />} />
          <Route path="/wedding-inspiration" element={<WeddingInspiration />} />

          {/* Public RSVP Route */}
          <Route path="/rsvp/:linkId" element={<PublicRSVP />} />

          {/* Articles Route */}
          <Route path="/articles" element={<ArticleNavigation />} />
          <Route path="/articles/:articleId" element={<ArticleDetail />} />
          <Route
            path="/articles/wedding-market-guide"
            element={<WeddingMarketGuide />}
          />
          <Route
            path="/articles/wedding-vibe-quiz"
            element={<WeddingVibeQuiz />}
          />
          <Route
            path="/articles/related-articles"
            element={<RelatedArticles />}
          />
          <Route
            path="/articles/everything-wrong-with-the-wedding-industry"
            element={<WrongWithWeddings />}
          />
          {/* Photography Routes */}
          <Route
            path="/request/photography"
            element={<PhotographyRequest />}
          />
          <Route
            path="/request/videography"
            element={<VideographyRequest />}
          />
          <Route path="/request/dj" element={<DjRequest />} />
          <Route
            path="/request/beauty"
            element={<HairAndMakeUpRequest />}
          />
          <Route path="/request/florist" element={<FloristRequest />} />
          <Route path="/request/catering" element={<CateringRequest />} />  
          <Route path="/welcome" element={<NewsletterLanding />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route
            path="/wedding-market-guide"
            element={<WeddingMarketGuide />}
          />
          <Route path="/vendors" element={<VendorListWithFilters />} />
          <Route path="/wedding-inspiration" element={<WeddingInspiration />} />
          {/* LocationBasedVendors Routes - Order matters! Most specific to least specific */}
          <Route
            path="/:type/wedding planner/coordinator/:location"
            element={<LocationBasedVendors />}
          />
          <Route
            path="/:type/wedding planner/coordinator"
            element={<LocationBasedVendors />}
          />
          <Route
            path="/:type/wedding planner/:location"
            element={<LocationBasedVendors />}
          />
          <Route
            path="/:type/wedding planner"
            element={<LocationBasedVendors />}
          />
          <Route
            path="/:type/:category/:location"
            element={<LocationBasedVendors />}
          />
          <Route
            path="/:type/:category"
            element={<LocationBasedVendors />}
          />
          <Route
            path="/:category/:location"
            element={<LocationBasedVendors />}
          />
          <Route 
            path="/:category" 
            element={<LocationBasedVendors />} 
          />
          <Route
            path="/wedding-vibe-quiz"
            element={<WeddingVibeQuizPage />}
          />
          <Route path="/vendor-selection/:category" element={<VendorSelection />} />
          {/* Catch-all route for 404 errors */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </div>
      
      {/* Setup Progress Popup - shows on all pages for business users */}
      {user && userRole === 'business' && (
        <SetupProgressPopup 
          userId={userId}
          onNavigateToSection={(stepKey) => {
            console.log('SetupProgressPopup navigation triggered:', stepKey);
            // Handle navigation based on the step clicked
            switch (stepKey) {
              case 'stripe':
                console.log('Navigating to Stripe setup');
                navigate('/stripe-setup');
                break;
              case 'profile':
              case 'photos':
                console.log('Navigating to portfolio section');
                navigate('/business-dashboard/portfolio');
                break;
              case 'paymentSettings':
              case 'businessSettings':
              case 'calendar':
              case 'bidTemplate':
              case 'aiBidder':
                console.log('Navigating to settings section with stepKey:', stepKey);
                navigate('/business-dashboard/settings', { 
                  state: { scrollToSection: stepKey }
                });
                break;
              default:
                console.log('Unknown step key:', stepKey);
                break;
            }
          }}
        />
      )}
      
      {/* Debug logging for SetupProgressPopup */}
      {console.log('SetupProgressPopup render check:', {
        user: !!user,
        userRole,
        userId,
        shouldRender: user && userRole === 'business'
      })}
      
      {(!user || !isDashboardRoute()) && 
        !location.pathname.includes('signin') && 
        !location.pathname.includes('createaccount') && 
        !location.pathname.includes('signup') &&
        !location.pathname.includes('pricing') && 
        !location.pathname.includes('request-password-reset') && 
        !location.pathname.includes('stripe-setup') && 
        !location.pathname.includes('portfolio') && 
        !location.pathname.includes('request-categories') && 
        <Footer />}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <PWAInstallPrompt />
      <NotificationPermissionPrompt />
    </div>
  );
}

function App() {
  // Only request notification permission after user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      // Remove the event listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('touchend', handleUserInteraction);
      
      // Check if we're on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // On mobile, don't automatically request notification permission
        // Instead, show a user-friendly message about enabling notifications
        console.log('Mobile device detected - notification permission will be requested when user explicitly enables it');
        return;
      }
      
      // Request notification permission after user interaction (desktop only)
      subscribeToPush();
    };

    // Add event listeners for user interaction (desktop + mobile)
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('touchend', handleUserInteraction);

    // Cleanup function
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('touchend', handleUserInteraction);
    };
  }, []);
  
  return (
    <HelmetProvider>
      <SupabaseStatusProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
      </SupabaseStatusProvider>
    </HelmetProvider>
  );
}

export default App;
