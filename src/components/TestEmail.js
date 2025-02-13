import React, { useState } from 'react';

function TestEmail() {
    const [formData, setFormData] = useState({
        request_id: '',
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('https://bidi-express.vercel.app/trigger-autobid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: formData.request_id, // Send request ID
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to trigger auto-bidding.');
            }

            setSuccessMessage(`Auto-bidding triggered successfully for Request ID: ${formData.request_id}`);
            setFormData({ request_id: '' }); // Clear the form after success
        } catch (error) {
            setErrorMessage(`Error triggering auto-bidding: ${error.message}`);
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <h2 className="text-center">Trigger Auto-Bid by Request ID</h2>
                {successMessage && <p className="text-success">{successMessage}</p>}
                {errorMessage && <p className="text-danger">{errorMessage}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="request_id"
                            name="request_id"
                            type="text"
                            placeholder="Enter Request ID"
                            value={formData.request_id}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="request_id">Enter Request ID</label>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Trigger Auto-Bid</button>
                </form>
            </div>
        </div>
    );
}

export default TestEmail;