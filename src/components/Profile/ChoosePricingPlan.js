import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import checkIcon from '../../assets/images/Icons/entypo_check.svg'
import checkIconWhite from '../../assets/images/Icons/ideas-entypo-check.svg'
import { supabase } from '../../supabaseClient';



function ChoosePricingPlan() {
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
  
    // Fetch the current user's ID
    useEffect(() => {
      const fetchUserId = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error fetching user:', error.message);
          return;
        }
        if (user) {
          setUserId(user.id); // Store the user's ID
        }
      };
  
      fetchUserId();
    }, []);
  
    // Generic function to update the pricing plan
    const updatePricingPlan = async (membershipTier) => {
      if (!userId) {
        console.error('User ID not available.');
        return;
      }
  
      try {
        const { data, error } = await supabase
          .from('business_profiles') // Replace with your actual table name
          .update({ membership_tier: membershipTier }) // Update the membership_tier column
          .eq('id', userId); // Match the user by ID
  
        if (error) throw error;
  
        console.log('Data updated successfully:', data);
  
        // Navigate to another page after successful update
        navigate('/dashboard'); // Replace with the desired route
      } catch (err) {
        console.error('Error updating data:', err.message);
      }
    };

    

    return (
        
        <div style={{display:'flex', flexDirection:'column', gap:'40px', justifyContent:'center', alignItems:'center'}}>
            <div className="pricing-plans-header" style={{  marginTop:'0px'}}>Pricing & Plans</div>
            <div className="pricing-plans-subheader" >Choose the plan that best fits your needs and start transforming your business today!</div>
            <div className='payment-plan-container'>
                <div className='free-plan'>
                    <div className='plan-items-header'>Free</div>
                    <div className='plan-items-subheader'>Use Bidi for free with no monthly cost. We only get paid if you do.</div>
                    <div className='includes-text'>Includes:</div>
                    <div className='plan-items-container'>
                        <div className='plan-items' >
                            <img src={checkIcon}></img>
                            Unlimited bids
                        </div>
                        <div className='plan-items' >
                            <img src={checkIcon}></img>
                            Get access to hundreds of new potential clients
                        </div>
                        <div className='plan-items' >
                        <img src={checkIcon}></img>
                            Use Bidi’s payment method for clients
                        </div>
                        <div className='plan-items' >
                        <img src={checkIcon}></img>
                            Pay a 8% fee per bid you win
                        </div>
                    </div>
                    <div className='price-text'>$0<span className='price-text-span'>/month</span></div>
                    <button className='free-plan-button'onClick={() => updatePricingPlan('Free')}>Choose Plan</button>
                </div>
                <div className='plus-plan'>
                    <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
                    <div className='plan-items-header' style={{color:'white'}}>Plus</div>
                    <div className='popular-tag'>Popular</div>
                    </div>
                
                    <div className='plan-items-subheader' style={{color:'white'}}>For a limited time, sign up for Bidi Plus and lock in at $20/month for life. </div>
                    <div className='includes-text'style={{color:'white'}}>Includes:</div>
                    <div className='plan-items-container' style={{ gap:"28px"}}>
                        <div className='plan-items' style={{color:'white'}}>
                            <img src={checkIconWhite}></img>
                            Unlimited bids
                        </div>
                        <div className='plan-items' style={{color:'white'}}>
                            <img src={checkIconWhite}></img>
                            No 8% payment to Bidi
                        </div>
                        <div className='plan-items' style={{color:'white'}}>
                        <img src={checkIconWhite}></img>
                            Choose your own payment method for clients
                        </div>
                        <div className='plan-items' style={{color:'white'}}>
                        <img src={checkIconWhite}></img>
                            5 monthly credits to spend on boosting your bids
                        </div>
                    </div>
                    <div className='price-text'style={{color:'white'}}>$20<span className='price-text-span' style={{color:'white'}}>/month</span></div>
                    <button className='plus-plan-button' onClick={() => updatePricingPlan('Plus')}>Choose Plan</button>
                </div>
                <div className='free-plan'>
                <div className='plan-items-header'>Pro</div>
                    <div className='plan-items-subheader'>Automate your bids and grow your business like never before.</div>
                    <div className='includes-text'>Includes:</div>
                    <div className='plan-items-container' style={{marginBottom:'-3px'}}>
                        <div className='plan-items' >
                            <img src={checkIcon}></img>
                            Unlimited bids
                        </div>
                        <div className='plan-items' >
                            <img src={checkIcon}></img>
                            Automated bidding based on criteria that you set
                        </div>
                        <div className='plan-items' >
                        <img src={checkIcon}></img>
                            Use AI to create templates for Bid descriptions
                        </div>
                        <div className='plan-items' >
                        <img src={checkIcon}></img>
                            5 monthly credits to spend on boosting your bids
                        </div>
                        <div className='plan-items' >
                        <img src={checkIcon}></img>
                            More coming soon
                        </div>
                    </div>
                    <div className='price-text'>TBD</div>
                    <button className='bidi-pro-button'>Coming Soon</button>
                </div>
            </div>
        </div>
          
    );
}

export default ChoosePricingPlan;
