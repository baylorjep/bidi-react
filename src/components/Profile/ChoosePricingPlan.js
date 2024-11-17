import React from 'react';
import { useNavigate } from 'react-router-dom';
import checkIcon from '../../assets/images/Icons/entypo_check.svg'
import checkIconWhite from '../../assets/images/Icons/ideas-entypo-check.svg'

function ChoosePricingPlan() {
    const navigate = useNavigate();

    return (
        
        <div style={{display:'flex', flexDirection:'column', gap:'40px', justifyContent:'center', alignItems:'center', height:'90vh', }}>
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
                    <button className='free-plan-button'>Choose Plan</button>
                </div>
                <div className='plus-plan'>
                    <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
                    <div className='plan-items-header' style={{color:'white'}}>Plus</div>
                    <div className='popular-tag'>Popular</div>
                    </div>
                
                    <div className='plan-items-subheader' style={{color:'white'}}>For a limited time, sign up for Bidi Plus and lock in at $19.99/month for life. </div>
                    <div className='includes-text'style={{color:'white'}}>Includes:</div>
                    <div className='plan-items-container' style={{marginBottom:'4px', gap:"28px"}}>
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
                    <div className='price-text'style={{color:'white'}}>$19.99<span className='price-text-span' style={{color:'white'}}>/month</span></div>
                    <button className='plus-plan-button'>Choose Plan</button>
                </div>
                <div className='pro-plan'>1</div>
            </div>
        </div>
          
    );
}

export default ChoosePricingPlan;
