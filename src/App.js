// App Imports
import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './i18n';

// Layout Imports
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import PrivacyPolicy from './components/Layout/PrivacyPolicy';
import TermsOfUse from './components/Layout/TermsOfUse';

// Bid Imports
import SubmitBid from './components/Request/SubmitBid';
import BidSuccess from './components/Bid/BidSuccess';
import BidAccepted from './components/Bid/BidAccepted';

// Request Imports
import RequestCategories from './components/Request/RequestCategories';
import RequestForm from './components/Request/RequestForm';
import SuccessRequest from './components/Request/SuccessRequest';
import OpenRequests from './components/Request/OpenRequests';

// Event Imports
import SelectEvent from './components/Event/SelectEvent';
import EventDetails from './components/Event/EventDetails';
import EventSummary from './components/Event/EventSummary';

// Profile Imports
import Signup from './components/Profile/Signup';
import SignIn from './components/Profile/SignIn';
import ChooseUserType from './components/Profile/ChooseUserType';
import SuccessSignup from './components/Profile/SuccessSignup';
import ResetPassword from './components/Profile/ResetPassword';

// Individual Imports
import MyBids from './components/Individual/MyBids';
import MyDashboard from './components/Individual/MyDashboard'

// Business Imports

// Misc Imports
import Homepage from './components/Homepage';
import ContactForm from './components/ContactForm';

// spanish imports
import HomepageES from './components/HomepageES'
import ContactFormES from './components/ContactFormES';




function App() {

    const [eventType, setEventType] = useState('');
    const [eventDetails, setEventDetails] = useState({});

    return (
        <Router>
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

                        {/* Event Routes */}
                        <Route path="/select-event" element={<SelectEvent setEventType={setEventType} />} />
                        <Route path="/event-details" element={<EventDetails eventType={eventType} setEventDetails={setEventDetails} />} />
                        <Route path="/event-summary" element={<EventSummary eventType={eventType} eventDetails={eventDetails} />} />

                        {/* Profile Routes */}
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/success-signup" element={<SuccessSignup />} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/createaccount" element={<ChooseUserType />} />

                        {/* Individual Routes */}
                        <Route path="/my-dashboard" element={<MyDashboard />} />

                        {/* Business Routes */}
                        <Route path="/open-requests" element={<OpenRequests />} />

                        {/* Misc Routes */}
                        <Route path="/contact-us" element={<ContactForm />} />

                        {/* Spanish Routes */}
                        <Route path="/inicio" element={<HomepageES />}/>
                        <Route path="/contactenos" element={<ContactFormES />}/>
                        
                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
