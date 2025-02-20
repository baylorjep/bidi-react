import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './Articles.css'; // Import the CSS file
import Helmet from 'react-helmet'; // Import Helmet for SEO

const Articles = () => {
    return (
        <div className="articles-navigation-container">
            <Helmet>
                <title>Wedding Guides</title>
                <meta name="description" content="Explore our collection of articles on wedding photography, including cost guides, budgeting tips, and insights from real couples." />
                <meta name="keywords" content="wedding photography, articles, guides, budgeting, wedding planning" />
            </Helmet>
            <h1 className="articles-navigation-title">Wedding Guides</h1>
            <ul className="articles-navigation-list">
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-photographer-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                            <img src={require('../../assets/articles/WeddingPhotographyCostGuide/photographer.webp')} alt="Wedding Photographer Cost Guide" className="article-image" />
                            <div className="article-content">
                                <h2>Wedding Photographer Cost Guide: What You'll Actually Pay in 2025 [From Real Couples]</h2>
                                <p>Explore the comprehensive guide on wedding photography costs in 2025, featuring insights from real couples. This article breaks down average prices, package options, and tips for budgeting effectively.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-videographer-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                            <img src={require('../../assets/articles/VideographyCostGuide/videographer.webp')} alt="Wedding Videographer Cost Guide" className="article-image" />
                            <div className="article-content">
                                <h2>Wedding Videographer Cost Guide: What You'll Actually Pay in 2025</h2>
                                <p>Discover the true costs of wedding videography in 2025, including average prices, hidden fees, and tips for budgeting effectively.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-catering-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                        <img src="https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/0feae650-b696-4124-89a5-b76f27157ab1.jpeg?st=2025-02-19T02%3A06%3A41Z&amp;se=2025-02-26T02%3A06%3A41Z&amp;sp=r&amp;sv=2025-01-05&amp;sr=b&amp;sig=Jy71E/0w%2BQV8h2IHqoywSMKqClC0oF6qX/e83pKliTI%3D" className='article-image' alt="Hero Image for Wedding Catering Costs Revealed: What You'll Actually Pay in 2025 [Expert Data]" />
                            <div className="article-content">
                                <h2>Wedding Catering Costs Revealed: What You'll Actually Pay in 2025 [Expert Data]</h2>
                                <p>Explore the comprehensive guide on wedding catering costs in 2025, featuring insights from real couples. This article breaks down average prices, package options, and tips for budgeting effectively.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-florist-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                        <img src="https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/3daa149f-80bd-4a7c-8cbf-ac0954d3b2fe.png?st=2025-02-19T02%3A49%3A14Z&amp;se=2025-02-26T02%3A49%3A14Z&amp;sp=r&amp;sv=2025-01-05&amp;sr=b&amp;sig=1/5iFN4stZoW184lDUyxFAHF%2BXwDE3QxCM9DZtEoqnY%3D" className='article-image' alt="Hero Image for How to Budget Wedding Flowers Cost: What Real Couples Actually Pay" />
                            <div className="article-content">
                                <h2>How to Budget Wedding Flowers Cost: What Real Couples Actually Pay</h2>
                                <p>Tired of guessing what wedding flowers should cost? Wedding flowers cost 22% more than just two years ago. Your dream bouquet that cost $2,200 in 2021 now sits at $2,800. The numbers tell a wild story. Some couples in Los Angeles spend over $10,000 on their floral arrangements, while others create beautiful celebrations with just $700. Most couples set aside 8% to 10% of their total budget for flowers, but what's the right amount for you? Your perfect flower budget depends on what matters most - your location, flower choices, and design dreams all play a part. The best way to plan? Learn what other couples actually pay. We'll show you real costs and smart ways to get the flowers you want without breaking your budget. Not sure about flower prices in your area? Tell us what you need, and Bidi will match you with local florists ready to create custom quotes for your special day.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-dj-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                            <img src="https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/f21fe181-8769-4701-a632-01f7e061d239.png" 
                                 alt="Wedding DJ Cost Guide" 
                                 className="article-image" />
                            <div className="article-content">
                                <h2>How to Find a Wedding DJ Near Me: Expert Guide to Prices & Booking</h2>
                                <p>Find the perfect wedding DJ with our comprehensive guide on costs, services, and what to look for when booking. Get expert insights on prices and packages for 2025.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                {/* Add more articles here */}
            </ul>
        </div>
    );
};

export default Articles;