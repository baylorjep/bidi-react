import React from 'react';
import { Helmet } from 'react-helmet';

const TermsOfUse = () => {
    return (
        <>
            <Helmet>
                <title>Terms of Use - Bidi</title>
                <meta name="description" content="Read the terms and conditions for using Bidi's services." />
                <meta name="keywords" content="terms of use, Bidi, wedding vendors, service marketplace" />
            </Helmet>
            <div className="mobile-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <h1>Terms of Use</h1>

                <p><strong>Last updated:</strong> March 10, 2025</p>

                <p>
                    Welcome to Bidi! These Terms of Use ("Terms") govern your access to and use of our website, services, and platform.
                    By creating an account or using our platform, you agree to be bound by these Terms.
                    If you do not agree with any part of these Terms, please do not use Bidi.
                </p>

                <h2>1. Intellectual Property Rights</h2>
                <p>
                    Unless otherwise stated, Bidi and/or its licensors own all intellectual property rights for the materials on this website.
                    All rights are reserved. You may view and/or print pages from <a href="https://savewithbidi.com/">https://savewithbidi.com/</a> 
                    for personal use, subject to the restrictions outlined in these Terms.
                </p>

                <h2>2. Restrictions</h2>
                <p>You are specifically restricted from the following:</p>
                <ul>
                    <li>Reproducing, redistributing, or republishing any website material without prior written permission.</li>
                    <li>Selling, sublicensing, or commercializing any content from this platform.</li>
                    <li>Using this website in any way that may harm, disrupt, or interfere with its proper functioning.</li>
                    <li>Engaging in data mining, data harvesting, or scraping of Bidi’s content.</li>
                    <li>Using Bidi for unauthorized advertising, marketing, or solicitation.</li>
                </ul>

                <h2>3. Non-Compete Agreement</h2>
                <p>
                    By creating an account and using Bidi, you agree that you will not, directly or indirectly, establish, operate, advise, 
                    or work for a competing business that provides an online marketplace for bidding on wedding or event services for a period 
                    of (2) years after your last use of Bidi. 
                </p>
                <p>
                    This non-compete agreement applies to all users, including vendors, businesses, and individuals using Bidi's platform. 
                    Violation of this clause may result in legal action.
                </p>

                <h2>4. Limitation of Liability</h2>
                <p>
                    In no event shall Bidi, its officers, directors, employees, or affiliates be held liable for any loss, damages, or claims 
                    arising from your use of the platform. This includes, but is not limited to, indirect, consequential, or special damages 
                    resulting from your use or inability to use the platform.
                </p>

                <h2>5. Governing Law & Jurisdiction</h2>
                <p>
                    These Terms shall be governed by and construed in accordance with the laws of the **State of Utah, USA**. 
                    You agree to submit to the exclusive jurisdiction of the state and federal courts located in Utah for any disputes arising 
                    out of or related to these Terms or your use of Bidi.
                </p>

                <h2>6. Changes to These Terms</h2>
                <p>
                    We may update these Terms from time to time without prior notice. Your continued use of Bidi after any modifications 
                    constitutes your acceptance of the revised Terms.
                </p>

                <h2>7. Contact Us</h2>
                <p>If you have any questions about these Terms, please contact us:</p>
                <p>
                    <strong>Email:</strong> savewithbidi@gmail.com<br />
                </p>
            </div>
        </>
    );
};

export default TermsOfUse;