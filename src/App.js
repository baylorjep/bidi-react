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
import RequestForm from './components/Request/RequestForm';
import SuccessRequest from './components/Request/SuccessRequest';
import OpenRequests from './components/Request/OpenRequests';

// New staged request imports
import MultiStepRequestForm from './components/Request/general requests/MultiStepRequestForm';


// Event Imports
import SelectEvent from './components/Event/SelectEvent';
import EventDetails from './components/Event/EventDetails';
import EventSummary from './components/Event/EventSummary';

// Profile Imports
import Signup from './components/Profile/Signup';
import SignIn from './components/Profile/SignIn';
import ChoosePricingPlan from './components/Profile/ChoosePricingPlan';
import ChooseUserType from './components/Profile/ChooseUserType';
import SuccessSignup from './components/Profile/SuccessSignup';
import ResetPassword from './components/Profile/ResetPassword';
import UpdatePassword from './components/Profile/UpdatePassword';

// Individual Imports
import MyBids from './components/Individual/MyBids';
import ApprovedBids from './components/Individual/ApprovedBids';
import MyDashboard from './components/Individual/MyDashboard'
import DeniedBids from './components/Individual/DeniedBids';

// Business Imports
import BusinessDashboard from './components/Business/BusinessDashboard';
import EditBid from './components/Business/EditBid';
// Misc Imports
import Homepage from './components/Homepage';
import ContactForm from './components/ContactForm';
import AboutUs from './components/AboutUs';

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

function App() {

    const [eventType, setEventType] = useState('');
    const [eventDetails, setEventDetails] = useState({});

    return (
        <Router>
            <ScrollToTop />
            <div className="app-container">
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
                        <Route path="/request" element={<RequestForm />} />
                        <Route path="/success-request" element={<SuccessRequest />} />
                        <Route path="/my-bids" element={<MyBids />} />

                        {/* New Staged Request Routes */}
                        <Route path="/request-form" element={<MultiStepRequestForm />} />
                        <Route path="/success-request" element={<SuccessRequest />} />
                        <Route path="/my-bids" element={<MyBids />} />

                        {/* Event Routes */}
                        <Route path="/select-event" element={<SelectEvent setEventType={setEventType} />} />
                        <Route path="/event-details" element={<EventDetails eventType={eventType} setEventDetails={setEventDetails} />} />
                        <Route path="/event-summary" element={<EventSummary eventType={eventType} eventDetails={eventDetails} />} />

                        {/* Profile Routes */}
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/success-signup" element={<SuccessSignup />} />
                        <Route path='/choose-pricing-plan' element={<ChoosePricingPlan/>} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/request-password-reset" element={<ResetPassword />} />
                        <Route path="/reset-password" element={<UpdatePassword />} />
                        <Route path="/createaccount" element={<ChooseUserType />} />

                        {/* Individual Routes */}
                        <Route path="/my-dashboard" element={<MyDashboard />} />
                        <Route path="/approved-bids" element={<ApprovedBids />} />
                        <Route path="/denied-bids" element={<DeniedBids />} />

                        {/* Business Routes */}
                        <Route path="/open-requests" element={<OpenRequests />} />
                        <Route path="/dashboard" element={<BusinessDashboard />} />
                        <Route path="/edit-bid/:requestId/:bidId" element={<EditBid />} /> {/* Dynamic URL for editing bids */}

                        {/* Misc Routes */}
                        <Route path="/contact-us" element={<ContactForm />} />
                        <Route path="/about-us" element={<AboutUs />} />

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
                        <Route path="/admin-dashboard" element={<AdminDashboard />} />

                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
