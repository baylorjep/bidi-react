import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './Articles.css'; // Import the CSS file
import Helmet from 'react-helmet'; // Import Helmet for SEO
import weddingPlanning from '../../assets/articles/weddingplanning.jpg'
import florist from '../../assets/articles/Florist/pexels-digitle-pixels-1775950082-30891131.jpg'
import catering from '../../assets/articles/Catering/pexels-fu-zhichao-176355-587741.jpg'
import cateringHero from '../../assets/articles/Utah Catering/utah_catering_timpanogos.png'
import weddingMarketGuide from '../../assets/images/State of the Utah Wedding Markets.png'
import rusticWedding from '../../assets/quiz/rustic/rustic-wedding.jpg'
import djHero from '../../assets/articles/UtahDJ/pexels-wendywei-1540319.jpg'

const Articles = () => {
    // Define articles with their dates
    const articles = [
        {
            id: 'utah-dj-costs',
            title: 'Utah DJ Costs Per Hour: Real Pricing Guide for 2025 [From Local DJs]',
            description: 'Comprehensive guide to Utah DJ costs for weddings, corporate events, and social gatherings. Learn about hourly rates, package options, and regional price variations.',
            image: djHero,
            date: '2024-03-20'
        },
        {
            id: 'utah-catering-costs',
            title: 'Utah Catering Costs Revealed: What You\'ll Actually Pay in 2025',
            description: 'Comprehensive guide to Utah catering costs for weddings, corporate events, and social gatherings. Learn about regional price variations, service styles, and hidden costs.',
            image: cateringHero,
            date: '2024-03-20'
        },
        {
            id: 'utah-wedding-planning-guide',
            title: 'How to Plan Your Dream Utah Wedding: A Wedding Planner\'s Step-by-Step Guide',
            description: 'Navigate Utah wedding planning with confidence. From temple ceremonies to mountain venues, discover everything you need to know about creating your perfect celebration in the Beehive State, including costs, traditions, and seasonal considerations.',
            image: weddingPlanning,
            date: '2024-03-15'
        },
        {
            id: 'utah-photography-cost-guide',
            title: 'Utah Wedding Photographer Guide 2025: Costs, Styles & Expert Tips',
            description: 'Get real pricing data for photographers across Utah, from Salt Lake City to St. George. Compare rates by region, experience level, and specialty. Includes tips for maximizing your photography budget in popular locations like Park City and Moab.',
            image: 'https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/61bd4058-aa6f-4844-84b8-444afcf7fe9a.png',
            date: '2024-03-10'
        },
        {
            id: 'wedding-photographer-cost-guide',
            title: 'Wedding Photographer Cost Guide: What You\'ll Actually Pay in 2025 [From Real Couples]',
            description: 'Planning your wedding photography budget? Discover what real couples are paying in 2025, from basic packages starting at $2,000 to luxury services exceeding $10,000. Learn about hidden costs, essential questions to ask photographers, and smart ways to maximize your photography investment. Plus, get expert tips on choosing the right photographer for your style and budget.',
            image: require('../../assets/articles/WeddingPhotographyCostGuide/photographer.webp'),
            date: '2024-03-05'
        },
        {
            id: 'wedding-videographer-cost-guide',
            title: 'Wedding Videographer Cost Guide: What You\'ll Actually Pay in 2025',
            description: 'Considering a wedding videographer? Explore comprehensive pricing details for 2025, with packages ranging from $1,000 to $7,500+. Understand what influences costs - from shoot duration and crew size to editing styles and delivery formats. Get insider tips on choosing the right package and avoiding common booking mistakes that could cost you later.',
            image: require('../../assets/articles/VideographyCostGuide/videographer.webp'),
            date: '2024-02-28'
        },
        {
            id: 'wedding-catering-cost-guide',
            title: 'Wedding Catering Costs Revealed: What You\'ll Actually Pay in 2025',
            description: 'Navigate wedding catering costs with confidence. From per-person pricing ($30-$270) to service styles affecting your budget, learn what drives catering costs in 2025. Discover how to choose between buffet, plated, and family-style service, plus tips for handling dietary restrictions without breaking the bank. Includes real examples of catering budgets from $2,000 to $30,000.',
            image: catering,
            date: '2024-02-20'
        },
        {
            id: 'wedding-florist-cost-guide',
            title: 'Wedding Florist Cost Guide: What You\'ll Actually Pay in 2025',
            description: 'Master your floral budget with our detailed 2025 pricing guide. Learn why flower costs have risen 22% since 2021 and what that means for your wedding. From bridal bouquets ($150-$350) to complete floral designs ($1,500-$15,000), understand what drives costs and how to get the most beauty for your budget. Includes seasonal pricing tips and money-saving strategies from expert florists.',
            image: florist,
            date: '2024-02-15'
        },
        {
            id: 'wedding-dj-cost-guide',
            title: 'Wedding DJ Cost Guide: What You\'ll Actually Pay in 2025',
            description: 'Find the perfect wedding DJ within your budget. Explore current market rates ($1,000-$3,000), package options, and what services you should expect at different price points. Learn about essential equipment, music libraries, and how to evaluate a DJ\'s experience. Includes tips for negotiating contracts and handling special music requests without extra charges.',
            image: 'https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/f21fe181-8769-4701-a632-01f7e061d239.png',
            date: '2024-02-10'
        },
        {
            id: 'wedding-hair-makeup-cost-guide',
            title: 'Wedding Hair and Makeup Cost Guide: What You\'ll Actually Pay in 2025',
            description: 'Get picture-perfect wedding beauty without budget stress. Understand current hair and makeup costs ($150-$650), including trials, on-site services, and bridal party packages. Learn what factors influence pricing, from location to style complexity, and get tips for timing your beauty schedule. Features advice on trials, selecting artists, and ensuring your look lasts all day.',
            image: require('../../assets/articles/WeddingHairStylist/pexels-enginakyurt-3065096.jpg'),
            date: '2024-02-05'
        },
        {
            id: 'utah-wedding-videographer-guide',
            title: 'How to Choose Your Utah Wedding Videographer: A Stress-Free Guide',
            description: 'Navigate the process of finding and hiring the perfect wedding videographer in Utah. Compare styles, packages, and prices while learning what questions to ask potential videographers. Includes insights on local venues, permits, and latest filming trends across Salt Lake City, Park City, and beyond.',
            image: 'https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/77bcb9b6-4c3e-4211-90c8-0d38283a4b73.png',
            date: '2024-02-01'
        },
        {
            id: 'everything-wrong-with-the-wedding-industry',
            title: '(Almost) Everything Wrong with the Wedding Industry, and Where We Go to Fix It',
            description: 'A critical look at the modern wedding industry: costs, time, and alternatives. By Luci Sullivan. Solutions for couples seeking a better way to plan.',
            image: 'https://images.pexels.com/photos/17315419/pexels-photo-17315419.jpeg',
            date: '2025-05-24'
        }
    ];

    // Sort articles by date (newest first)
    const sortedArticles = [...articles].sort((a, b) => {
        // First, check if either article is Utah-specific
        const aIsUtah = a.title.toLowerCase().includes('utah') || a.id.toLowerCase().includes('utah');
        const bIsUtah = b.title.toLowerCase().includes('utah') || b.id.toLowerCase().includes('utah');
        
        // If both are Utah articles or both are not Utah articles, sort by date
        if (aIsUtah === bIsUtah) {
            return new Date(b.date) - new Date(a.date);
        }
        
        // Utah articles come first
        return bIsUtah ? 1 : -1;
    });

    return (
        <div className="articles-navigation-container">
            <Helmet>
                <title>Wedding Guides</title>
                <meta name="description" content="Explore our collection of articles on wedding photography, including cost guides, budgeting tips, and insights from real couples." />
                <meta name="keywords" content="wedding photography, articles, guides, budgeting, wedding planning" />
            </Helmet>
            <h1 className="articles-navigation-title">Wedding Guides</h1>

            {/* Featured Guide Section - now with better mobile layout */}
            <div className="featured-guide">
                <Link to="/wedding-market-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="featured-guide-content">
                        <div className="featured-guide-text">
                            <span className="featured-label">NEW & EXCLUSIVE</span>
                            <h2 className="featured-title">2024 State of Utah Wedding Markets Guide</h2>
                            <p className="featured-description">
                                Get exclusive data on real wedding costs in Utah based on thousands of actual vendor bids. 
                                Compare prices across different regions and vendor categories.
                            </p>
                            <div className="button-container">
                                <button className="download-guide-button">Download Free Guide</button>
                            </div>
                        </div>
                        <div className="featured-guide-image">
                            <img 
                                src={weddingMarketGuide} 
                                alt="State of Utah Wedding Markets Guide" 
                            />
                        </div>
                    </div>
                </Link>
            </div>

            <div className="interactive-feature">
                <Link to="/wedding-vibe-quiz" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="interactive-feature-content">
                        <div className="interactive-feature-text">
                            <span className="featured-label">INTERACTIVE</span>
                            <h2 className="featured-title">What's Your Wedding Style?</h2>
                            <p className="featured-description">
                                Take our quick quiz to discover your perfect wedding aesthetic and get matched with vendors who match your vision. 
                                From classic elegance to modern chic, find your unique style in minutes!
                            </p>
                            <div className="button-container">
                                <button className="take-quiz-button">Take the Quiz</button>
                            </div>
                        </div>
                        <div className="interactive-feature-image">
                            <img 
                                src={rusticWedding}
                                alt="Wedding Style Quiz" 
                            />
                        </div>
                    </div>
                </Link>
            </div>

            <h2 className="section-title">All Guides</h2>
            <ul className="articles-navigation-list">
                {sortedArticles.map((article) => (
                    <li key={article.id} className="article-navigation-item">
                        <Link to={`/articles/${article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="article-preview">
                                <img 
                                    src={article.image} 
                                    alt={article.title} 
                                    className="article-image" 
                                />
                                <div className="article-content">
                                    <h2>{article.title}</h2>
                                    <p>{article.description}</p>
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Articles;