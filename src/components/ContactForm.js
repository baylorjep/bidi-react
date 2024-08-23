import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../App.css';
import { useNavigate } from 'react-router-dom';

function ContactForm() {
    const [formData, setFormData] = useState({
        email: '',
        subject: '',
        message: '',
    });
    const [user, setUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setUser(data.session.user);
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    email: data.session.user.email,
                }));
            }
        };

        fetchUser();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user && !formData.email) {
            setErrorMessage('Please provide an email address.');
            return;
        }

        const { email, subject, message } = formData;

        const { error } = await supabase
            .from('contact_forms')
            .insert([
                {
                    user_id: user ? user.id : null,
                    email,
                    subject,
                    message,
                },
            ]);

        if (error) {
            setErrorMessage(`Error submitting form: ${error.message}`);
        } else {
            setSuccessMessage('Your message has been sent. We will get back to you shortly.');
            setFormData({
                email: user ? user.email : '',
                subject: '',
                message: '',
            });
        }
    };

    return (
        
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <div className="mb-5 mb-lg-0 text-center">
                <br/>
                    <h1>Contact Us</h1>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                    {successMessage && <p className="text-success">{successMessage}</p>}
                </div>
                <form onSubmit={handleSubmit}>
                    {!user && (
                        <div className="form-floating mb-3">
                            <input
                                className="form-control"
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="email">Email Address</label>
                        </div>
                    )}
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
                            placeholder="Your message..."
                            value={formData.message}
                            onChange={handleChange}
                            required
                            style={{ height: '10rem' }}
                        ></textarea>
                        <label htmlFor="message">Message</label>
                    </div>
                    <div className="d-grid">
                        <button type="submit" className="btn btn-secondary btn-lg w-100">Send Message</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ContactForm;
