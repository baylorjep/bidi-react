import React from 'react';
import Testimonial from './Testimonial';
import '../../../App.css';

const testimonials = [
    { text: "This is incredible! Super excited!", author: "Whitney J." },
    { text: "Yay this is so cool! Can't wait!", author: "Mike S." },
    { text: "You guys are kicking butt btw!", author: "Justin W." },
    { text: "I love how automated it all is!", author: "Olivia J." },
    { text: "Will definitely use again!", author: "Josh B." },
    // Add more testimonials as needed
];

const TestimonialSlider = () => {
    return (
        <div className="testimonial-slider">
            <div className="testimonial-wrapper">
                {testimonials.map((testimonial, index) => (
                    <Testimonial key={index} text={testimonial.text} author={testimonial.author} />
                ))}
                {/* Duplicate testimonials to ensure seamless looping */}
                {testimonials.map((testimonial, index) => (
                    <Testimonial key={index + testimonials.length} text={testimonial.text} author={testimonial.author} />
                ))}
            </div>
        </div>
    );
};

export default TestimonialSlider;
