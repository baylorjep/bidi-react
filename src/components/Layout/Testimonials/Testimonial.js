import React from 'react';
import '../../../App.css';

const Testimonial = ({ text, author }) => {
    return (
        <div className="testimonial">
            <p>"{text}"</p>
            <footer>- {author}</footer>
        </div>
    );
};

export default Testimonial;
