import { supabase } from '../../src/supabaseClient';
import { google } from 'googleapis';

const calendar = google.calendar('v3');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Log the incoming request body for debugging
  console.log('Received schedule consultation request:', req.body);

  const { businessId, startTime, duration = 30, customerEmail, customerName } = req.body;

  if (!businessId || !startTime || !customerEmail || !customerName) {
    console.error('Missing required parameters:', { businessId, startTime, customerEmail, customerName });
    return res.status(400).json({ message: 'Missing required parameters', received: req.body });
  }

  try {
    // Get the business's Google Calendar credentials and details
    console.log('Querying business_profiles for id:', businessId);
    const { data: business, error: businessError } = await supabase
      .from('business_profiles')
      .select(`
        id,
        business_name,
        google_calendar_token,
        google_calendar_refresh_token,
        profile:profiles (
          email
        )
      `)
      .eq('id', businessId)
      .single();
    console.log('Business query result:', business, 'Error:', businessError);

    if (businessError || !business) {
      console.error('Business not found or calendar not connected:', businessError);
      return res.status(404).json({ message: 'Business not found or calendar not connected' });
    }

    // Set up OAuth2 client
    console.log('Setting up OAuth2 client with business email:', business.profile?.email);
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: business.google_calendar_token?.access_token,
      refresh_token: business.google_calendar_refresh_token
    });
    console.log('OAuth2 credentials set.');

    // Set up calendar client
    const calendarClient = google.calendar({ version: 'v3', auth: oauth2Client });

    // Calculate start and end times
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    console.log('Scheduling event from', start.toISOString(), 'to', end.toISOString());

    // Create event with Google Meet
    const eventDetails = {
      summary: `Consultation: ${business.business_name} with ${customerName}`,
      description: `Consultation regarding services.\n\nThis meeting will take place on Google Meet. Click the link below to join at the scheduled time.`,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'America/Denver',
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'America/Denver',
      },
      attendees: [
        { email: business.profile?.email },
        { email: customerEmail },
        { email: 'savewithbidi@gmail.com' }
      ],
      conferenceData: {
        createRequest: {
          requestId: `bidi-consultation-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 10 }
        ]
      }
    };

    // Create the calendar event
    const createdEvent = await calendarClient.events.insert({
      calendarId: 'primary',
      resource: eventDetails,
      conferenceDataVersion: 1,
      sendUpdates: 'all'  // Send emails to attendees
    });

    // Return success response with event details
    return res.status(200).json({
      message: 'Consultation scheduled successfully',
      eventId: createdEvent.data.id,
      meetLink: createdEvent.data.hangoutLink || createdEvent.data.conferenceData?.entryPoints?.[0]?.uri,
      startTime: start.toISOString(),
      endTime: end.toISOString()
    });
    
  } catch (error) {
    console.error('Error creating calendar event:', error);
    
    // Check for specific Google Calendar API errors
    if (error.code === 401) {
      return res.status(401).json({ message: 'Calendar authorization expired. Please reconnect your Google Calendar.' });
    } else if (error.code === 403) {
      return res.status(403).json({ message: 'Calendar access denied. Please check your calendar permissions.' });
    }

    return res.status(500).json({ 
      message: 'Error creating calendar event',
      error: error.message
    });
  }
}
