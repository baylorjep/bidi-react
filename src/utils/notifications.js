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