import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

function SummaryPage({ formData, prevStep }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Fetch the current user’s session
        const fetchUser = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setUser(data.session.user);
            }
        };
        fetchUser();
    }, []);

    const handleSubmit = async () => {
        const { error } = await supabase
            .from('requests')
            .insert([{
                user_id: user ? user.id : null,
                customer_email: user ? user.email : null,
                service_title: formData.serviceTitle,
                location: formData.location,
                service_category: formData.category,
                service_description: formData.description,
                service_date: formData.startDate, // Assuming startDate is the main date
                end_date: formData.endDate || null,
                time_of_day: formData.timeOfDay || 'TBD',
                price_range: formData.budget,
                additional_comments: formData.additionalComments || ''
            }]);

        if (error) {
            setErrorMessage(`Error submitting request: ${error.message}`);
        } else {
            navigate('/success-request');
        }
    };

    return (
        <div className="form-container">
            <h2>Summary of Your Request</h2>
            <p><strong>Service Title:</strong> {formData.serviceTitle}</p>
            <p><strong>Description:</strong> {formData.description}</p>
            <p><strong>Budget:</strong> {formData.budget}</p>
            <p><strong>Start Date:</strong> {formData.startDate}</p>
            {formData.endDate && <p><strong>End Date:</strong> {formData.endDate}</p>}
            <p><strong>Time of Day:</strong> {formData.timeOfDay || 'TBD'}</p>
            <p><strong>Location:</strong> {formData.location}</p>
            {formData.additionalComments && <p><strong>Additional Comments:</strong> {formData.additionalComments}</p>}

            {errorMessage && <p className="text-danger">{errorMessage}</p>}

            <div className="form-button-container">
                <button type="button" onClick={prevStep} className="btn btn-primary mt-3">Back</button>
                <button type="button" onClick={handleSubmit} className="btn btn-secondary mt-3">Submit</button>
            </div>
        </div>
    );
}

export default SummaryPage;