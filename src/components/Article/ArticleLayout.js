import React from 'react';
import RelatedArticles from './RelatedArticles';
import Ads from '../Ads/Ads';
import { useNavigate } from 'react-router-dom';
import './Articles.css';

const ArticleLayout = ({ children, articleId }) => {
    const navigate = useNavigate();

    // Function to get contextual ad content based on article type
    const getContextualAd = () => {
        const articleType = articleId.toLowerCase();
        
        if (articleType.includes('dj')) {
            return {
                title: "Need help finding a DJ?",
                description: "Get matched with top-rated DJs in your area. Compare prices and reviews from real couples.",
                cta: "Find Your DJ",
                category: "DJ"
            };
        } else if (articleType.includes('photograph')) {
            return {
                title: "Looking for a photographer?",
                description: "Connect with talented photographers who match your style and budget.",
                cta: "Find Your Photographer",
                category: "Photography"
            };
        } else if (articleType.includes('cater')) {
            return {
                title: "Need a caterer?",
                description: "Discover amazing caterers who can create the perfect menu for your special day.",
                cta: "Find Your Caterer",
                category: "Catering"
            };
        } else if (articleType.includes('florist')) {
            return {
                title: "Looking for a florist?",
                description: "Find the perfect florist to bring your wedding vision to life with beautiful arrangements.",
                cta: "Find Your Florist",
                category: "Florist"
            };
        } else if (articleType.includes('videograph')) {
            return {
                title: "Need a videographer?",
                description: "Capture your special moments with a professional videographer who understands your style.",
                cta: "Find Your Videographer",
                category: "Videography"
            };
        } else if (articleType.includes('hair') || articleType.includes('makeup')) {
            return {
                title: "Looking for hair & makeup?",
                description: "Get picture-perfect on your wedding day with our curated selection of beauty professionals.",
                cta: "Find Your Artist",
                category: "HairAndMakeup"
            };
        } else if (articleType.includes('utah')) {
            return {
                title: "Planning a Utah wedding?",
                description: "Get matched with the best Utah wedding vendors. Compare prices and reviews from local couples.",
                cta: "Find Utah Vendors",
                category: "WeddingPlanning"
            };
        } else {
            return {
                title: "Planning your wedding?",
                description: "Let us help you find the perfect vendors for your special day.",
                cta: "Get Started",
                category: "WeddingPlanning"
            };
        }
    };

    const handleCtaClick = () => {
        const contextualAd = getContextualAd();
        navigate('/request-categories', {
            state: {
                selectedCategories: [contextualAd.category],
                showRequestFlow: true
            }
        });
    };

    const contextualAd = getContextualAd();

    return (
        <div className="article-layout">
            <div className="article-main">
                {children}
                <RelatedArticles currentArticle={articleId} />
            </div>
            <aside className="article-ads">
                <div className="contextual-ad">
                    <h3>{contextualAd.title}</h3>
                    <p>{contextualAd.description}</p>
                    <button 
                        className="cta-button-contextual-ad"
                        onClick={handleCtaClick}
                    >
                        {contextualAd.cta}
                    </button>
                </div>
                <Ads />
            </aside>
        </div>
    );
};

export default ArticleLayout; 