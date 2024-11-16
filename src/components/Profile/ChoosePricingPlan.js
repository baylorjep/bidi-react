import React from 'react';
import { useNavigate } from 'react-router-dom';
import checkIcon from '../../assets/images/Icons/entypo_check.svg'

function ChoosePricingPlan() {
    const navigate = useNavigate();

    return (
        
        <div style={{display:'flex', flexDirection:'column', gap:'40px', justifyContent:'center', alignItems:'center'}}>
            <div className="pricing-plans-header" style={{ marginTop: '80px' }}>Pricing & Plans</div>
            <div className="pricing-plans-subheader" >Choose the plan that best fits your needs and start transforming your business today!</div>
            <div className='payment-plan-container'>
                <div className='free-plan'>
                    <div className='plan-items-header'>Free</div>
                    <div className='plan-items-subheader'>Use Bidi for free with no monthly cost. We only get paid if you do</div>
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
                            No more paying for leads that don't go anywhere
                        </div>
                        <div className='plan-items' >
                        <img src={checkIcon}></img>
                            Use Bidi’s payment method for clients
                        </div>
                        <div className='plan-items' >
                        <img src={checkIcon}></img>
                            Pay 8% on bids you win
                        </div>
                    </div>
                    <div className='price-text'>$0<span className='price-text-span'>/month</span></div>
                    <button className='free-plan-button'>Choose Plan</button>
                </div>
                <div className='plus-plan'>1</div>
                <div className='pro-plan'>1</div>
            </div>
        </div>
          
    );
}

export default ChoosePricingPlan;
