import React, {useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import StatusBar from './StatusBar';  // Add this import

function SuccessRequest() {
    const [emailStatus, setEmailStatus] = useState(null);
    const location = useLocation();
    const formData = location.state?.formData || {};

    const steps = ['Service Details', 'Event Details', 'Personal Details', 'Preferences', 'Submit'];

    useEffect(() => {
        const sendEmail = async () => {
            const category = formData.serviceType || formData.category || "General";
            console.log("Retrieved category:", category);
            if (!category) {
                setEmailStatus('No category found. Email not sent.');
                return;
            }

            try {
                const emailPayload = { category };
                const response = await fetch('https://bidi-express.vercel.app/send-resend-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(emailPayload),
                });

                if (!response.ok) {
                    const errorDetails = await response.json();
                    console.error('Failed to send email:', errorDetails);
                    setEmailStatus('Failed to send email notifications.');
                } else {
                    console.log('Emails sent successfully! ');
                    setEmailStatus('Vendors successfully contacted! You will receive an email or texts as vendors send in bids.');
                    localStorage.removeItem("requestFormData");
                    localStorage.removeItem('submittedCategory'); // Clear localStorage after success
                }
            } catch (error) {
                console.error('Error sending email:', error);
                setEmailStatus('Error sending email notifications.');
            }
        };

        sendEmail();
    }, []);

    return (
        <div className='request-form-overall-container'>
            <div className="request-form-status-container desktop-only" style={{ height: '75vh', padding:'40px' }}>
                <div className="request-form-box">
                    <StatusBar steps={steps} currentStep={4} />
                </div>
            </div>  
            <div className='request-form-container-details'>
                <div className="request-form-status-container mobile-only">
                    <div className="request-form-box">
                        <StatusBar steps={steps} currentStep={4} />
                    </div>
                </div>  

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '60px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <path d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z" fill="white" stroke="#FF008A" strokeWidth="4" strokeLinejoin="round" />
                        <path d="M16 24L22 30L34 18" stroke="#FF3875" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    <div className='successfully-submitted'>
                        Successfully Submitted!
                    </div>

                    <div className='successfully-submitted-subheader'
                    role="status"
                    aria-live="polite">
                    {emailStatus || "You will receive an email or texts as vendors send in bids. You're done! Just relax and let the bids roll in."}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
                        <Link to='/bids' className='success-page-button-secondary'>
                            Close
                        </Link>
                        <Link to='/request-categories' className='success-page-button-primary'>
                            Make Another Request
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SuccessRequest;