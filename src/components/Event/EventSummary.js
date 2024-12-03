import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useIndividualUser } from '../Individual/getIndividualUser';

function EventSummary({ eventType, eventDetails }) {
    const { user, userError } = useIndividualUser();
    const navigate = useNavigate();

    const sendEmailNotification = async (recipientEmail, subject, htmlContent) => {
        try {
            await fetch('https://bidi-express.vercel.app/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recipientEmail, subject, htmlContent }),
            });
        } catch (error) {
            console.error('Error sending email:', error);
        }
    };


    const handleSubmit = async () => {
        // Insert the request into the photography_requests table
        const { error } = await supabase
            .from('photography_requests')
            .insert([
                {
                    profile_id: user.id,
                    event_title: eventDetails.eventTitle,
                    event_type: eventType,
                    date_type: eventDetails.dateType,
                    start_date: eventDetails.startDate,
                    end_date: eventDetails.endDate,
                    time_of_day: eventDetails.timeOfDay,
                    location: eventDetails.location,
                    num_people: eventDetails.numPeople,
                    duration: eventDetails.duration,
                    indoor_outdoor: eventDetails.indoorOutdoor,
                    additional_comments: eventDetails.additionalComments,
                    extras: eventDetails.extras,
                    status: 'open'
                },
            ]);

            if (!error) {
                // Email businesses when a new request is placed
                const subject = 'New Photography Request';
                const htmlContent = `<p>A new photography request has been posted.</p>
                                    <p><strong>Event:</strong> ${eventDetails.eventTitle}</p>
                                    <p><strong>Location:</strong> ${eventDetails.location}</p>`;
                await sendEmailNotification('savewithbidi@gmail.com', subject, htmlContent); // Send to relevant businesses
    
                navigate('/success-request');
            } else {
                console.error('Error submitting request:', error.message);
            }
        };

    return (
        <div className="container">
            <h2 className="PageHeader">{eventDetails.eventTitle} Summary</h2>
            <p><strong>Event Type:</strong> {eventType}</p>
            <p><strong>Location:</strong> {eventDetails.location}</p>
            <p><strong>{eventDetails.dateType === 'range' && 'Start'} Date:</strong> {String(eventDetails.startDate)}</p>
            {eventDetails.dateType === 'range' && <p><strong>End Date:</strong> {String(eventDetails.endDate)}</p>}
            <p><strong>Time of Day:</strong> {String(eventDetails.timeOfDay)}</p>
            <p><strong>Number of People:</strong> {String(eventDetails.numPeople)}</p>
            <p><strong>Duration (in hours):</strong> {String(eventDetails.duration)}</p>
            <p><strong>Indoor/Outdoor:</strong> {eventDetails.indoorOutdoor}</p>
            <p><strong>Additional Comments:</strong> {eventDetails.additionalComments}</p>
            {/* Display other details */}
            <div className='form-button-container'><button className="btn btn-primary mt-3" onClick={() => navigate('/event-details')}>Back</button>
            <button className="btn btn-secondary mt-3" onClick={handleSubmit}>Submit</button>
            </div>
            <div style={{display:'flex',justifyContent:'center',flexDirection:'column', alignItems:'center'}   }>
            <h1 className="Sign-Up-Page-Header" style={{ marginTop: '40px' }}>
                        Need Help Figuring Out What You Need?
                    </h1>
                    <button 
                        className="btn btn-secondary btn-lg"
                        style={{marginBottom:'20px', maxWidth:'400px'}}
                        onClick={() => {
                            const isWindows = navigator.userAgent.includes('Windows');
                            if (isWindows) {
                                window.open('https://calendly.com/weston-burnett19/meetingwithweston', '_blank');
                            } else {
                                window.location.href = 'tel:+13852169587';
                            }
                        }}
                    >   <i className="fas fa-phone-alt me-2" style={{rotate:'90deg'}}></i>
                        Schedule a Free Consultation Call
                    </button>

            </div>
        </div>
    );
}

export default EventSummary;
