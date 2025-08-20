import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Helmet } from 'react-helmet';
import Weston from '../assets/images/Weston.png';
import Baylor from '../assets/images/Baylor.png';
import Emma from '../assets/images/Emma.png';
import Matias from '../assets/images/Matias.jpeg';
import '../styles/AboutAndContact.css';

function AboutAndContact() {
    // Contact form state
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [user, setUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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

        const { error } = await supabase
            .from('contact_forms')
            .insert([{
                user_id: user ? user.id : null,
                email: formData.email,
                phone: formData.phone,
                subject: formData.subject,
                message: formData.message,
            }]);

        if (error) {
            setErrorMessage(`Error submitting form: ${error.message}`);
        } else {
            setSuccessMessage('Your message has been sent. We will get back to you shortly.');
            setFormData({
                email: user ? user.email : '',
                phone: '',
                subject: '',
                message: '',
            });
        }
    };

    return (
        <>
            <Helmet>
                <title>About & Contact - Bidi</title>
                <meta name="description" content="Meet the Bidi team and get in touch with us for any questions or support." />
                <meta name="keywords" content="about us, contact, team, Bidi, event vendors" />
            </Helmet>

            <div className="about-contact-container">
                {/* Mission Section */}
                <div className="mission-section">
                    <div className="mission-title">
                        Our <span className="mission-highlight">Mission</span>
                    </div>
                    
                    <div className="mission-content">
                        <p>
                            At Bidi, we're revolutionizing the event planning experience by creating a marketplace that truly works for both event organizers and vendors.
                        </p>
                    </div>

                    <div className="value-props-container">
                        <div className="value-prop-card">
                            <div className="value-prop-title">For Event Vendors</div>
                            <div className="value-prop-content">
                            <span className="highlight-text">We're the only marketplace where our success is directly tied to yours</span>. Unlike other platforms that charge monthly fees or per-lead costs, we only make money when you win business and get paid.
                                <div className="experience-note">
                                    This means we're incentivized to send you only quality leads that match your services and availability. No more wasting time and money on unqualified inquiries.
                                </div>
                            </div>
                        </div>

                        <div className="value-prop-card">
                            <div className="value-prop-title">For Event Organizers</div>
                            <div className="value-prop-content">
                                <span className='highlight-text'>We've been through event planning ourselves, and we know the frustrations:</span> ghosted messages, discovering pricing mismatches after days of conversation, and endless searching for quality vendors.
                                <div className="experience-note">
                                    That's why we built Bidi - to give you instant access to available, transparent vendors who are ready to make your event special. No more wasted time on dead-end inquiries.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mission-content">
                        <ul>
                            <li>Direct connections between event organizers and quality vendors</li>
                            <li>Transparent pricing and availability upfront</li>
                            <li>No monthly fees - vendors only pay when they get paid</li>
                            <li>Quick responses and no ghosting</li>
                        </ul>
                    </div>

                    <div className="mission-button-container">
                        <button 
                            className="mission-button"
                            onClick={() => {
                                document.querySelector('.contact-section').scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Contact Us
                        </button>
                    </div>
                </div>

                {/* About Section */}
                <div className="about-section">
                    <div className="about-us-title">
                        Meet Our <span className='about-us-highlight'>Team</span>
                    </div>
                    {/* Team member sections from AboutUs.js */}
                    <div className='team-member-container'>
                        <div className='team-member-image-container'>
                            <img src={Weston} alt="Weston Burnett" />
                        </div>
                        <div className='about-us-text'>
                            Hey everyone! My name is Weston Burnett! I'm from Layton, Utah, and I am currently a student at BYU studying Finance while also being part of the Sandbox program at BYU. I've been married to my amazing wife, Vivian, for two years, and they have been two incredible years. My role at Bidi is as a product manager. I take feedback from you and work to implement it into Bidi to make it as amazing as possible! I also handle a lot of the front-end development for the site, bringing to life the amazing designs that Emma creates for Bidi.
                            <br /><br />
                            I'd love to chat if you have any questions, concerns, or feedback on Bidi! Feel free to text me at 385-216-9587 or email me at weston.burnett19@gmail.com.
                        </div>
                    </div>

                    <div className='team-member-container'>
                        <div className='team-member-image-container-baylor-mobile'>
                            <img src={Baylor} alt="Baylor Jeppsen" />
                        </div>
                        <div className='about-us-text-baylor'>
                            What's up! I'm Baylor Jeppsen, and I'm from Draper, Utah. It's always been my dream to start and scale my own company, and I'm excited to be doing that with Bidi. I'm currently studying Information Systems at BYU as part of the Sandbox program, which has been an incredible opportunity to develop my entrepreneurial skills and bring Bidi to life. Right now, my wife Isabel and I are living in Germany for an internship, which has been an amazing experience.
                            <br /><br />
                            I handle all the development at Bidi, making sure the platform runs smoothly and building out new features. If there's anything you'd love to see added or ways we can make Bidi better, I'm always looking for feedback and suggestions! Feel free to reach out to me at baylor.jeppsen@gmail.com or text me at 385-223-7237 -I'd love to hear your thoughts!
                        </div>
                        <div className='team-member-image-container-baylor'>
                            <img src={Baylor} alt="Baylor Jeppsen" style={{marginRight:'3rem'}} />
                        </div>
                    </div>

                    <div className='team-member-container'>
                        <div className='team-member-image-container'>
                            <img src={Emma} alt="Emma" />
                        </div>
                        <div className='about-us-text'>
                            Hey there! My name is Emma and I am a student at BYU studying ux/ui design. I was born in South Korea but grew up in Southern California. Some of my hobbies include online shopping, watching shows (currently, Tell Me Lies, and Love Is Blind are my favorites), cooking, taking naps, and spending time on TikTok.
                            <br /><br />
                            I recently joined this team in the Sandbox program! It has been a rewarding experience to share thoughts and ideas pertaining to the goal of Bidi. I recently got married and consequently experienced firsthand how difficult it is to find venues, photographers, and all things event-related. Bidi makes this easier by allowing the goods and services to be directed to you! Not the other way around.
                        </div>
                    </div>

                    <div className='team-member-container'>
                        <div className='team-member-image-container-baylor-mobile'>
                            <img src={Matias} alt="Matias" />
                        </div>
                        <div className='about-us-text-baylor' style={{marginTop:'40px'}}>
                            Hey! I'm Matias, originally from Chile and currently studying Strategy at BYU. I love diving into complex problems, finding creative solutions, and exploring how businesses can grow and compete. Outside of my studies, you'll almost always find me with a cup of mate in hand—it's more than just a drink for me; it's a tradition and a way to connect with others. I'm always up for a good conversation, whether it's about strategy, culture, or just life in general.
                            <br /><br />
                            In my work, I focus on partnerships, product development, and business growth—bringing ideas to life and building relationships that drive impact. I also help guide our overall strategy, making sure we're not just growing but doing so in a smart, sustainable way. Whether it's negotiating a partnership, refining a business model, or brainstorming the next big move, I'm always looking for ways to create value and push things forward.
                        </div>
                        <div className='team-member-image-container-baylor' style={{marginTop:'40px'}}>
                            <img src={Matias} alt="Matias" style={{marginRight:'3rem', width:'420px', height:'500px', objectFit:'cover'}} />
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="contact-section">
                    <div className="contact-title-about-us">
                        Let's <span className="highlight">Talk!</span>
                    </div>
                    <div className="contact-subtitle">
                        Have any questions or need assistance? We're here to help! Feel free to reach out to us directly at <a href="tel:3852169587" className="phone-link">(385) 216-9587</a> or fill out the form below.
                    </div>
                    
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                    {successMessage && <p className="text-success">{successMessage}</p>}

                    <form onSubmit={handleSubmit}>
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
                                <label className='custom-label' htmlFor="email">Email Address</label>
                            </div>
                        )}
                        <div className="custom-input-container">
                            <input
                                className="custom-input"
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="(123) 456-7890"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                            <label htmlFor="phone" className='custom-label'>Phone Number (Optional)</label>
                        </div>
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
                            <button type="submit" className="mission-button">Send Message</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default AboutAndContact; 