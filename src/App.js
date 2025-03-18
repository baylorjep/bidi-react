// App Imports
import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './i18n';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Layout Imports
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import PrivacyPolicy from './components/Layout/PrivacyPolicy';
import TermsOfUse from './components/Layout/TermsOfUse';

// Admin Imports
import AdminDashboard from './components/admin/AdminDashboard';

// Bid Imports
import SubmitBid from './components/Request/SubmitBid';
import BidSuccess from './components/Bid/BidSuccess';
import BidAccepted from './components/Bid/BidAccepted';

// Request Imports
import RequestCategories from './components/Request/RequestCategories';
import SuccessRequest from './components/Request/SuccessRequest';
import OpenRequests from './components/Request/OpenRequests';
import PhotographyRequest from './components/Request/Photography/PhotographyRequest';

// New staged request imports
import MultiStepRequestForm from './components/Request/general requests/MultiStepRequestForm';

// test email imports
import TestEmail from './components/TestEmail';

// Event Imports
import SelectEvent from './components/Request/Event/SelectEvent';
import EventDetails from './components/Request/Event/EventDetails';
import EventPhotos from './components/Request/Event/UploadPictures';
import PersonalDetails from './components/Request/Event/PersonalDetails';
import EventSummary from './components/Request/Event/EventSummary';

// Profile Imports
import Signup from './components/Profile/Signup';
import SignIn from './components/Profile/SignIn';
import ChooseUserType from './components/Profile/ChooseUserType';
import ChoosePricingPlan from './components/Profile/ChoosePricingPlan';
import SuccessSignup from './components/Profile/SuccessSignup';
import ResetPassword from './components/Profile/ResetPassword';
import UpdatePassword from './components/Profile/UpdatePassword';
import ProfilePage from './components/Profile/Profile';

// Individual Imports
import MyDashboard from './components/Individual/MyDashboard'
import MyRequests from './components/Individual/MyRequests';
import EditRequest from './components/Individual/EditRequest';

// Business Imports
import BusinessDashboard from './components/Business/BusinessDashboard';
import EditBid from './components/Business/EditBid';
import Portfolio from './components/Business/Portfolio/Portfolio';
import Gallery from './components/Business/Portfolio/Gallery';


// Misc Imports
import Homepage from './components/Homepage';
import ContactForm from './components/ContactForm';
import AboutUs from './components/AboutUs';

// Messaging imports


// Spanish imports
import HomepageES from './components/HomepageES'
import ContactFormES from './components/ContactFormES';

// Stripe imports
import Onboarding from './components/Stripe/Onboarding';
import StripeOnboarding from './components/Stripe/StripeOnboarding';
import EmbeddedCheckoutForm from './components/Stripe/EmbeddedCheckoutForm';
import PaymentCancelled from './components/Stripe/PaymentCancelled';
import SuccessPayment from './components/Stripe/SuccessfulPayment';
import PaymentStatus from './components/Stripe/PaymentStatus';

// ScrollToTop import
import ScrollToTop from './components/ScrollToTop';

// Add this import
import BidsPage from './components/Individual/BidsPage'
import PrivateRoute from './components/PrivateRoute';
import ArticleNavigation from './components/Article/ArticleNavigation';
import ArticleDetail from './components/Article/ArticleDetail';
import WeddingPhotographerCostGuide from './components/Article/WeddingPhotographerCostGuide';
import WeddingVideographerCostGuide from './components/Article/WeddingVideographerCostGuide';
import WeddingCateringCostGuide from './components/Article/WeddingCateringCostGuide';
import VideographyRequest from './components/Request/Videography/VideographyRequest';
import DjRequest from './components/Request/DJ/DjRequest';
import HairAndMakeUpRequest from './components/Request/Beauty/HairAndMakeUpRequest';
import FloristRequest from './components/Request/Florist/FloristRequest'; // Add this import
import CateringRequest from './components/Request/Catering/CateringRequest'; // Add this import
import WeddingFloristCostGuide from './components/Article/WeddingFloristCostGuide';
import WeddingDJCostGuide from './components/Article/WeddingDJCostGuide';
import WeddingHairMakeupCostGuide from './components/Article/WeddingHairMakeupCostGuide';
import UtahPhotographyCostGuide from './components/Article/UtahPhotographyCostGuide';
import NewsletterLanding from './components/NewsletterLanding';
import Unsubscribe from './components/Unsubscribe';
import LocationBanner from './components/LocationBanner/LocationBanner';
import UtahWeddingVideographerGuide from './components/Article/UtahWeddingVideographerGuide';
import WeddingMarketGuide from './components/WeddingGuide/WeddingMarketGuide';

function App() {

    const [eventType, setEventType] = useState('');
    const [eventDetails, setEventDetails] = useState({});

    return (
        <Router>
            <ScrollToTop />
            <div className="app-container">
                <LocationBanner />
                <Navbar />
                <div className='content'>
                    <Routes>
                        {/* Layout Routes */}
                        <Route path="/" element={<Homepage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-of-use" element={<TermsOfUse />} />

                        {/* Bid Routes */}
                        <Route path="/submit-bid/:requestId" element={<SubmitBid />} />
                        <Route path="/bid-accepted" element={<BidAccepted />} />
                        <Route path="/bid-success" element={<BidSuccess />} />

                        {/* Request Routes */}
                        <Route path="/request-categories" element={<RequestCategories />} />
                        <Route path="/success-request" element={<SuccessRequest />} />

                        {/* New Staged Request Routes */}
                        <Route path="/request-form" element={<MultiStepRequestForm />} />
                        <Route path="/success-request" element={<SuccessRequest />} />

                        {/* Event Routes */}
                        <Route path="/select-event" element={<SelectEvent setEventType={setEventType} />} />
                        <Route path="/event-details" element={<EventDetails eventType={eventType} setEventDetails={setEventDetails} />} />
                        <Route path="/event-photos" element={<EventPhotos eventType={eventType} setEventDetails={setEventDetails} />} />
                        <Route path="/personal-details" element={<PersonalDetails eventType={eventType} setEventDetails={setEventDetails} />} />
                        <Route path="/event-summary" element={<EventSummary eventType={eventType} eventDetails={eventDetails} />} />

                        {/* Profile Routes */}
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/success-signup" element={<SuccessSignup />} />
                        <Route path='/choose-pricing-plan' element={<ChoosePricingPlan/>} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/request-password-reset" element={<ResetPassword />} />
                        <Route path="/reset-password" element={<UpdatePassword />} />
                        <Route path="/createaccount" element={<ChooseUserType />} />
                        <Route path="/choose-pricing" element={<ChoosePricingPlan />}/>
                        <Route path="/profile" element={<ProfilePage />} />

                        {/* Individual Routes */}
                        <Route path="/my-dashboard" element={<MyDashboard />} />
                        <Route path="/my-requests" element={<MyRequests />} />
                        <Route path="/edit-request/:type/:id" element={<EditRequest />} />
                        
                        {/* Test API Routes */}
                         <Route path="/test-email" element={<TestEmail />} />
                        
                        {/* Business Routes */}
                        <Route path="/open-requests" element={<OpenRequests />} />
                        <Route path="/dashboard" element={<BusinessDashboard />} />
                        <Route path="/edit-bid/:requestId/:bidId" element={<EditBid />} /> {/* Dynamic URL for editing bids */}
                        
                        {/* Dynamic URL for viewing portfolio */}
                        <Route path="/portfolio/:businessId" element={<Portfolio />} />
                        <Route path="/portfolio/:businessId/gallery" element={<Gallery />} />


                        {/* Misc Routes */}
                        <Route path="/contact-us" element={<ContactForm />} />
                        <Route path="/about-us" element={<AboutUs />} />
                        
                        {/* Messaging Routes */}
                        

                        {/* Spanish Routes */}
                        <Route path="/inicio" element={<HomepageES />} />
                        <Route path="/contactenos" element={<ContactFormES />} />

                        {/* Stripe Routes */}
                        <Route path="/onboarding" element={<Onboarding />} />
                        <Route path="/stripe-setup" element={<StripeOnboarding />} />
                        <Route path="/checkout" element={<EmbeddedCheckoutForm />} />
                        <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                        <Route path="/payment-successful" element={<SuccessPayment />} />
                        <Route path="/payment-status" element={<PaymentStatus />} />

                        {/* Admin Routes */}
                        <Route path="/admin-dashboard" element={
                            <PrivateRoute>
                                <AdminDashboard />
                            </PrivateRoute>
                        } />

                        {/* Combined Bids Route */}
                        <Route path="/bids" element={
                            <PrivateRoute>
                                <BidsPage />
                            </PrivateRoute>
                        } />

                        {/* Articles Route */}
                        <Route path="/articles" element={<ArticleNavigation />} />
                        <Route path="/articles/:articleId" element={<ArticleDetail />} />
                        <Route path="/articles/utah-wedding-videographer-guide" element={<UtahWeddingVideographerGuide />} />

                        {/* Photography Routes */}
                        <Route path="/request/photography" element={<PhotographyRequest />} />
                        <Route path="/request/videography" element={<VideographyRequest />} />
                        <Route path="/request/dj" element={<DjRequest />} />
                        <Route path="/request/beauty" element={<HairAndMakeUpRequest />} />
                        <Route path="/request/florist" element={<FloristRequest />} /> {/* Add this route */}
                        <Route path="/request/catering" element={<CateringRequest />} /> {/* Add this route */}
                        <Route path="/welcome" element={<NewsletterLanding />} />
                        <Route path="/unsubscribe" element={<Unsubscribe />} />
                        <Route path="/wedding-market-guide" element={<WeddingMarketGuide />} />

                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
