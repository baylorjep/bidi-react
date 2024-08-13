import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Header from './components/Header';
import RequestForm from './components/RequestForm';
import Signup from './components/Signup';
import SignIn from './components/SignIn';
import MyBids from './components/MyBids';
import SuccessSignup from './components/SuccessSignup';
import SuccessRequest from './components/SuccessRequest';

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
                    <Route path="/my-bids" element={<MyBids />} />
                    <Route path="/success-signup" element={<SuccessSignup />} />
                    <Route path="/success-request" element={<SuccessRequest />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
