import React from 'react';
import Weston from '../assets/images/Weston.png'
import Baylor from '../assets/images/Baylor.png'
import Emma from '../assets/images/Emma.png'
function AboutUs() {
    return (
        <div className="about-us-container">
            <div className="about-us-title">
                Meet Our <br></br> Team 
            </div>
            <div className='team-member-container'>
                <div className='team-member-image-container'>
                    <img src={Weston}></img>
                </div>
                <div className='about-us-text'>Hey everyone! My name is Weston Burnett! I’m from Layton, Utah, and I am currently a student at BYU studying Finance while also being part of the Sandbox program at BYU. I’ve been married to my amazing wife, Vivian, for two years, and they have been two incredible years. My role at Bidi is as a product manager. I take feedback from you and work to implement it into Bidi to make it as amazing as possible! I also handle a lot of the front-end development for the site, bringing to life the amazing designs that Emma creates for Bidi. <br></br><br></br>

                    Some of my hobbies include working on cars. I used to own a 1999 Mazda Miata in high school, which I did a lot of work on. Unfortunately, I had to sell it, but I currently own a 2008 Scion TC, which has been a lot of fun to drive around the canyons. I also enjoy playing soccer, Latin dancing (my wife Vivian is from Peru), cooking, camping, fishing, shooting, and hiking.<br></br> <br></br>

                    Starting a company has always been a dream of mine, and I’m so happy that it’s becoming a reality! Working on Bidi has been an incredible experience, and I’ve learned so much along the way. I’m passionate about creating a better platform for people to find services quickly and easily. When I got married, finding a photographer, venue, and other services was such a frustrating process, and I want to make sure no one else has to go through that. <br></br> <br></br>

                    I’d love to chat if you have any questions, concerns, or feedback on Bidi! Feel free to text me at 385-216-9587 or email me at weston.burnett19@gmail.com.</div>
            </div>
            <div className='team-member-container'>
                <div className='team-member-image-container-baylor-mobile'>
                    <img src={Baylor}></img>
                </div>
                <div className='about-us-text-baylor'>What’s up!? My name is Baylor Jeppsen. I’m from Draper, Utah, and I am currently at BYU studying Information Systems. My wives name is Isabel and we’ve been married for about a year now. I’m the developer at Bidi so I make sure that our website is running smoothly and that everything is working. If you every run into any bugs, send me a message through the “contact us” form and I’ll get back to you as soon as I can! <br></br> <br></br> 

I love watching sports and when I say sports, it can be anything. I like watching football, basketball, baseball, hockey, lacrosse, literally anything. I enjoy watching movies with my wife, going out to eat, and having huge parties and get togethers with friends. One thing I have been able to do a lot recently is travel and that has been super fun. I’ve been to the Dominican Republic, The Bahamas, Mexico, and currently I am living in Germany on a study abroad.  

<br></br><br></br>Weston and I have always talked about starting a company together and the Sandbox program at BYU was a great way for us to get started! We have really loved working together and we are all excited about where Bidi is headed!</div>
                <div className='team-member-image-container-baylor'>
                    <img style={{marginRight:'3rem'}}src={Baylor}></img>
                </div>
                
            </div>
            <div className='team-member-container'>
                <div className='team-member-image-container'>
                    <img src={Emma}></img>
                </div>
                
                <div className='about-us-text'>Hey there! My name is Emma and I am a student at BYU studying ux/ui design. I was born in South Korea but grew up in Southern California. Some of my hobbies include online shopping, watching shows (currently, Tell Me Lies, and Love Is Blind are my favorites), cooking, taking naps, and spending time on TikTok. <br></br> <br></br>I recently joined this team in the Sandbox program! It has been a rewarding experience to share thoughts and ideas pertaining to the goal of Bidi. I recently got married and consequently experienced firsthand how difficult it is to find venues, photographers, and all things wedding related. Bidi makes this easier by allowing the goods and services to be directed to you! Not the other way around. </div>
            </div>
        </div>
    );
}

export default AboutUs;
