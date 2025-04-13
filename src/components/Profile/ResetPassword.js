import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import '../../App.css';


function ResetPassword() {
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleResetPassword = async (e) => {
        e.preventDefault();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://savewithbidi.vercel.app/reset-password', // Replace with your app's URL
        });

        if (error) {
            setErrorMessage(`Error sending reset email: ${error.message}`);
        } else {
            setSuccessMessage('Password reset email sent. It may take 5-10 minutes to arrive. Please check your inbox and spam folder.');
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <div className="mb-5 mb-lg-0 text-center">
                    <h1 className="Sign-Up-Page-Header" style={{ marginTop: '40px' }}>Reset Your Password</h1>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                    {successMessage && <p className="text-success">{successMessage}</p>}
                </div>
                <form onSubmit={handleResetPassword}>
                    <div className="form-floating create-account-form mb-3">
                        <input
                            className="form-control"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <label htmlFor="email">Email Address</label>
                    </div>
                    <div className="d-grid">
                        <button type="submit" className="sign-up-button">Send Reset Link</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
