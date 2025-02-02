import React from 'react';
import '../../styles/StatusBar.css';

function StatusBar({ steps, currentStep }) {
    return (
        <div className="status-bar-container">
            <div className="status-steps-container">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className={`status-check-container ${
                            index === currentStep ? 'active' : 
                            index < currentStep ? 'completed' : ''}`}>
                            {index < currentStep ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none" style={{ transform: 'rotate(-90deg)' }}>
                                    <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                                </svg>
                            ) : `0${index + 1}`}
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`status-line ${index < currentStep ? 'completed' : ''}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
            <div className="status-text-container">
                {steps.map((text, index) => (
                    <div className={`status-text ${index === currentStep ? 'active' : ''}`} key={index}>
                        {text}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default StatusBar;
