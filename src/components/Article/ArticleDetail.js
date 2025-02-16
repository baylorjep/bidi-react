import React from 'react';
import { useParams } from 'react-router-dom';

const ArticleDetail = () => {
    const { articleId } = useParams();

    // Example static content based on articleId
    const articles = {
        "wedding-photographer-cost-guide": {
            title: "Wedding Photographer Cost Guide: What You'll Actually Pay in 2025 [From Real Couples]",
            content: "This article provides insights into the costs associated with hiring a wedding photographer in 2025, featuring real experiences from couples."
        },
        "understanding-state-management": {
            title: "Understanding State Management",
            content: "Exploring state management in React applications."
        },
        "building-full-stack-application": {
            title: "Building a Full-Stack Application",
            content: "Step-by-step guide to building a full-stack app."
        }
    };

    const article = articles[articleId];

    return (
        <div>
            {article ? (
                <>
                    <h1>{article.title}</h1>
                    <p>{article.content}</p>
                </>
            ) : (
                <h1>Article not found</h1>
            )}
        </div>
    );
};

export default ArticleDetail; 