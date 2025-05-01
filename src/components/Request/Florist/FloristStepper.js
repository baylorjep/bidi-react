import React from 'react';
import '../../../styles/Requests.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

// Import flower images
import Roses from '../../../assets/images/flowers/roses.jpg';
import Peonies from '../../../assets/images/flowers/peonies.jpg';
import Hydrangeas from '../../../assets/images/flowers/hydrangeas.jpg';
import Lilies from '../../../assets/images/flowers/lilies.jpg';
import Tulips from '../../../assets/images/flowers/tulips.jpg';
import Orchids from '../../../assets/images/flowers/orchids.jpg';
import Daisies from '../../../assets/images/flowers/daises.jpg';
import Ranunculus from '../../../assets/images/flowers/ranunculus.jpg';
import Anemones from '../../../assets/images/flowers/anemones.jpg';
import Eucalyptus from '../../../assets/images/flowers/eucalyptus.jpg';
import Sunflowers from '../../../assets/images/flowers/sunflowers.jpg';
import BabysBreath from '../../../assets/images/flowers/babysBreath.jpg';
import Lavender from '../../../assets/images/flowers/lavender.jpg';
import Dahlia from '../../../assets/images/flowers/dahlia.jpg';
import Zinnias from '../../../assets/images/flowers/zinnias.jpg';
import Protea from '../../../assets/images/flowers/protea.jpg';
import Amaranthus from '../../../assets/images/flowers/amaranthus.jpg';
import Chrysanthemums from '../../../assets/images/flowers/chrysanthemums.jpg';
import Ruscus from '../../../assets/images/flowers/ruscus.jpg';
import Ivy from '../../../assets/images/flowers/ivy.jpg';
import Ferns from '../../../assets/images/flowers/ferns.jpg';

const FlowerModal = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-photo" onClick={e => e.stopPropagation()}>
        <button 
          className="remove-photo-button" 
          style={{ position: 'absolute', right: '10px', top: '10px' }}
          onClick={onClose}
        >
          X
        </button>
        <img src={photo.imgSrc} alt={photo.label} />
      </div>
    </div>
  );
};

const PhotoGrid = ({ photos, removePhoto, openModal }) => {
    return (
        <div className="photo-grid">
            {photos.map((photo, index) => (
                <div key={index} className="photo-grid-item">
                    <img src={photo.url} alt={`Uploaded ${index}`} className="photo-grid-image" onClick={() => openModal(photo)} />
                    <button className="remove-photo-button" onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(index);
                    }}>X</button>
                </div>
            ))}
        </div>
    );
};

const PhotoModal = ({ photo, onClose }) => {
    if (!photo) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-photo" onClick={e => e.stopPropagation()}>
                <button 
                    className="remove-photo-button" 
                    style={{ position: 'absolute', right: '10px', top: '10px' }}
                    onClick={onClose}
                >
                    X
                </button>
                <img src={photo.url} alt="Full size" />
            </div>
        </div>
    );
};

function FloristStepper({ formData, setFormData, currentStep, setCurrentStep, subStep, setSubStep }) {
  const [selectedFlower, setSelectedFlower] = React.useState(null);
  const [isFlowerModalOpen, setIsFlowerModalOpen] = React.useState(false);
  const [selectedPhoto, setSelectedPhoto] = React.useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  // Debug log
  console.log('FloristStepper - Current subStep:', subStep);

  // Initialize eventDetails if it doesn't exist
  React.useEffect(() => {
    if (!formData.requests) {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          Florist: {
            floralArrangements: {},
            colorPreferences: [],
            flowerPreferences: {
              html: '',
              text: ''
            },
            additionalServices: {},
            priceQualityPreference: '2',
            priceRange: ''
          }
        }
      }));
    } else if (!formData.requests.Florist?.flowerPreferences?.html) {
      // Ensure flowerPreferences has the correct structure
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          Florist: {
            ...prev.requests?.Florist,
            flowerPreferences: {
              html: prev.requests?.Florist?.flowerPreferences || '',
              text: prev.requests?.Florist?.flowerPreferences || ''
            }
          }
        }
      }));
    }
  }, [formData.requests, setFormData]);

  const calculateRecommendedBudget = () => {
    let basePrice = 0;
    const eventDetails = formData.requests?.Florist || {};
    const floralArrangements = eventDetails.floralArrangements || {};
    const additionalServices = eventDetails.additionalServices || {};

    // Calculate base price based on floral arrangements
    if (floralArrangements.bridalBouquet) {
      basePrice += 200; // Base price for bridal bouquet
    }
    if (floralArrangements.bridesmaidBouquets) {
      const quantity = parseInt(floralArrangements.bridesmaidBouquetsQuantity) || 1;
      basePrice += quantity * 100; // $100 per bridesmaid bouquet
    }
    if (floralArrangements.boutonnieres) {
      const quantity = parseInt(floralArrangements.boutonnieresQuantity) || 1;
      basePrice += quantity * 25; // $25 per boutonniere
    }
    if (floralArrangements.corsages) {
      const quantity = parseInt(floralArrangements.corsagesQuantity) || 1;
      basePrice += quantity * 40; // $40 per corsage
    }
    if (floralArrangements.centerpieces) {
      const quantity = parseInt(floralArrangements.centerpiecesQuantity) || 1;
      basePrice += quantity * 75; // $75 per centerpiece
    }
    if (floralArrangements.ceremonyArchFlowers) {
      basePrice += 500; // Base price for ceremony arch
    }
    if (floralArrangements.aisleDecorations) {
      basePrice += 300; // Base price for aisle decorations
    }
    if (floralArrangements.floralInstallations) {
      basePrice += 800; // Base price for floral installations
    }
    if (floralArrangements.cakeFlowers) {
      basePrice += 150; // Base price for cake flowers
    }
    if (floralArrangements.loosePetals) {
      basePrice += 100; // Base price for loose petals
    }

    // Add costs for additional services
    if (additionalServices.setup) {
      basePrice += 200; // Setup fee
    }
    if (additionalServices.delivery) {
      basePrice += 150; // Delivery fee
    }
    if (additionalServices.cleanup) {
      basePrice += 100; // Cleanup fee
    }
    if (additionalServices.consultation) {
      basePrice += 150; // Consultation fee
    }

    // Apply price quality preference multiplier
    const qualityMultiplier = 1 + (parseInt(eventDetails.priceQualityPreference || "2") - 1) * 0.5;
    return Math.round(basePrice * qualityMultiplier);
  };

  const getSubSteps = () => {
    switch (formData.commonDetails?.eventType) {
      case 'Wedding':
        return [
          'Floral Arrangements',
          'Color & Flower Preferences',
          'Services',
          'Inspiration',
          'Budget'
        ];
      default:
        return [
          'Floral Arrangements',
          'Color & Flower Preferences',
          'Services',
          'Inspiration',
          'Budget'
        ];
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  const renderSubStep = () => {
    const eventDetails = formData.requests?.Florist || {};

    switch (subStep) {
      case 0: // Floral Arrangements
        const handleCheckboxChange = (id, checked) => {
          setFormData(prev => ({
            ...prev,
            requests: {
              ...prev.requests,
              Florist: {
                ...prev.requests?.Florist,
                floralArrangements: {
                  ...prev.requests?.Florist?.floralArrangements,
                  [id]: checked
                }
              }
            }
          }));
        };

        const handleQuantityChange = (id, value) => {
          setFormData(prev => ({
            ...prev,
            requests: {
              ...prev.requests,
              Florist: {
                ...prev.requests?.Florist,
                floralArrangements: {
                  ...prev.requests?.Florist?.floralArrangements,
                  [`${id}Quantity`]: value
                }
              }
            }
          }));
        };

        return (
          <div className="wedding-details-container" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
            <div className="custom-input-container">
              <label className="photo-options-header">Floral Arrangements Needed</label>
              <div className="photo-options-grid">
                {[
                  { id: 'bridalBouquet', label: 'Bridal bouquet' },
                  { id: 'bridesmaidBouquets', label: 'Bridesmaid bouquets' },
                  { id: 'boutonnieres', label: 'Boutonnieres' },
                  { id: 'corsages', label: 'Corsages' },
                  { id: 'centerpieces', label: 'Centerpieces' },
                  { id: 'ceremonyArchFlowers', label: 'Ceremony arch flowers' },
                  { id: 'aisleDecorations', label: 'Aisle decorations' },
                  { id: 'floralInstallations', label: 'Floral installations (hanging, wall, etc.)' },
                  { id: 'cakeFlowers', label: 'Cake flowers' },
                  { id: 'loosePetals', label: 'Loose petals' },
                  { id: 'otherFloralArrangements', label: 'Other (please specify)' }
                ].map((item) => (
                  <div key={item.id} className="photo-option-item">
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={eventDetails.floralArrangements?.[item.id] || false}
                      onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                    />
                    <label htmlFor={item.id}>{item.label}</label>
                    {item.id !== 'loosePetals' && eventDetails.floralArrangements?.[item.id] && (
                      <div className="custom-input-container">
                        <input
                          type="number"
                          name={`${item.id}Quantity`}
                          value={eventDetails.floralArrangements?.[`${item.id}Quantity`] || ''}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          placeholder="Quantity"
                          className="custom-input"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {eventDetails.floralArrangements?.otherFloralArrangements && (
                <div className="custom-input-container">
                  <input
                    type="text"
                    name="otherFloralArrangementsDetails"
                    value={eventDetails.floralArrangements?.otherFloralArrangementsDetails || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requests: {
                        ...prev.requests,
                        Florist: {
                          ...prev.requests?.Florist,
                          floralArrangements: {
                            ...prev.requests?.Florist?.floralArrangements,
                            otherFloralArrangementsDetails: e.target.value
                          }
                        }
                      }
                    }))}
                    placeholder="Please specify other floral arrangements"
                    className="custom-input"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 1: // Color & Flower Preferences
        const colorOptions = [
          'Red', 'Pink', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'White', 'Black', 'Gray', 'Brown'
        ];

        return (
          <div className="wedding-details-container" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
            <div className="custom-input-container">
              <label className="photo-options-header">Color Preferences</label>
              <div className="photo-options-grid">
                {colorOptions.map((color, index) => (
                  <div key={index} className="photo-option-item">
                    <input
                      type="checkbox"
                      id={color}
                      checked={eventDetails.colorPreferences?.includes(color) || false}
                      onChange={(e) => {
                        const newColorPreferences = e.target.checked
                          ? [...(eventDetails.colorPreferences || []), color]
                          : (eventDetails.colorPreferences || []).filter(c => c !== color);
                        setFormData(prev => ({
                          ...prev,
                          requests: {
                            ...prev.requests,
                            Florist: {
                              ...prev.requests?.Florist,
                              colorPreferences: newColorPreferences
                            }
                          }
                        }));
                      }}
                    />
                    <label htmlFor={color}>{color}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="custom-input-container" style={{ marginTop: '20px' }}>
              <ReactQuill
                value={eventDetails.flowerPreferences?.html || ''}
                onChange={(content, delta, source, editor) => {
                  setFormData(prev => ({
                    ...prev,
                    requests: {
                      ...prev.requests,
                      Florist: {
                        ...prev.requests?.Florist,
                        flowerPreferences: {
                          html: content,
                          text: editor.getText()
                        }
                      }
                    }
                  }));
                }}
                modules={modules}
                placeholder="List any specific flowers you'd like to include in your arrangements. For example: 'I'd love to have peonies and roses as the main flowers, with some eucalyptus for greenery'"
              />
              <label htmlFor="flowerPreferences" className="custom-label">
                Specific Flower Requests
              </label>
            </div>
          </div>
        );

      case 2: // Services
        return (
          <div className="wedding-details-container" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
            <div className="custom-input-container">
              <h3 className="section-subtitle">Additional Services</h3>
              <div className="checkbox-grid">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.requests?.Florist?.additionalServices?.setup || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requests: {
                        ...prev.requests,
                        Florist: {
                          ...prev.requests?.Florist,
                          additionalServices: {
                            ...prev.requests?.Florist?.additionalServices,
                            setup: e.target.checked
                          }
                        }
                      }
                    }))}
                  />
                  <span className="checkbox-text">Setup & Installation</span>
                </label>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.requests?.Florist?.additionalServices?.delivery || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requests: {
                        ...prev.requests,
                        Florist: {
                          ...prev.requests?.Florist,
                          additionalServices: {
                            ...prev.requests?.Florist?.additionalServices,
                            delivery: e.target.checked
                          }
                        }
                      }
                    }))}
                  />
                  <span className="checkbox-text">Delivery</span>
                </label>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.requests?.Florist?.additionalServices?.cleanup || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requests: {
                        ...prev.requests,
                        Florist: {
                          ...prev.requests?.Florist,
                          additionalServices: {
                            ...prev.requests?.Florist?.additionalServices,
                            cleanup: e.target.checked
                          }
                        }
                      }
                    }))}
                  />
                  <span className="checkbox-text">Cleanup & Removal</span>
                </label>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.requests?.Florist?.additionalServices?.consultation || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requests: {
                        ...prev.requests,
                        Florist: {
                          ...prev.requests?.Florist,
                          additionalServices: {
                            ...prev.requests?.Florist?.additionalServices,
                            consultation: e.target.checked
                          }
                        }
                      }
                    }))}
                  />
                  <span className="checkbox-text">In-person Consultation</span>
                </label>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.requests?.Florist?.specificTimeNeeded || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requests: {
                        ...prev.requests,
                        Florist: {
                          ...prev.requests?.Florist,
                          specificTimeNeeded: e.target.checked
                        }
                      }
                    }))}
                  />
                  <span className="checkbox-text">Specific Time Needed</span>
                </label>
                {formData.requests?.Florist?.specificTimeNeeded && (
                    <div className="custom-input-container" style={{ marginTop: '10px' }}>
                        <input
                            type="time"
                            value={formData.requests?.Florist?.specificTime || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                requests: {
                                    ...prev.requests,
                                    Florist: {
                                        ...prev.requests?.Florist,
                                        specificTime: e.target.value
                                    }
                                }
                            }))}
                            className="custom-input"
                            style={{ width: '100%' }}
                        />
                        <label className="custom-label">Specific Time</label>
                    </div>
                )}
              </div>
            </div>

            <div className="custom-input-container" style={{ marginTop: '20px' }}>
              <ReactQuill
                value={eventDetails.serviceComments || ''}
                onChange={(content) => setFormData(prev => ({
                  ...prev,
                  requests: {
                    ...prev.requests,
                    Florist: {
                      ...prev.requests?.Florist,
                      serviceComments: content
                    }
                  }
                }))}
                modules={modules}
                placeholder="Please provide any specific details about your service needs. For example: 'Setup needs to be completed by 2pm on the day of the event', 'Delivery address is different from the venue', or 'Special handling required for delicate arrangements'"
              />
              <label htmlFor="serviceComments" className="custom-label">
                Additional Service Details
              </label>
            </div>
          </div>
        );

      case 3: // Inspiration
        const handleFileSelect = async (event) => {
            const files = Array.from(event.target.files);
            if (!files.length) return;

            // Validate file types
            const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
            const invalidFiles = files.filter(file => !validImageTypes.includes(file.type));
            
            if (invalidFiles.length > 0) {
                console.error("Please only upload image files (JPEG, PNG, GIF, WEBP)");
                return;
            }
            
            try {
                const newPhotos = files.map(file => ({
                    file: file,
                    url: URL.createObjectURL(file),
                    name: file.name,
                    type: file.type
                }));
                
                setFormData(prev => ({
                    ...prev,
                    requests: {
                        ...prev.requests,
                        Florist: {
                            ...prev.requests?.Florist,
                            photos: [...(prev.requests?.Florist?.photos || []), ...newPhotos]
                        }
                    }
                }));
                
            } catch (err) {
                console.error("Error processing files:", err);
            }
        };

        const handleRemovePhoto = async (index) => {
            try {
                const photoToRemove = formData.requests?.Florist?.photos?.[index];
                if (!photoToRemove) return;

                // If the photo has been uploaded to storage, remove it
                if (photoToRemove.url.includes('request-media')) {
                    const filePathMatch = photoToRemove.url.match(/request-media\/(.+)/);
                    if (filePathMatch) {
                        const filePath = filePathMatch[1];
                        const { error: storageError } = await supabase.storage
                            .from('request-media')
                            .remove([filePath]);

                        if (storageError) {
                            console.error('Storage deletion error:', storageError);
                            return;
                        }
                    }
                }

                // Update local state
                setFormData(prev => ({
                    ...prev,
                    requests: {
                        ...prev.requests,
                        Florist: {
                            ...prev.requests?.Florist,
                            photos: prev.requests?.Florist?.photos?.filter((_, i) => i !== index) || []
                        }
                    }
                }));
            } catch (error) {
                console.error('Error in removal process:', error);
            }
        };

        return (
            <div className="photo-upload-section">
                <div className="custom-input-container">
                    <input
                        type="url"
                        name="pinterestBoard"
                        value={eventDetails.pinterestBoard || ''}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            requests: {
                                ...prev.requests,
                                Florist: {
                                    ...prev.requests?.Florist,
                                    pinterestBoard: e.target.value
                                }
                            }
                        }))}
                        placeholder="Paste your Pinterest board link here"
                        className="custom-input"
                    />
                    <label htmlFor="pinterestBoard" className="custom-label">
                        Pinterest Board Link
                    </label>
                </div>

                <div className="photo-preview-container" style={{ 
                    height: '45vh',
                    overflowY: 'auto',
                    padding: '0 20px 20px 20px'
                }}>
                    {(!eventDetails.photos || eventDetails.photos.length === 0) ? (
                        <div
                            className="photo-upload-box"
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <input
                                type="file"
                                id="file-input"
                                multiple
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" width="54" height="45" viewBox="0 0 54 45" fill="none">
                                <path d="M40.6939 15.6916C40.7126 15.6915 40.7313 15.6915 40.75 15.6915C46.9632 15.6915 52 20.2889 52 25.9601C52 31.2456 47.6249 35.5984 42 36.166M40.6939 15.6916C40.731 15.3158 40.75 14.9352 40.75 14.5505C40.75 7.61906 34.5939 2 27 2C19.8081 2 13.9058 7.03987 13.3011 13.4614M40.6939 15.6916C40.4383 18.2803 39.3216 20.6423 37.6071 22.5372M13.3011 13.4614C6.95995 14.0121 2 18.8869 2 24.8191C2 30.339 6.2944 34.9433 12 36.0004M13.3011 13.4614C13.6956 13.4271 14.0956 13.4096 14.5 13.4096C17.3146 13.4096 19.9119 14.2586 22.0012 15.6915" stroke="#141B34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M27 24.7783L27 43.0002M27 24.7783C25.2494 24.7783 21.9788 29.3208 20.75 30.4727M27 24.7783C28.7506 24.7783 32.0212 29.3208 33.25 30.4727" stroke="#141B34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="photo-upload-text">Drag & Drop to Upload or Click to Browse</div>
                        </div>
                    ) : (
                        <PhotoGrid 
                            photos={eventDetails.photos}
                            removePhoto={handleRemovePhoto}
                            openModal={(photo) => {
                                setSelectedPhoto(photo);
                                setIsPhotoModalOpen(true);
                            }}
                        />
                    )}
                </div>

                {eventDetails.photos && eventDetails.photos.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', display: 'flex', justifyContent: 'center' }}>
                        <button 
                            onClick={() => document.getElementById('file-input-more').click()}
                            className="add-more-photos-btn"
                        >
                            <input
                                type="file"
                                id="file-input-more"
                                multiple
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            <span className='add-more-text'>Add More Photos</span>
                        </button>
                    </div>
                )}

                {isPhotoModalOpen && (
                    <PhotoModal 
                        photo={selectedPhoto} 
                        onClose={() => {
                            setSelectedPhoto(null);
                            setIsPhotoModalOpen(false);
                        }} 
                    />
                )}
            </div>
        );

      case 4: // Budget
        const recommendedBudget = calculateRecommendedBudget();
        return (
          <div className="wedding-details-container" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
            <div className="budget-recommendation-container" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>Recommended Budget</h3>
              <p className="budget-amount" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                ${recommendedBudget.toLocaleString()}
              </p>
              <div className="budget-explanation">
                <p style={{ marginBottom: '10px' }}>This recommendation is based on:</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                  {eventDetails.floralArrangements?.bridalBouquet && <li>Bridal bouquet</li>}
                  {eventDetails.floralArrangements?.bridesmaidBouquets && (
                    <li>{eventDetails.floralArrangements.bridesmaidBouquetsQuantity || 1} bridesmaid bouquet(s)</li>
                  )}
                  {eventDetails.floralArrangements?.boutonnieres && (
                    <li>{eventDetails.floralArrangements.boutonnieresQuantity || 1} boutonniere(s)</li>
                  )}
                  {eventDetails.floralArrangements?.corsages && (
                    <li>{eventDetails.floralArrangements.corsagesQuantity || 1} corsage(s)</li>
                  )}
                  {eventDetails.floralArrangements?.centerpieces && (
                    <li>{eventDetails.floralArrangements.centerpiecesQuantity || 1} centerpiece(s)</li>
                  )}
                  {eventDetails.floralArrangements?.ceremonyArchFlowers && <li>Ceremony arch flowers</li>}
                  {eventDetails.floralArrangements?.aisleDecorations && <li>Aisle decorations</li>}
                  {eventDetails.floralArrangements?.floralInstallations && <li>Floral installations</li>}
                  {eventDetails.floralArrangements?.cakeFlowers && <li>Cake flowers</li>}
                  {eventDetails.floralArrangements?.loosePetals && <li>Loose petals</li>}
                  {eventDetails.additionalServices?.setup && <li>Setup & installation service</li>}
                  {eventDetails.additionalServices?.delivery && <li>Delivery service</li>}
                  {eventDetails.additionalServices?.cleanup && <li>Cleanup service</li>}
                  {eventDetails.additionalServices?.consultation && <li>In-person consultation</li>}
                </ul>
              </div>
            </div>

            <div className="price-quality-slider-container" style={{ marginBottom: '20px' }}>
              <div className="slider-header" style={{ marginBottom: '10px' }}>What matters most to you?</div>
              <div className="slider-labels" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Budget Conscious</span>
                <span>Quality Focused</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={eventDetails.priceQualityPreference || "2"}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  requests: {
                    ...prev.requests,
                    Florist: {
                      ...prev.requests?.Florist,
                      priceQualityPreference: e.target.value
                    }
                  }
                }))}
                className="price-quality-slider"
                style={{ width: '100%', marginBottom: '10px' }}
              />
            </div>

            <div className="custom-input-container required" style={{ marginBottom: '20px' }}>
              <select
                name="priceRange"
                value={eventDetails.priceRange || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  requests: {
                    ...prev.requests,
                    Florist: {
                      ...prev.requests?.Florist,
                      priceRange: e.target.value
                    }
                  }
                }))}
                className="custom-input"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Select a range</option>
                <option value="0-500">$0-500</option>
                <option value="500-1000">$500-1,000</option>
                <option value="1000-1500">$1,000-1,500</option>
                <option value="1500-2000">$1,500-2,000</option>
                <option value="2000-2500">$2,000-2,500</option>
                <option value="2500-3000">$2,500-3,000</option>
                <option value="3000-3500">$3,000-3,500</option>
                <option value="3500-4000">$3,500-4,000</option>
                <option value="4000+">$4,000+</option>
              </select>
              <label htmlFor="priceRange" className="custom-label" style={{ display: 'block', marginTop: '5px' }}>
                Budget Range
              </label>
            </div>

            <div className="custom-input-container">
              <ReactQuill
                value={eventDetails.additionalInfo || ''}
                onChange={(content) => setFormData(prev => ({
                  ...prev,
                  requests: {
                    ...prev.requests,
                    Florist: {
                      ...prev.requests?.Florist,
                      additionalInfo: content
                    }
                  }
                }))}
                modules={modules}
                placeholder="Any special requests or additional information florists should know..."
                style={{ marginBottom: '20px' }}
              />
              <label htmlFor="additionalInfo" className="custom-label" style={{ display: 'block', marginTop: '5px' }}>
                Additional Information
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user found');
            return;
        }

        // Create florist request data
        const floristRequestData = {
            user_id: user.id,
            status: 'pending',
            floral_arrangements: formData.requests?.Florist?.floralArrangements,
            color_preferences: formData.requests?.Florist?.colorPreferences,
            flower_preferences: formData.requests?.Florist?.flowerPreferences,
            additional_services: formData.requests?.Florist?.additionalServices,
            price_range: formData.requests?.Florist?.priceRange,
            additional_comments: formData.requests?.Florist?.additionalInfo,
            pinterest_board: formData.requests?.Florist?.pinterestBoard
        };

        // Insert into florist_requests table
        const { data: newFloristRequest, error: floristRequestError } = await supabase
            .from('florist_requests')
            .insert([floristRequestData])
            .select()
            .single();

        if (floristRequestError) throw floristRequestError;

        // Handle photo uploads
        if (formData.requests?.Florist?.photos && formData.requests.Florist.photos.length > 0) {
            const uploadPromises = formData.requests.Florist.photos.map(async (photo) => {
                const fileExt = photo.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const filePath = `${user.id}/${newFloristRequest.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('request-media')
                    .upload(filePath, photo.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('request-media')
                    .getPublicUrl(filePath);

                // Store photo information in florist_photos table
                return supabase
                    .from('florist_photos')
                    .insert([{
                        request_id: newFloristRequest.id,
                        user_id: user.id,
                        photo_url: publicUrl,
                        file_path: filePath
                    }]);
            });

            await Promise.all(uploadPromises);
        }

        // Clear form data and navigate to success page
        localStorage.removeItem('masterRequest');
        navigate('/success-request', { 
            state: { 
                message: 'Your florist request has been submitted successfully!'
            }
        });

    } catch (err) {
        console.error('Error submitting florist request:', err);
        setError('Failed to submit request. Please try again.');
    }
  };

  return (
    <div className="florist-stepper">
      <div className="florist-stepper-content">
        {renderSubStep()}
      </div>
      {isFlowerModalOpen && <FlowerModal photo={selectedFlower} onClose={() => setIsFlowerModalOpen(false)} />}
    </div>
  );
}

export default FloristStepper; 