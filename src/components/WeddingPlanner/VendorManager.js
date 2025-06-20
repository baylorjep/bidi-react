import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import './VendorManager.css';

function VendorManager({ weddingData, onUpdate, compact = false }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const navigate = useNavigate();

  const vendorCategories = [
    { id: 'photography', name: 'Photography', icon: 'fas fa-camera', color: '#667eea' },
    { id: 'videography', name: 'Videography', icon: 'fas fa-video', color: '#764ba2' },
    { id: 'catering', name: 'Catering', icon: 'fas fa-utensils', color: '#f093fb' },
    { id: 'dj', name: 'DJ & Music', icon: 'fas fa-music', color: '#4facfe' },
    { id: 'florist', name: 'Florist', icon: 'fas fa-flower', color: '#43e97b' },
    { id: 'beauty', name: 'Hair & Makeup', icon: 'fas fa-spa', color: '#fa709a' },
    { id: 'venue', name: 'Venue', icon: 'fas fa-building', color: '#a8edea' },
    { id: 'transportation', name: 'Transportation', icon: 'fas fa-car', color: '#ffecd2' },
    { id: 'officiant', name: 'Officiant', icon: 'fas fa-pray', color: '#fc466b' },
    { id: 'decor', name: 'Decor & Rentals', icon: 'fas fa-palette', color: '#ff9a9e' }
  ];

  useEffect(() => {
    if (weddingData) {
      loadVendors();
    }
  }, [weddingData]);

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_vendors')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setLoading(false);
    }
  };

  const addVendor = async (vendorData) => {
    try {
      const { data, error } = await supabase
        .from('wedding_vendors')
        .insert([{
          wedding_id: weddingData.id,
          ...vendorData,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setVendors([data, ...vendors]);
      setShowAddVendor(false);
      toast.success('Vendor added successfully!');
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast.error('Failed to add vendor');
    }
  };

  const updateVendorStatus = async (vendorId, status) => {
    try {
      const { error } = await supabase
        .from('wedding_vendors')
        .update({ status })
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(vendors.map(vendor => 
        vendor.id === vendorId ? { ...vendor, status } : vendor
      ));
      toast.success('Vendor status updated!');
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast.error('Failed to update vendor status');
    }
  };

  const deleteVendor = async (vendorId) => {
    try {
      const { error } = await supabase
        .from('wedding_vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(vendors.filter(vendor => vendor.id !== vendorId));
      toast.success('Vendor removed successfully!');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to remove vendor');
    }
  };

  const requestBidsFromVendors = (category) => {
    // Navigate to the existing request form system
    const categoryMap = {
      'photography': '/photography-request',
      'videography': '/videography-request',
      'catering': '/catering-request',
      'dj': '/dj-request',
      'florist': '/florist-request',
      'beauty': '/hair-and-makeup-request'
    };

    const requestPath = categoryMap[category.id];
    if (requestPath) {
      navigate(requestPath, {
        state: {
          weddingData: weddingData,
          category: category
        }
      });
    } else {
      // For categories without specific request forms, use the master request flow
      navigate('/master-request-flow', {
        state: {
          weddingData: weddingData,
          selectedCategory: category
        }
      });
    }
  };

  const getVendorsByCategory = (categoryId) => {
    return vendors.filter(vendor => vendor.category === categoryId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'declined': return '#ef4444';
      case 'contacted': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return 'fas fa-check-circle';
      case 'pending': return 'fas fa-clock';
      case 'declined': return 'fas fa-times-circle';
      case 'contacted': return 'fas fa-phone';
      default: return 'fas fa-question-circle';
    }
  };

  if (compact) {
    const confirmedVendors = vendors.filter(v => v.status === 'confirmed').length;
    const totalVendors = vendors.length;
    
    return (
      <div className="vendor-manager-compact">
        <div className="vendor-summary">
          <div className="vendor-count">
            <span className="count-number">{confirmedVendors}</span>
            <span className="count-label">Confirmed</span>
          </div>
          <div className="vendor-count">
            <span className="count-number">{totalVendors}</span>
            <span className="count-label">Total</span>
          </div>
        </div>
        <div className="vendor-progress">
          <div 
            className="progress-bar" 
            style={{ width: `${totalVendors > 0 ? (confirmedVendors / totalVendors) * 100 : 0}%` }}
          ></div>
        </div>
        <button 
          className="add-vendor-btn-compact"
          onClick={() => setShowAddVendor(true)}
        >
          <i className="fas fa-plus"></i>
          Add Vendor
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="vendor-manager-loading">
        <div className="loading-spinner"></div>
        <p>Loading vendors...</p>
      </div>
    );
  }

  return (
    <div className="vendor-manager">
      <div className="vendor-manager-header">
        <h2>Vendor Management</h2>
        <button 
          className="add-vendor-btn"
          onClick={() => setShowAddVendor(true)}
        >
          <i className="fas fa-plus"></i>
          Add Vendor
        </button>
      </div>

      <div className="vendor-categories">
        {vendorCategories.map(category => {
          const categoryVendors = getVendorsByCategory(category.id);
          const confirmedCount = categoryVendors.filter(v => v.status === 'confirmed').length;
          
          return (
            <div key={category.id}>
              <div 
                className={`vendor-category ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              >
                <div className="category-icon" style={{ backgroundColor: category.color }}>
                  <i className={category.icon}></i>
                </div>
                <div className="category-info">
                  <h3>{category.name}</h3>
                  <p>{categoryVendors.length} vendors • {confirmedCount} confirmed</p>
                </div>
                <div className="category-actions">
                  <button 
                    className="request-bids-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestBidsFromVendors(category);
                    }}
                  >
                    Request Bids
                  </button>
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
              
              {selectedCategory === category.id && (
                <div className="vendor-list">
                  <h3>{category.name} Vendors</h3>
                  {categoryVendors.length === 0 ? (
                    <div className="no-vendors">
                      <p>No vendors added yet.</p>
                      <button 
                        className="request-bids-btn"
                        onClick={() => requestBidsFromVendors(category)}
                      >
                        Request Bids from Vendors
                      </button>
                    </div>
                  ) : (
                    <div className="vendors-grid">
                      {categoryVendors.map(vendor => (
                        <div key={vendor.id} className="vendor-card">
                          <div className="vendor-header">
                            <div className="vendor-info">
                              <h4>{vendor.name}</h4>
                              <p>{vendor.contact_info}</p>
                            </div>
                            <div className="vendor-status">
                              <span 
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(vendor.status) }}
                              >
                                <i className={getStatusIcon(vendor.status)}></i>
                                {vendor.status}
                              </span>
                            </div>
                          </div>
                          
                          {vendor.notes && (
                            <div className="vendor-notes">
                              <p>{vendor.notes}</p>
                            </div>
                          )}
                          
                          <div className="vendor-actions">
                            <select 
                              value={vendor.status}
                              onChange={(e) => updateVendorStatus(vendor.id, e.target.value)}
                              className="status-select"
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="declined">Declined</option>
                            </select>
                            
                            <button 
                              className="delete-vendor-btn"
                              onClick={() => deleteVendor(vendor.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAddVendor && (
        <div className="modal-overlay" onClick={() => setShowAddVendor(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Vendor</h3>
            <AddVendorForm 
              onSubmit={addVendor}
              onCancel={() => setShowAddVendor(false)}
              categories={vendorCategories}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Add Vendor Form Component
function AddVendorForm({ onSubmit, onCancel, categories }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    contact_info: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="add-vendor-form">
      <div className="form-group">
        <label htmlFor="name">Vendor Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="contact_info">Contact Information</label>
        <input
          type="text"
          id="contact_info"
          name="contact_info"
          value={formData.contact_info}
          onChange={handleChange}
          placeholder="Phone, email, or website"
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional notes about this vendor"
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
        <button type="submit" className="submit-btn">
          Add Vendor
        </button>
      </div>
    </form>
  );
}

export default VendorManager; 