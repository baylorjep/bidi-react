import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

const PaymentStatus = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Add logic here to handle any additional post-payment processes
    // Example: Optionally redirect after a few seconds
    const timer = setTimeout(() => {
      navigate('/bids'); // Replace with the route you want to redirect to
    }, 10000); // 10-second delay

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [navigate]);

  return (
    <div className="container px-5 text-center">
      <div className="content">
        <h1>Your Order is Under Review!</h1>
        <p>Thank you for your payment. We are reviewing your order and your business will notify you once it is processed.</p>
        <p>You will be redirected to your dashboard shortly.</p>
        <p>If you are not redirected, <a href="/my-bids">click here</a>.</p>
      </div>
    </div>
  );
};

export default PaymentStatus;