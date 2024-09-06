import React, { useEffect, useState } from 'react';
import '../../App.css';

function RotatingText() {
    const texts = [
        'Family Photos',
        'Wedding Photos',
        'Engagement Photos',
        'Couples Photo Sessions',
        'Individual Photos',
        'Headshots',
        'Event Photos',
        'Product Photos',
        'Maternity Photos',
        'Newborn Photos',
        'Videographers',
        'DJs',
        'Wedding Cakes',
        'Hair and Makeup Artists'
    ];
    
    
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        let intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                return (prevIndex + 1) % texts.length;
            });
        }, 3000);
    
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
