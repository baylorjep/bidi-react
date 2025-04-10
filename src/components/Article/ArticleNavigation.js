import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './Articles.css'; // Import the CSS file
import Helmet from 'react-helmet'; // Import Helmet for SEO
import weddingPlanning from '../../assets/articles/weddingplanning.jpg'
import florist from '../../assets/articles/Florist/pexels-digitle-pixels-1775950082-30891131.jpg'
import catering from '../../assets/articles/Catering/pexels-fu-zhichao-176355-587741.jpg'
import weddingMarketGuide from '../../assets/images/State of the Utah Wedding Markets.png'
import rusticWedding from '../../assets/quiz/rustic/rustic-wedding.jpg'

const Articles = () => {
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
            <li className="article-navigation-item">
                    <Link to="/articles/utah-wedding-planning-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                            <img 
                                src={weddingPlanning} 
                                alt="Utah Wedding Planning Guide" 
                                className="article-image" 
                            />
                            <div className="article-content">
                                <h2>How to Plan Your Dream Utah Wedding: A Wedding Planner's Step-by-Step Guide</h2>
                                <p>Navigate Utah wedding planning with confidence. From temple ceremonies to mountain venues, discover everything you need to know about creating your perfect celebration in the Beehive State, including costs, traditions, and seasonal considerations.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/utah-photography-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                            <img 
                                src="https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/61bd4058-aa6f-4844-84b8-444afcf7fe9a.png"
                                alt="Utah Photography Cost Guide" 
                                className="article-image" 
                            />
                            <div className="article-content">
                                <h2>Utah Wedding Photographer Guide 2025: Costs, Styles & Expert Tips</h2>
                                <p>Get real pricing data for photographers across Utah, from Salt Lake City to St. George. Compare rates by region, experience level, and specialty. Includes tips for maximizing your photography budget in popular locations like Park City and Moab.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-photographer-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                            <img src={require('../../assets/articles/WeddingPhotographyCostGuide/photographer.webp')} alt="Wedding Photographer Cost Guide" className="article-image" />
                            <div className="article-content">
                                <h2>Wedding Photographer Cost Guide: What You'll Actually Pay in 2025 [From Real Couples]</h2>
                                <p>Planning your wedding photography budget? Discover what real couples are paying in 2025, from basic packages starting at $2,000 to luxury services exceeding $10,000. Learn about hidden costs, essential questions to ask photographers, and smart ways to maximize your photography investment. Plus, get expert tips on choosing the right photographer for your style and budget.</p>
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
                                <p>Considering a wedding videographer? Explore comprehensive pricing details for 2025, with packages ranging from $1,000 to $7,500+. Understand what influences costs - from shoot duration and crew size to editing styles and delivery formats. Get insider tips on choosing the right package and avoiding common booking mistakes that could cost you later.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-catering-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                        <img src={catering} className='article-image' alt="Hero Image for Wedding Catering Costs Revealed: What You'll Actually Pay in 2025 [Expert Data]" />
                            <div className="article-content">
                                <h2>Wedding Catering Costs Revealed: What You'll Actually Pay in 2025</h2>
                                <p>Navigate wedding catering costs with confidence. From per-person pricing ($30-$270) to service styles affecting your budget, learn what drives catering costs in 2025. Discover how to choose between buffet, plated, and family-style service, plus tips for handling dietary restrictions without breaking the bank. Includes real examples of catering budgets from $2,000 to $30,000.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-florist-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                        <img src={florist} className='article-image' alt="Hero Image for How to Budget Wedding Flowers Cost: What Real Couples Actually Pay" />
                            <div className="article-content">
                                <h2>Wedding Florist Cost Guide: What You'll Actually Pay in 2025</h2>
                                <p>Master your floral budget with our detailed 2025 pricing guide. Learn why flower costs have risen 22% since 2021 and what that means for your wedding. From bridal bouquets ($150-$350) to complete floral designs ($1,500-$15,000), understand what drives costs and how to get the most beauty for your budget. Includes seasonal pricing tips and money-saving strategies from expert florists.</p>
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
                                <h2>Wedding DJ Cost Guide: What You'll Actually Pay in 2025</h2>
                                <p>Find the perfect wedding DJ within your budget. Explore current market rates ($1,000-$3,000), package options, and what services you should expect at different price points. Learn about essential equipment, music libraries, and how to evaluate a DJ's experience. Includes tips for negotiating contracts and handling special music requests without extra charges.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-hair-makeup-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                            <img 
                                src={require('../../assets/articles/WeddingHairStylist/pexels-enginakyurt-3065096.jpg')}
                                alt="Wedding Hair and Makeup Guide" 
                                className="article-image" 
                            />
                            <div className="article-content">
                                <h2>Wedding Hair and Makeup Cost Guide: What You'll Actually Pay in 2025</h2>
                                <p>Get picture-perfect wedding beauty without budget stress. Understand current hair and makeup costs ($150-$650), including trials, on-site services, and bridal party packages. Learn what factors influence pricing, from location to style complexity, and get tips for timing your beauty schedule. Features advice on trials, selecting artists, and ensuring your look lasts all day.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/utah-wedding-videographer-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                            <img 
                                src="https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/77bcb9b6-4c3e-4211-90c8-0d38283a4b73.png"
                                alt="Utah Wedding Videographer Guide" 
                                className="article-image" 
                            />
                            <div className="article-content">
                                <h2>How to Choose Your Utah Wedding Videographer: A Stress-Free Guide</h2>
                                <p>Navigate the process of finding and hiring the perfect wedding videographer in Utah. Compare styles, packages, and prices while learning what questions to ask potential videographers. Includes insights on local venues, permits, and latest filming trends across Salt Lake City, Park City, and beyond.</p>
                            </div>
                        </div>
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default Articles;