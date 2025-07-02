import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './GuestListManager.css';

function GuestListManager({ weddingData, onUpdate, compact = false }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [showRSVPLinkModal, setShowRSVPLinkModal] = useState(false);
  const [rsvpLink, setRsvpLink] = useState('');
  const [rsvpLinkActive, setRsvpLinkActive] = useState(false);

  // Guest form state
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    group_name: '',
    rsvp_status: 'pending',
    dietary_restrictions: '',
    plus_one: false,
    plus_one_name: '',
    plus_one_dietary: '',
    notes: '',
    address: ''
  });

  // React Quill configuration
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const quillFormats = [
    'bold', 'italic', 'underline',
    'list', 'bullet'
  ];

  useEffect(() => {
    if (weddingData?.id) {
      loadGuests();
      loadRSVPLink();
    }
  }, [weddingData]);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wedding_guests')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Error loading guests:', error);
      toast.error('Failed to load guest list');
    } finally {
      setLoading(false);
    }
  };

  const loadRSVPLink = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_rsvp_links')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        setRsvpLink(`${window.location.origin}/rsvp/${data.link_id}`);
        setRsvpLinkActive(data.is_active);
      }
    } catch (error) {
      console.error('Error loading RSVP link:', error);
    }
  };

  const generateRSVPLink = async () => {
    try {
      const linkId = generateUniqueId();
      const { data, error } = await supabase
        .from('wedding_rsvp_links')
        .insert([{
          wedding_id: weddingData.id,
          link_id: linkId,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const fullLink = `${window.location.origin}/rsvp/${linkId}`;
      setRsvpLink(fullLink);
      setRsvpLinkActive(true);
      setShowRSVPLinkModal(true);
      toast.success('RSVP link created successfully!');
    } catch (error) {
      console.error('Error creating RSVP link:', error);
      toast.error('Failed to create RSVP link');
    }
  };

  const toggleRSVPLink = async () => {
    try {
      const { error } = await supabase
        .from('wedding_rsvp_links')
        .update({ is_active: !rsvpLinkActive })
        .eq('wedding_id', weddingData.id);

      if (error) throw error;

      setRsvpLinkActive(!rsvpLinkActive);
      toast.success(`RSVP link ${!rsvpLinkActive ? 'activated' : 'deactivated'}!`);
    } catch (error) {
      console.error('Error toggling RSVP link:', error);
      toast.error('Failed to update RSVP link status');
    }
  };

  const copyRSVPLink = async () => {
    try {
      await navigator.clipboard.writeText(rsvpLink);
      toast.success('RSVP link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const printMailingAddresses = () => {
    const guestsWithAddresses = guests.filter(guest => guest.address && guest.address.trim());
    
    if (guestsWithAddresses.length === 0) {
      toast.info('No guests have provided mailing addresses');
      return;
    }

    // Create printable content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mailing Addresses - ${weddingData.wedding_title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .guest-address { margin-bottom: 20px; page-break-inside: avoid; }
            .guest-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
            .address { font-size: 14px; line-height: 1.4; }
            .group { color: #666; font-size: 12px; margin-bottom: 5px; }
            .plus-one { color: #8b5cf6; font-size: 12px; margin-top: 5px; }
            @media print {
              body { margin: 0; }
              .guest-address { margin-bottom: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Mailing Addresses</h1>
            <h2>${weddingData.wedding_title}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          ${guestsWithAddresses.map(guest => `
            <div class="guest-address">
              ${guest.group_name ? `<div class="group">${guest.group_name}</div>` : ''}
              <div class="guest-name">${guest.name}</div>
              <div class="address">${guest.address.replace(/\n/g, '<br>')}</div>
              ${guest.plus_one && guest.plus_one_name ? `<div class="plus-one">+ ${guest.plus_one_name}</div>` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Helper function to strip HTML tags from React Quill content
  const stripHtmlTags = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const addGuest = async (e) => {
    e.preventDefault();
    try {
      const newGuest = {
        wedding_id: weddingData.id,
        name: guestForm.name,
        email: guestForm.email || null,
        phone: guestForm.phone || null,
        group_name: guestForm.group_name || null,
        rsvp_status: guestForm.rsvp_status,
        dietary_restrictions: guestForm.dietary_restrictions || null,
        plus_one: guestForm.plus_one,
        plus_one_name: guestForm.plus_one_name || null,
        plus_one_dietary: guestForm.plus_one_dietary || null,
        notes: guestForm.notes || null,
        address: guestForm.address || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('wedding_guests')
        .insert([newGuest])
        .select()
        .single();

      if (error) throw error;

      setGuests([...guests, data]);
      setShowAddGuest(false);
      resetForm();
      toast.success('Guest added successfully!');
    } catch (error) {
      console.error('Error adding guest:', error);
      toast.error('Failed to add guest');
    }
  };

  const updateGuest = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: guestForm.name,
        email: guestForm.email || null,
        phone: guestForm.phone || null,
        group_name: guestForm.group_name || null,
        rsvp_status: guestForm.rsvp_status,
        dietary_restrictions: guestForm.dietary_restrictions || null,
        plus_one: guestForm.plus_one,
        plus_one_name: guestForm.plus_one_name || null,
        plus_one_dietary: guestForm.plus_one_dietary || null,
        notes: guestForm.notes || null,
        address: guestForm.address || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('wedding_guests')
        .update(updateData)
        .eq('id', editingGuest.id);

      if (error) throw error;

      setGuests(guests.map(guest => 
        guest.id === editingGuest.id ? { ...guest, ...updateData } : guest
      ));
      setEditingGuest(null);
      resetForm();
      toast.success('Guest updated successfully!');
    } catch (error) {
      console.error('Error updating guest:', error);
      toast.error('Failed to update guest');
    }
  };

  const deleteGuest = async (guestId) => {
    if (!window.confirm('Are you sure you want to remove this guest?')) return;

    try {
      const { error } = await supabase
        .from('wedding_guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;

      setGuests(guests.filter(guest => guest.id !== guestId));
      toast.success('Guest removed successfully!');
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast.error('Failed to remove guest');
    }
  };

  const updateRSVPStatus = async (guestId, status) => {
    try {
      const { error } = await supabase
        .from('wedding_guests')
        .update({ 
          rsvp_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', guestId);

      if (error) throw error;

      setGuests(guests.map(guest => 
        guest.id === guestId ? { ...guest, rsvp_status: status } : guest
      ));
      toast.success('RSVP status updated!');
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error('Failed to update RSVP status');
    }
  };

  const resetForm = () => {
    setGuestForm({
      name: '',
      email: '',
      phone: '',
      group_name: '',
      rsvp_status: 'pending',
      dietary_restrictions: '',
      plus_one: false,
      plus_one_name: '',
      plus_one_dietary: '',
      notes: '',
      address: ''
    });
  };

  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setGuestForm({
      name: guest.name || '',
      email: guest.email || '',
      phone: guest.phone || '',
      group_name: guest.group_name || '',
      rsvp_status: guest.rsvp_status || 'pending',
      dietary_restrictions: guest.dietary_restrictions || '',
      plus_one: guest.plus_one || false,
      plus_one_name: guest.plus_one_name || '',
      plus_one_dietary: guest.plus_one_dietary || '',
      notes: guest.notes || '',
      address: guest.address || ''
    });
  };

  const handleImportGuests = async () => {
    try {
      const lines = importData.trim().split('\n');
      const newGuests = [];

      for (const line of lines) {
        const [fullName, email, group] = line.split(',').map(s => s.trim());
        if (fullName) {
          newGuests.push({
            wedding_id: weddingData.id,
            name: fullName,
            email: email || '',
            group_name: group || '',
            rsvp_status: 'pending',
            created_at: new Date().toISOString()
          });
        }
      }

      if (newGuests.length === 0) {
        toast.error('No valid guest data found');
        return;
      }

      const { data, error } = await supabase
        .from('wedding_guests')
        .insert(newGuests)
        .select();

      if (error) throw error;

      setGuests([...guests, ...data]);
      setShowImportModal(false);
      setImportData('');
      toast.success(`${data.length} guests imported successfully!`);
    } catch (error) {
      console.error('Error importing guests:', error);
      toast.error('Failed to import guests');
    }
  };

  // Filter and search guests
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || guest.rsvp_status === filterStatus;
    const matchesGroup = filterGroup === 'all' || guest.group_name === filterGroup;
    
    return matchesSearch && matchesStatus && matchesGroup;
  });

  // Get unique groups for filter
  const groups = [...new Set(guests.map(guest => guest.group_name).filter(Boolean))];

  // Calculate statistics
  const stats = {
    total: guests.length,
    attending: guests.filter(g => g.rsvp_status === 'attending').length,
    declined: guests.filter(g => g.rsvp_status === 'declined').length,
    not_sure: guests.filter(g => g.rsvp_status === 'not_sure').length,
    pending: guests.filter(g => g.rsvp_status === 'pending').length,
    plusOnes: guests.filter(g => g.plus_one).length
  };

  // Compact mode for overview
  if (compact) {
    return (
      <div className="guest-list-compact">
        <div className="guest-stats-compact">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.attending}</span>
            <span className="stat-label">Attending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        
        <div className="guest-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${stats.total > 0 ? (stats.attending / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {stats.attending} of {stats.total} responded
          </span>
        </div>

        <button 
          className="add-guest-btn-compact"
          onClick={() => setShowAddGuest(true)}
        >
          <i className="fas fa-plus"></i>
          Add Guest
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="guest-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading guest list...</p>
      </div>
    );
  }

  return (
    <div className="guest-list-manager">
      <div className="guest-list-header">
      <h2>Guest List Manager</h2>
        <div className="guest-actions">
          <button 
            className="print-addresses-btn"
            onClick={printMailingAddresses}
          >
            <i className="fas fa-print"></i>
            Print Addresses
          </button>
          <button 
            className="rsvp-link-btn"
            onClick={() => setShowRSVPLinkModal(true)}
          >
            <i className="fas fa-link"></i>
            RSVP Link
          </button>
          <button 
            className="add-guest-btn"
            onClick={() => setShowAddGuest(true)}
          >
            <i className="fas fa-plus"></i>
            Add Guest
          </button>
          <button 
            className="import-btn"
            onClick={() => setShowImportModal(true)}
          >
            <i className="fas fa-upload"></i>
            Import
          </button>
        </div>
      </div>

      {/* Guest Statistics */}
      <div className="guest-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Guests</div>
        </div>
        <div className="stat-card">
          <div className="stat-number attending">{stats.attending}</div>
          <div className="stat-label">Attending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number declined">{stats.declined}</div>
          <div className="stat-label">Declined</div>
        </div>
        <div className="stat-card">
          <div className="stat-number not-sure">{stats.not_sure}</div>
          <div className="stat-label">Not Sure</div>
        </div>
        <div className="stat-card">
          <div className="stat-number pending">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number plus-ones">{stats.plusOnes}</div>
          <div className="stat-label">Plus Ones</div>
        </div>
      </div>

      {/* Undecided Guests Notification */}
      {stats.not_sure > 0 && (
        <div className="undecided-guests-notification">
          <div className="notification-header">
            <i className="fas fa-question-circle"></i>
            <h3>Guests Need Follow-up</h3>
          </div>
          <p>You have <strong>{stats.not_sure}</strong> guest{stats.not_sure !== 1 ? 's' : ''} who marked themselves as "Not Sure". Consider reaching out to them to get a final confirmation.</p>
          <div className="notification-actions">
            <button 
              className="filter-not-sure-btn"
              onClick={() => setFilterStatus('not_sure')}
            >
              <i className="fas fa-filter"></i>
              View Undecided Guests
            </button>
            <button 
              className="email-reminder-btn"
              onClick={() => {
                // This could be expanded to send email reminders
                toast.info('Email reminder feature coming soon!');
              }}
            >
              <i className="fas fa-envelope"></i>
              Send Reminder Emails
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="guest-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All RSVP Status</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
            <option value="not_sure">Not Sure</option>
            <option value="pending">Pending</option>
          </select>
          
          <select 
            value={filterGroup} 
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="all">All Groups</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Guest List */}
      <div className="guest-list">
        {filteredGuests.length === 0 ? (
          <div className="no-guests">
            <i className="fas fa-users"></i>
            <h3>No guests found</h3>
            <p>Add your first guest to get started!</p>
            <button 
              className="add-first-guest-btn"
              onClick={() => setShowAddGuest(true)}
            >
              Add Your First Guest
            </button>
          </div>
        ) : (
          <div className="guests-grid">
            {filteredGuests.map(guest => (
              <div key={guest.id} className={`guest-card guest-card-${guest.rsvp_status}`}>
                <div className="guest-header">
                  <div className="guest-name">
                    <h4>
                      {guest.name}
                      {guest.plus_one && guest.plus_one_name && (
                        <span className="plus-one-badge">+ {guest.plus_one_name}</span>
                      )}
                    </h4>
                    {guest.group_name && (
                      <span className="group-badge">{guest.group_name}</span>
                    )}
                  </div>
                  <div className="guest-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditGuest(guest)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="delete-btn-guest-list-manager"
                      onClick={() => deleteGuest(guest.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                
                <div className="guest-info">
                  {guest.email && (
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span>{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="info-item">
                      <span className="info-label">Phone:</span>
                      <span>{guest.phone}</span>
                    </div>
                  )}
                  {guest.address && (
                    <div className="info-item">
                      <span className="info-label">Address:</span>
                      <span>{guest.address}</span>
                    </div>
                  )}
                  {guest.dietary_restrictions && (
                    <div className="info-item">
                      <span className="info-label">Dietary:</span>
                      <span>{stripHtmlTags(guest.dietary_restrictions)}</span>
                    </div>
                  )}
                  {guest.plus_one && guest.plus_one_dietary && (
                    <div className="info-item">
                      <span className="info-label">Plus One Dietary:</span>
                      <span>{stripHtmlTags(guest.plus_one_dietary)}</span>
                    </div>
                  )}
                  {guest.notes && (
                    <div className="info-item">
                      <span className="info-label">Notes:</span>
                      <span>{stripHtmlTags(guest.notes)}</span>
                    </div>
                  )}
                </div>
                
                <div className="rsvp-section">
                  <div className="rsvp-status">
                    <span className={`status-badge ${guest.rsvp_status}`}>
                      {guest.rsvp_status === 'not_sure' ? 'Not Sure' : guest.rsvp_status}
                    </span>
                  </div>
                  <div className="rsvp-actions">
                    <button 
                      className={`rsvp-btn attending ${guest.rsvp_status === 'attending' ? 'active' : ''}`}
                      onClick={() => updateRSVPStatus(guest.id, 'attending')}
                      title="Mark as Attending"
                    >
                      <i className="fas fa-check"></i>
                    </button>
                    <button 
                      className={`rsvp-btn not-sure ${guest.rsvp_status === 'not_sure' ? 'active' : ''}`}
                      onClick={() => updateRSVPStatus(guest.id, 'not_sure')}
                      title="Mark as Not Sure"
                    >
                      <i className="fas fa-question"></i>
                    </button>
                    <button 
                      className={`rsvp-btn declined ${guest.rsvp_status === 'declined' ? 'active' : ''}`}
                      onClick={() => updateRSVPStatus(guest.id, 'declined')}
                      title="Mark as Declined"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Guest Modal */}
      {(showAddGuest || editingGuest) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingGuest ? 'Edit Guest' : 'Add New Guest'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddGuest(false);
                  setEditingGuest(null);
                  resetForm();
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={editingGuest ? updateGuest : addGuest} style={{marginTop: '200px'}}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({...guestForm, name: e.target.value})}
                  placeholder="e.g., John Doe"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={guestForm.email}
                    onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Group</label>
                  <input
                    type="text"
                    value={guestForm.group_name}
                    onChange={(e) => setGuestForm({...guestForm, group_name: e.target.value})}
                    placeholder="e.g., Family, Friends, Colleagues"
                  />
                </div>
                <div className="form-group">
                  <label>RSVP Status</label>
                  <select
                    value={guestForm.rsvp_status}
                    onChange={(e) => setGuestForm({...guestForm, rsvp_status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="attending">Attending</option>
                    <option value="not_sure">Not Sure</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Dietary Restrictions</label>
                <ReactQuill
                  value={guestForm.dietary_restrictions}
                  onChange={(value) => setGuestForm({...guestForm, dietary_restrictions: value})}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="e.g., Vegetarian, Gluten-free, Allergies"
                />
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={guestForm.address}
                  onChange={(e) => setGuestForm({...guestForm, address: e.target.value})}
                  placeholder="Mailing address for invitations"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={guestForm.plus_one}
                    onChange={(e) => setGuestForm({...guestForm, plus_one: e.target.checked})}
                  />
                  Plus One
                </label>
              </div>
              
              {guestForm.plus_one && (
                <>
                  <div className="form-group">
                    <label>Plus One Name</label>
                    <input
                      type="text"
                      value={guestForm.plus_one_name}
                      onChange={(e) => setGuestForm({...guestForm, plus_one_name: e.target.value})}
                      placeholder="Name of plus one"
                    />
                  </div>
                  <div className="form-group">
                    <label>Plus One Dietary Restrictions</label>
                    <ReactQuill
                      value={guestForm.plus_one_dietary}
                      onChange={(value) => setGuestForm({...guestForm, plus_one_dietary: value})}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="e.g., Vegetarian, Gluten-free, Allergies"
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label>Notes</label>
                <ReactQuill
                  value={guestForm.notes}
                  onChange={(value) => setGuestForm({...guestForm, notes: value})}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Any additional notes about this guest"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddGuest(false);
                    setEditingGuest(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingGuest ? 'Update Guest' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RSVP Link Modal */}
      {showRSVPLinkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>RSVP Link</h3>
              <button 
                className="close-btn"
                onClick={() => setShowRSVPLinkModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="rsvp-link-content">
              {!rsvpLink ? (
                <div className="create-rsvp-link">
                  <div className="rsvp-link-info">
                    <i className="fas fa-link"></i>
                    <h4>Create RSVP Link</h4>
                    <p>Generate a public link that your guests can use to RSVP directly without needing to log in.</p>
                  </div>
                  <button 
                    className="create-link-btn"
                    onClick={generateRSVPLink}
                  >
                    <i className="fas fa-plus"></i>
                    Create RSVP Link
                  </button>
                </div>
              ) : (
                <div className="rsvp-link-details">
                  <div className="link-status">
                    <span className={`status-indicator ${rsvpLinkActive ? 'active' : 'inactive'}`}>
                      {rsvpLinkActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="link-display">
                    <label>RSVP Link</label>
                    <div className="link-input-group">
                      <input
                        type="text"
                        value={rsvpLink}
                        readOnly
                        className="link-input"
                      />
                      <button 
                        className="copy-btn"
                        onClick={copyRSVPLink}
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="link-actions">
                    <button 
                      className={`toggle-btn ${rsvpLinkActive ? 'deactivate' : 'activate'}`}
                      onClick={toggleRSVPLink}
                    >
                      <i className={`fas fa-${rsvpLinkActive ? 'pause' : 'play'}`}></i>
                      {rsvpLinkActive ? 'Deactivate Link' : 'Activate Link'}
                    </button>
                    
                    <div className="link-sharing">
                      <h5>Share with your guests:</h5>
                      <div className="share-options">
                        <button 
                          className="share-btn email"
                          onClick={() => window.open(`mailto:?subject=RSVP for ${weddingData.wedding_title}&body=Please RSVP for our wedding using this link: ${rsvpLink}`)}
                        >
                          <i className="fas fa-envelope"></i>
                          Email
                        </button>
                        <button 
                          className="share-btn whatsapp"
                          onClick={() => window.open(`https://wa.me/?text=Please RSVP for our wedding using this link: ${rsvpLink}`)}
                        >
                          <i className="fab fa-whatsapp"></i>
                          WhatsApp
                        </button>
                        <button 
                          className="share-btn sms"
                          onClick={() => window.open(`sms:?body=Please RSVP for our wedding using this link: ${rsvpLink}`)}
                        >
                          <i className="fas fa-sms"></i>
                          SMS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Import Guest List</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowImportModal(false);
                  setImportData('');
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="import-instructions">
              <p>Import guests from a CSV format. Each line should contain:</p>
              <p><strong>Full Name, Email, Group</strong></p>
              <p>Example:</p>
              <pre>John Doe, john@email.com, Family
Jane Smith, jane@email.com, Friends</pre>
            </div>
            
            <div className="form-group">
              <label>Guest Data</label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your guest data here..."
                rows="10"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowImportModal(false);
                  setImportData('');
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="submit-btn"
                onClick={handleImportGuests}
              >
                Import Guests
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestListManager;