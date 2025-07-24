import React, { useState, useEffect } from 'react';
import { ProgressBar } from 'react-step-progress-bar';
import 'react-step-progress-bar/styles.css';
import '../../styles/StatusBar.css';

function StatusBar({ steps, currentStep, onStepClick, visitedSteps = new Set([0]) }) {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1350);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1350);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleStepClick = (index) => {
        if (visitedSteps.has(index) && onStepClick) {
            onStepClick(index);
        }
    };

    // Group steps by category, treating 'Event Logistics' as its own main category
    const groupStepsByCategory = () => {
        const groups = {};
        let currentCategory = '';
        
        steps.forEach((step, index) => {
            if (step === 'Event Logistics') {
                groups['Event Logistics'] = [{ step, index }];
                currentCategory = '';
                return;
            }
            // Split step name by hyphen to get category
            const parts = step.split(' - ');
            if (parts.length > 1) {
                currentCategory = parts[0];
            }
            if (!groups[currentCategory]) {
                groups[currentCategory] = [];
            }
            groups[currentCategory].push({ step, index });
        });
        // Remove any empty string group (from before Event Logistics)
        if (groups['']) delete groups[''];
        return groups;
    };

    const stepGroups = groupStepsByCategory();

    if (isMobile) {
        return (
            <div className="mobile-status-bar">
                <ProgressBar
                    percent={(currentStep / (steps.length - 1)) * 100}
                    filledBackground="#A328F4"
                    height="12px"
                />
            </div>
        );
    }

    return (
        <div className="desktop-status-bar">
            {Object.entries(stepGroups).map(([category, categorySteps], groupIndex) => {
                const isCurrentCategory = categorySteps.some(step => step.index === currentStep);
                const isCompletedCategory = categorySteps.every(step => visitedSteps.has(step.index));
                const isEventLogistics = category === "Event Logistics";
                
                return (
                    <div key={category} className={`step-category ${isCurrentCategory ? 'active' : ''} ${isCompletedCategory ? 'completed' : ''}`}>
                        <div className="category-header-status-bar">
                            <div className="category-indicator">
                                {isCompletedCategory ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 7L9 18L4 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                ) : (
                                    groupIndex + 1
                                )}
                            </div>
                            <span className="category-title-status-bar">{category}</span>
                        </div>
                        
                        {isCurrentCategory && !isEventLogistics && (
                            <div className="category-steps">
                                {categorySteps.map(({ step, index }) => {
                                    const isCurrent = index === currentStep;
                                    const isCompleted = visitedSteps.has(index);
                                    const stepName = step.split(' - ')[1] || step;
                                    
                                    return (
                                        <div 
                                            key={index}
                                            className={`step-item ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                            onClick={() => handleStepClick(index)}
                                        >
                                            <div className="step-indicator">
                                                {isCompleted ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                        <path d="M20 7L9 18L4 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                ) : (
                                                    index - categorySteps[0].index + 1
                                                )}
                                            </div>
                                            <span className="step-name">{stepName}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default StatusBar;
