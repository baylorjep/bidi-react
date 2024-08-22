import React, { useEffect, useState } from 'react';
import '../App.css';

function RotatingText() {
    const texts = [
        'Family Photos',
        'Home Cleaning',
        'Renovation Project',
        'Car Detailing',
        'Moving Service',
        'Landscaping Job',
        'Painting Project',
        'Language Lesson',
        'Web Design Project',
        'Catering Job',
        'Chiropractic Visit',
        'CPA Service',
        'Financial Planning',
        'Tutoring Session',
        'DJ Booking',
        'Personal Training',
        'Piano Lesson',
        'Haircut',
        'Manicure',
        'Social Media Management',
        'Interior Design',
    ];
    
    
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }, 3000); // Change text every 3 seconds

        return () => clearInterval(intervalId);
    }, [texts.length]);

    return (
        <div className="rotating-text-wrapper">
            <div className="rotating-text">
                {texts[currentIndex]}
            </div>
        </div>
    );
}

export default RotatingText;
