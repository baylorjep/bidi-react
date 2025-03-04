import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Unsubscribe.css';

const Unsubscribe = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // '', 'success', 'error'
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('email_subscribers')
        .delete()
        .eq('email', email);

      if (error) throw error;
      setStatus('success');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="unsubscribe-container">
      <div className="unsubscribe-card">
        <h2>Unsubscribe from Newsletter</h2>
        {!status && (
          <form onSubmit={handleUnsubscribe}>
            <p>Please enter your email address to unsubscribe:</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="email-input"
            />
            <button 
              type="submit" 
              className="unsubscribe-button"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Unsubscribe'}
            </button>
          </form>
        )}

        {status === 'success' && (
          <div className="success">
            <h3>Successfully Unsubscribed</h3>
            <p>You have been unsubscribed from our newsletter.</p>
            <p>We're sorry to see you go! If you change your mind, you can always subscribe again.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="error">
            <h3>Error</h3>
            <p>We couldn't process your unsubscribe request.</p>
            <p>Please try again or contact support if the problem persists.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
