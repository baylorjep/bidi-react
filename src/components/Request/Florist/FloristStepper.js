import React from 'react';
import '../../../styles/Requests.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

function FloristStepper({ formData, setFormData, currentStep, setCurrentStep, subStep, setSubStep }) {
  const [selectedFlower, setSelectedFlower] = React.useState(null);
  const [isFlowerModalOpen, setIsFlowerModalOpen] = React.useState(false);

  // Initialize eventDetails if it doesn't exist
  React.useEffect(() => {
    if (!formData.eventDetails) {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          floralArrangements: {},
          colorPreferences: [],
          flowerPreferences: {},
          additionalServices: {},
          priceQualityPreference: '2',
          priceRange: '',
          additionalInfo: ''
        }
      }));
    }
  }, [formData.eventDetails, setFormData]);

  const getSubSteps = () => {
    switch (formData.commonDetails?.eventType) {
      case 'Wedding':
        return [
          'Floral Arrangements',
          'Color & Flower Preferences',
          'Services & Budget'
        ];
      default:
        return [
          'Floral Arrangements',
          'Color & Flower Preferences',
          'Services & Budget'
        ];
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  const renderSubStep = () => {
    const eventDetails = formData.eventDetails || {};

    switch (subStep) {
      case 0: // Floral Arrangements
        const handleCheckboxChange = (id, checked) => {
          setFormData(prev => ({
            ...prev,
            eventDetails: {
              ...prev.eventDetails,
              floralArrangements: {
                ...prev.eventDetails.floralArrangements,
                [id]: checked
              }
            }
          }));
        };

        const handleQuantityChange = (id, value) => {
          setFormData(prev => ({
            ...prev,
            eventDetails: {
              ...prev.eventDetails,
              floralArrangements: {
                ...prev.eventDetails.floralArrangements,
                [`${id}Quantity`]: value
              }
            }
          }));
        };

        return (
          <div className="wedding-details-container" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '20px' }}>
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
                      eventDetails: {
                        ...prev.eventDetails,
                        floralArrangements: {
                          ...prev.eventDetails.floralArrangements,
                          otherFloralArrangementsDetails: e.target.value
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

        const flowerOptions = [
          // Luxury Tier
          { id: 'peonies', label: 'Peonies', imgSrc: Peonies, tier: 'luxury' },
          { id: 'orchids', label: 'Orchids', imgSrc: Orchids, tier: 'luxury' },
          { id: 'protea', label: 'Protea', imgSrc: Protea, tier: 'luxury' },
          
          // Premium Tier
          { id: 'ranunculus', label: 'Ranunculus', imgSrc: Ranunculus, tier: 'premium' },
          { id: 'anemones', label: 'Anemones', imgSrc: Anemones, tier: 'premium' },
          { id: 'dahlia', label: 'Dahlia', imgSrc: Dahlia, tier: 'premium' },
          
          // Moderate Tier
          { id: 'roses', label: 'Roses', imgSrc: Roses, tier: 'moderate' },
          { id: 'lilies', label: 'Lilies', imgSrc: Lilies, tier: 'moderate' },
          { id: 'hydrangeas', label: 'Hydrangeas', imgSrc: Hydrangeas, tier: 'moderate' },
          
          // Standard Tier
          { id: 'tulips', label: 'Tulips', imgSrc: Tulips, tier: 'standard' },
          { id: 'daisies', label: 'Daisies', imgSrc: Daisies, tier: 'standard' },
          { id: 'sunflowers', label: 'Sunflowers', imgSrc: Sunflowers, tier: 'standard' },
          { id: 'babysBreath', label: "Baby's Breath", imgSrc: BabysBreath, tier: 'standard' },
          { id: 'lavender', label: 'Lavender', imgSrc: Lavender, tier: 'standard' },
          { id: 'zinnias', label: 'Zinnias', imgSrc: Zinnias, tier: 'standard' },
          { id: 'amaranthus', label: 'Amaranthus', imgSrc: Amaranthus, tier: 'standard' },
          { id: 'chrysanthemums', label: 'Chrysanthemums', imgSrc: Chrysanthemums, tier: 'standard' },
          
          // Greenery
          { id: 'eucalyptus', label: 'Eucalyptus', imgSrc: Eucalyptus, tier: 'greenery' },
          { id: 'ruscus', label: 'Ruscus', imgSrc: Ruscus, tier: 'greenery' },
          { id: 'ivy', label: 'Ivy', imgSrc: Ivy, tier: 'greenery' },
          { id: 'ferns', label: 'Ferns', imgSrc: Ferns, tier: 'greenery' }
        ];

        // Group flowers by tier for display
        const groupedFlowers = flowerOptions.reduce((acc, flower) => {
          if (!acc[flower.tier]) {
            acc[flower.tier] = [];
          }
          acc[flower.tier].push(flower);
          return acc;
        }, {});

        return (
          <div className="wedding-details-container" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '20px' }}>
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
                          eventDetails: {
                            ...prev.eventDetails,
                            colorPreferences: newColorPreferences
                          }
                        }));
                      }}
                    />
                    <label htmlFor={color}>{color}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="custom-input-container">
              <label className="photo-options-header">Flower Preferences & Greenery</label>
              <div className="flower-options-container">
                {Object.entries(groupedFlowers).map(([tier, flowers]) => (
                  <div key={tier} className="flower-tier-section">
                    <h3 className="flower-tier-header">
                      {tier === 'luxury' && '✨ Luxury Flowers'}
                      {tier === 'premium' && '💫 Premium Flowers'}
                      {tier === 'moderate' && '🌟 Moderate-Priced Flowers'}
                      {tier === 'standard' && '🌸 Standard Flowers'}
                      {tier === 'greenery' && '🌿 Greenery'}
                    </h3>
                    <div className="photo-options-grid">
                      {flowers.map((flower) => (
                        <div
                          key={flower.id}
                          className={`flower-option ${eventDetails.flowerPreferences?.[flower.id] ? 'selected' : ''}`}
                        >
                          <img
                            src={flower.imgSrc}
                            alt={flower.label}
                            className="flower-image"
                            onClick={() => {
                              setSelectedFlower(flower);
                              setIsFlowerModalOpen(true);
                            }}
                          />
                          <div className="flower-label">
                            {flower.label}
                            {flower.tier === 'luxury' && ' ✨'}
                            {flower.tier === 'premium' && ' 💫'}
                          </div>
                          <input
                            type="checkbox"
                            id={flower.id}
                            checked={eventDetails.flowerPreferences?.[flower.id] || false}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                eventDetails: {
                                  ...prev.eventDetails,
                                  flowerPreferences: {
                                    ...prev.eventDetails.flowerPreferences,
                                    [flower.id]: e.target.checked
                                  }
                                }
                              }));
                            }}
                          />
                          <label htmlFor={flower.id}>Select</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Services & Budget
        return (
          <div className="wedding-details-container" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '20px' }}>
            <div className="custom-input-container">
              <h3 className="section-subtitle">Additional Services</h3>
              <div className="checkbox-grid">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={eventDetails.additionalServices?.setup || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventDetails: {
                        ...prev.eventDetails,
                        additionalServices: {
                          ...prev.eventDetails.additionalServices,
                          setup: e.target.checked
                        }
                      }
                    }))}
                  />
                  <span className="checkbox-text">Setup & Installation</span>
                </label>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={eventDetails.additionalServices?.delivery || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventDetails: {
                        ...prev.eventDetails,
                        additionalServices: {
                          ...prev.eventDetails.additionalServices,
                          delivery: e.target.checked
                        }
                      }
                    }))}
                  />
                  <span className="checkbox-text">Delivery</span>
                </label>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={eventDetails.additionalServices?.cleanup || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventDetails: {
                        ...prev.eventDetails,
                        additionalServices: {
                          ...prev.eventDetails.additionalServices,
                          cleanup: e.target.checked
                        }
                      }
                    }))}
                  />
                  <span className="checkbox-text">Cleanup & Removal</span>
                </label>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={eventDetails.additionalServices?.consultation || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventDetails: {
                        ...prev.eventDetails,
                        additionalServices: {
                          ...prev.eventDetails.additionalServices,
                          consultation: e.target.checked
                        }
                      }
                    }))}
                  />
                  <span className="checkbox-text">In-person Consultation</span>
                </label>
              </div>
            </div>

            <div className="price-quality-slider-container">
              <div className="slider-header">What matters most to you?</div>
              <div className="slider-labels">
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
                  eventDetails: {
                    ...prev.eventDetails,
                    priceQualityPreference: e.target.value
                  }
                }))}
                className="price-quality-slider"
              />
            </div>

            <div className="custom-input-container required">
              <select
                name="priceRange"
                value={eventDetails.priceRange || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    priceRange: e.target.value
                  }
                }))}
                className="custom-input"
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
              <label htmlFor="priceRange" className="custom-label">
                Budget Range
              </label>
            </div>

            <div className="custom-input-container">
              <ReactQuill
                value={eventDetails.additionalInfo || ''}
                onChange={(content) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    additionalInfo: content
                  }
                }))}
                modules={modules}
                placeholder="Any special requests or additional information florists should know..."
              />
              <label htmlFor="additionalInfo" className="custom-label">
                Additional Information
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="florist-stepper">
      <div className="sub-steps-indicator">
        {getSubSteps().map((step, index) => (
          <div
            key={index}
            className={`sub-step ${index === subStep ? 'active' : ''} 
                      ${index < subStep ? 'completed' : ''}`}
            onClick={() => setSubStep(index)}
          >
            {step}
          </div>
        ))}
      </div>
      <div className="florist-stepper-content">
        {renderSubStep()}
      </div>
      {isFlowerModalOpen && <FlowerModal photo={selectedFlower} onClose={() => setIsFlowerModalOpen(false)} />}
    </div>
  );
}

export default FloristStepper; 