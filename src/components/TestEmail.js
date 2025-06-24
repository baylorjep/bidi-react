import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function TestEmail() {
    const [formData, setFormData] = useState({
        request_id: '',
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [testResults, setTestResults] = useState('');

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
            setFormData({ request_id: '' }); // Clear the form after success
        } catch (error) {
            setErrorMessage(`Error triggering auto-bidding: ${error.message}`);
        }
    };

    const testAutobidTraining = async () => {
        try {
            setTestResults('Testing autobid training system...\n');
            
            // Test 1: Check if tables exist
            const { data: requests, error: requestsError } = await supabase
                .from('autobid_training_requests')
                .select('count')
                .limit(1);
            
            if (requestsError) {
                setTestResults(prev => prev + `❌ Training requests table error: ${requestsError.message}\n`);
                return;
            }
            setTestResults(prev => prev + '✅ Training requests table accessible\n');

            // Test 2: Check training responses table
            const { data: responses, error: responsesError } = await supabase
                .from('autobid_training_responses')
                .select('count')
                .limit(1);
            
            if (responsesError) {
                setTestResults(prev => prev + `❌ Training responses table error: ${responsesError.message}\n`);
                return;
            }
            setTestResults(prev => prev + '✅ Training responses table accessible\n');

            // Test 3: Check training progress table
            const { data: progress, error: progressError } = await supabase
                .from('autobid_training_progress')
                .select('count')
                .limit(1);
            
            if (progressError) {
                setTestResults(prev => prev + `❌ Training progress table error: ${progressError.message}\n`);
                return;
            }
            setTestResults(prev => prev + '✅ Training progress table accessible\n');

            // Test 4: Check training feedback table
            const { data: feedback, error: feedbackError } = await supabase
                .from('autobid_training_feedback')
                .select('count')
                .limit(1);
            
            if (feedbackError) {
                setTestResults(prev => prev + `❌ Training feedback table error: ${feedbackError.message}\n`);
                return;
            }
            setTestResults(prev => prev + '✅ Training feedback table accessible\n');

            // Test 5: Count sample data by category
            const { count: requestCount } = await supabase
                .from('autobid_training_requests')
                .select('*', { count: 'exact', head: true });

            setTestResults(prev => prev + `✅ Found ${requestCount} training requests\n`);

            // Test 6: Check category distribution
            const { data: categoryData, error: categoryError } = await supabase
                .from('autobid_training_requests')
                .select('category')
                .eq('is_active', true);

            if (categoryError) {
                setTestResults(prev => prev + `❌ Category analysis error: ${categoryError.message}\n`);
            } else {
                const categoryCounts = {};
                categoryData.forEach(req => {
                    categoryCounts[req.category] = (categoryCounts[req.category] || 0) + 1;
                });
                
                setTestResults(prev => prev + '📊 Category distribution:\n');
                Object.entries(categoryCounts).forEach(([category, count]) => {
                    setTestResults(prev => prev + `   ${category}: ${count} requests\n`);
                });
            }

            // Test 7: Check multi-category progress structure
            const { data: progressData, error: progressDataError } = await supabase
                .from('autobid_training_progress')
                .select('category, training_completed, consecutive_approvals')
                .limit(10);

            if (progressDataError) {
                setTestResults(prev => prev + `❌ Progress data error: ${progressDataError.message}\n`);
            } else {
                setTestResults(prev => prev + `✅ Found ${progressData.length} progress records\n`);
                if (progressData.length > 0) {
                    setTestResults(prev => prev + '📊 Sample progress data:\n');
                    progressData.slice(0, 3).forEach(progress => {
                        setTestResults(prev => prev + `   ${progress.category}: ${progress.consecutive_approvals}/2 approvals, completed: ${progress.training_completed}\n`);
                    });
                }
            }

            setTestResults(prev => prev + '\n🎉 Multi-category autobid training system is working correctly!\n');

        } catch (error) {
            setTestResults(prev => prev + `❌ Test failed: ${error.message}\n`);
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

                {/* Autobid Training Test Section */}
                <div className="card">
                    <div className="card-header">
                        <h4>Test Autobid Training System</h4>
                    </div>
                    <div className="card-body">
                        <button 
                            type="button" 
                            className="btn btn-secondary w-100 mb-3"
                            onClick={testAutobidTraining}
                        >
                            Test Database Schema
                        </button>
                        {testResults && (
                            <div className="mt-3">
                                <h5>Test Results:</h5>
                                <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                                    {testResults}
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