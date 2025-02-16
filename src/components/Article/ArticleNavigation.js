import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './Articles.css'; // Import the CSS file
import Helmet from 'react-helmet'; // Import Helmet for SEO

const Articles = () => {
    return (
        <div className="articles-navigation-container">
            <Helmet>
                <title>Articles - Wedding Guides and Tips</title>
                <meta name="description" content="Explore our collection of articles on wedding photography, including cost guides, budgeting tips, and insights from real couples." />
                <meta name="keywords" content="wedding photography, articles, guides, budgeting, wedding planning" />
            </Helmet>
          <h1 className="articles-navigation-title">Articles</h1>
            <ul className="articles-navigation-list">
                <li className="article-navigation-item">
                    <Link to="/articles/wedding-photographer-cost-guide" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="article-preview">
                            <img src={require('../../assets/articles/budget.jpg')} alt="Wedding Photographer Cost Guide" className="article-image" />
                            <div className="article-content">
                                <h2>Wedding Photographer Cost Guide: What You'll Actually Pay in 2025 [From Real Couples]</h2>
                                <p>Explore the comprehensive guide on wedding photography costs in 2025, featuring insights from real couples. This article breaks down average prices, package options, and tips for budgeting effectively.</p>
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