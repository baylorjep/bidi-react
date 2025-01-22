import React, { useState } from 'react';

function TestEmail() {
    const [formData, setFormData] = useState({
        category: '', // Add a category field to specify the business category
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { category } = formData;

        try {
            const response = await fetch('https://bidi-express.vercel.app/send-resend-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category, // Send the business category to the backend
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send the email.');
            }

            setSuccessMessage(`Emails successfully sent to ${category} users!`);
            setFormData({ category: '' }); // Clear the form after success
        } catch (error) {
            setErrorMessage(`Error sending emails: ${error.message}`);
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <h2 className="text-center">Send Emails by Category</h2>
                {successMessage && <p className="text-success">{successMessage}</p>}
                {errorMessage && <p className="text-danger">{errorMessage}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="category"
                            name="category"
                            type="text"
                            placeholder="Business Category (e.g., Photographer)"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="category">Business Category (e.g., Photographer)</label>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Send Emails</button>
                </form>
            </div>
        </div>
    );
}

export default TestEmail;