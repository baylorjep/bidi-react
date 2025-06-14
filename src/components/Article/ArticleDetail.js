import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EmailCaptureModal from '../EmailCaptureModal/EmailCaptureModal';
import { Helmet } from 'react-helmet';
import { supabase } from '../../supabaseClient';
import ArticleLayout from './ArticleLayout';

// Import all article components
import UtahPhotographyCostGuide from '../Article/UtahPhotographyCostGuide';
import WeddingPhotographerCostGuide from '../Article/WeddingPhotographerCostGuide';
import WeddingVideographerCostGuide from '../Article/WeddingVideographerCostGuide';
import WeddingCateringCostGuide from '../Article/WeddingCateringCostGuide';
import WeddingFloristCostGuide from '../Article/WeddingFloristCostGuide';
import WeddingDJCostGuide from '../Article/WeddingDJCostGuide';
import WeddingHairMakeupCostGuide from '../Article/WeddingHairMakeupCostGuide';
import UtahWeddingPlanningGuide from '../Article/UtahWeddingPlanningGuide';
import UtahWeddingVideographerGuide from '../Article/UtahWeddingVideographerGuide';
import UtahCateringCosts from '../Article/UtahCateringCosts';
import UtahDJCosts from '../Article/UtahDJCosts';

const articleComponents = {
    'utah-photography-cost-guide': UtahPhotographyCostGuide,
    'wedding-photographer-cost-guide': WeddingPhotographerCostGuide,
    'wedding-videographer-cost-guide': WeddingVideographerCostGuide,
    'wedding-catering-cost-guide': WeddingCateringCostGuide,
    'wedding-florist-cost-guide': WeddingFloristCostGuide,
    'wedding-dj-cost-guide': WeddingDJCostGuide,
    'wedding-hair-makeup-cost-guide': WeddingHairMakeupCostGuide,
    'utah-wedding-planning-guide': UtahWeddingPlanningGuide,
    'utah-wedding-videographer-guide': UtahWeddingVideographerGuide,
    'utah-catering-costs': UtahCateringCosts,
    'utah-dj-costs': UtahDJCosts
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
            const { data, error } = await supabase
                .from('email_subscribers')
                .insert([
                    { 
                        email,
                        article_id: articleId,
                    }
                ]);

            if (error) throw error;

            localStorage.setItem('hasSubscribed', 'true');
            setShowModal(false);
            
            // Redirect to welcome page instead of showing alert
            navigate('/welcome', { state: { email } });
        } catch (error) {
            console.error('Error saving email:', error);
            
            if (error.code === '23505') {
                alert('This email is already subscribed!');
            } else {
                alert('There was an error. Please try again.');
            }
        }
    };

    if (!ArticleComponent) return null;

    return (
        <ArticleLayout articleId={articleId}>
            <ArticleComponent />
            <EmailCaptureModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleEmailSubmit}
            />
        </ArticleLayout>
    );
};

export default ArticleDetail;