import React, { useEffect, useState } from 'react';
import '../../App.css';
import cakeIcon from '../../assets/images/Icons/cake icon.svg';
import cameraIcon from '../../assets/images/Icons/camera icon.svg';
import hairIcon from '../../assets/images/Icons/music_line.svg';
import scicssorIcon from '../../assets/images/Icons/scissors icon.svg'

function RotatingText() {
    const items = [
        { text: 'Photographer', image: cameraIcon },
        { text: 'DJ', image: hairIcon },
        { text: 'Hair and Makeup Artist', image: scicssorIcon },
        { text: 'Wedding/Event Planner', image: cakeIcon },
        { text: 'Videographer', image: cameraIcon }
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
        }, 3000); // 3 seconds for each full cycle (fade-out + display)

        return () => clearInterval(fadeOutInterval);
    }, [items.length]);

    return (
        <div className="rotating-text-wrapper">
            <div className={`rotating-text ${isFadingOut ? 'fade-out' : 'fade-in'}`}>
                <img src={items[currentIndex].image} alt={items[currentIndex].text} className="rotating-image" />
                <span>{items[currentIndex].text}</span>
            </div>
        </div>
    );
}

export default RotatingText;
