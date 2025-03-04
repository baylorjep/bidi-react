import React from 'react';
import '../../App.css';

const PrivacyPolicy = () => {
    return (
        <div className="mobile-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Privacy Policy</h1>

            <p>Last updated: November 13, 2024</p>

            <p>
                At Bidi, we respect your privacy and are committed to protecting the personal information you share with us.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
                Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not
                access the site.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
                We may collect personal information that you voluntarily provide to us when you register on the site, express an
                interest in obtaining information about us or our products and services, or otherwise contact us.
            </p>
            <p>
                The personal information we collect may include your name, email address, phone number, and any other information
                you choose to provide.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>
                We use the information we collect to operate and maintain our website, send you marketing and promotional communications,
                respond to your inquiries, and improve our services.
            </p>

            <h2>3. Sharing Your Information</h2>
            <p>
                We do not share your personal information with third parties without your consent, except as necessary to comply with
                applicable laws, respond to legal processes, protect our rights, or fulfill our contractual obligations to you.
            </p>

            <h2>4. Your Rights and Choices</h2>
            <p>You have the following rights regarding your personal information:</p>
            <ul>
                <li><strong>Access and Update:</strong> You can review, update, or delete your personal information by contacting us.</li>
                <li><strong>Marketing Opt-Out:</strong> You can opt out of marketing communications by clicking the "Unsubscribe" link in our emails or contacting us.</li>
                <li><strong>Data Deletion:</strong> You may request the deletion of your data at any time by emailing us at savewithbidi@gmail.com.</li>
            </ul>

            <h2>5. Security of Your Information</h2>
            <p>
                We use administrative, technical, and physical security measures to protect your personal information. However, please
                be aware that no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed
                against any interception or other types of misuse.
            </p>

            <h2>6. Changes to This Privacy Policy</h2>
            <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date
                at the top of this Privacy Policy. We encourage you to review this Privacy Policy periodically to stay informed about
                how we are protecting your information.
            </p>

            <h2>7. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
            <p>Email: savewithbidi@gmail.com</p>
            <p>Text: 385-223-7237</p>

            <h2>8. Information Collected Through Google OAuth</h2>
            <p>
                We use Google OAuth to allow you to sign in securely using your Google account. When you choose to sign in with Google,
                we may collect and use the following information:
            </p>
            <ul>
                <li>Your Google-provided name and email address to create and manage your account.</li>
                <li>Your profile picture (if provided) to personalize your user experience.</li>
            </ul>
            <p>We only use this information for authentication and account management purposes. We do not share this information with third parties or use it for marketing purposes without your consent.</p>

            <h2>9. Data Retention</h2>
            <p>
                We retain your personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy or as required by law. If you wish to delete your account or personal data, please contact us at savewithbidi@gmail.com, and we will process your request promptly.
            </p>

            <h2>10. Revoking Google OAuth Permissions</h2>
            <p>
                If you would like to revoke our access to your Google account, you can do so at any time through your Google Account settings: <a href="https://myaccount.google.com/permissions">https://myaccount.google.com/permissions</a>.
            </p>
        </div>
    );
};

export default PrivacyPolicy;