import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NoGhostingGuarantee.css';

const NoGhostingGuarantee = () => {
    const navigate = useNavigate();

    return (
        <div className="no-ghost-guarantee-page">
            <div className="no-ghost-guarantee-container">
                <button className="no-ghost-back-button" onClick={() => navigate(-1)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back
                </button>
                
                <h1 className="no-ghost-guarantee-title">
                    <span style={{ marginRight: '15px' }}>👻</span>
                    No-Ghost Guarantee
                </h1>
                
                <div className="no-ghost-guarantee-section">
                    <h2>What is the No-Ghost Guarantee?</h2>
                    <p>
                        At Bidi, we understand that planning your special day is stressful enough without worrying about vendors becoming unresponsive. 
                        That's why we've implemented our No-Ghost Guarantee - a promise to protect you and your event from vendor no-shows.
                    </p>
                </div>

                <div className="no-ghost-guarantee-section">
                    <h2>How No-Ghost Works</h2>
                    <div className="no-ghost-guarantee-steps">
                        <div className="no-ghost-step">
                            <div className="no-ghost-step-number">1</div>
                            <div className="no-ghost-step-content">
                                <h3>Book Through Bidi</h3>
                                <p>When you book your vendor through our platform, you're automatically covered by our No-Ghost guarantee.</p>
                            </div>
                        </div>
                        <div className="no-ghost-step">
                            <div className="no-ghost-step-number">2</div>
                            <div className="no-ghost-step-content">
                                <h3>Vendor Becomes Unresponsive</h3>
                                <p>If your vendor stops responding to messages or fails to show up for scheduled meetings, contact us immediately.</p>
                            </div>
                        </div>
                        <div className="no-ghost-step">
                            <div className="no-ghost-step-number">3</div>
                            <div className="no-ghost-step-content">
                                <h3>No-Ghost Team Steps In</h3>
                                <p>Our No-Ghost team will investigate the situation and work to resolve it within 24 hours.</p>
                            </div>
                        </div>
                        <div className="no-ghost-step">
                            <div className="no-ghost-step-number">4</div>
                            <div className="no-ghost-step-content">
                                <h3>Full No-Ghost Protection</h3>
                                <p>If we can't resolve the issue, we'll refund your full payment and help you find a replacement vendor.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="no-ghost-guarantee-section">
                    <h2>What No-Ghost Covers</h2>
                    <ul className="no-ghost-coverage-list">
                        <li>Full refund of your payment</li>
                        <li>Assistance finding a replacement vendor</li>
                        <li>Priority support from our No-Ghost team</li>
                        <li>Help ensuring your event stays on track</li>
                    </ul>
                </div>

                <div className="no-ghost-guarantee-section">
                    <h2>Why Trust No-Ghost?</h2>
                    <p>
                        We've built our platform on trust and reliability. Our No-Ghost Guarantee is our commitment to ensuring 
                        your event planning experience is stress-free and secure. We carefully vet all vendors on our platform 
                        and maintain strict standards to prevent issues before they occur.
                    </p>
                </div>

                <div className="no-ghost-guarantee-cta">
                    <h2>Ready to Plan with No-Ghost Confidence?</h2>
                    <p>Start your vendor search today and experience the peace of mind that comes with our No-Ghost Guarantee.</p>
                    <button className="no-ghost-cta-button">Find Vendors Now</button>
                </div>
            </div>
        </div>
    );
};

export default NoGhostingGuarantee; 