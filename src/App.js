import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Header from './components/Header';
import RequestForm from './components/Request/RequestForm';
import Signup from './components/Signup';
import SignIn from './components/SignIn';
import MyBids from './components/MyBids';
import SuccessSignup from './components/SuccessSignup';
import SuccessRequest from './components/SuccessRequest';
import OpenRequests from './components/Request/OpenRequests';
import SubmitBid from './components/Request/SubmitBid';
import BidSuccess from './components/BidSuccess';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import BidAccepted from './components/BidAccepted';
import ResetPassword from './components/ResetPassword';
import ContactForm from './components/ContactForm';
import ChooseUserType from './components/ChooseUserType';
import MyDashboard from './components/Individual/MyDashboard'
import SelectEvent from './components/SelectEvent';
import EventDetails from './components/EventDetails';
import Summary from './components/Summary';
import PrivacyPolicy from './components/Layout/PrivacyPolicy';
import TermsOfUse from './components/Layout/TermsOfUse';
import RequestCategories from './components/Request/RequestCategories';


function App() {

    const [eventType, setEventType] = useState('');
    const [eventDetails, setEventDetails] = useState({});

    return (
        <Router>
            <div className="app-container">
                <Navbar />
                <div className='content'>
                    <Routes>
                        {/* Layout */}
                        <Route path="/" element={<Header />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-of-use" element={<TermsOfUse />} />
                        <Route path="/request-categories" element={<RequestCategories />} />

                        {/* Bid */}
                        <Route path="/submit-bid/:requestId" element={<SubmitBid />} />
                        <Route path="/bid-accepted" element={<BidAccepted />} />
                        <Route path="/bid-success" element={<BidSuccess />} />

                        {/* Request */}
                        <Route path="/request" element={<RequestForm />} />
                        <Route path="/success-request" element={<SuccessRequest />} />
                        <Route path="/my-bids" element={<MyBids />} />

                        {/* Events */}
                        <Route path="/select-event" element={<SelectEvent setEventType={setEventType} />} />
                        <Route path="/event-details" element={<EventDetails eventType={eventType} setEventDetails={setEventDetails} />} />
                        <Route path="/summary" element={<Summary eventType={eventType} eventDetails={eventDetails} />} />

                        {/* Individual */}
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/success-signup" element={<SuccessSignup />} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/my-dashboard" element={<MyDashboard />} />

                        {/* Business */}
                        <Route path="/open-requests" element={<OpenRequests />} />

                        {/* Misc/TBD */}
                        <Route path="/createaccount" element={<ChooseUserType />} />
                        <Route path="/contact-us" element={<ContactForm />} />
                        
                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
