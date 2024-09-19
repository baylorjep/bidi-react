import React, {useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

const SuccessPayment = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Add any logic here to update the status of the bid and request
    // Optionally, fetch data from the server to verify payment success

    // Example: redirect to the dashboard after a few seconds
    const timer = setTimeout(() => {
      navigate('/my-bids'); // Replace with the route you want to redirect to
    }, 5000); // 5-second delay

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [navigate]);

  return (
    <div className="container px-5 text-center">
      <div className="content">
        <h1>Payment Successful!</h1>
        <p>Thank you for your payment. Your bid has been accepted successfully.</p>
        <p>You will be redirected to your dashboard shortly.</p>
        <p>If you are not redirected, <a href="/my-bids">click here</a>.</p>
      </div>
    </div>
  );
};

export default SuccessPayment;