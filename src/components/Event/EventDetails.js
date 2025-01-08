import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import SignInModal from './SignInModal';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ]
};

const formats = [
  'header',
  'bold', 'italic', 'underline',

  'blockquote', 'code-block',
  'list', 'bullet'
];

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
    const currentStep = 1

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
        
        const { data: { session } } = await supabase.auth.getSession();

        // Store the source
        localStorage.setItem('requestSource', 'photography');

        if (!session) {
            localStorage.setItem('eventDetails', JSON.stringify(details));
            setIsModalOpen(true);
        } else {
            setEventDetails(details);
            navigate('/personal-details', { 
                state: { 
                    from: 'event-details',
                    source: 'photography',
                    eventDetails: details 
                } 
            });
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
            <div className="request-form-status-container">
                <div className="status-bar-container">
                    {Array.from({ length: 5 }, (_, index) => (
                        <React.Fragment key={index}>
                            <div
                                className={`status-check-container ${
                                    index + 1 === currentStep
                                        ? 'active'
                                        : index + 1 < currentStep
                                        ? 'completed'
                                        : ''
                                }`}
                            >
                                {index + 1 < currentStep ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 25"
                                        fill="none"
                                        style={{ transform: 'rotate(-90deg)' }} // Rotating to vertical
                                    >
                                        <path
                                            d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z"
                                            fill="white"
                                        />
                                    </svg>
                                ) : (
                                    `0${index + 1}`
                                )}
                            </div>
                            {index < 4 && (
                                <div
                                    className={`status-line ${
                                        index + 1 < currentStep ? 'completed' : ''
                                    }`}
                                ></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="status-text-container">
                    {['Service Details', 'Personal Details', 'Add Photos', 'Review', 'Submit'].map(
                        (text, index) => (
                            <div
                                className={`status-text ${
                                    index + 1 === currentStep ? 'active' : ''
                                }`}
                                key={index}
                            >
                                {text}
                            </div>
                        )
                    )}
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
                            <ReactQuill 
                                theme="snow"
                                value={details.additionalComments}
                                onChange={(content) => handleChange({
                                    target: {
                                        name: 'additionalComments',
                                        value: content
                                    }
                                })}
                                modules={modules}
                                formats={formats}
                                style={{
                                    height: '200px',
                                    marginBottom: '50px'
                                }}
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
