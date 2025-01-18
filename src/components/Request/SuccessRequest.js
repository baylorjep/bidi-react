import React from 'react';
import { Link } from 'react-router-dom';

function SuccessRequest() {
    return (
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height:'auto', }}>
            <div className='request-form-status-container'>
                <div className='status-bar-container'>
                    {Array.from({ length: 5 }, (_, index) => (
                        <React.Fragment key={index}>
                            <div
                                className='status-check-container'
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: index + 1 <= 5 ? '#000' : 'transparent', // Filled black for all completed steps
                                    border: '2px solid #000',
                                }}
                            >
                                {index + 1 <= 5 ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 25"
                                        fill="none"
                                        style={{ transform: 'rotate(-90deg)' }} // Rotate the checkmark to make it vertical
                                    >
                                        <path
                                            d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z"
                                            fill="white"
                                        />
                                    </svg>
                                ) : (
                                    `0${index + 1}`
                                )}
                            </div>
                            {index < 4 && (
                                <div
                                    className='status-line'
                                    style={{
                                        width: '2px',
                                        height: '50px',
                                        backgroundColor: '#000', // Black for completed lines
                                        margin: '0 auto',
                                    }}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className='status-text-container'>
                    <div className='status-text'>Service Details</div>
                    <div className='status-text'>Personal Details</div>
                    <div className='status-text'>Add Photos</div>
                    <div className='status-text'>Review</div>
                    <div className='status-text'>Submit</div>
                </div>
            </div>
            <div className='request-form-container-details'>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '60px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <path d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z" fill="white" stroke="#FF008A" strokeWidth="4" strokeLinejoin="round" />
                        <path d="M16 24L22 30L34 18" stroke="#FF3875" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    <div className='successfully-submitted'>
                        Successfully Submitted!
                    </div>

                    <div className='successfully-submitted-subheader'>
                        You will receive an email or texts as vendors send in bids. You're done! Just relax and let the bids roll in.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
                        <Link to='/my-bids' className='success-page-button-secondary'>
                            Close
                        </Link>
                        <Link to='/request-categories' className='success-page-button-primary'>
                            Make Another Request
                        </Link>
                    </div>


                </div>
            </div>
        </div>
    );
}

export default SuccessRequest;