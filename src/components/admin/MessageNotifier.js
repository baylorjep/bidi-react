import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Alert, Badge } from 'react-bootstrap';
import './MessageNotifier.css';

function MessageNotifier() {
    const [messages, setMessages] = useState([]);
    const [userContacts, setUserContacts] = useState({});
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            // Get all messages that haven't been notified about
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .eq('notified', false)
                .order('created_at', { ascending: false });

            if (messagesError) throw messagesError;

            console.log('Raw messages data:', messagesData);

            // Get unique receiver IDs
            const receiverIds = [...new Set(messagesData.map(msg => msg.receiver_id))];
            console.log('Receiver IDs:', receiverIds);

            // Get receiver profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, email, role')
                .in('id', receiverIds);

            if (profilesError) throw profilesError;
            console.log('Profiles data:', profiles);

            // Create a map of user IDs to their roles
            const userRoles = profiles.reduce((acc, profile) => {
                acc[profile.id] = profile.role;
                return acc;
            }, {});
            console.log('User roles:', userRoles);

            // Fetch individual profiles
            const { data: individualProfiles, error: individualError } = await supabase
                .from('individual_profiles')
                .select('id, first_name, last_name, phone')
                .in('id', receiverIds);

            if (individualError) throw individualError;
            console.log('Individual profiles:', individualProfiles);

            // Fetch business profiles
            const { data: businessProfiles, error: businessError } = await supabase
                .from('business_profiles')
                .select('id, business_name, phone')
                .in('id', receiverIds);

            if (businessError) throw businessError;
            console.log('Business profiles:', businessProfiles);

            // Combine all the information
            const contacts = profiles.reduce((acc, profile) => {
                const role = userRoles[profile.id];
                let displayName = '';
                let phone = '';

                if (role === 'individual') {
                    const individualProfile = individualProfiles.find(p => p.id === profile.id);
                    displayName = individualProfile ? `${individualProfile.first_name} ${individualProfile.last_name}` : 'N/A';
                    phone = individualProfile?.phone || 'Not provided';
                } else if (role === 'business') {
                    const businessProfile = businessProfiles.find(p => p.id === profile.id);
                    displayName = businessProfile ? businessProfile.business_name : 'N/A';
                    phone = businessProfile?.phone || 'Not provided';
                }

                acc[profile.id] = {
                    email: profile.email,
                    displayName: displayName,
                    role: role,
                    phone: phone
                };
                return acc;
            }, {});

            console.log('Combined contacts:', contacts);
            setUserContacts(contacts);
            setMessages(messagesData);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleSendSMS = (receiverId) => {
        const contact = userContacts[receiverId];
        if (!contact) return;

        // Format phone number - remove any non-numeric characters
        const formattedPhone = contact.phone.replace(/\D/g, '');
        
        // If there's no phone number, show an alert
        if (!formattedPhone || formattedPhone === 'Not provided' || formattedPhone === 'Unknown') {
            alert('No phone number available for this user');
            return;
        }
        
        // Generate message template
        const message = `You have a new message on Bidi! Click here to view: https://www.savewithbidi.com/messages`;
        
        // Create the sms link
        const smsLink = `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
        
        // Open the link
        window.open(smsLink, '_blank');
    };

    const markMessageAsNotified = async (messageId) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ notified: true })
                .eq('id', messageId);

            if (error) throw error;

            // Update local state
            setMessages(prevMessages => 
                prevMessages.filter(msg => msg.id !== messageId)
            );

            setSuccessMessage('Message marked as notified successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error marking message as notified:', error);
            setError('Failed to mark message as notified');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) return <div>Loading messages...</div>;

    return (
        <div className="message-notifier-container">
            <div className="header-actions">
                <h3 className="section-title">
                    Unnotified Messages
                    <Badge bg="danger" className="count-badge">
                        {messages.length}
                    </Badge>
                </h3>
                <button 
                    className="refresh-button" 
                    onClick={fetchMessages}
                >
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            {messages.length === 0 ? (
                <div className="alert alert-info">
                    No unnotified messages at the moment.
                </div>
            ) : (
                <div className="messages-list">
                    {messages.map(message => {
                        const contact = userContacts[message.receiver_id];
                        console.log('Rendering message:', message);
                        console.log('Contact for message:', contact);
                        return (
                            <div key={message.id} className="message-card">
                                <div className="message-header">
                                    <h5 className="recipient-name">
                                        {contact ? contact.displayName : 'Unknown User'}
                                        <small className="user-type">({contact?.role || 'unknown'})</small>
                                    </h5>
                                    <span className="message-time">
                                        {new Date(message.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="message-body">
                                    <div className="message-content">
                                        <p className="message-text">{message.message}</p>
                                    </div>
                                    <div className="contact-info">
                                        <p><strong>Email:</strong> {contact?.email || 'N/A'}</p>
                                        <p><strong>Phone:</strong> {contact?.phone || 'Not provided'}</p>
                                    </div>
                                    <div className="action-buttons">
                                        <button
                                            className="sms-button"
                                            onClick={() => handleSendSMS(message.receiver_id)}
                                            disabled={!contact?.phone || contact.phone === 'Not provided'}
                                        >
                                            <i className="fas fa-sms"></i> Send Text
                                        </button>
                                        <button
                                            className="mark-button"
                                            onClick={() => markMessageAsNotified(message.id)}
                                        >
                                            Mark as Notified
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MessageNotifier; 