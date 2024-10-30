import React from 'react';

function AdditionalComments({ formData, setAdditionalComments, nextStep, prevStep }) {
    const handleChange = (e) => {
        setAdditionalComments({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="form-container">
            <h2>Additional Comments</h2>
            <form>
                <div className="form-group">
                    <label>Comments (optional)</label>
                    <textarea
                        name="additionalComments"
                        value={formData.additionalComments || ""}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Enter any additional information or special requests here."
                    ></textarea>
                </div>
                <div className="form-button-container">
                    <button type="button" onClick={prevStep} className="btn btn-primary mt-3">Back</button>
                    <button type="button" onClick={nextStep} className="btn btn-secondary mt-3">Next</button>
                </div>
            </form>
        </div>
    );
}

export default AdditionalComments;