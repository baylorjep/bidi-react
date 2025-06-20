import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './WeddingTimeline.css';

function SharedTimelineView() {
  const { shareId } = useParams();
  const [timelineData, setTimelineData] = useState(null);
  const [weddingInfo, setWeddingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTimeline, setActiveTimeline] = useState('dayOf');

  useEffect(() => {
    fetchSharedTimeline();
  }, [shareId]);

  const fetchSharedTimeline = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('shared_timelines')
        .select('*')
        .eq('share_id', shareId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('This timeline link has expired or is no longer available.');
        } else {
          setError('Failed to load the shared timeline. Please check the link and try again.');
        }
        return;
      }

      setTimelineData(data.timeline_data);
      setWeddingInfo({
        title: data.wedding_title,
        date: data.wedding_date
      });

    } catch (err) {
      console.error('Error fetching shared timeline:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getPhaseColor = (phaseId) => {
    const dayOfPhases = [
      { id: 'ceremony', color: '#ec4899' },
      { id: 'cocktail', color: '#8b5cf6' },
      { id: 'reception', color: '#10b981' },
      { id: 'dinner', color: '#f59e0b' },
      { id: 'dancing', color: '#ef4444' },
      { id: 'sendoff', color: '#6366f1' }
    ];

    const preparationPhases = [
      { id: 'planning', color: '#fbbf24' },
      { id: 'booking', color: '#8b5cf6' },
      { id: 'shopping', color: '#ec4899' },
      { id: 'meetings', color: '#10b981' },
      { id: 'rehearsal', color: '#f59e0b' },
      { id: 'final', color: '#ef4444' }
    ];

    const phases = activeTimeline === 'dayOf' ? dayOfPhases : preparationPhases;
    const phase = phases.find(p => p.id === phaseId);
    return phase ? phase.color : '#6b7280';
  };

  const getPhaseIcon = (phaseId) => {
    const dayOfPhases = [
      { id: 'ceremony', icon: '💒' },
      { id: 'cocktail', icon: '🥂' },
      { id: 'reception', icon: '🎉' },
      { id: 'dinner', icon: '🍽️' },
      { id: 'dancing', icon: '💃' },
      { id: 'sendoff', icon: '✨' }
    ];

    const preparationPhases = [
      { id: 'planning', icon: '📋' },
      { id: 'booking', icon: '📅' },
      { id: 'shopping', icon: '🛍️' },
      { id: 'meetings', icon: '🤝' },
      { id: 'rehearsal', icon: '🎭' },
      { id: 'final', icon: '✨' }
    ];

    const phases = activeTimeline === 'dayOf' ? dayOfPhases : preparationPhases;
    const phase = phases.find(p => p.id === phaseId);
    return phase ? phase.icon : '📅';
  };

  if (loading) {
    return (
      <div className="shared-timeline-loading">
        <div className="loading-spinner"></div>
        <h2>Loading shared timeline...</h2>
        <p>Please wait while we fetch the wedding timeline.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-timeline-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Unable to Load Timeline</h2>
        <p>{error}</p>
        <button 
          className="retry-btn"
          onClick={fetchSharedTimeline}
        >
          <i className="fas fa-redo"></i>
          Try Again
        </button>
      </div>
    );
  }

  const currentItems = timelineData?.[activeTimeline] || [];

  return (
    <div className="shared-timeline-view">
      <div className="timeline-header">
        <div className="timeline-header-content">
          <div className="timeline-title-section">
            <h2 style={{fontFamily:'Outfit', fontSize:'2rem'}}>{weddingInfo?.title || 'Wedding Timeline'}</h2>
            <p style={{fontFamily:'Outfit', fontSize:'1rem'}}>
              {weddingInfo?.date ? 
                new Date(weddingInfo.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 
                'Shared wedding timeline'
              }
            </p>
          </div>
          
          <div className="timeline-action-buttons">
            <div className="shared-badge">
              <i className="fas fa-share-alt"></i>
              Shared Timeline
            </div>
          </div>
        </div>
        
        <div className="timeline-tabs-container">
          <div className="timeline-tabs">
            <button 
              className={`timeline-tab ${activeTimeline === 'dayOf' ? 'active' : ''}`}
              onClick={() => setActiveTimeline('dayOf')}
            >
              <i className="fas fa-calendar-day"></i>
              <div className="tab-content">
                <span className="tab-title">Day of Wedding</span>
                <span className="tab-description">Ceremony, reception & celebration schedule</span>
              </div>
            </button>
            <button 
              className={`timeline-tab ${activeTimeline === 'preparation' ? 'active' : ''}`}
              onClick={() => setActiveTimeline('preparation')}
            >
              <i className="fas fa-tasks"></i>
              <div className="tab-content">
                <span className="tab-title">Preparation Timeline</span>
                <span className="tab-description">Planning tasks & vendor coordination</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="timeline-container">
        {currentItems.length === 0 ? (
          <div className="timeline-empty">
            <i className="fas fa-clock"></i>
            <h3>No {activeTimeline === 'dayOf' ? 'day-of' : 'preparation'} timeline items</h3>
            <p>This timeline doesn't have any {activeTimeline === 'dayOf' ? 'day-of' : 'preparation'} events yet.</p>
          </div>
        ) : (
          <div className="timeline-list">
            {currentItems.map((item, index) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-marker" style={{ backgroundColor: getPhaseColor(item.phase) }}>
                  <span className="timeline-icon">{getPhaseIcon(item.phase)}</span>
                </div>
                
                <div className="timeline-content">
                  <div className="timeline-header">
                    <div className="timeline-time">
                      <span className="time">
                        {activeTimeline === 'dayOf' ? formatTime(item.time) : item.date}
                      </span>
                      {activeTimeline === 'dayOf' && item.duration > 0 && (
                        <span className="duration">({item.duration} min)</span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="timeline-activity">{item.activity}</h3>
                  
                  {item.description && (
                    <p className="timeline-description">{item.description}</p>
                  )}
                  
                  <div className="timeline-details">
                    {item.location && (
                      <div className="timeline-detail">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{item.location}</span>
                      </div>
                    )}
                    {item.responsible && (
                      <div className="timeline-detail">
                        <i className="fas fa-user"></i>
                        <span>{item.responsible}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shared-timeline-footer">
        <p>
          <i className="fas fa-info-circle"></i>
          This is a shared timeline view. Contact the wedding couple for any questions or updates.
        </p>
      </div>
    </div>
  );
}

export default SharedTimelineView; 