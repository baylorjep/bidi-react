import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { Spinner } from 'react-bootstrap';
import scrollBtn from '../../../assets/images/Icons/scroll button.png';
import { useLocation } from 'react-router-dom';

const PhotoGrid = ({ photos, removePhoto, openModal }) => {
  return (
    <div className="photo-grid">
      {photos.map((photo, index) => (
        <div key={index} className="photo-grid-item">
          <img src={photo.url} alt={`Uploaded ${index}`} className="photo-grid-image" onClick={() => openModal(photo)} />
          <button className="remove-photo-button" onClick={() => removePhoto(index)}>X</button>
        </div>
      ))}
    </div>
  );
};

function UploadPictures({ formData, setFormPhotos, nextStep, prevStep }) { // Changed setPhotos to setFormPhotos
    const [photos, setPhotos] = useState(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        return savedForm.photos || [];
    });
    const [details, setDetails] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [deletingPhotoUrl, setDeletingPhotoUrl] = useState(null);
    const [uploadingFiles, setUploadingFiles] = useState(0);
    const [addMoreLoading, setAddMoreLoading] = useState(false); // Add new state for add more button loading
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const navigate = useNavigate();
    const requestId = uuidv4(); // Generate a new request ID
    const currentStep = 3; // Change this to the current step

    useEffect(() => {
        // Fetch authenticated user's ID
        const fetchUserId = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUserId(user?.id);
        };
        fetchUserId();
    }, []);

    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return setError("No file selected");
        
        // Validate file types
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        const invalidFiles = files.filter(file => !validImageTypes.includes(file.type));
        
        if (invalidFiles.length > 0) {
            setError("Please only upload image files (JPEG, PNG, GIF, WEBP)");
            return;
        }
        
        setLoading(true);
        setAddMoreLoading(true);
        
        try {
            const newPhotos = files.map(file => ({
                file: file,
                url: URL.createObjectURL(file),
                name: file.name,
                type: file.type
            }));
            
            // Update local state first
            setPhotos(prevPhotos => {
                const updatedPhotos = [...prevPhotos, ...newPhotos];
                
                // Then update parent state and localStorage
                if (typeof setFormPhotos === 'function') {
                    setFormPhotos(updatedPhotos);
                }
                
                const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
                localStorage.setItem('photographyRequest', JSON.stringify({
                    ...savedForm,
                    photos: updatedPhotos
                }));
                
                return updatedPhotos;
            });
            
        } catch (err) {
            console.error("Error processing files:", err);
            setError(err.message);
        } finally {
            setLoading(false);
            setAddMoreLoading(false);
        }
    };
    
const handleRemovePhoto = async (photoUrl) => {
  try {
    setDeletingPhotoUrl(photoUrl); // Start loading
    console.log("Starting photo removal process...");
    
    const filePathMatch = photoUrl.match(/request-media\/(.+)/);
    if (!filePathMatch) {
      console.error('Invalid file path:', photoUrl);
      return;
    }
    
    const filePath = filePathMatch[1];

    const { error: storageError } = await supabase
      .storage
      .from('request-media')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      return;
    }

    const { error: dbError } = await supabase
      .from('event_photos')
      .delete()
      .match({ photo_url: photoUrl });

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return;
    }

    setPhotos(prevPhotos => prevPhotos.filter(photo => photo.url !== photoUrl));
    console.log("Successfully deleted photo:", filePath);

  } catch (error) {
    console.error('Error in removal process:', error);
  } finally {
    setDeletingPhotoUrl(null); // Stop loading
  }
};
    
    
    const handleClick = () => {
        document.getElementById('file-input').click();  // Trigger file input
    };
    

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        const serviceType = localStorage.getItem('serviceType');
        const specificService = localStorage.getItem('specificService');
        
        // Store photos in localStorage
        const savedFormData = JSON.parse(localStorage.getItem('requestFormData') || '{}');
        localStorage.setItem('requestFormData', JSON.stringify({
            ...savedFormData,
            photos: photos
        }));

        // Navigate based on service type
        if (serviceType === 'photography') {
            navigate('/event-summary', {
                state: { 
                    photos,
                    eventDetails: JSON.parse(localStorage.getItem('photographyRequest') || '{}').eventDetails || {}
                }
            });
        } else {
            // For general services, use the multi-step form navigation
            if (typeof nextStep === 'function') {
                nextStep(); // Use the provided nextStep function
            } else {
                // If not in multi-step form, navigate to the form with the correct step
                navigate('/request-form', { 
                    state: { 
                        currentStep: 7, // Set to the summary step
                        photos,
                        formData: savedFormData
                    }
                });
            }
        }
    };

    const handleBack = () => {
        if (typeof prevStep === 'function') {
            prevStep();
        } else {
            navigate('/personal-details');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const inputEvent = { target: { files } };
        handleFileSelect(inputEvent);
    };

    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    };

    const handlePrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? photos.length - 1 : prevIndex - 1
        );
    };
    
    const renderRemoveButton = (photo) => {
        return (
          <div 
            className="remove-photo-overlay" 
            style={{color:'black'}}
            onClick={() => {
              console.log("Remove clicked for photo:", photo);
              handleRemovePhoto(photo.url);
            }}
          >
            {deletingPhotoUrl === photo.url ? (
                <div>
                    <Spinner />
                </div>
              ) : (
                '×'
              )}
          </div>
        );
      };

    const removePhoto = (index) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        localStorage.setItem('photographyRequest', JSON.stringify({
            ...savedForm,
            photos: photos
        }));
    }, [photos]);

    // Add this CSS class to handle the overflow issue
    const styles = {
      photoPreviewContainer: {
        maxHeight: '460px',
        overflowY: 'auto',
        // Add padding to prevent content from being cut off
        paddingTop: '10px',
        paddingBottom: '10px',
      },
      addMoreText: {
        color: '#FF008A',
        transition: 'color 0.3s',
      },
      addMoreTextHover: {
        color: 'white',
      },
    };

    useEffect(() => {
      const addMoreText = document.querySelector('.add-more-text');
      if (addMoreText) {
        addMoreText.addEventListener('mouseover', () => {
          addMoreText.style.color = styles.addMoreTextHover.color;
        });
        addMoreText.addEventListener('mouseout', () => {
          addMoreText.style.color = styles.addMoreText.color;
        });
      }
    }, []);

    const openModal = (photo) => {
      setSelectedPhoto(photo);
    };

    const closeModal = () => {
      setSelectedPhoto(null);
    };

    return (
        <div className='request-form-overall-container'>
            <div className="request-form-status-container">
                <div className="request-form-box">
              <div className="status-bar-container">
                  {Array.from({ length: 5 }, (_, index) => (
                      <React.Fragment key={index}>
                          <div
                              className={`status-check-container ${
                                  index + 1 === currentStep
                                      ? 'active'
                                      : index + 1 < currentStep
                                      ? 'completed'
                                      : ''
                              }`}
                          >
                              {index + 1 < currentStep ? (
                                  <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="32"
                                      height="32"
                                      viewBox="0 0 24 25"
                                      fill="none"
                                      style={{ transform: 'rotate(-90deg)' }} // Rotating to vertical
                                  >
                                      <path
                                          d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z"
                                          fill="white"
                                      />
                                  </svg>
                              ) : (
                                  `0${index + 1}`
                              )}
                          </div>
                          {index < 4 && (
                              <div
                                  className={`status-line ${
                                      index + 1 < currentStep ? 'completed' : ''
                                  }`}
                              ></div>
                          )}
                      </React.Fragment>
                  ))}
              </div>
              <div className="status-text-container">
                  {['Service Details', 'Personal Details', 'Add Photos', 'Review', 'Submit'].map(
                      (text, index) => (
                          <div
                              className={`status-text ${
                                  index + 1 === currentStep ? 'active' : ''
                              }`}
                              key={index}
                          >
                              {text}
                          </div>
                      )
                  )}
              </div>
              </div>
          </div>
            <div className='request-form-container-details' style={{alignItems:"normal", justifyContent:"flex-start",alignItems:"flex-start"}}>
                <h2 className="request-form-header" style={{textAlign:'left', marginBottom:"8px",marginLeft:"20px"}}>Inspiration Photos</h2>
                <p className="Sign-Up-Page-Subheader" style={{textAlign:'left',marginLeft:"20px", marginTop:"0",marginBottom:"0"}}>You can upload inspo (inspiration) photos here. If you aren't sure what you are looking for, just press next.
                </p>
                

                
                    {photos.length === 0 ? ( // Only show this when no photo is uploaded
                    <div className='photo-preview-container'>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={handleClick}
                            className="photo-upload-box"
                        >
                            <input
                                type="file"
                                id="file-input"
                                multiple
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" width="54" height="45" viewBox="0 0 54 45" fill="none">
                                <path d="M40.6939 15.6916C40.7126 15.6915 40.7313 15.6915 40.75 15.6915C46.9632 15.6915 52 20.2889 52 25.9601C52 31.2456 47.6249 35.5984 42 36.166M40.6939 15.6916C40.731 15.3158 40.75 14.9352 40.75 14.5505C40.75 7.61906 34.5939 2 27 2C19.8081 2 13.9058 7.03987 13.3011 13.4614M40.6939 15.6916C40.4383 18.2803 39.3216 20.6423 37.6071 22.5372M13.3011 13.4614C6.95995 14.0121 2 18.8869 2 24.8191C2 30.339 6.2944 34.9433 12 36.0004M13.3011 13.4614C13.6956 13.4271 14.0956 13.4096 14.5 13.4096C17.3146 13.4096 19.9119 14.2586 22.0012 15.6915" stroke="#141B34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M27 24.7783L27 43.0002M27 24.7783C25.2494 24.7783 21.9788 29.3208 20.75 30.4727M27 24.7783C28.7506 24.7783 32.0212 29.3208 33.25 30.4727" stroke="#141B34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            
                            <div className="photo-upload-btn-text">Drag & Drop to Upload or Click to Browse</div>
                            <div className="photo-upload-btn-text-pink">or click to browse</div>
                            {loading && (
                                <div className="uploading-container">
                                    <p>Uploading</p>
                                    <Spinner />
                                </div>
                            )}
                        </div>
                    </div>
                    ) : (

                    <div className="photo-grid-container">
                        <PhotoGrid photos={photos} removePhoto={removePhoto} openModal={openModal} />
                    </div>

                        
                        
                        
                    )}
                
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                {photos.length > 0 && (
                <div style={{display:'flex', justifyContent:'center', alignItems:'center', width:'100%'}}>
                                    <button 
                                        onClick={handleClick}
                                        className="add-more-photos-btn"
                                        disabled={addMoreLoading}
                                    >
                                        <input
                                            type="file"
                                            id="file-input"
                                            multiple
                                            onChange={handleFileSelect}
                                            style={{ display: 'none'}}
                                        />
                                        {addMoreLoading ? (
                                            <Spinner />
                                        ) : (
                                            <span className="add-more-text">Add More</span>
                                        )}
                                    </button>
                                </div>
 )}
            <div className="form-button-container" style={{margin:"0"}}>
                <button className="request-form-back-and-foward-btn" onClick={handleBack}>
                    Back
                </button>
                <button
                type='submit'
                className='request-form-back-and-foward-btn'
                 onClick={handleSubmit}
                >
                    Next


                </button>
            </div>
                </div>

                {selectedPhoto && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content">
            <button 
              className="remove-photo-button"
              style={{ position: 'absolute', top: '10px', right: '10px' }}
              onClick={closeModal}
            >
              ✕
            </button>
            <img src={selectedPhoto.url} alt="Enlarged view" />
          </div>
        </div>
      )}
        </div>
        
    );
}

export default UploadPictures;