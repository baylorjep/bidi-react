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
            ...savedData,
            category: category // Add this line to ensure category is included
        };
    });

    const updateFormData = (newData) => {
        console.log('Updating form data with:', newData); // Add this
        const updatedData = { ...formData, ...newData };
        console.log('Updated form data:', updatedData); // Add this
        setFormData(updatedData);
        localStorage.setItem('requestFormData', JSON.stringify(updatedData));
    };

    const nextStep = () => setCurrentStep(prevStep => prevStep + 1);
    const prevStep = () => setCurrentStep(prevStep => prevStep - 1);

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <ServiceDetails formData={formData} setServiceDetails={updateFormData} nextStep={nextStep} />;
            case 2:
                return <DateAndTime formData={formData} setDateDetails={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 3:
                return <LocationDetails formData={formData} setLocationDetails={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 4:
                return <AdditionalComments formData={formData} setAdditionalComments={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 5:
                return <PersonalDetails formData={formData} setPersonalDetails={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 6:
                return <EventPhotos 
                    formData={formData} 
                    setFormPhotos={photos => updateFormData({photos})} // Changed from setPhotos
                    nextStep={nextStep} 
                    prevStep={prevStep} 
                />;
            case 7:
                return <SummaryPage formData={formData} photos={formData.photos} prevStep={prevStep} />;
            default:
                return null;
        }
    };

    return (
        <div className="container">
            {renderStep()}
        </div>
    );
}

export default MultiStepRequestForm;