import React, { useEffect, useState } from 'react';
import '../../App.css';
import cakeIcon from '../../assets/images/Icons/cake icon.svg';
import cameraIcon from '../../assets/images/Icons/camera icon.svg';
import hairIcon from '../../assets/images/Icons/music_line.svg';
import scicssorIcon from '../../assets/images/Icons/scissors icon.svg'

function RotatingText() {
    const items = [
        'Photographer',
        'DJ',
        'Hairstylist',
        'Makeup Artist',
        'Videographer',
        'Caterer',
        'Florist',
        'Venue',
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

export default RotatingText;
