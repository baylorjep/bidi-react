import { request } from 'express';
import React from 'react';
import { useNavigate } from 'react-router-dom';


function ServiceDetails({ formData, setServiceDetails, nextStep }) {
    const navigate = useNavigate();

    const [requestType, setRequestType] = useState('');
    
    useEffect(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        const type = savedForm.requestType || '';
        setRequestType(type.charAt(0).toUpperCase() + type.slice(1));
    }, []);

    const handleChange = (e) => {
        setServiceDetails({ ...formData, [e.target.name]: e.target.value });
    };

    // Capitalize category name with spaces instead of hyphens
    const formattedCategory = formData.category
        ? formData.category.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
        : '';

    return (


            <div className='request-form-overall-container'>
        <div className='request-form-status-container'>
            <div className='status-bar-container'>
            <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                01
                </div>
                <svg width="25px" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>
                
                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                02
                </div>
                <svg width="25px"  xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>

                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                03
                </div>
                <svg width="25px"  xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>

                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                04
                </div>
                <svg width="25px" xmlns="http://www.w3.org/2000/svg">
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
        <div className="request-form-container-details" style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            <div className="request-form-header" style={{marginTop:'40px'}}>{requestType} Details</div>
            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
           
                <div className="custom-input-container">
                    
                    <input
                        className='custom-input'
                        id="serviceTitle"
                        name="serviceTitle"
                        type="text"
                        placeholder="Title of Service"
                        value={formData.serviceTitle}
                        onChange={handleChange}
                        required
                    />
                     <label className='custom-label'>Service Title</label>
                </div>
                <div className="custom-input-container">
                    
                    <textarea
                        name="description"
                        type="text"
                        value={formData.description || ""}
                        onChange={handleChange}
                        className="custom-input"
                    ></textarea>
                    <label className='custom-label'>Description</label>
                </div>
                <div className="custom-input-container">
                    
                    <input
                        type="text"
                        name="budget"
                        value={formData.budget || ""}
                        onChange={handleChange}
                        className="custom-input"
                    />
                    <label className='custom-label'>Budget</label>
                </div>
                <div className="form-button-container">
                    <button type="button" onClick={() => navigate('/request-categories')} className="btn btn-primary mt-3">Back</button>
                    <button type="submit" className="btn btn-secondary mt-3">
                        Next
                    </button>
                </div>
            </form>

            <div className="form-button-container">
                <button className="request-form-back-and-foward-btn"  style={{color:"black"}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                    </svg>
                    Back
                </button>
                <button
                    className={`request-form-back-and-foward-btn`}
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

export default ServiceDetails;