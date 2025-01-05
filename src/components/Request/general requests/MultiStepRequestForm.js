import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ServiceDetails from './ServiceDetails';
import DateAndTime from './DateandTime';
import LocationDetails from './Location';
import AdditionalComments from './AdditionalComments';
import PersonalDetails from '../../Event/PersonalDetails';
import EventPhotos from '../../Event/UploadPictures';
import SummaryPage from './ServiceSummary';


function MultiStepRequestForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const category = location.state?.category || 'General';
    const [currentStep, setCurrentStep] = useState(() => {
        return location.state?.currentStep || 1;
    });

    const [formData, setFormData] = useState(() => {
        const savedData = JSON.parse(localStorage.getItem('requestFormData') || '{}');
        return {
            ...savedData
        };
    });

    const updateFormData = (newData) => {
        const updatedData = { ...formData, ...newData };
        setFormData(updatedData);
        localStorage.setItem('requestFormData', JSON.stringify(updatedData));
    };

    const nextStep = () => setCurrentStep(prevStep => prevStep + 1);
    const prevStep = () => setCurrentStep(prevStep => prevStep - 1);

    const handleSubmit = async () => {
        // Send formData to your Supabase or backend endpoint here
        navigate('/success-request'); // Redirect after successful submission
    };

    return (
        <div className="container">
            {currentStep === 1 && (
                <ServiceDetails
                    formData={formData}
                    setServiceDetails={updateFormData}
                    nextStep={nextStep}
                />
            )}
            {currentStep === 2 && (
                <DateAndTime
                    formData={formData}
                    setDateDetails={updateFormData}
                    nextStep={nextStep}
                    prevStep={prevStep}
                />
            )}
            {currentStep === 3 && (
                <LocationDetails
                    formData={formData}
                    setLocationDetails={updateFormData}
                    nextStep={nextStep}
                    prevStep={prevStep}
                />
            )}
            {currentStep === 4 && (
                <AdditionalComments
                    formData={formData}
                    setAdditionalComments={updateFormData}
                    nextStep={nextStep}
                    prevStep={prevStep}
                    source="requestForm"  // This is where the source prop is set
                />
            )}
            {currentStep === 5 && (
                <PersonalDetails
                    formData={formData}
                    setPersonalDetails={updateFormData}
                    nextStep={nextStep}
                    prevStep={prevStep}
                    
                />
            )}
            {currentStep === 6 && (
                <EventPhotos
                    formData={formData}
                    setPersonalDetails={updateFormData}
                    nextStep={nextStep}
                    prevStep={prevStep}
                    
                />
            )}
            {currentStep === 7 && (
                <SummaryPage
                    formData={formData}
                    handleSubmit={handleSubmit}
                    prevStep={prevStep}
                />
            )}
        </div>
    );
}

export default MultiStepRequestForm;