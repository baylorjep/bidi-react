import React, { useState } from 'react';
import '../../App.css';
import './TrainingVideos.css';

const TrainingVideos = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Helper function to get embed URL for different platforms
    const getEmbedUrl = (url, platform = 'youtube') => {
        if (platform === 'youtube') {
            // Convert YouTube URL to embed format
            const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
        }
        if (platform === 'vimeo') {
            // Convert Vimeo URL to embed format
            const videoId = url.match(/vimeo\.com\/(\d+)/);
            return videoId ? `https://player.vimeo.com/video/${videoId[1]}` : url;
        }
        if (platform === 'loom') {
            // Convert Loom URL to embed format
            const videoId = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
            return videoId ? `https://www.loom.com/embed/${videoId[1]}` : url;
        }
        return url;
    };

    // Training video categories and content
    const videoCategories = [
        { id: 'all', name: 'All Videos', icon: 'fas fa-play-circle' },
        { id: 'getting-started', name: 'Getting Started', icon: 'fas fa-rocket' },
        { id: 'bidding', name: 'Bidding & Pricing', icon: 'fas fa-gavel' },
        { id: 'payments', name: 'Payments & Billing', icon: 'fas fa-credit-card' }
    ];

    // ===== UPDATE YOUR VIDEOS HERE =====
    // Replace the videoUrl with your actual video URLs
    // Supported platforms: YouTube, Vimeo, Loom
    const trainingVideos = [
        {
            id: 1,
            title: 'Welcome to Bidi - Getting Started',
            description: 'Learn the basics of setting up your business profile and navigating the platform.',
            category: 'getting-started',
            duration: '2:30',
            thumbnail: 'https://cdn.loom.com/sessions/thumbnails/f495e3d94c4940aa8eea55d5feafa31f-b9aea6ac222c249a-full-play.gif',
            videoUrl: 'https://www.loom.com/share/f495e3d94c4940aa8eea55d5feafa31f?sid=709a24b7-e848-452d-864d-4c52ad6bf0a1', // Replace with your YouTube URL
            platform: 'loom', // 'youtube', 'vimeo', or 'loom'
            featured: true
        },
        {
            id: 2,
            title: 'Setting Up Payment Processing',
            description: 'Configure your payment settings and understand the billing process.',
            category: 'payments',
            duration: '2:30',
            thumbnail: '/images/training/payments-thumb.jpg',
            videoUrl: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID',
            platform: 'youtube'
        },
        {
            id: 3,
            title: 'What Your Clients Are Seeing',
            description: 'See what your clients are seeing when they view your bids, profile, and packages.',
            category: 'bidding',
            duration: '3:00',
            thumbnail: 'https://cdn.loom.com/sessions/thumbnails/ac2fec2136bd4d49ae8eed11d185586d-2153929311852527-full-play.gif',
            videoUrl: 'https://www.loom.com/share/ac2fec2136bd4d49ae8eed11d185586d?sid=bb599340-eb4c-413a-b106-3258e1ac3498',
            platform: 'loom'
        }
    ];

    // ===== END VIDEO CONFIGURATION =====

    const filteredVideos = trainingVideos.filter(video => {
        const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
        const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             video.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const [selectedVideo, setSelectedVideo] = useState(null);

    const handleVideoClick = (video) => {
        setSelectedVideo(video);
    };

    const closeVideo = () => {
        setSelectedVideo(null);
    };

    return (
        <div className="training-videos-container">
            <div className="training-header">
                <h1>Training Videos</h1>
                <p>Master Bidi and grow your business with our comprehensive training library</p>
            </div>

            {/* Search and Filter Section */}
            <div className="training-controls">
                <div className="search-container">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        placeholder="Search training videos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <div className="category-filters">
                    {videoCategories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
                        >
                            <i className={category.icon}></i>
                            <span>{category.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Featured Video Section */}
            {selectedCategory === 'all' && searchTerm === '' && (
                <div className="featured-video-section">
                    <h2>Featured Training</h2>
                    <div className="featured-video">
                        {trainingVideos.find(v => v.featured) && (
                            <div className="featured-video-card" onClick={() => handleVideoClick(trainingVideos.find(v => v.featured))}>
                                <div className="video-thumbnail">
                                    <img src={trainingVideos.find(v => v.featured).thumbnail} alt="Featured video" />
                                    <div className="play-overlay">
                                        <i className="fas fa-play"></i>
                                    </div>
                                    <div className="duration-badge">{trainingVideos.find(v => v.featured).duration}</div>
                                </div>
                                <div className="video-info">
                                    <h3>{trainingVideos.find(v => v.featured).title}</h3>
                                    <p>{trainingVideos.find(v => v.featured).description}</p>
                                    <span className="featured-badge">Featured</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Video Grid */}
            <div className="videos-grid">
                <h2>{selectedCategory === 'all' ? 'All Training Videos' : videoCategories.find(c => c.id === selectedCategory)?.name}</h2>
                
                {filteredVideos.length === 0 ? (
                    <div className="no-videos">
                        <i className="fas fa-video-slash"></i>
                        <p>No videos found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="video-cards">
                        {filteredVideos.map(video => (
                            <div key={video.id} className="video-card" onClick={() => handleVideoClick(video)}>
                                <div className="video-thumbnail">
                                    <img src={video.thumbnail} alt={video.title} />
                                    <div className="play-overlay">
                                        <i className="fas fa-play"></i>
                                    </div>
                                    <div className="duration-badge">{video.duration}</div>
                                </div>
                                <div className="video-info">
                                    <h3>{video.title}</h3>
                                    <p>{video.description}</p>
                                    <div className="video-meta">
                                        <span className="category-tag">
                                            {videoCategories.find(c => c.id === video.category)?.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="video-modal-overlay" onClick={closeVideo}>
                    <div className="video-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={closeVideo}>
                            <i className="fas fa-times"></i>
                        </button>
                        <div className="video-container">
                            <iframe
                                src={getEmbedUrl(selectedVideo.videoUrl, selectedVideo.platform)}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div className="video-details">
                            <h2>{selectedVideo.title}</h2>
                            <p>{selectedVideo.description}</p>
                            <div className="video-meta">
                                <span className="duration">{selectedVideo.duration}</span>
                                <span className="category">
                                    {videoCategories.find(c => c.id === selectedVideo.category)?.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainingVideos; 