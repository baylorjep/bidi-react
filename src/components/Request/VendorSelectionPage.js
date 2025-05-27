import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import VendorList from '../Vendor/VendorList';

function VendorSelectionPage() {
  const { categoryId, requestId } = useParams();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVendors, setSelectedVendors] = useState([]);

  useEffect(() => {
    fetchVendors();
  }, [categoryId]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // Fetch vendors based on the category
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('category', categoryId);

      if (error) throw error;
      setVendors(data || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSelect = async (vendorId) => {
    try {
      // Add vendor to selected vendors
      setSelectedVendors(prev => [...prev, vendorId]);

      // Update the request with the selected vendor
      const { error } = await supabase
        .from(`${categoryId}_requests`)
        .update({ selected_vendors: [...selectedVendors, vendorId] })
        .eq('id', requestId);

      if (error) throw error;

      // Send notification to the vendor
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: vendorId,
          type: 'new_request',
          message: `You have been selected for a new ${categoryId} request!`,
          request_id: requestId,
          category: categoryId
        }]);

      if (notificationError) throw notificationError;
    } catch (err) {
      console.error('Error selecting vendor:', err);
      setError('Failed to select vendor. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ 
          color: '#9633eb', 
          fontSize: '18px', 
          fontWeight: 600 
        }}>
          Loading vendors...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ 
          color: '#dc3545', 
          fontSize: '18px', 
          fontWeight: 600 
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '32px 16px' 
    }}>
      <h1 style={{ 
        color: '#9633eb', 
        fontSize: '32px', 
        fontWeight: 800, 
        marginBottom: '24px' 
      }}>
        Select Vendors for Your {categoryId.charAt(0).toUpperCase() + categoryId.slice(1)} Request
      </h1>

      <div style={{ 
        background: '#fff', 
        borderRadius: '16px', 
        padding: '24px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
      }}>
        <VendorList
          vendors={vendors}
          selectedVendors={selectedVendors}
          onVendorSelect={handleVendorSelect}
          category={categoryId}
        />
      </div>
    </div>
  );
}

export default VendorSelectionPage; 