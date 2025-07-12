import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import posthog from 'posthog-js';
import RotatingText from './Layout/RotatingText';
// Video will be served from public folder
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import '../styles/animations.css';
import '../styles/WeddingPlannerHomepage.css';
import { Helmet } from 'react-helmet';
import AnimatedNumber from './AnimatedNumber';
import WeddingPlanningVideo from '../assets/Wedding Planning Video V2.mp4';

// Import real dashboard components
import WeddingOverview from './WeddingPlanner/WeddingOverview';

// Initialize PostHog for client-side tracking
posthog.init('phc_I6vGPSJc5Uj1qZwGyizwTLCqZyRqgMzAg0HIjUHULSh', {
    api_host: 'https://us.i.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });
  
function WeddingPlannerHomepage() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [stats, setStats] = useState({
    weddings: 0,
    tasks: 0,
    vendors: 0
  });

  // Mock wedding data for the demo
  const mockWeddingData = {
    id: 'demo-wedding-123',
    user_id: 'demo-user-123',
    wedding_date: '2024-06-15',
    wedding_location: 'Salt Lake City, Utah',
    couple_name: 'Sarah & Mike',
    budget: 25000,
    guest_count: 150,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00Z'
  };

  // Mock function to handle navigation (does nothing in demo)
  const handleDemoNavigation = (tab) => {
    // In demo, this could show a toast or modal explaining the feature
    console.log(`Demo navigation to: ${tab}`);
  };

  // Mock data for the demo - this would normally come from the database
  const mockBudgetItems = [
    { id: 1, wedding_id: 'demo-wedding-123', category: 'photography', name: 'Sarah Johnson Photography', planned_cost: 3500, actual_cost: 3500, notes: 'Full day coverage + engagement session', created_at: '2024-01-15T00:00:00Z' },
    { id: 2, wedding_id: 'demo-wedding-123', category: 'catering', name: 'Elegant Events Catering', planned_cost: 8500, actual_cost: 8200, notes: '150 guests, 3-course meal', created_at: '2024-01-20T00:00:00Z' },
    { id: 3, wedding_id: 'demo-wedding-123', category: 'florist', name: 'Blossom Floral Design', planned_cost: 2500, actual_cost: 2400, notes: 'Bridal bouquet, centerpieces, ceremony decor', created_at: '2024-02-01T00:00:00Z' },
    { id: 4, wedding_id: 'demo-wedding-123', category: 'dj', name: 'Premier DJ Services', planned_cost: 1200, actual_cost: 1200, notes: '6 hours of music + MC services', created_at: '2024-02-10T00:00:00Z' },
    { id: 5, wedding_id: 'demo-wedding-123', category: 'venue', name: 'The Grand Ballroom', planned_cost: 5000, actual_cost: 5000, notes: 'Ceremony and reception venue', created_at: '2024-01-05T00:00:00Z' },
    { id: 6, wedding_id: 'demo-wedding-123', category: 'beauty', name: 'Glamour Hair & Makeup', planned_cost: 800, actual_cost: 800, notes: 'Bridal party styling', created_at: '2024-02-15T00:00:00Z' },
    { id: 7, wedding_id: 'demo-wedding-123', category: 'videography', name: 'Cinematic Memories', planned_cost: 2800, actual_cost: 0, notes: 'Full wedding video + highlights', created_at: '2024-02-20T00:00:00Z' },
    { id: 8, wedding_id: 'demo-wedding-123', category: 'decor', name: 'Elegant Rentals', planned_cost: 1200, actual_cost: 1100, notes: 'Chairs, tables, linens', created_at: '2024-02-25T00:00:00Z' }
  ];

  const mockVendors = [
    { id: 1, wedding_id: 'demo-wedding-123', name: 'Sarah Johnson Photography', category: 'photography', contact_info: 'Email: sarah@photography.com, Phone: (555) 123-4567', notes: 'Amazing photographer, very responsive', pricing: '$3,500', rating: 5, status: 'confirmed', is_booked: true, created_at: '2024-01-15T00:00:00Z' },
    { id: 2, wedding_id: 'demo-wedding-123', name: 'Elegant Events Catering', category: 'catering', contact_info: 'Email: info@elegantevents.com, Phone: (555) 234-5678', notes: 'Great tasting, flexible with dietary restrictions', pricing: '$8,200', rating: 5, status: 'confirmed', is_booked: true, created_at: '2024-01-20T00:00:00Z' },
    { id: 3, wedding_id: 'demo-wedding-123', name: 'Blossom Floral Design', category: 'florist', contact_info: 'Email: hello@blossomfloral.com, Phone: (555) 345-6789', notes: 'Beautiful work, reasonable pricing', pricing: '$2,400', rating: 4, status: 'confirmed', is_booked: true, created_at: '2024-02-01T00:00:00Z' },
    { id: 4, wedding_id: 'demo-wedding-123', name: 'Premier DJ Services', category: 'dj', contact_info: 'Email: dj@premierservices.com, Phone: (555) 456-7890', notes: 'Great music selection, professional', pricing: '$1,200', rating: 4, status: 'confirmed', is_booked: true, created_at: '2024-02-10T00:00:00Z' },
    { id: 5, wedding_id: 'demo-wedding-123', name: 'Cinematic Memories', category: 'videography', contact_info: 'Email: info@cinematicmemories.com, Phone: (555) 567-8901', notes: 'Still deciding between options', pricing: '$2,800', rating: 0, status: 'pending', is_booked: false, created_at: '2024-02-20T00:00:00Z' },
    { id: 6, wedding_id: 'demo-wedding-123', name: 'Glamour Hair & Makeup', category: 'beauty', contact_info: 'Email: glamour@beauty.com, Phone: (555) 678-9012', notes: 'Trial scheduled for next week', pricing: '$800', rating: 0, status: 'contacted', is_booked: false, created_at: '2024-02-15T00:00:00Z' }
  ];

  const mockGuests = [
    { id: 1, wedding_id: 'demo-wedding-123', name: 'John Smith', email: 'john.smith@email.com', phone: '(555) 111-1111', rsvp_status: 'attending', meal_preference: 'chicken', plus_one: 'Jane Smith', created_at: '2024-01-10T00:00:00Z' },
    { id: 2, wedding_id: 'demo-wedding-123', name: 'Emily Johnson', email: 'emily.j@email.com', phone: '(555) 222-2222', rsvp_status: 'attending', meal_preference: 'vegetarian', plus_one: null, created_at: '2024-01-12T00:00:00Z' },
    { id: 3, wedding_id: 'demo-wedding-123', name: 'Michael Brown', email: 'mike.brown@email.com', phone: '(555) 333-3333', rsvp_status: 'declined', meal_preference: null, plus_one: null, created_at: '2024-01-15T00:00:00Z' },
    { id: 4, wedding_id: 'demo-wedding-123', name: 'Sarah Davis', email: 'sarah.d@email.com', phone: '(555) 444-4444', rsvp_status: 'pending', meal_preference: null, plus_one: 'Tom Davis', created_at: '2024-01-18T00:00:00Z' },
    { id: 5, wedding_id: 'demo-wedding-123', name: 'David Wilson', email: 'david.w@email.com', phone: '(555) 555-5555', rsvp_status: 'attending', meal_preference: 'beef', plus_one: null, created_at: '2024-01-20T00:00:00Z' }
  ];

  const mockTimelineItems = [
    { id: 1, wedding_id: 'demo-wedding-123', title: 'Book photographer', description: 'Research and book wedding photographer', due_date: '2024-03-15', category: 'preparation', completed: true, responsible: 'Sarah', created_at: '2024-01-01T00:00:00Z' },
    { id: 2, wedding_id: 'demo-wedding-123', title: 'Choose wedding dress', description: 'Finalize wedding dress selection', due_date: '2024-04-01', category: 'preparation', completed: false, responsible: 'Sarah', created_at: '2024-01-05T00:00:00Z' },
    { id: 3, wedding_id: 'demo-wedding-123', title: 'Book caterer', description: 'Finalize catering contract and menu', due_date: '2024-03-20', category: 'preparation', completed: true, responsible: 'Mike', created_at: '2024-01-10T00:00:00Z' },
    { id: 4, wedding_id: 'demo-wedding-123', title: 'Send invitations', description: 'Mail wedding invitations to guests', due_date: '2024-05-01', category: 'preparation', completed: false, responsible: 'Sarah', created_at: '2024-01-15T00:00:00Z' },
    { id: 5, wedding_id: 'demo-wedding-123', title: 'Book videographer', description: 'Research and book wedding videographer', due_date: '2024-03-25', category: 'preparation', completed: false, responsible: 'Mike', created_at: '2024-01-20T00:00:00Z' },
    { id: 6, wedding_id: 'demo-wedding-123', title: 'Schedule hair trial', description: 'Book hair and makeup trial', due_date: '2024-04-15', category: 'preparation', completed: false, responsible: 'Sarah', created_at: '2024-02-01T00:00:00Z' },
    { id: 7, wedding_id: 'demo-wedding-123', title: 'Finalize guest list', description: 'Confirm final guest count and meal preferences', due_date: '2024-05-15', category: 'preparation', completed: false, responsible: 'Both', created_at: '2024-02-05T00:00:00Z' },
    { id: 8, wedding_id: 'demo-wedding-123', title: 'Book transportation', description: 'Arrange transportation for wedding party', due_date: '2024-04-30', category: 'preparation', completed: false, responsible: 'Mike', created_at: '2024-02-10T00:00:00Z' }
  ];

  const mockMoodBoardImages = [
    { id: 1, wedding_plan_id: 'demo-wedding-123', image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop', image_name: 'Romantic garden wedding', uploaded_at: '2024-01-05T00:00:00Z' },
    { id: 2, wedding_id: 'demo-wedding-123', image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop', image_name: 'Elegant reception setup', uploaded_at: '2024-01-10T00:00:00Z' },
    { id: 3, wedding_id: 'demo-wedding-123', image_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=300&fit=crop', image_name: 'Bridal bouquet inspiration', uploaded_at: '2024-01-15T00:00:00Z' },
    { id: 4, wedding_id: 'demo-wedding-123', image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop', image_name: 'Wedding cake design', uploaded_at: '2024-01-20T00:00:00Z' },
    { id: 5, wedding_id: 'demo-wedding-123', image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop', image_name: 'Ceremony decor', uploaded_at: '2024-02-01T00:00:00Z' },
    { id: 6, wedding_id: 'demo-wedding-123', image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop', image_name: 'Table centerpieces', uploaded_at: '2024-02-05T00:00:00Z' }
  ];

  const mockBids = [
    {
      id: 1,
      request_id: 1,
      user_id: 'business-1',
      bid_amount: 3500,
      description: 'Full day wedding coverage including engagement session, 8 hours of photography, 400+ edited photos, online gallery, and wedding album.',
      status: 'approved',
      viewed: true,
      interest_rating: 5,
      client_notes: 'Love their style! Great portfolio and reasonable pricing.',
      created_at: '2024-01-15T00:00:00Z',
      business_profiles: {
        id: 'business-1',
        business_name: 'Sarah Johnson Photography',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop'
      },
      service_requests: { category: 'photography', table: 'photography_requests' }
    },
    {
      id: 2,
      request_id: 2,
      user_id: 'business-2',
      bid_amount: 8200,
      description: 'Full catering service for 150 guests including appetizers, 3-course meal, dessert, and staff. Dietary restrictions accommodated.',
      status: 'approved',
      viewed: true,
      interest_rating: 5,
      client_notes: 'Amazing tasting! Great value and flexible menu options.',
      created_at: '2024-01-20T00:00:00Z',
      business_profiles: {
        id: 'business-2',
        business_name: 'Elegant Events Catering',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop'
      },
      service_requests: { category: 'catering', table: 'catering_requests' }
    },
    {
      id: 3,
      request_id: 3,
      user_id: 'business-3',
      bid_amount: 2400,
      description: 'Complete floral design including bridal bouquet, bridesmaid bouquets, ceremony decor, and reception centerpieces.',
      status: 'approved',
      viewed: true,
      interest_rating: 4,
      client_notes: 'Beautiful work and great communication.',
      created_at: '2024-02-01T00:00:00Z',
      business_profiles: {
        id: 'business-3',
        business_name: 'Blossom Floral Design',
        membership_tier: 'standard',
        google_calendar_connected: false,
        profile_image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=100&h=100&fit=crop'
      },
      service_requests: { category: 'florist', table: 'florist_requests' }
    },
    {
      id: 4,
      request_id: 4,
      user_id: 'business-4',
      bid_amount: 1200,
      description: 'Professional DJ services including 6 hours of music, MC services, and all equipment. Custom playlist available.',
      status: 'approved',
      viewed: true,
      interest_rating: 4,
      client_notes: 'Great music selection and professional service.',
      created_at: '2024-02-10T00:00:00Z',
      business_profiles: {
        id: 'business-4',
        business_name: 'Premier DJ Services',
        membership_tier: 'standard',
        google_calendar_connected: true,
        profile_image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop'
      },
      service_requests: { category: 'dj', table: 'dj_requests' }
    },
    {
      id: 5,
      request_id: 5,
      user_id: 'business-5',
      bid_amount: 2800,
      description: 'Full wedding video coverage including ceremony, reception highlights, and edited feature film.',
      status: 'pending',
      viewed: false,
      interest_rating: 0,
      client_notes: '',
      created_at: '2024-02-20T00:00:00Z',
      business_profiles: {
        id: 'business-5',
        business_name: 'Cinematic Memories',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=100&h=100&fit=crop'
      },
      service_requests: { category: 'videography', table: 'videography_requests' }
    },
    {
      id: 6,
      request_id: 6,
      user_id: 'business-6',
      bid_amount: 800,
      description: 'Professional hair and makeup services for bride and bridal party. Trial session included.',
      status: 'interested',
      viewed: true,
      interest_rating: 3,
      client_notes: 'Good reviews, need to schedule trial.',
      created_at: '2024-02-15T00:00:00Z',
      business_profiles: {
        id: 'business-6',
        business_name: 'Glamour Hair & Makeup',
        membership_tier: 'standard',
        google_calendar_connected: false,
        profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop'
      },
      service_requests: { category: 'beauty', table: 'beauty_requests' }
    }
  ];

  useEffect(() => {
    const fetchSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);

        // Fetch the user's profile to get the role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) setRole(profile.role);
      }
    };

    fetchSessionAndRole();

    // Capture a page view only once on mount
    posthog.capture('page_view', {
      distinctId: user?.id || 'anonymous',
      url: window.location.href,
      page_title: document.title,
    });
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get wedding plans count
        const { count: weddingsCount } = await supabase
          .from('wedding_plans')
          .select('*', { count: 'exact' });

        // Get timeline tasks count
        const { count: tasksCount } = await supabase
          .from('wedding_timeline_items')
          .select('*', { count: 'exact' });

        // Get vendors count
        const { count: vendorsCount } = await supabase
          .from('wedding_vendors')
          .select('*', { count: 'exact' });

        setStats({
          weddings: weddingsCount || 0,
          tasks: tasksCount || 0,
          vendors: vendorsCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Add refs for each section
  const [mastheadRef, mastheadVisible] = useIntersectionObserver();
  const [featuresRef, featuresVisible] = useIntersectionObserver();
  const [howToRef, howToVisible] = useIntersectionObserver();
  const [testimonialsRef, testimonialsVisible] = useIntersectionObserver();
  const [ctaRef, ctaVisible] = useIntersectionObserver();

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>Complete Wedding Planning Tool - Timeline, Budget & Vendor Management | Bidi</title>
        <meta name="title" content="Complete Wedding Planning Tool - Timeline, Budget & Vendor Management | Bidi" />
        <meta name="description" content="Plan your perfect wedding with our comprehensive planning tool. Manage timeline, budget, vendors, guest list, and more. Start planning your dream wedding today! Free to use." />
        <meta name="keywords" content="wedding planning tool, wedding timeline, wedding budget tracker, wedding vendor management, wedding guest list, wedding checklist, free wedding planner, wedding planning app, wedding organizer, wedding planning software" />
        <meta name="author" content="Bidi" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.savewithbidi.com/wedding-planner" />
        <meta property="og:title" content="Complete Wedding Planning Tool - Timeline, Budget & Vendor Management | Bidi" />
        <meta property="og:description" content="Plan your perfect wedding with our comprehensive planning tool. Manage timeline, budget, vendors, guest list, and more. Start planning your dream wedding today! Free to use." />
        <meta property="og:image" content="https://www.savewithbidi.com/images/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Bidi Wedding Planner" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.savewithbidi.com/wedding-planner" />
        <meta property="twitter:title" content="Complete Wedding Planning Tool - Timeline, Budget & Vendor Management | Bidi" />
        <meta property="twitter:description" content="Plan your perfect wedding with our comprehensive planning tool. Manage timeline, budget, vendors, guest list, and more. Start planning your dream wedding today! Free to use." />
        <meta property="twitter:image" content="https://www.savewithbidi.com/images/og-image.jpg" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#FF008A" />
        <meta name="msapplication-TileColor" content="#FF008A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bidi Wedding Planner" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.savewithbidi.com/wedding-planner" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/Bidi-Favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/Bidi-Favicon.png" />
        <link rel="apple-touch-icon" href="/Bidi-Favicon.png" />
        
        {/* Enhanced Structured Data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://www.savewithbidi.com/#website",
                  "url": "https://www.savewithbidi.com/wedding-planner",
                  "name": "Bidi Wedding Planner",
                  "description": "Complete wedding planning tool with timeline management, budget tracking, vendor coordination, and guest list management.",
                  "publisher": {
                    "@type": "Organization",
                    "name": "Bidi",
                    "logo": {
                      "@type": "ImageObject",
                      "url": "https://www.savewithbidi.com/Bidi-Favicon.png"
                    }
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.savewithbidi.com/search?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": "https://www.savewithbidi.com/wedding-planner/#app",
                  "name": "Bidi Wedding Planner",
                  "applicationCategory": "Wedding Planning Tool",
                  "description": "Comprehensive wedding planning platform with timeline, budget, vendor, and guest management features.",
                  "url": "https://www.savewithbidi.com/wedding-planner",
                  "operatingSystem": "Web Browser",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "description": "Free wedding planning tool"
                  },
                  "featureList": [
                    "Timeline Management",
                    "Budget Tracking", 
                    "Vendor Management",
                    "Guest List Management",
                    "Wedding Checklist",
                    "Mood Board Creation"
                  ],
                  "screenshot": "https://www.savewithbidi.com/images/og-image.jpg",
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "ratingCount": "1250"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://www.savewithbidi.com/#organization",
                  "name": "Bidi",
                  "url": "https://www.savewithbidi.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.savewithbidi.com/Bidi-Favicon.png"
                  },
                  "sameAs": [
                    "https://www.facebook.com/savewithbidi",
                    "https://www.instagram.com/savewithbidi"
                  ]
                },
                {
                  "@type": "BreadcrumbList",
                  "@id": "https://www.savewithbidi.com/wedding-planner/#breadcrumb",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "Home",
                      "item": "https://www.savewithbidi.com"
                    },
                    {
                      "@type": "ListItem", 
                      "position": 2,
                      "name": "Wedding Planner",
                      "item": "https://www.savewithbidi.com/wedding-planner"
                    }
                  ]
                }
              ]
            }
          `}
        </script>
        
        {/* Additional Schema for FAQ */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Is the Bidi Wedding Planner free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our wedding planning tool is completely free to use. You can access all features including timeline management, budget tracking, vendor management, and guest list organization at no cost."
                  }
                },
                {
                  "@type": "Question", 
                  "name": "What features are included in the wedding planner?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our comprehensive wedding planner includes timeline management, budget tracking, vendor management, guest list organization, wedding checklists, and mood board creation tools."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I manage my wedding budget with this tool?",
                  "acceptedAnswer": {
                    "@type": "Answer", 
                    "text": "Yes, our budget tracking feature allows you to set your total budget, break it down by categories, track actual spending, and compare planned vs actual costs to stay on budget."
                  }
                }
              ]
            }
          `}
        </script>
      </Helmet>
      
      <div ref={mastheadRef} className={`wedding-planner-masthead fade-in-section ${mastheadVisible ? 'is-visible' : ''}`}>
        <div className='wedding-planner-text-section'>
          <h1 className='wedding-planner-title heading-reset'>
            Plan Your Dream Wedding
          </h1>
          <h2 className='wedding-planner-subtitle heading-reset'>
            Everything you need to plan the perfect wedding in one beautiful, easy-to-use platform. 
            From timeline management to budget tracking, vendor coordination to guest list management - 
            we've got every detail covered. Start planning your dream wedding today and create memories 
            that will last a lifetime.
            <span style={{ display: 'block', marginTop: '15px', color: '#FF008A', fontWeight: 'bold' }}>
              Free to use - Start planning your perfect day today!
            </span>
          </h2>
          <div className='wedding-planner-button-container'>
            {user ? (
              role === 'individual' || role === 'both' ? (
                <Link to="/wedding-planner/overview" onClick={() => posthog.capture('wedding_planner_dashboard')}>
                  <button className='wedding-planner-button'>Open Wedding Planner</button>
                </Link>
              ) : (
                <Link to="/signin">
                  <button className='wedding-planner-button'>Get Started</button>
                </Link>
              )
            ) : (
              <Link to="/signin" onClick={() => posthog.capture('wedding_planner_signup')}>
                <button className='wedding-planner-button'>Start Planning Free</button>
              </Link>
            )}
          </div>
        </div>

        <div className='wedding-planner-video-section'>
          <div className='wedding-planner-video-container'>
            <video 
              className="wedding-planner-video" 
              controls 
              autoPlay 
              muted 
              loop
              poster="/images/Landing Page Photo.jpg"
            >
              <source src={WeddingPlanningVideo} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      <div ref={featuresRef} className={`wedding-planner-features-section fade-in-section ${featuresVisible ? 'is-visible' : ''}`}>
        <div className='wedding-planner-features-header'>
          <h2 className='wedding-planner-features-title'>Everything You Need to Plan Your Perfect Wedding</h2>
          <p className='wedding-planner-features-subtitle'>
            Our comprehensive wedding planning tool includes all the features you need to organize, track, and execute your dream wedding.
          </p>
        </div>
        
        <div className='wedding-planner-features-grid'>
          <div className='wedding-planner-feature-card'>
            <div className='wedding-planner-feature-icon'>
              <i className="fas fa-calendar-alt"></i>
            </div>
            <h3 className='wedding-planner-feature-title'>Timeline Management</h3>
            <p className='wedding-planner-feature-description'>
              Create detailed timelines for both your wedding day and planning process. Track tasks, set deadlines, and never miss an important milestone.
            </p>
            <ul className='wedding-planner-feature-list'>
              <li>Day-of timeline with minute-by-minute scheduling</li>
              <li>Planning timeline with automatic task reminders</li>
              <li>Customizable phases and categories</li>
              <li>Progress tracking and completion status</li>
            </ul>
          </div>

          <div className='wedding-planner-feature-card'>
            <div className='wedding-planner-feature-icon'>
              <i className="fas fa-dollar-sign"></i>
            </div>
            <h3 className='wedding-planner-feature-title'>Budget Tracking</h3>
            <p className='wedding-planner-feature-description'>
              Keep your wedding budget organized and on track. Monitor spending, compare planned vs actual costs, and stay within your budget.
            </p>
            <ul className='wedding-planner-feature-list'>
              <li>Comprehensive budget breakdown by category</li>
              <li>Real-time spending tracking</li>
              <li>Budget vs actual cost comparisons</li>
              <li>Custom budget categories and allocations</li>
            </ul>
          </div>

          <div className='wedding-planner-feature-card'>
            <div className='wedding-planner-feature-icon'>
              <i className="fas fa-users"></i>
            </div>
            <h3 className='wedding-planner-feature-title'>Vendor Management</h3>
            <p className='wedding-planner-feature-description'>
              Organize all your wedding vendors in one place. Track contracts, payments, and communications with ease.
            </p>
            <ul className='wedding-planner-feature-list'>
              <li>Complete vendor profiles and contact info</li>
              <li>Contract and payment tracking</li>
              <li>Vendor communication history</li>
              <li>Bid comparison and selection tools</li>
            </ul>
          </div>

          <div className='wedding-planner-feature-card'>
            <div className='wedding-planner-feature-icon'>
              <i className="fas fa-user-friends"></i>
            </div>
            <h3 className='wedding-planner-feature-title'>Guest List Management</h3>
            <p className='wedding-planner-feature-description'>
              Manage your guest list, track RSVPs, and organize seating arrangements. Keep everything organized for the big day.
            </p>
            <ul className='wedding-planner-feature-list'>
              <li>Comprehensive guest profiles and contact info</li>
              <li>RSVP tracking and status management</li>
              <li>Seating chart creation and management</li>
              <li>Guest count and meal preference tracking</li>
            </ul>
          </div>

          <div className='wedding-planner-feature-card'>
            <div className='wedding-planner-feature-icon'>
              <i className="fas fa-tasks"></i>
            </div>
            <h3 className='wedding-planner-feature-title'>Wedding Checklist</h3>
            <p className='wedding-planner-feature-description'>
              Never miss an important task with our comprehensive wedding checklist. Customize tasks and track your progress.
            </p>
            <ul className='wedding-planner-feature-list'>
              <li>Pre-built wedding planning checklists</li>
              <li>Custom task creation and organization</li>
              <li>Priority levels and due date tracking</li>
              <li>Progress visualization and completion stats</li>
            </ul>
          </div>

          <div className='wedding-planner-feature-card'>
            <div className='wedding-planner-feature-icon'>
              <i className="fas fa-palette"></i>
            </div>
            <h3 className='wedding-planner-feature-title'>Wedding Details & Mood Board</h3>
            <p className='wedding-planner-feature-description'>
              Capture your wedding vision with detailed planning tools and visual mood boards to bring your dream to life.
            </p>
            <ul className='wedding-planner-feature-list'>
              <li>Comprehensive wedding details and preferences</li>
              <li>Visual mood board with inspiration images</li>
              <li>Color scheme and style preferences</li>
              <li>Venue and decor planning tools</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Demo Section - Using Real Dashboard Components */}
      <div className="wedding-planner-demo-section">
        <div className="wedding-planner-demo-container">
          <h2 className="wedding-planner-demo-title">See It In Action</h2>
          <p className="wedding-planner-demo-subtitle">
            Take a peek at how our wedding planner works with this interactive demo
          </p>
          
          <div className="wedding-planning-dashboard">
            {/* Demo Notice */}
            <div className="demo-notice">
              <div className="demo-notice-content">
                <i className="fas fa-info-circle"></i>
                <span>This is a live demo of the actual wedding planning dashboard</span>
              </div>
            </div>
            
            {/* Render the real WeddingOverview component with mock data */}
            <WeddingOverview 
              weddingData={mockWeddingData}
              onNavigate={handleDemoNavigation}
              mockData={{
                budgetItems: mockBudgetItems,
                vendors: mockVendors,
                guests: mockGuests,
                timelineItems: mockTimelineItems,
                moodBoardImages: mockMoodBoardImages,
                bids: mockBids
              }}
            />
          </div>
          
          <div className="demo-cta">
            <p>Ready to create your own wedding plan?</p>
            <Link to="/signin">
              <button className="demo-cta-button">
                Start Your Wedding Plan
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div ref={howToRef} className={`wedding-planner-how-to-section fade-in-section ${howToVisible ? 'is-visible' : ''}`}>
        <div className='wedding-planner-how-to-content'>
          <h2 className='wedding-planner-how-to-title'>How It Works</h2>
          <p className='wedding-planner-how-to-subtitle'>
            Get started with your wedding planning in just a few simple steps
          </p>
          
          <div className='wedding-planner-steps'>
            <div className='wedding-planner-step'>
              <div className='wedding-planner-step-number'>1</div>
              <div className='wedding-planner-step-content'>
                <h3>Create Your Wedding Plan</h3>
                <p>Set up your wedding details including date, location, budget, and guest count. Our smart system will help you get organized from day one.</p>
              </div>
            </div>

            <div className='wedding-planner-step'>
              <div className='wedding-planner-step-number'>2</div>
              <div className='wedding-planner-step-content'>
                <h3>Build Your Timeline</h3>
                <p>Create detailed timelines for both your planning process and wedding day. Our templates make it easy to get started with proven wedding planning schedules.</p>
              </div>
            </div>

            <div className='wedding-planner-step'>
              <div className='wedding-planner-step-number'>3</div>
              <div className='wedding-planner-step-content'>
                <h3>Track Your Budget</h3>
                <p>Set your budget and track spending across all wedding categories. Get insights into where your money is going and stay on track financially.</p>
              </div>
            </div>

            <div className='wedding-planner-step'>
              <div className='wedding-planner-step-number'>4</div>
              <div className='wedding-planner-step-content'>
                <h3>Manage Vendors & Guests</h3>
                <p>Organize all your vendors and manage your guest list in one place. Track contracts, payments, RSVPs, and communications.</p>
              </div>
            </div>

            <div className='wedding-planner-step'>
              <div className='wedding-planner-step-number'>5</div>
              <div className='wedding-planner-step-content'>
                <h3>Execute Your Perfect Day</h3>
                <p>With everything organized and tracked, you can focus on enjoying your special day. Our tools ensure nothing falls through the cracks.</p>
              </div>
            </div>
          </div>

          <div className='wedding-planner-cta-section'>
            <Link to="/signin">
              <button className="wedding-planner-cta-button">
                Start Planning Your Wedding
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div ref={ctaRef} className={`wedding-planner-final-cta fade-in-section ${ctaVisible ? 'is-visible' : ''}`}>
        <div className='wedding-planner-final-cta-content'>
          <h2>Ready to Plan Your Dream Wedding?</h2>
          <p>Join thousands of couples who are planning their perfect day with our comprehensive wedding planning tools.</p>
          <div className='wedding-planner-final-cta-buttons'>
            <Link to="/signin">
              <button className="wedding-planner-final-cta-button primary">
                Start Planning Free
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default WeddingPlannerHomepage; 