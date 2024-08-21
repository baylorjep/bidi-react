import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
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
import ChooseUserType from './components/ChooseUserType';


import IndividualDashboard from './components/Individual/IndividualDashboard';

function App() {
    return (
        <Router>
            <div>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Header />} />
                    <Route path="/request" element={<RequestForm />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/my-bids" element={<MyBids />} />
                    <Route path="/success-signup" element={<SuccessSignup />} />
                    <Route path="/success-request" element={<SuccessRequest />} />
                    <Route path="/bid-success" element={<BidSuccess />} />
                    <Route path="/open-requests" element={<OpenRequests />} />
                    <Route path="/submit-bid/:requestId" element={<SubmitBid />} />
                    <Route path="/bid-accepted" element={<BidAccepted />} />
                    <Route path="/createaccount" element={<ChooseUserType />} />
                    {/* <Route path="/dashboard" element={<IndividualDashboard />} /> */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
