import React, { useState, useEffect } from 'react';
import '../../App.css';
import IndividualUser from './IndividualUser';

function IndividualDashboard() {
    const [user, setUser] = useState(null); // user obj holds the user information

    setUser(IndividualUser());

    console.log(user)

    return (
        <div class="row fill-page-grey-bg">
            <div class="col-md-6">
                    <div class="DashboardPill">
                        You Have 3 new bids to view!
                        <div class="details">
                            <p>Baylor LLC offered to complete Wedding Photography for $350</p>
                            <p>Clarissa Jones offered to complete Wedding Photography for $600</p>
                            <p>Young Movers offered to complete Pack my Moving Truck for $1500</p>
                        </div>
                    </div>
                    <div class="DashboardPill">
                        Your open job requests
                        <div class="details">
                            <p>Wedding Photography - Photography on August 18</p>
                            <p>Pack my Moving Truck - Moving on October 15</p>
                        </div>
                    </div>
            </div>
             {/* <!-- Submit a new bid form on the right --> */}
            <div class="col-md-6">
                <div class="DashboardPill">Need Something Else Done?
                    <div class="details">
                        <form id="serviceRequestForm" action="submit_service_request" method="POST" enctype="multipart/form-data" onClick="event.stopPropagation()">
                            {/* <!-- Customer Name --> */}
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="customerName" name="customerName" placeholder="Enter your name" required></input>
                                <label for="customerName">Customer Name</label>
                                <div class="invalid-feedback">Customer name is required.</div>
                            </div>
                            {/* <!-- Title of Service --> */}
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="serviceTitle" name="serviceTitle" placeholder="Enter service title" required></input>
                                <label for="serviceTitle">Title of Service</label>
                                <div class="invalid-feedback">Service title is required.</div>
                            </div>
                            {/* <!-- Service Category --> */}
                            <div class="form-floating mb-3">
                                <select class="form-control" id="serviceCategory" name="serviceCategory" required>
                                    <option value="">Select a category...</option>
                                    <option value="cleaning">Home Cleaning</option>
                                    <option value="photography">Photo Shoot</option>
                                    <option value="landscaping">Landscaping</option>
                                    <option value="plumbing">Plumbing</option>
                                    <option value="electrical">Electrical</option>
                                    <option value="moving">Moving</option>
                                    <option value="other">Other</option>
                                </select>
                                <label for="serviceCategory">Service Category</label>
                                <div class="invalid-feedback">Service category is required.</div>
                            </div>
                            {/* <!-- Description of Service --> */}
                            <div class="form-floating mb-3">
                                <textarea class="form-control" id="serviceDescription" name="serviceDescription" placeholder="Enter a detailed description of the service" style={{height: '10rem'}} required></textarea>
                                <label for="serviceDescription">Description of Service</label>
                                <div class="invalid-feedback">Description is required.</div>
                            </div>
                            {/* <!-- Pictures (Optional) --> */}
                            <div class="form-group mb-3">
                                <label for="servicePictures">Pictures (Optional)</label>
                                <input type="file" class="form-control" id="servicePictures" name="servicePictures[]" multiple></input>
                            </div>
                            {/* <!-- Date of Service --> */}
                            <div class="form-floating mb-3">
                                <input type="date" class="form-control" id="serviceDate" name="serviceDate" placeholder="Select a date" required></input>
                                <label for="serviceDate">Date of Service</label>
                                <div class="invalid-feedback">Date of service is required.</div>
                            </div>
                            {/* <!-- Expected Price Range --> */}
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="priceRange" name="priceRange" placeholder="Enter expected price range" required></input>
                                <label for="priceRange">Expected Price Range</label>
                                <div class="invalid-feedback">Price range is required.</div>
                            </div>
                            {/* <!-- Additional Comments (Optional) --> */}
                            <div class="form-floating mb-3">
                                <textarea class="form-control" id="additionalComments" name="additionalComments" placeholder="Enter any additional comments" style={{height: '5rem'}}></textarea>
                                <label for="additionalComments">Additional Comments (Optional)</label>
                            </div>
                            {/* <!-- Submit Button --> */}
                            <div class="d-grid">
                                <button type="submit" class="btn btn-secondary-white">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
                <div class="DashboardPill">
                    Favorite Businesses
                    <div class="details">
                        <p><a href="../Business/BusinessLandingPage.html" target="_blank">Baylor LLC</a></p>
                        <p>Movers and Shakers</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default IndividualDashboard;
