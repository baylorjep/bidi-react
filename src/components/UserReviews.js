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

const UserReviews = () => {
  const reviews = [
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
    },
    {
      avatar: jennaferIcon, // Replace with actual avatar URL
      name: "Jennifer J.",
      date: "November 16th, 2024",
      review: `I was looking for a roofer to fix a leak on the roof of my cabin. I put my job request on bidi when they first launched. Because bidi was brand new there were not any roofers yet. Within a day the bidi founders personally made tons of calls to find me a handful of roofers who could bid on my job. I was blown away! My 2nd experience was even better. I needed a fast turnaround for family pictures (one week). I submitted my request for a photographer to take a family photos. Within an hour of my request, I had 12 photographers post bids. Since my first experience with bidi, it has only gotten better and better. This company is going to be a game changer in the way I shop for services!`,
    },
    {
      avatar: jaronIcon,
      name: "Jaron A.",
      date: "October 8th, 2024",
      review: `We recently used Bidi to find a cleaning service, and it was a total game-changer. With a new baby on the way, we needed all the help we could get, and Bidi made it super easy. After I submitted a quick request, I got lots of bids from different cleaning services right away. Bidi took care of all the details, saving us tons of time, and it ended up being way more affordable. If you’re looking for a quick, budget-friendly way to find a reliable service, I’d definitely recommend Bidi!`,
    },
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
                        <div style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <img className="star-icon" src={starIcon} alt="star icon" />
                        <img className="star-icon" src={starIcon} alt="star icon" />
                        <img className="star-icon" src={starIcon} alt="star icon" />
                        <img className="star-icon" src={starIcon} alt="star icon" />
                        <img className="star-icon" src={starIcon} alt="star icon" />
                        </div>
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