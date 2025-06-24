import React, { useState } from 'react';

function TestEmail() {
    const [formData, setFormData] = useState({
        request_id: '',
        business_id: '',
        category: 'photography'
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [trainingResults, setTrainingResults] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('https://bidi-express.vercel.app/trigger-autobid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: formData.request_id, // Send request ID
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to trigger auto-bidding.');
            }

            setSuccessMessage(`Auto-bidding triggered successfully for Request ID: ${formData.request_id}`);
            setFormData({ ...formData, request_id: '' }); // Clear only the request_id
        } catch (error) {
            setErrorMessage(`Error triggering auto-bidding: ${error.message}`);
        }
    };

    const testTrainingDataRetrieval = async () => {
        try {
            setTrainingResults('Testing training data retrieval...\n');
            
            const response = await fetch(`https://bidi-express.vercel.app/api/autobid/training-data/${formData.business_id}/${formData.category}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to retrieve training data.');
            }

            const data = await response.json();
            setTrainingResults(prev => prev + `✅ Training data retrieved successfully!\n`);
            setTrainingResults(prev => prev + `📊 Data: ${JSON.stringify(data, null, 2)}\n`);
        } catch (error) {
            setTrainingResults(prev => prev + `❌ Error: ${error.message}\n`);
        }
    };

    const testSampleBidGeneration = async () => {
        try {
            setTrainingResults('Testing sample bid generation...\n');
            
            const response = await fetch('https://bidi-express.vercel.app/api/autobid/generate-sample-bid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: formData.business_id,
                    category: formData.category,
                    request_data: {
                        date: "2024-08-15",
                        duration: "8 hours",
                        location: "Salt Lake City, UT",
                        event_type: "wedding",
                        guest_count: 150,
                        requirements: ["Full day coverage", "Online gallery", "Print release"]
                    }
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate sample bid.');
            }

            const data = await response.json();
            setTrainingResults(prev => prev + `✅ Sample bid generated successfully!\n`);
            setTrainingResults(prev => prev + `💰 Generated Bid: ${JSON.stringify(data, null, 2)}\n`);
        } catch (error) {
            setTrainingResults(prev => prev + `❌ Error: ${error.message}\n`);
        }
    };

    const testTrainingStatus = async () => {
        try {
            setTrainingResults('Testing training status...\n');
            
            const response = await fetch(`https://bidi-express.vercel.app/api/autobid/training-status/${formData.business_id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get training status.');
            }

            const data = await response.json();
            setTrainingResults(prev => prev + `✅ Training status retrieved successfully!\n`);
            setTrainingResults(prev => prev + `📈 Status: ${JSON.stringify(data, null, 2)}\n`);
        } catch (error) {
            setTrainingResults(prev => prev + `❌ Error: ${error.message}\n`);
        }
    };

    const testTrainingFeedback = async () => {
        try {
            setTrainingResults('Testing training feedback submission...\n');
            
            const response = await fetch('https://bidi-express.vercel.app/api/autobid/training-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: formData.business_id,
                    category: formData.category,
                    sample_bid_id: 'test-bid-123',
                    approved: true,
                    feedback: 'Great pricing and description style!',
                    suggested_changes: 'Maybe add more detail about equipment'
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit training feedback.');
            }

            const data = await response.json();
            setTrainingResults(prev => prev + `✅ Training feedback submitted successfully!\n`);
            setTrainingResults(prev => prev + `💬 Response: ${JSON.stringify(data, null, 2)}\n`);
        } catch (error) {
            setTrainingResults(prev => prev + `❌ Error: ${error.message}\n`);
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-8">
                <h2 className="text-center mb-4">Testing Tools</h2>
                
                {/* Auto-bid Trigger Section */}
                <div className="card mb-4">
                    <div className="card-header">
                        <h4>Trigger Auto-Bid by Request ID</h4>
                    </div>
                    <div className="card-body">
                        {successMessage && <p className="text-success">{successMessage}</p>}
                        {errorMessage && <p className="text-danger">{errorMessage}</p>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-floating mb-3">
                                <input
                                    className="form-control"
                                    id="request_id"
                                    name="request_id"
                                    type="text"
                                    placeholder="Enter Request ID"
                                    value={formData.request_id}
                                    onChange={handleChange}
                                    required
                                />
                                <label htmlFor="request_id">Enter Request ID</label>
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Trigger Auto-Bid</button>
                        </form>
                    </div>
                </div>

                {/* Training API Test Section */}
                <div className="card">
                    <div className="card-header">
                        <h4>Test Training API Endpoints</h4>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <div className="form-floating mb-3">
                                    <input
                                        className="form-control"
                                        id="business_id"
                                        name="business_id"
                                        type="text"
                                        placeholder="Enter Business ID"
                                        value={formData.business_id}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label htmlFor="business_id">Business ID</label>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-floating mb-3">
                                    <select
                                        className="form-control"
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        <option value="photography">Photography</option>
                                        <option value="videography">Videography</option>
                                        <option value="florist">Florist</option>
                                        <option value="beauty">Beauty</option>
                                        <option value="dj">DJ</option>
                                        <option value="wedding planning">Wedding Planning</option>
                                        <option value="catering">Catering</option>
                                        <option value="cake">Cake</option>
                                    </select>
                                    <label htmlFor="category">Category</label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="row">
                            <div className="col-md-6">
                                <button 
                                    type="button" 
                                    className="btn btn-info w-100 mb-2"
                                    onClick={testTrainingDataRetrieval}
                                >
                                    Test Training Data Retrieval
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-success w-100 mb-2"
                                    onClick={testSampleBidGeneration}
                                >
                                    Test Sample Bid Generation
                                </button>
                            </div>
                            <div className="col-md-6">
                                <button 
                                    type="button" 
                                    className="btn btn-warning w-100 mb-2"
                                    onClick={testTrainingStatus}
                                >
                                    Test Training Status
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary w-100 mb-2"
                                    onClick={testTrainingFeedback}
                                >
                                    Test Training Feedback
                                </button>
                            </div>
                        </div>
                        
                        {trainingResults && (
                            <div className="mt-3">
                                <h5>Training Test Results:</h5>
                                <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap', fontSize: '14px', maxHeight: '400px', overflowY: 'auto' }}>
                                    {trainingResults}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TestEmail;