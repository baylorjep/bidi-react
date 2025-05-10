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
            console.log('Fetching messages...');
            
            // Get all messages that haven't been notified about AND haven't been seen
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .or('notified.is.null,notified.eq.false')
                .or('seen.is.null,seen.eq.false')
                .order('created_at', { ascending: false });

            if (messagesError) {
                console.error('Error fetching messages:', messagesError);
                throw messagesError;
            }

            console.log('Fetched unnotified and unseen messages:', messagesData);

            if (!messagesData || messagesData.length === 0) {
                console.log('No unnotified and unseen messages found');
                setMessages([]);
                setLoading(false);
                return;
            }

            // Get unique user IDs (both sender and receiver)
            const userIds = [...new Set([
                ...messagesData.map(msg => msg.sender_id),
                ...messagesData.map(msg => msg.receiver_id)
            ])];

            console.log('User IDs to fetch:', userIds);

            // Get all relevant profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, email, role')
                .in('id', userIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                throw profilesError;
            }

            console.log('Fetched profiles:', profiles);

            // Create a map of user IDs to their roles
            const userRoles = profiles.reduce((acc, profile) => {
                acc[profile.id] = profile.role;
                return acc;
            }, {});

            // Fetch individual profiles
            const { data: individualProfiles, error: individualError } = await supabase
                .from('individual_profiles')
                .select('id, first_name, last_name, phone')
                .in('id', userIds);

            if (individualError) {
                console.error('Error fetching individual profiles:', individualError);
                throw individualError;
            }

            console.log('Fetched individual profiles:', individualProfiles);

            // Fetch business profiles
            const { data: businessProfiles, error: businessError } = await supabase
                .from('business_profiles')
                .select('id, business_name, phone')
                .in('id', userIds);

            if (businessError) {
                console.error('Error fetching business profiles:', businessError);
                throw businessError;
            }

            console.log('Fetched business profiles:', businessProfiles);

            // Fetch wedding planning requests for context
            const { data: weddingPlanningRequests, error: weddingPlanningError } = await supabase
                .from('wedding_planning_requests')
                .select('id, user_id, event_title, status')
                .in('user_id', userIds);

            if (weddingPlanningError) {
                console.error('Error fetching wedding planning requests:', weddingPlanningError);
                throw weddingPlanningError;
            }

            console.log('Fetched wedding planning requests:', weddingPlanningRequests);

            // Combine all the information
            const contacts = userIds.reduce((acc, userId) => {
                const role = userRoles[userId];
                let displayName = '';
                let phone = '';

                if (role === 'individual') {
                    const individualProfile = individualProfiles.find(p => p.id === userId);
                    displayName = individualProfile ? `${individualProfile.first_name} ${individualProfile.last_name}` : 'N/A';
                    phone = individualProfile?.phone || 'Not provided';
                } else if (role === 'business') {
                    const businessProfile = businessProfiles.find(p => p.id === userId);
                    displayName = businessProfile ? businessProfile.business_name : 'N/A';
                    phone = businessProfile?.phone || 'Not provided';
                } else if (role === 'both') {
                    // For 'both' role, check both profiles and use business info if available
                    const businessProfile = businessProfiles.find(p => p.id === userId);
                    const individualProfile = individualProfiles.find(p => p.id === userId);
                    
                    // Prefer business name if available, otherwise use individual name
                    displayName = businessProfile?.business_name || 
                                 (individualProfile ? `${individualProfile.first_name} ${individualProfile.last_name}` : 'N/A');
                    
                    // Prefer business phone if available, otherwise use individual phone
                    phone = businessProfile?.phone || individualProfile?.phone || 'Not provided';
                    
                    console.log('Both role user profiles:', {
                        userId,
                        businessProfile,
                        individualProfile,
                        finalDisplayName: displayName,
                        finalPhone: phone
                    });
                }

                // Add wedding planning request context if available
                const userWeddingRequests = weddingPlanningRequests?.filter(req => req.user_id === userId) || [];
                const weddingRequestContext = userWeddingRequests.length > 0 
                    ? ` (${userWeddingRequests.length} wedding planning request${userWeddingRequests.length > 1 ? 's' : ''})`
                    : '';

                acc[userId] = {
                    email: profiles.find(p => p.id === userId)?.email || 'N/A',
                    displayName: displayName + weddingRequestContext,
                    role: role,
                    phone: phone
                };
                console.log('Contact info for user', userId, ':', acc[userId]);
                return acc;
            }, {});

            console.log('Combined contacts:', contacts);
            setUserContacts(contacts);
            setMessages(messagesData);
        } catch (error) {
            console.error('Error in fetchMessages:', error);
            setError('Failed to fetch messages: ' + error.message);
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

        const formattedPhone = contact.phone.replace(/\D/g, '');
        
        if (!formattedPhone || formattedPhone === 'Not provided' || formattedPhone === 'Unknown') {
            alert('No phone number available for this user');
            return;
        }
        
        const message = `You have new messages on Bidi! Click here to view: https://www.savewithbidi.com/messages`;
        const smsLink = `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
        window.open(smsLink, '_blank');
    };

    const markMessageAsNotified = async (messageId) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ notified: true })
                .eq('id', messageId);

            if (error) throw error;

            setMessages(prevMessages => 
                prevMessages.filter(msg => msg.id !== messageId)
            );

            setSuccessMessage('Message marked as notified successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error marking message as notified:', error);
            setError('Failed to mark message as notified: ' + error.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Group messages by sender-receiver pairs
    const groupedMessages = messages.reduce((groups, message) => {
        // Use the original sender and receiver IDs in the key
        const key = `${message.sender_id}-${message.receiver_id}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(message);
        return groups;
    }, {});

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
                    {Object.entries(groupedMessages).map(([key, messageGroup]) => {
                        // Get the first message to determine sender and receiver
                        const firstMessage = messageGroup[0];
                        const sender = userContacts[firstMessage.sender_id];
                        const receiver = userContacts[firstMessage.receiver_id];
                        
                        return (
                            <div key={key} className="message-group">
                                <div className="message-header">
                                    <div className="message-participants">
                                        <div className="sender-info">
                                            <h5 className="participant-name">
                                                From: {sender ? sender.displayName : 'Unknown User'}
                                                <small className="user-type">({sender?.role || 'unknown'})</small>
                                            </h5>
                                        </div>
                                        <div className="receiver-info">
                                            <h5 className="participant-name">
                                                To: {receiver ? receiver.displayName : 'Unknown User'}
                                                <small className="user-type">({receiver?.role || 'unknown'})</small>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="message-status">
                                        <span className="message-time">
                                            {new Date(messageGroup[0].created_at).toLocaleString()}
                                        </span>
                                        {messageGroup.some(msg => !msg.seen) && (
                                            <Badge bg="warning" className="status-badge">
                                                Unseen
                                            </Badge>
                                        )}
                                        {messageGroup.some(msg => !msg.notified) && (
                                            <Badge bg="danger" className="status-badge">
                                                Unnotified
                                            </Badge>
                                        )}
                                        <Badge bg="info" className="count-badge">
                                            {messageGroup.length} message{messageGroup.length > 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="message-body">
                                    <div className="message-content">
                                        {messageGroup.map(message => (
                                            <div key={message.id} className="message-text-container">
                                                <p className="message-text">{message.message}</p>
                                                <small className="message-time">
                                                    {new Date(message.created_at).toLocaleString()}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="contact-info">
                                        <div className="sender-details">
                                            <p><strong>Sender Email:</strong> {sender?.email || 'N/A'}</p>
                                            <p><strong>Sender Phone:</strong> {sender?.phone || 'Not provided'}</p>
                                        </div>
                                        <div className="receiver-details">
                                            <p><strong>Receiver Email:</strong> {receiver?.email || 'N/A'}</p>
                                            <p><strong>Receiver Phone:</strong> {receiver?.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="action-buttons">
                                        <button
                                            className="sms-button"
                                            onClick={() => handleSendSMS(firstMessage.receiver_id)}
                                            disabled={!receiver?.phone || receiver.phone === 'Not provided'}
                                        >
                                            <i className="fas fa-sms"></i> Send Text
                                        </button>
                                        <button
                                            className="mark-button"
                                            onClick={() => messageGroup.forEach(msg => markMessageAsNotified(msg.id))}
                                        >
                                            Mark All as Notified
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