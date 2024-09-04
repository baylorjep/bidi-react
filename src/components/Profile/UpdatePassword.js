import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import '../../App.css';

function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setErrorMessage(`Error updating password: ${error.message}`);
    } else {
      setSuccessMessage('Password updated successfully! You can now log in with your new password.');
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Update Your Password</h1>
      {errorMessage && <p className="text-danger">{errorMessage}</p>}
      {successMessage && <p className="text-success">{successMessage}</p>}
      <form onSubmit={handleUpdatePassword}>
        <input
          type="password"
          placeholder="Enter your new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default UpdatePassword;
