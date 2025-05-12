import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../App.css"; // Add custom styling
import jennaferIcon from '../assets/images/Jennafer Profile.png';
import jaronIcon from '../assets/images/Jaron Anderson.jpg';
import starIcon from '../assets/images/Star.svg'
import KaylaIcon from '../assets/images/Kayla Barnett.jpg'
import JessicaIcon from '../assets/images/Jessica Williams.jpg'
import ChandraIcon from '../assets/images/Chandra cropped.png'
import Jessica from '../assets/images/Jessica Williams Cropped.jpg'

const UserReviews = () => {
  const reviews = [
    {
      avatar: Jessica,
      name: "Jessica W.",
      date: "February 17th, 2025",
      review: "Bidi has been awesome. It's super helpful to have multiple vendors come to you and be able to review them side by side. We found a great deal on our videographer! 10/10 recommend."
    },
    {
      avatar: ChandraIcon,
      name: "Chandra W.",
      date: "Februrary 17th, 2025",
      review: "If you're planning a wedding, I can't recommend Bidi enough! I received offers from multiple vendors within hours, making the process incredibly smooth. It’s like having a personal wedding planner right at your fingertips—fast, easy, and incredibly resourceful. Definitely worth it!!!"
    },
    
    {
      avatar:KaylaIcon,
      name: "Kayla B.",
      date: "February 07th, 2025",
      review:"I came across Bidi for the first time in its early days while planning my wedding and searching for an easier way to request bids from vendors aside from sending hundreds of blind emails. The team over at Bidi won me over by not only saving me precious time, but also with their exceptional customer service. Eager to grow and make the platform more user friendly, they took the recommendations I had to heart, and weeks later, I am beyond impressed with the improvements they've made. It's a thriving platform built truly optimized for the user experience. It's super cool seeing a young company grow so fast, all while filling a huge gap in the wedding industry. Super grateful for Bidi!"
    },

    {
      avatar: JessicaIcon,
      name: "Jessica W.",
      date: "December 9th, 2024",
      review: "I used it and was able to find a great photographer! It was nice to see options all in one place, and to know that they were available."
    }
  ];

  return (
    <div className="user-reviews">
        <div className="user-reviews-title">Here Is What Our Clients Are Saying About Us</div>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
      >
        {reviews.map((review, index) => (
          <SwiperSlide key={index}>

            <div className="review-container">

                <div className="review-card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img className="review-avatar" src={review.avatar} alt={`${review.name}'s avatar`} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap:'8px' }}>
                        <div className="review-name">{review.name}</div>
                        <div className="review-text">{review.review}</div>
                        <div className="review-date">{review.date}</div>
                    </div>
                </div>
            </div>

          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default UserReviews;