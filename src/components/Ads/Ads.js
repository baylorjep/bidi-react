import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Ads.css';
import JessicaIcon from '../../assets/images/Jessica Williams Cropped.jpg';
import ChandraIcon from '../../assets/images/Chandra cropped.png';
import KaylaIcon from '../../assets/images/Kayla Barnett.jpg';

const Ads = () => {
    const navigate = useNavigate();

    useEffect(() => {
        console.log('Ads component mounted');
    }, []);

    const reviews = useMemo(() => {
        const allReviews = [
            {
                avatar: JessicaIcon,
                name: "Jessica W.",
                date: "February 17th, 2025",
                review: "Bidi has been awesome. It's super helpful to have multiple vendors come to you and be able to review them side by side. We found a great deal on our videographer! 10/10 recommend."
            },
            {
                avatar: ChandraIcon,
                name: "Chandra W.",
                date: "February 17th, 2025",
                review: "If you're planning a wedding, I can't recommend Bidi enough! I received offers from multiple vendors within hours, making the process incredibly smooth. It's like having a personal wedding planner right at your fingertips—fast, easy, and incredibly resourceful. Definitely worth it!!!"
            },
            {
                avatar: KaylaIcon,
                name: "Kayla B.",
                date: "February 07th, 2025",
                review: "I came across Bidi for the first time in its early days while planning my wedding and searching for an easier way to request bids from vendors aside from sending hundreds of blind emails. The team over at Bidi won me over by not only saving me precious time, but also with their exceptional customer service."
            }
        ];

        // Randomly select 2 reviews
        return allReviews
            .sort(() => Math.random() - 0.5)
            .slice(0, 2);
    }, []);

    return (
        <div className="ad-container" style={{ display: 'block', visibility: 'visible', height: 'auto' }}>
            <div className="ad-card" style={{ display: 'block', visibility: 'visible', height: 'auto' }}>
                <h3 className="ad-title">
                    Get Instant Quotes
                </h3>
                <p className="ad-text">
                    Compare prices and services from multiple vendors in one place. Save time and find the perfect match for your event.
                </p>
                <button className="ad-button">
                    Request Quotes Now
                </button>
            </div>

            <div className="ad-card">
                <h3 className="ad-title">
                    Save Big with Bidi
                </h3>
                <div className="savings-amount">
                    $300
                </div>
                <p className="ad-text ad-text-center">
                    Average savings when booking through Bidi compared to direct booking
                </p>
            </div>

            <div className="ad-card">
                <h3 className="ad-title">
                    <span style={{ marginRight: '10px' }}>👻</span>
                    No Ghosting Guarantee
                </h3>
                <div className="ad-text">
                    <p style={{ marginBottom: '16px' }}>
                        Book with confidence knowing that if your vendor becomes unresponsive, we'll:
                    </p>
                    <ul className="guarantee-list">
                        <li className="guarantee-item">
                            <span className="guarantee-check">✓</span>
                            <span className="guarantee-text">Refund your full payment</span>
                        </li>
                        <li className="guarantee-item">
                            <span className="guarantee-check">✓</span>
                            <span className="guarantee-text">Help you find a replacement vendor</span>
                        </li>
                        <li className="guarantee-item">
                            <span className="guarantee-check">✓</span>
                            <span className="guarantee-text">Ensure your event stays on track</span>
                        </li>
                    </ul>
                    <button 
                        className="ad-button"
                        onClick={() => navigate('/no-ghosting-guarantee')}
                        style={{ 
                            marginTop: '20px',
                            background: 'linear-gradient(85deg, #A328F4 9.33%, rgba(255, 0, 138, 0.76) 68.51%)',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        Learn More About Our Guarantee
                    </button>
                </div>
            </div>

            {reviews.map((review, index) => (
                <div key={index} className="ad-card">
                    <h3 className="ad-title">
                        What Our Clients Say
                    </h3>
                    <div className="ad-text">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                            <img 
                                src={review.avatar} 
                                alt={review.name} 
                                style={{ width: "48px", height: "48px", borderRadius: "50%" }}
                                onError={(e) => {
                                    console.error(`Failed to load image for ${review.name}:`, e);
                                    e.target.style.display = 'none';
                                }}
                            />
                            <div>
                                <div style={{ fontWeight: "bold" }}>{review.name}</div>
                                <div style={{ fontSize: "0.9em", color: "#666" }}>{review.date}</div>
                            </div>
                        </div>
                        <p style={{ fontStyle: "italic" }}>
                            "{review.review}"
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Ads; 