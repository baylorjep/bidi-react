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
                                <h2>Wedding Photographer Cost Guide: What You'll Actually Pay in 2025</h2>
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
                        <img src="https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/0feae650-b696-4124-89a5-b76f27157ab1.jpeg?st=2025-02-19T02%3A06%3A41Z&amp;se=2025-02-26T02%3A06%3A41Z&amp;sp=r&amp;sv=2025-01-05&amp;sr=b&amp;sig=Jy71E/0w%2BQV8h2IHqoywSMKqClC0oF6qX/e83pKliTI%3D" className='article-image' alt="Hero Image for Wedding Catering Costs Revealed: What You'll Actually Pay in 2025 [Expert Data]" />
                            <div className="article-content">
                                <h2>Wedding Catering Cost Guide: What You'll Actually Pay in 2025</h2>
                                <p>Navigate wedding catering costs with confidence. From per-person pricing ($30-$270) to service styles affecting your budget, learn what drives catering costs in 2025. Discover how to choose between buffet, plated, and family-style service, plus tips for handling dietary restrictions without breaking the bank. Includes real examples of catering budgets from $2,000 to $30,000.</p>
                            </div>
                        </div>
                    </Link>
                </li>
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-florist-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                        <img src="https://wsstgprdphotosonic01.blob.core.windows.net/photosonic/3daa149f-80bd-4a7c-8cbf-ac0954d3b2fe.png?st=2025-02-19T02%3A49%3A14Z&amp;se=2025-02-26T02%3A49%3A14Z&amp;sp=r&amp;sv=2025-01-05&amp;sr=b&amp;sig=1/5iFN4stZoW184lDUyxFAHF%2BXwDE3QxCM9DZtEoqnY%3D" className='article-image' alt="Hero Image for How to Budget Wedding Flowers Cost: What Real Couples Actually Pay" />
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
                {/* Add more articles here */}
            </ul>
        </div>
    );
};

export default Articles;