import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function EventDetails({ eventType, setEventDetails }) {
    const [details, setDetails] = useState({
        eventTitle: '',
        location: '',
        dateType: 'specific',
        startDate: '',
        endDate: null,
        timeOfDay: '',
        numPeople: '',
        duration: '',
        indoorOutdoor: '',
        additionalComments: '',
        extras: {}
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setEventDetails(details);
        navigate('/event-summary');  // Navigate to the summary stage
    };

    const handleBack = () => {
        navigate('/select-event');  // Adjust the route for going back
    };

    return (
        <div className="request-form-container">
            <h2 className="Sign-Up-Page-Header">{eventType} Details</h2>
            <form onSubmit={handleSubmit}>
                {/* Event Title */}
                <div className="form-floating request-form mb-3">
                    <input
                        type="text"
                        name="eventTitle"
                        placeholder='Event Title'
                        value={details.eventTitle}
                        onChange={handleChange}
                        className="form-control"
                    />
                    <label htmlFor="eventTitle">Title</label>
                </div>

                {/* Location */}
                <div className="form-floating request-form mb-3">
                    
                    <input
                        type="text"
                        name="location"
                        placeholder='Location'
                        value={details.location}
                        onChange={handleChange}
                        className="form-control"
                    />
                    <label htmlFor='location'>Location</label>
                </div>

                {/* Date Type (Specific Date or Date Range) */}
                <div className="form-floating request-form mb-3">
                    
                    <select
                        name="dateType"
                        placeholder="Date Type"
                        value={details.dateType}
                        onChange={handleChange}
                        className="form-control"
                    >
                        <option value="specific">Specific Date</option>
                        <option value="range">Date Range</option>
                    </select>
                    <label htmlFor='dateType'>Date Type</label>
                </div>

                {/* Start Date */}
                <div className="form-floating request-form mb-3">
                    
                    <input
                        type="date"
                        name="startDate"
                        value={details.startDate}
                        onChange={handleChange}
                        className="form-control"
                    />
                    <label>{details.dateType === 'range' && 'Start'} Date</label>
                </div>

                {/* End Date (only show if dateType is range) */}
                {details.dateType === 'range' && (
                    <div className="form-floating request-form mb-3">
                        
                        <input
                            type="date"
                            name="endDate"
                            value={details.endDate}
                            onChange={handleChange}
                            className="form-control"
                        />
                        <label>End Date</label>
                    </div>
                    
                )}

                {/* Time of Day */}
                <div className="form-floating request-form mb-3">
                    
                    <input
                        type="time"
                        name="timeOfDay"
                        value={details.timeOfDay}
                        onChange={handleChange}
                        className="form-control"
                    />
                    <label>Time of Day</label>
                </div>

                {/* Number of People */}
                <div className="form-floating request-form mb-3">
                    
                    <input
                        type="number"
                        name="numPeople"
                        placeholder='Number of People'
                        value={details.numPeople}
                        onChange={handleChange}
                        className="form-control"
                    />
                    <label>Number of People</label>
                </div>

                {/* Duration */}
                <div className="form-floating request-form mb-3">
                    
                    <input
                        type="number"
                        name="duration"
                        placeholder='Duration'
                        value={details.duration}
                        onChange={handleChange}
                        className="form-control"
                    />
                    <label>Duration (in hours)</label>
                </div>

                {/* Indoor or Outdoor */}
                <div className="form-floating request-form mb-3">
                    
                    <select
                        name="indoorOutdoor"
                        value={details.indoorOutdoor}
                        onChange={handleChange}
                        className="form-control"
                    >
                        <option value="">Select</option>
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                    </select>
                    <label>Indoor/Outdoor</label>
                </div>

                {/* Additional Comments */}
                <div className="form-floating request-form mb-3">
                    
                    <textarea
                        name="additionalComments"
                        placeholder='Additional Comments'
                        value={details.additionalComments}
                        onChange={handleChange}
                        className="form-control"
                    />
                    <label>Additional Comments</label>
                </div>

                
                <div className='form-button-container'>
                <button className="btn btn-primary mt-4" onClick={handleBack}>
                    Back
                </button>
                <button className="btn btn-secondary mt-4" type="submit">Next</button>
            </div>
            </form>
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
                    >
                        <i className="fas fa-phone-alt me-2" style={{rotate:'90deg'}}></i>
                        Schedule a Free Consultation Call
                    </button>

            </div>
        </div>
    );
}

export default EventDetails;
