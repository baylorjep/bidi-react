import React from 'react';
import '../App.css';

function MyBids() {
    return (
        <div className="container px-5">
            <h1>My Bids</h1>
            <p>Here you will see all your bids...</p>
        </div>
    );
}

const App = () => {
    const [activeIndex, setActiveIndex] = useState(null);
  
    const toggleDescription = (index) => {
      setActiveIndex(activeIndex === index ? null : index);
    };



export default MyBids;

<header className="masthead">
        <div className="container px-5">
          <h2>Photography Shoot Bid</h2>

          {[1, 2, 3, 4, 5, 6].map(index => (
            <div className="business-container" key={index} onClick={() => toggleDescription(index)}>
              <div className="business-info">
                <div className="business-name">Business {index}</div>
                <div className="business-description">
                  <span className="short-description">
                    Hey Baylor, I would love to do a photography shoot for you...
                  </span>
                  {activeIndex === index && (
                    <span className="full-description">
                      Hey Baylor,
                      <br /><br />
                      I’d love to handle your photography shoot! I’m available to travel anywhere within Utah County, and there’s no additional charge for travel unless we go outside the county. Since you’re located in Utah County, that works perfectly.
                      <br /><br />
                      My rate is ${58 + (index - 1) * 2} per hour, and I typically focus on family portraits during that time. I recommend heading up to the Unitas for some stunning photo locations.
                      <br /><br />
                      Here is my website so you can see work I've done in the past: <a href="https://google.com">My Website</a>
                      <br /><br />
                      Looking forward to the opportunity to work with you!
                    </span>
                  )}
                </div>
              </div>
              <div className="business-price">${58 + (index - 1) * 2}</div>
              {activeIndex === index && (
                <div className="business-actions" style={{ display: 'flex' }}>
                  <button className="btn-approve">Approve</button>
                  <button className="btn-deny">Deny</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </header>
