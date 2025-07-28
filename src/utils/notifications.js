import { supabase } from '../supabaseClient';

export const sendNotification = async (userId, type, message) => {
  const { error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        type,
        message,
      },
    ]);

  if (error) {
    console.error('Error sending notification:', error);
    return false;
  }

  return true;
};

// Function to clear notifications for a user
export const clearNotifications = async (userId, notificationIds = null) => {
  try {
    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    // If specific notification IDs are provided, only delete those
    if (notificationIds) {
      query = query.in('id', Array.isArray(notificationIds) ? notificationIds : [notificationIds]);
    }

    const { error } = await query;

    if (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
};

export const notificationTypes = {
  NEW_REQUEST: 'new_request',
  SETUP_REMINDER: 'setup_reminder',
  BID_RESPONSE: 'bid_response',
  PAYMENT_RECEIVED: 'payment_received',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  CONTRACT_SIGNED: 'contract_signed',
  REVIEW_RECEIVED: 'review_received',
}; 