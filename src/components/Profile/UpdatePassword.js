import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

function UpdatePassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords don't match.");
            return;
        }

        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        // Update the password
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setErrorMessage(`Error updating password: ${error.message}`);
            setLoading(false);
        } else {
            setSuccessMessage('Password updated successfully!');
            setLoading(false);
            setTimeout(() => navigate('/signin'), 2000); // Redirect to sign-in page after 2 seconds
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <div className="mb-5 mb-lg-0 text-center">
                    <br />
                    <h1 className="SignInPageHeader">Update Your Password</h1>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                    {successMessage && <p className="text-success">{successMessage}</p>}
                </div>
                <form onSubmit={handleUpdatePassword}>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <label htmlFor="newPassword">New Password</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <label htmlFor="confirmPassword">Confirm Password</label>
                    </div>
                    <div className="d-grid">
                        <button type="submit" className="btn btn-secondary btn-lg w-100" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                    <br />
                    <div className="text-center mt-3">
                        <a href="/signin" className="btn btn-link">
                            Go back to Sign In
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UpdatePassword;
