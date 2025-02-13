import React, { useState } from "react";

function TestEmail() {
    const [formData, setFormData] = useState({
        title: "", 
        category: "", 
        location: "",
        start_date: "",
        end_date: "",
        details: ""
    });
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("https://bidi-express.vercel.app/trigger-autobid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    request_id: "test-request-123", // Static ID for testing
                    title: formData.title,
                    category: formData.category,
                    location: formData.location,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    details: formData.details
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to trigger auto-bidding.");
            }

            setSuccessMessage(`Auto-bidding triggered successfully!`);
            setFormData({ title: "", category: "", location: "", start_date: "", end_date: "", details: "" });
        } catch (error) {
            setErrorMessage(`Error triggering auto-bidding: ${error.message}`);
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <h2 className="text-center">Test Auto-Bidding</h2>
                {successMessage && <p className="text-success">{successMessage}</p>}
                {errorMessage && <p className="text-danger">{errorMessage}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-floating mb-3">
                        <input className="form-control" id="title" name="title" type="text" placeholder="Request Title"
                            value={formData.title} onChange={handleChange} required />
                        <label htmlFor="title">Request Title</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input className="form-control" id="category" name="category" type="text" placeholder="Category"
                            value={formData.category} onChange={handleChange} required />
                        <label htmlFor="category">Category</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input className="form-control" id="location" name="location" type="text" placeholder="Location"
                            value={formData.location} onChange={handleChange} required />
                        <label htmlFor="location">Location</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input className="form-control" id="start_date" name="start_date" type="date"
                            value={formData.start_date} onChange={handleChange} required />
                        <label htmlFor="start_date">Start Date</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input className="form-control" id="end_date" name="end_date" type="date"
                            value={formData.end_date} onChange={handleChange} required />
                        <label htmlFor="end_date">End Date</label>
                    </div>
                    <div className="form-floating mb-3">
                        <textarea className="form-control" id="details" name="details" placeholder="Request Details"
                            value={formData.details} onChange={handleChange} required />
                        <label htmlFor="details">Request Details</label>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Trigger Auto-Bid</button>
                </form>
            </div>
        </div>
    );
}

export default TestEmail;