import { supabase } from '../../src/supabaseClient';
import { google } from 'googleapis';

const calendar = google.calendar('v3');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { businessId, date } = req.query;

  if (!businessId || !date) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD' });
  }

  try {
    console.log('Received request for availability:', { businessId, date });
    
    // Get the business's Google Calendar credentials
    const { data: business, error } = await supabase
      .from('business_profiles')
      .select('google_calendar_token, google_calendar_refresh_token')
      .eq('id', businessId)
      .single();

    console.log('Business data:', {
      hasToken: !!business?.google_calendar_token,
      hasRefreshToken: !!business?.google_calendar_refresh_token,
      error: error?.message
    });

    if (error || !business) {
      return res.status(404).json({ message: 'Business not found or calendar not connected' });
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: business.google_calendar_token?.access_token,
      refresh_token: business.google_calendar_refresh_token
    });

    // Get the start and end of the requested date
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0); // Start at 9 AM
    console.log('Start date:', startDate.toISOString());

    // FOR TESTING: Generate mock available slots for the selected date
    const availableSlots = [];
    let currentSlot = new Date(startDate);    // Generate slots every 30 minutes from 9 AM to 5 PM in the business's timezone
    const businessTimeZone = 'America/Denver'; // You might want to make this configurable per business
    for (let hour = 9; hour < 17; hour++) {
      for (let minute of [0, 30]) {
        currentSlot = new Date(startDate);
        currentSlot.setHours(hour, minute, 0, 0);
        // Convert to UTC for consistency
        availableSlots.push(currentSlot.toISOString());
      }    }
    console.log('Generated slots:', availableSlots);
    return res.status(200).json({
      events: availableSlots,  // Changed to match what the frontend is receiving
      timezone: businessTimeZone
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return res.status(500).json({ message: 'Error fetching availability', error: error.message });
  }
}
