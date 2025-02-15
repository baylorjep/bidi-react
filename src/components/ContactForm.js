import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

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
        <>
            <Helmet>
                <title>Contact Us - Bidi</title>
                <meta name="description" content="Have questions or need assistance? Reach out to the Bidi team through our contact form." />
                <meta name="keywords" content="contact, support, Bidi, wedding vendors" />
            </Helmet>
            <div className="container px-5 d-flex align-items-center justify-content-center">
                <div className="col-lg-6">
                    <div className="mb-5 mb-lg-0 text-center">
                    <br/>
                        <div className='Sign-Up-Page-Header'>Let's <span className='Sign-Up-Page-Header highlight'>Talk!</span></div>
                        <div className='submit-form-2nd-header' style={{textAlign:'left', padding:'16px'}}>Have any questions or need assistance? We're here to help! Feel free to reach out to us. Our team is dedicated to providing prompt and helpful responses to ensure you get the support you need.</div>
                        {errorMessage && <p className="text-danger">{errorMessage}</p>}
                        {successMessage && <p className="text-success">{successMessage}</p>}
                    </div>
                    <form onSubmit={handleSubmit} style={{marginTop:'40px'}}>
                        {!user && (
                            <div className="custom-input-container">
                                <input
                                    className="custom-input"
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <label className='custom-label'htmlFor="email">Email Address</label>
                            </div>
                        )}
                        <div className="custom-input-container">
                            <input
                                className="custom-input"
                                id="subject"
                                name="subject"
                                type="text"
                                placeholder="Subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="subject" className='custom-label'>Subject</label>
                        </div>
                        <div className="custom-input-container">
                            <textarea
                                className="custom-input"
                                id="message"
                                name="message"
                                placeholder="Your message..."
                                value={formData.message}
                                onChange={handleChange}
                                required
                                style={{ height: '5rem' }}
                            ></textarea>
                            <label className='custom-label' htmlFor="message">Message</label>
                        </div>
                        <div className="d-grid">
                            <button type="submit" className="btn-primary">Send Message</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default ContactForm;
