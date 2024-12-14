import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import SignInModal from './SignInModal';

function EventDetails({ eventType, setEventDetails }) {
    const [details, setDetails] = useState(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        return savedForm.eventDetails || {
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
        };
    });
    
    const [isModalOpen, setIsModalOpen] = useState(false);  // Modal state
    const navigate = useNavigate();
    const formRef = useRef(null);

    const handleChange = (e) => {
        const newDetails = { ...details, [e.target.name]: e.target.value };
        setDetails(newDetails);
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        localStorage.setItem('photographyRequest', JSON.stringify({
            ...savedForm,
            eventDetails: newDetails
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        // Check if user is signed in
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // Save the form data temporarily (localStorage or sessionStorage)
            localStorage.setItem('eventDetails', JSON.stringify(details));

            // Open the sign-in modal
            setIsModalOpen(true);
        } else {
            // User is signed in, proceed with setting the event details
            setEventDetails(details);
            navigate('/personal-details');  // Proceed to personal details page
        }
    };

    const handleBack = () => {
        navigate('/select-event');  // Adjust the route for going back
    };

    return (
        <div style={{display:'flex', flexDirection:'row', gap:'64px', justifyContent:'center', alignItems:'center',height:'85vh'}}>
             {/* Render the SignInModal if isModalOpen is true */}
             {/* Modal: Display only if isModalOpen is true */}
            {isModalOpen && (
                <>
                    {console.log('Rendering modal...')}
                    <SignInModal setIsModalOpen={setIsModalOpen} />
                </>
            )}
            <div className='request-form-status-container'>
                <div className='status-bar-container'>
                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    01
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    02
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    03
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    04
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    05
                    </div>
                    
                </div>
                <div className='status-text-container'>
                    <div className='status-text'>Service Details</div>
                    <div className='status-text'>Personal Details</div>
                    <div className='status-text'>Add Photos</div>
                    <div className='status-text'>Review</div>
                    <div className='status-text'>Submit</div>
                </div>
            </div>
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <h2 className="request-form-header" style={{textAlign:'left',marginLeft:"20px"}}>{eventType} Details</h2>
                <div className="form-scrollable-content">
                <form ref={formRef} style={{minWidth:'100%'}}onSubmit={handleSubmit}>
                    <div className='form-grid' style={{}}>
                        {/* Event Title */}
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="eventTitle"
                                value={details.eventTitle}
                                onChange={handleChange}
                                className="custom-input"
                                id="eventTitle"
                            />
                            <label htmlFor="eventTitle" className="custom-label">
                                Title
                            </label>
                        </div>
                        
                        {/* Location */}
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="location"

                                value={details.location}
                                onChange={handleChange}
                                className="custom-input"
                            />
                            <label htmlFor='location' className="custom-label">
                                Location
                            </label>
                        </div>
                    </div>

                    <div className='non-grid-form'>
                        {/* Date Type (Specific Date or Date Range) */}
                        <div className="custom-input-container">
                            <select
                                name="dateType"

                                value={details.dateType}
                                onChange={handleChange}
                                className="custom-input"
                                style={{height:'56px'}}
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                            </select>
                            <label htmlFor="dateType" className="custom-label">
                                Date Type
                            </label>
                        </div>
                    </div>

                    <div className='form-grid'>
                        {/* Start Date */}
                        <div className="custom-input-container">
                            <input
                                type="date"
                                name="startDate"
                                value={details.startDate}
                                onChange={handleChange}
                                className="custom-input"
                            />
                            <label htmlFor="startDate" className="custom-label">
                                {details.dateType === 'range' ? 'Start Date' : 'Date'}
                            </label>
                        </div>

                        {/* End Date (only show if dateType is range) */}
                        {details.dateType === 'range' && (
                            <div className="custom-input-container">
                                <input
                                    type="date"
                                    name="endDate"
                                    value={details.endDate || ''}
                                    onChange={handleChange}
                                    className="custom-input"
                                />
                                <label htmlFor="endDate" className="custom-label">
                                    End Date
                                </label>
                            </div>
                        )}

                        {/* Time of Day */}
                        <div className="custom-input-container">
                            <input
                                type="time"
                                name="timeOfDay"
                                value={details.timeOfDay}
                                onChange={handleChange}
                                className="custom-input"
                            />
                            <label htmlFor="timeOfDay" className="custom-label">
                                Time of Day
                            </label>
                        </div>

                        {/* Number of People */}
                        <div className="custom-input-container">
                            <input
                                type="number"
                                name="numPeople"
                                value={details.numPeople}
                                onChange={handleChange}
                                className="custom-input"
                            />
                            <label htmlFor="numPeople" className="custom-label">
                                Number of People
                            </label>
                        </div>

                        {/* Duration */}
                        <div className="custom-input-container">
                            <input
                                type="number"
                                name="duration"
                                value={details.duration}
                                onChange={handleChange}
                                className="custom-input"
                            />
                            <label htmlFor="duration" className="custom-label">
                                Duration (in hours)
                            </label>
                        </div>

                        {/* Indoor or Outdoor */}
                        <div className="custom-input-container">
                            <select
                                name="indoorOutdoor"
                                value={details.indoorOutdoor}
                                onChange={handleChange}
                                className="custom-input"

                            >
                                <option value="">Select</option>
                                <option value="indoor">Indoor</option>
                                <option value="outdoor">Outdoor</option>
                            </select>
                            <label htmlFor="indoorOutdoor" className="custom-label">
                                Indoor/Outdoor
                            </label>
                        </div>
                    </div>

                    {/* Additional Comments */}
                    <div className='non-grid-form'>
                        <div className="custom-input-container">
                            <textarea
                                name="additionalComments"
                                value={details.additionalComments}
                                onChange={handleChange}
                                className="custom-input"
                                style={{height:'120px'}}
                            />
                            <label htmlFor="additionalComments" className="custom-label">
                                Additional Comments
                            </label>
                        </div> 
                    </div>
                </form>
                </div>
                <div className="form-button-container">
                    <button type="button"className="request-form-back-and-foward-btn" onClick={handleBack} style={{color:"black"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                        </svg>
                        Back
                    </button>
                    <button
                    type='button'
                    className='request-form-back-and-foward-btn'
                    style={{color:'black'}}
                    onClick={() => formRef.current.requestSubmit()}
                    >
                        Next
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"

                        >
                            <path d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z" />
                        </svg>
                    </button>
                </div>
            </div>
           
        </div>
    );
}



export default EventDetails;
