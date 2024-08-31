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
            setSuccessMessage('Password reset email sent. Please check your inbox.');
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <div className="mb-5 mb-lg-0 text-center">
                    <h1 className="ResetPasswordPageHeader" style={{ marginTop: '40px' }}>Reset Your Password</h1>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                    {successMessage && <p className="text-success">{successMessage}</p>}
                </div>
                <form onSubmit={handleResetPassword}>
                    <div className="form-floating mb-3">
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
                        <button type="submit" className="btn btn-secondary btn-lg w-100">Send Reset Link</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
