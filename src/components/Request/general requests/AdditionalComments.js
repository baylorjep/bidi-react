import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import SignInModal from '../../Event/SignInModal';

function AdditionalComments({ formData, setAdditionalComments, nextStep, prevStep }) {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleChange = (content) => {
        const updatedData = { 
            ...formData, 
            additionalComments: content 
        };
        setAdditionalComments(updatedData);
        localStorage.setItem('requestFormData', JSON.stringify(updatedData));
    };

    AdditionalComments.modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            ['clean']
        ],
    };

    AdditionalComments.formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet',
        'link'
    ];

    const handleNext = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            localStorage.setItem('additionalComments', formData.additionalComments);
            setIsModalOpen(true);
        } else {
            nextStep();
        }
    };

    return (
        <div className="request-form-overall-container">
            {isModalOpen && <SignInModal setIsModalOpen={setIsModalOpen} />}
            
            <div className="request-form-status-container">
                <div className="status-bar-container">
                    {Array.from({ length: 5 }, (_, index) => (
                        <React.Fragment key={index}>
                            <div
                                className="status-check-container"
                                style={{ background: "transparent", border: "2px solid gray" }}
                            >
                                {`0${index + 1}`}
                            </div>
                            {index < 4 && (
                                <svg width="25px" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                                </svg>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="status-text-container">
                    <div className="status-text">Service Details</div>
                    <div className="status-text">Personal Details</div>
                    <div className="status-text">Add Photos</div>
                    <div className="status-text">Review</div>
                    <div className="status-text">Submit</div>
                </div>
            </div>

            <div className="request-form-container-details" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="request-form-header" style={{ marginTop: '40px' }}>Additional comments</div>

                <div className="form-container">
                    <form>
                        <div className="custom-input-container">
                            <ReactQuill
                                theme="snow"
                                value={formData.additionalComments || ''}
                                onChange={handleChange}
                                modules={AdditionalComments.modules}
                                formats={AdditionalComments.formats}
                                placeholder="Enter any additional information or special requests here."
                            />
                            <label className="custom-label">Comments (optional)</label>
                        </div>

                        <div className="form-button-container">
                            <button 
                                type="button" 
                                onClick={prevStep} 
                                className="request-form-back-and-foward-btn"
                                style={{ color: "black" }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black" />
                                </svg>
                                Back
                            </button>
                            <button
                                className="request-form-back-and-foward-btn"
                                onClick={handleNext}
                                style={{ color: 'black' }}
                            >
                                Next
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                    <path d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}

export default AdditionalComments;