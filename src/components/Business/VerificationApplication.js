import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../../App.css';
import './VerificationApplication.css'; // Add this line

const VerificationApplication = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    yearsInBusiness: '',
    completedEvents: '',
    portfolio: '',
    instagram: '',
    registeredInUtah: '',
    hasInsurance: '',
    insuranceFile: null,
    reviewsUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        insuranceFile: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let insuranceUrl = null;
      
      // Upload insurance document if provided
      if (formData.insuranceFile && formData.hasInsurance === 'yes') {
        // Create a folder with the user's ID
        const folderPath = `${user.id}`;
        const fileExt = formData.insuranceFile.name.split('.').pop();
        const fileName = `${folderPath}/${Date.now()}.${fileExt}`;

        // Upload the file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, formData.insuranceFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(fileName);
          
        insuranceUrl = publicUrl;
      }

      // Create verification application with updated field name
      const { error: insertError } = await supabase
        .from('verification_applications')
        .insert([{
          business_id: user.id,
          years_in_business: formData.yearsInBusiness,
          completed_events: formData.completedEvents,
          portfolio_url: formData.portfolio,
          instagram_handle: formData.instagram,
          registered_in_utah: formData.registeredInUtah === 'yes',
          has_insurance: formData.hasInsurance === 'yes',
          insurance_document_url: insuranceUrl,
          reviews_url: formData.reviewsUrl,
          status: 'pending'
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // Update business profile
      const { error: updateError } = await supabase
        .from('business_profiles')
        .update({ verification_pending: true })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      alert('Application submitted successfully! Our team will review your application and update your membership tier if approved.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div style={{
          justifyContent: 'center', 
          alignItems: 'center', 
          display: 'flex', 
          flexDirection: 'column', // Add this line for mobile responsiveness
          padding: '0 15px' // Add padding for mobile responsiveness
        }} className="col-md-8">
          <div className="request-form-container-details" style={{
            padding: '40px', 
            height: '100%', 
            borderRadius: '8px',
            width: '100%', // Ensure full width on mobile
            maxWidth: '600px' // Limit max width for larger screens
          }}>
            <h2 className="text-center mb-4" style={{
              color: '#000',
              fontFamily: 'Outfit',
              fontSize: '30px',
              fontWeight: '700',
              wordBreak: 'break-word',
              textOverflow: 'clip',
              whiteSpace: 'normal'
            }}>Bidi Verification Application</h2>
            
            {/* Add new benefits section */}
            <div className="benefits-section mb-5" style={{
              background: 'linear-gradient(to right, rgba(163, 40, 244, 0.1), rgba(255, 0, 138, 0.1))',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '32px'
            }}>
              <h3 style={{
                color: '#000',
                fontFamily: 'Outfit',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                textAlign: 'center'
              }}>Why Should You Get Bidi Verified?</h3>
              
              <div style={{
                display: 'grid',
                gap: '16px',
                color: '#000',
                fontFamily: 'Roboto',
                fontSize: '16px'
              }}>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#A328F4', marginTop: '4px' }}>✓</span>
                  <p style={{ margin: 0 }}><strong>Priority Listing:</strong> Appear at the top of vendor search results</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#A328F4', marginTop: '4px' }}>✓</span>
                  <p style={{ margin: 0 }}><strong>Enhanced Bid Visibility:</strong> Your bids are highlighted and shown first to potential clients</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#A328F4', marginTop: '4px' }}>✓</span>
                  <p style={{ margin: 0 }}><strong>Money-Back Guarantee:</strong> Clients get a 100% money-back guarantee when booking through Bidi, increasing their confidence in choosing you</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#A328F4', marginTop: '4px' }}>✓</span>
                  <p style={{ margin: 0 }}><strong>It's Free: Not much else to say here :)</strong></p>
                </div>
              </div>
            </div>

            <p className="text-center mb-4" style={{
              color: 'rgba(84, 89, 94, 0.8)',
              fontFamily: 'Roboto',
              fontSize: '16px'
            }}>
              Complete this form to become a verified Bidi vendor. 
              We'll review your application and update your status within 2-3 business days.
            </p>

            <form onSubmit={handleSubmit} style={{width: '100%', margin: '0 auto'}}> {/* Change width to 100% */}
              <div className="mb-4">
                <label className="form-label" style={{
                  color: '#000',
                  fontFamily: 'Outfit',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>How many years have you been in business?</label>
                <input
                  type="number"
                  className="form-control"
                  name="yearsInBusiness"
                  placeholder='Feel free to estimate!'
                  value={formData.yearsInBusiness}
                  onChange={handleChange}
                  required
                  min="0"
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    width: '100%'
                  }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label" style={{
                  color: '#000',
                  fontFamily: 'Outfit',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>How many events have you completed in your career?</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder='Feel free to estimate!'
                  name="completedEvents"
                  value={formData.completedEvents}
                  onChange={handleChange}
                  required
                  min="0"
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0'
                  }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label" style={{
                  color: '#000',
                  fontFamily: 'Outfit',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>Are you registered with the State of Utah?</label>
                <select
                  className="form-control"
                  name="registeredInUtah"
                  value={formData.registeredInUtah}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0'
                  }}
                >
                  <option value="">Please select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label" style={{
                  color: '#000',
                  fontFamily: 'Outfit',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>Do you have business insurance?</label>
                <select
                  className="form-control"
                  name="hasInsurance"
                  value={formData.hasInsurance}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0'
                  }}
                >
                  <option value="">Please select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              {formData.hasInsurance === 'yes' && (
                <div className="mb-4">
                  <label className="form-label" style={{
                    color: '#000',
                    fontFamily: 'Outfit',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>Upload proof of insurance</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #E0E0E0'
                    }}
                  />
                  <small className="text-muted" style={{
                    fontFamily: 'Roboto',
                    fontSize: '14px',
                    marginTop: '8px',
                    display: 'block'
                  }}>
                    Please upload your insurance certificate (PDF, JPG, or PNG format)
                  </small>
                </div>
              )}

              <div className="mb-4">
                <label className="form-label" style={{
                  color: '#000',
                  fontFamily: 'Outfit',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>Where can we find your best reviews? (Google, The Knot, WeddingWire, etc.)</label>
                <input
                  type="url"
                  className="form-control"
                  name="reviewsUrl"
                  value={formData.reviewsUrl}
                  onChange={handleChange}
                  required
                  placeholder="https://www.google.com/business/..."
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0'
                  }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label" style={{
                  color: '#000',
                  fontFamily: 'Outfit',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>Where can we see examples of your work?</label>
                <input
                  type="url"
                  className="form-control"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  required
                  placeholder="https://your-portfolio-website.com"
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0'
                  }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label" style={{
                  color: '#000',
                  fontFamily: 'Outfit',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>What's your Instagram handle?</label>
                <input
                  type="text"
                  className="form-control"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="@yourbusiness"
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0'
                  }}
                />
              </div>

              <div className="text-center mt-5">
                <button
                  type="submit"
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(85deg, #A328F4 9.33%, rgba(255, 0, 138, 0.76) 68.51%)',
                    border: 'none',
                    borderRadius: '30px',
                    color: 'white',
                    fontFamily: 'Outfit',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  disabled={isSubmitting}
                  className="btn-submit"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationApplication;
