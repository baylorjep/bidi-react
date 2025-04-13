import React from 'react';
import { Link } from 'react-router-dom';
import videographerCost from '../../assets/articles/VideographyCostGuide/videographer cost.webp';
import photographerCost from '../../assets/articles/WeddingPhotographyCostGuide/budget.jpg';
import weddingPlanning from '../../assets/articles/weddingplanning.jpg';
import florist from '../../assets/articles/Florist/pexels-digitle-pixels-1775950082-30891131.jpg';
import catering from '../../assets/articles/Catering/pexels-fu-zhichao-176355-587741.jpg';
import hairMakeup from '../../assets/articles/WeddingHairStylist/pexels-enginakyurt-3065096.jpg';

const RelatedArticles = ({ currentArticle }) => {
    const articles = [
        {
            title: "How to Plan Your Dream Utah Wedding: A Wedding Planner's Step-by-Step Guide",
            description: "Navigate Utah wedding planning with confidence. From temple ceremonies to mountain venues, discover everything you need to know.",
            image: weddingPlanning,
            path: "/articles/utah-wedding-planning-guide",
            id: "planning"
        },
        {
            title: "Utah Wedding Photographer Guide 2025: Costs, Styles & Expert Tips",
            description: "Get real pricing data for photographers across Utah, from Salt Lake City to St. George. Compare rates by region, experience level, and specialty.",
            image: "https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/61bd4058-aa6f-4844-84b8-444afcf7fe9a.png",
            path: "/articles/utah-photography-cost-guide",
            id: "utah-photographer"
        },
        {
            title: "Wedding Photographer Cost Guide: What You'll Actually Pay in 2025",
            description: "Discover comprehensive pricing insights for wedding photography, including package breakdowns and money-saving tips.",
            image: photographerCost,
            path: "/articles/wedding-photographer-cost-guide",
            id: "photographer"
        },
        {
            title: "Wedding Videographer Cost Guide: What You'll Actually Pay in 2025",
            description: "Learn about wedding videography costs, from basic packages to premium services, and how to choose the right coverage for your day.",
            image: videographerCost,
            path: "/articles/wedding-videographer-cost-guide",
            id: "videographer"
        },
        {
            title: "Wedding Catering Costs Revealed: What You'll Actually Pay in 2025",
            description: "Navigate wedding catering costs with confidence. From per-person pricing to service styles affecting your budget.",
            image: catering,
            path: "/articles/wedding-catering-cost-guide",
            id: "catering"
        },
        {
            title: "Wedding Florist Cost Guide: What You'll Actually Pay in 2025",
            description: "Master your floral budget with our detailed pricing guide. Learn why flower costs have risen and what that means for your wedding.",
            image: florist,
            path: "/articles/wedding-florist-cost-guide",
            id: "florist"
        },
        {
            title: "Wedding DJ Cost Guide: What You'll Actually Pay in 2025",
            description: "Find the perfect wedding DJ within your budget. Explore current market rates, package options, and what services you should expect.",
            image: "https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/f21fe181-8769-4701-a632-01f7e061d239.png",
            path: "/articles/wedding-dj-cost-guide",
            id: "dj"
        },
        {
            title: "Wedding Hair and Makeup Cost Guide: What You'll Actually Pay in 2025",
            description: "Get picture-perfect wedding beauty without budget stress. Understand current hair and makeup costs and what influences pricing.",
            image: hairMakeup,
            path: "/articles/wedding-hair-makeup-cost-guide",
            id: "hair-makeup"
        },
        {
            title: "How to Choose Your Utah Wedding Videographer: A Stress-Free Guide",
            description: "Navigate the process of finding and hiring the perfect wedding videographer in Utah. Compare styles, packages, and prices.",
            image: "https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/77bcb9b6-4c3e-4211-90c8-0d38283a4b73.png",
            path: "/articles/utah-wedding-videographer-guide",
            id: "utah-videographer"
        }
    ];

    // Filter out current article and get 3 random related articles
    const relatedArticles = articles
        .filter(article => article.id !== currentArticle)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    return (
        <div className="related-articles">
            <h2>Related Articles</h2>
            <div className="related-articles-grid">
                {relatedArticles.map((article, index) => (
                    <Link to={article.path} key={index} className="related-article-card">
                        <img src={article.image} alt={article.title} />
                        <div className="related-article-content">
                            <h3>{article.title}</h3>
                            <p>{article.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RelatedArticles; 