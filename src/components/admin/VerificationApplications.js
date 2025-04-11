import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Modal, Button } from 'react-bootstrap';

const VerificationApplications = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      console.log('Fetching applications...'); // Debug log

      const { data, error } = await supabaseAdmin
        .from('verification_applications')
        .select(`
          *,
          business_profiles!business_id (
            business_name,
            phone
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('Response:', { data, error }); // Debug log

      if (error) {
        console.error('Error fetching applications:', error);
        throw error;
      }

      if (data) {
        console.log('Applications found:', data.length); // Debug log
        setApplications(data);
      }
    } catch (error) {
      console.error('Error in fetchApplications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplication = async (applicationId, businessId, approved) => {
    try {
      // Begin transaction
      // 1. Update application status
      const { error: updateError } = await supabaseAdmin
        .from('verification_applications')
        .update({ 
          status: approved ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // 2. Update business profile
      const { error: profileError } = await supabaseAdmin
        .from('business_profiles')
        .update({ 
          verification_pending: false,
          membership_tier: approved ? 'Verified' : 'Basic',
          verified_at: approved ? new Date().toISOString() : null
        })
        .eq('id', businessId);

      if (profileError) throw profileError;

      // Find the business in our current applications
      const application = applications.find(app => app.id === applicationId);
      const businessData = {
        business_name: application.business_profiles.business_name,
        phone: application.business_profiles.phone
      };

      // Show modal with business details
      setSelectedBusiness(businessData);
      setIsApproved(approved);
      setShowModal(true);

      // Refresh applications list
      fetchApplications();
    } catch (error) {
      console.error('Error processing application:', error);
      alert('Error processing application');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBusiness(null);
  };

  const handleTextClick = () => {
    if (selectedBusiness?.phone) {
      // Format phone number for SMS link
      const formattedPhone = selectedBusiness.phone.replace(/\D/g, '');
      const message = isApproved 
        ? `Congratulations! Your verification application for ${selectedBusiness.business_name} has been approved! If you have any questions please let us know! - The Bidi Team`
        : `We've reviewed your verification application for ${selectedBusiness.business_name} on Bidi. Unfortunately, we cannot verify your business at this time.`;
      
      // Open default SMS app with pre-filled message
      window.open(`sms:${formattedPhone}?body=${encodeURIComponent(message)}`);
    }
  };

  return (
    <div className="verification-applications mt-4">
      <h3 className="mb-4">Pending Verification Applications</h3>
      {isLoading ? (
        <div>Loading applications...</div>
      ) : applications.length === 0 ? (
        <p>No pending applications</p>
      ) : (
        <div className="row">
          {applications.map((app) => (
            <div key={app.id} className="col-md-6 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">
                    {app.business_profiles?.business_name || 'Unknown Business'}
                  </h5>
                  <div className="application-details">
                    <p><strong>Years in Business:</strong> {app.years_in_business}</p>
                    <p><strong>Completed Events:</strong> {app.completed_events}</p>
                    <p><strong>Registered in Utah:</strong> {app.registered_in_utah ? 'Yes' : 'No'}</p>
                    <p><strong>Has Insurance:</strong> {app.has_insurance ? 'Yes' : 'No'}</p>
                    
                    {app.portfolio_url && (
                      <p>
                        <strong>Portfolio:</strong>{' '}
                        <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer">View Portfolio</a>
                      </p>
                    )}
                    
                    {app.instagram_handle && (
                      <p>
                        <strong>Instagram:</strong>{' '}
                        <a href={`https://instagram.com/${app.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                          {app.instagram_handle}
                        </a>
                      </p>
                    )}
                    
                    {app.reviews_url && (
                      <p>
                        <strong>Reviews:</strong>{' '}
                        <a href={app.reviews_url} target="_blank" rel="noopener noreferrer">View Reviews</a>
                      </p>
                    )}

                    {app.insurance_document_url && (
                      <p>
                        <strong>Insurance Document:</strong>{' '}
                        <a href={app.insurance_document_url} target="_blank" rel="noopener noreferrer">View Document</a>
                      </p>
                    )}
                    
                    <div className="mt-3 d-flex justify-content-between">
                      <button
                        className="btn btn-success"
                        onClick={() => handleApplication(app.id, app.business_id, true)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleApplication(app.id, app.business_id, false)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            Application {isApproved ? 'Approved' : 'Rejected'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {selectedBusiness?.business_name} has been {isApproved ? 'approved' : 'rejected'}.
            Would you like to send them a text notification?
          </p>
          {selectedBusiness?.phone ? (
            <Button 
              onClick={handleTextClick}
              variant="primary"
              className="w-100"
              style={{
                backgroundColor: '#A328F4',
                border: 'none',
                fontFamily: 'Outfit',
                fontWeight: '600'
              }}
            >
              📱 Text {selectedBusiness.business_name}
            </Button>
          ) : (
            <p className="text-muted">No phone number available for this business.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleCloseModal}
            style={{
              fontFamily: 'Outfit',
              fontWeight: '600'
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VerificationApplications;
