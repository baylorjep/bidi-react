import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import SignInModal from '../Event/SignInModal';

function AdditionalComments({ formData, setAdditionalComments, nextStep, prevStep, currentStep }) {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setIsModalOpen(true);
            return;
        }

        nextStep();
    };

    return (
        <div className="request-form-overall-container">
            {isModalOpen && <SignInModal setIsModalOpen={setIsModalOpen} />}
            
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
                                {`0${index + 1}`}
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

            <div className="request-form-container-details" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="request-form-header" style={{ marginTop: '40px' }}>Additional Comments</div>

                <div className="form-container">
                    <form onSubmit={handleSubmit}>
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
                            >

                                Back
                            </button>
                            <button
                                type="submit"
                                className="request-form-back-and-foward-btn"

                            >
                                Next

                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdditionalComments;