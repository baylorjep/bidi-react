import React, { useState } from 'react';

function TestEmail() {
    const [formData, setFormData] = useState({
        email: '',
        subject: '',
        message: '',
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { email, subject, message } = formData;

        try {
            const response = await fetch('https://bidi-express.vercel.app/send-resend-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientEmail: email,
                    subject: subject,
                    htmlContent: `<p>${message}</p>`,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send the email.');
            }

            setSuccessMessage('Email sent successfully!');
            setFormData({
                email: '',
                subject: '',
                message: '',
            });
        } catch (error) {
            setErrorMessage(`Error sending email: ${error.message}`);
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <h2 className="text-center">Test Email Sending</h2>
                {successMessage && <p className="text-success">{successMessage}</p>}
                {errorMessage && <p className="text-danger">{errorMessage}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Recipient Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="email">Recipient Email</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="subject"
                            name="subject"
                            type="text"
                            placeholder="Subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="subject">Subject</label>
                    </div>
                    <div className="form-floating mb-3">
                        <textarea
                            className="form-control"
                            id="message"
                            name="message"
                            placeholder="Message Content"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            style={{ height: '150px' }}
                        ></textarea>
                        <label htmlFor="message">Message Content</label>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Send Test Email</button>
                </form>
            </div>
        </div>
    );
}

export default TestEmail;