import React, { useEffect, useState } from 'react';
import '../../App.css';

function CorporateRotatingText() {
    const items = [
        'Caterers',
        'Event Coordinators',
        'Photographers',
        'DJs',
        'Venues',
        'Decorators',
        'Florists',
        'Videographers',
        'Event Planners'
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const fadeOutInterval = setInterval(() => {
            setIsFadingOut(true);

            // After 500ms (the length of the fade-out animation), update the text
            setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
                setIsFadingOut(false);
            }, 500); // This should match the CSS fade-out duration
        }, 2000); // Changed from 3000 to 2000 for faster rotation

        return () => clearInterval(fadeOutInterval);
    }, [items.length]);

    return (
        <div className="rotating-text-wrapper">
            <div className={`rotating-text ${isFadingOut ? 'fade-out' : 'fade-in'}`}>
                <span>{items[currentIndex]}</span>
            </div>
        </div>
    );
}

export default CorporateRotatingText; 