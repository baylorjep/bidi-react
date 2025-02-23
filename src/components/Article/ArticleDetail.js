import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EmailCaptureModal from '../EmailCaptureModal/EmailCaptureModal';
import { Helmet } from 'react-helmet';
import { supabase } from '../../supabaseClient';

// Import all article components
import UtahPhotographyCostGuide from '../Article/UtahPhotographyCostGuide';
import WeddingPhotographerCostGuide from '../Article/WeddingPhotographerCostGuide';
import WeddingVideographerCostGuide from '../Article/WeddingVideographerCostGuide';
import WeddingCateringCostGuide from '../Article/WeddingCateringCostGuide';
import WeddingFloristCostGuide from '../Article/WeddingFloristCostGuide';
import WeddingDJCostGuide from '../Article/WeddingDJCostGuide';
import WeddingHairMakeupCostGuide from '../Article/WeddingHairMakeupCostGuide';
import UtahWeddingPlanningGuide from '../Article/UtahWeddingPlanningGuide';

const articleComponents = {
    'utah-photography-cost-guide': UtahPhotographyCostGuide,
    'wedding-photographer-cost-guide': WeddingPhotographerCostGuide,
    'wedding-videographer-cost-guide': WeddingVideographerCostGuide,
    'wedding-catering-cost-guide': WeddingCateringCostGuide,
    'wedding-florist-cost-guide': WeddingFloristCostGuide,
    'wedding-dj-cost-guide': WeddingDJCostGuide,
    'wedding-hair-makeup-cost-guide': WeddingHairMakeupCostGuide,
    'utah-wedding-planning-guide': UtahWeddingPlanningGuide
};

const ArticleDetail = () => {
    const { articleId } = useParams();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    
    const ArticleComponent = articleComponents[articleId];

    useEffect(() => {
        if (!ArticleComponent) {
            navigate('/articles');
            return;
        }

        const hasSeenModal = localStorage.getItem('hasSeenModal');
        const hasSubscribed = localStorage.getItem('hasSubscribed');

        if (!hasSeenModal && !hasSubscribed) {
            const timer = setTimeout(() => {
                setShowModal(true);
                localStorage.setItem('hasSeenModal', Date.now());
            }, 30000);

            return () => clearTimeout(timer);
        }
    }, [ArticleComponent, navigate]);

    const handleEmailSubmit = async (email) => {
        try {
            // Add to Supabase
            const { data, error } = await supabase
                .from('email_subscribers')
                .insert([
                    { 
                        email,
                        article_id: articleId, // Track which article they subscribed from
                    }
                ]);

            if (error) throw error;

            // Set local storage to prevent showing modal again
            localStorage.setItem('hasSubscribed', 'true');
            setShowModal(false);
            
            // Show success message
            alert('Thank you for subscribing! You\'ll receive our wedding planning tips soon.');
        } catch (error) {
            console.error('Error saving email:', error);
            
            // Check if it's a unique constraint error
            if (error.code === '23505') {
                alert('This email is already subscribed!');
            } else {
                alert('There was an error. Please try again.');
            }
        }
    };

    if (!ArticleComponent) return null;

    return (
        <div>
            <ArticleComponent />
            <EmailCaptureModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleEmailSubmit}
            />
        </div>
    );
};

export default ArticleDetail;