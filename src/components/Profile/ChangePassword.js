import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // If using react-router-dom
import { supabase } from '../../supabaseClient';

function ChangePassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Extract the token from the URL
  const accessToken = searchParams.get('access_token');

  useEffect(() => {
    if (!accessToken) {
      setErrorMessage('Invalid or missing reset token.');
    }
  }, [accessToken]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!password) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Use Supabase to update the password using the access token
    const { error } = await supabase.auth.updateUser({
      password,
      access_token: accessToken, // Include the access token from the URL
    });

    if (error) {
      setErrorMessage(`Error resetting password: ${error.message}`);
    } else {
      setSuccessMessage('Password updated successfully! You can now log in with your new password.');
    }

    setLoading(false);
  };

  return (
    <div className="container px-5 d-flex align-items-center justify-content-center">
      <div className="col-lg-6">
        <div className="mb-5 mb-lg-0 text-center">
          <h1 className="ChangePasswordHeader" style={{ marginTop: '40px' }}>Set New Password</h1>
          {errorMessage && <p className="text-danger">{errorMessage}</p>}
          {successMessage && <p className="text-success">{successMessage}</p>}
        </div>
        {accessToken ? (
          <form onSubmit={handleUpdatePassword}>
            <div className="form-floating mb-3">
              <input
                className="form-control"
                id="new-password"
                name="password"
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label htmlFor="new-password">New Password</label>
            </div>
            <div className="d-grid">
              <button type="submit" className="btn btn-secondary btn-lg w-100" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-danger">Invalid or expired reset token.</p>
        )}
      </div>
    </div>
  );
}

export default ChangePassword;
