import React from 'react';
import { useNavigate } from 'react-router-dom';


function ServiceDetails({ formData, setServiceDetails, nextStep }) {
    const navigate = useNavigate();

    const handleChange = (e) => {
        setServiceDetails({ ...formData, [e.target.name]: e.target.value });
    };

    // Capitalize category name with spaces instead of hyphens
    const formattedCategory = formData.category
        ? formData.category.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
        : '';

    return (
        <div className="form-container">
            <h2>{formattedCategory} Details</h2>
            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                <div className="form-group">
                    <label>Service Title</label>
                    <input
                        type="text"
                        name="serviceTitle"
                        value={formData.serviceTitle || ""}
                        onChange={handleChange}
                        className="form-control"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={handleChange}
                        className="form-control"
                    ></textarea>
                </div>
                <div className="form-group">
                    <label>Budget</label>
                    <input
                        type="text"
                        name="budget"
                        value={formData.budget || ""}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                <div className="form-button-container">
                    <button type="button" onClick={() => navigate('/request-categories')} className="btn btn-primary mt-3">Back</button>
                    <button type="submit" className="btn btn-secondary mt-3">
                        Next
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ServiceDetails;