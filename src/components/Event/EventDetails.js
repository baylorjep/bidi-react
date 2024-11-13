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
        navigate('/event-photos');  // Navigate to the photo upload stage
    };

    const handleBack = () => {
        navigate('/select-event');  // Adjust the route for going back
    };

    return (
        <div style={{display:'flex', flexDirection:'row', gap:'64px', justifyContent:'center', alignItems:'center',height:'85vh'}}>
            <div className='request-form-status-container'>
                <div className='status-bar-container'>
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="300" stroke="black" strokeWidth="2" />
                    </svg>
                    
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
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
                    <div className='status-text'>Type of Service</div>
                    <div className='status-text'>Service Details</div>
                    <div className='status-text'>Add Photos</div>
                    <div className='status-text'>Personal Details</div>
                    <div className='status-text'>Submit</div>
                </div>
            </div>
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <h2 className="request-form-header" style={{textAlign:'left', marginBottom:'40px',marginLeft:"20px"}}>{eventType} Details</h2>
                <form style={{minWidth:'100%'}}onSubmit={handleSubmit}>
                    <div className="form-grid">
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
                    </div>
                    <div className='non-grid-form'>
                        {/* Date Type (Specific Date or Date Range) */}
                        <div className="select-container form-floating request-form mb-3">
                            
                            <select
                                name="dateType"
                                placeholder="Date Type"
                                value={details.dateType}
                                onChange={handleChange}
                                className="form-control date-type-select"
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                            </select>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="10" viewBox="0 0 16 10" fill="none" className="select-arrow">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.06066 9.06068C8.47487 9.64646 7.52513 9.64646 6.93934 9.06068L1.28249 3.40382C0.696699 2.81804 0.696699 1.86829 1.28248 1.2825C1.86827 0.696717 2.81802 0.696717 3.40381 1.2825L8 5.8787L12.5962 1.2825C13.182 0.696716 14.1317 0.696716 14.7175 1.2825C15.3033 1.86829 15.3033 2.81804 14.7175 3.40382L9.06066 9.06068Z" fill="black"/>
                            </svg>
                            <label htmlFor="dateType">Date Type</label>
                        </div>
                        
                    </div>

                    
                    <div className='form-grid'>
                        {/* Start Date */}
                        <div className="form-floating request-form mb-3">
                            <input
                                type="date"
                                name="startDate"
                                value={details.startDate}
                                onChange={handleChange}
                                className="form-control"
                            />
                            <label>{details.dateType === 'range' ? 'Start Date' : 'Date'}</label>
                        </div>

                        {/* End Date (only show if dateType is range) */}
                        {details.dateType === 'range' ? (
                            <div className="form-floating request-form mb-3">
                                <input
                                    type="date"
                                    name="endDate"
                                    value={details.endDate || ''}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                                <label>End Date</label>
                            </div>
                        ) : (
                            // Empty space for "Specific Date"
                            <div className="mb-3 col-6">
                                <div className="empty-date"></div>
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

                    </div>
                    {/* Additional Comments (outside the grid) */}
                <div className='non-grid-form'>
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
                </div>


                    <div className="form-button-container">
                <button className="request-form-back-and-foward-btn" onClick={handleBack} style={{color:"black"}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                    </svg>
                    Back
                </button>
                <button
                type='submit'
                className='request-form-back-and-foward-btn'
                style={{color:'black'}}
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
                </form>
            </div>

        </div>
    );
}

export default EventDetails;
