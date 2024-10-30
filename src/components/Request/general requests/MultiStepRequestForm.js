import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ServiceDetails from './ServiceDetails';
import DateAndTime from './DateandTime';
import LocationDetails from './Location';
import AdditionalComments from './AdditionalComments';
import SummaryPage from './ServiceSummary';

function MultiStepRequestForm() {
    const location = useLocation();
    const category = location.state?.category || 'General';

    const [formData, setFormData] = useState({
        category,
        serviceTitle: '',
        description: '',
        budget: '',
        startDate: '',
        endDate: '',
        timeOfDay: '',
        location: '',
        additionalComments: ''
    });
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();

    const updateFormData = (newData) => {
        setFormData(prevData => ({ ...prevData, ...newData }));
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
                />
            )}
            {currentStep === 5 && (
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