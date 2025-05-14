import { supabase } from '../../src/supabaseClient';
import { google } from 'googleapis';

const calendar = google.calendar('v3');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Log the incoming request body for debugging
  console.log('Received schedule consultation request:', req.body);
  console.log('Type of businessId:', typeof businessId, 'Value:', businessId);
  console.log('Type of bidId:', typeof bidId, 'Value:', bidId);
  console.log('Type of startTime:', typeof startTime, 'Value:', startTime);

  const { businessId, bidId, startTime, duration = 30 } = req.body;

  if (!businessId || !bidId || !startTime) {
    console.error('Missing required parameters:', { businessId, bidId, startTime });
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
    }    // Get bid details including request information
    console.log('Querying bids for id:', bidId);
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select(`
        id,
        customer_profiles (
          id,
          email,
          first_name,
          last_name
        ),
        requests (
          id,
          event_type,
          service_type
        )
      `)
      .eq('id', bidId)
      .single();
    console.log('Bid query result:', bid, 'Error:', bidError);

    if (bidError || !bid) {
      console.error('Bid not found:', bidError);
      return res.status(404).json({ message: 'Bid not found' });
    }    // Set up OAuth2 client
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
      summary: `Consultation: ${business.business_name} with ${bid.customer_profiles.first_name}`,
      description: `Consultation regarding ${bid.requests.service_type || bid.requests.event_type || 'services'}.\n\nThis meeting will take place on Google Meet. Click the link below to join at the scheduled time.`,
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
        { email: bid.customer_profiles.email }
      ],
      conferenceData: {
        createRequest: {
          requestId: `bidi-consultation-${bidId}`,
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
    });    // Store the event details in your database
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        bid_id: bidId,
        business_id: businessId,
        event_id: createdEvent.data.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        meet_link: createdEvent.data.hangoutLink || createdEvent.data.conferenceData?.entryPoints?.[0]?.uri,
        status: 'scheduled'
      })
      .select()
      .single();

    if (consultationError) {
      console.error('Error storing consultation:', consultationError);
      return res.status(500).json({ message: 'Error storing consultation details' });
    }    // Return success response with event details
    return res.status(200).json({
      message: 'Consultation scheduled successfully',
      consultation: {
        id: consultation.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        meetLink: consultation.meet_link,
        eventId: createdEvent.data.id
      }
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
