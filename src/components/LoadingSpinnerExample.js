import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingSpinnerExample = () => {
    const [activeVariant, setActiveVariant] = useState('default');

    const variants = [
        { id: 'default', name: 'Default (Clip)', color: '#ff008a' },
        { id: 'clip', name: 'Clip', color: '#ff008a' },
        { id: 'dots', name: 'Dots', color: '#ff008a' },
        { id: 'pulse', name: 'Pulse', color: '#ff008a' },
        { id: 'ring', name: 'Ring', color: '#ff008a' },
        { id: 'bars', name: 'Bars', color: '#ff008a' }
    ];

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>LoadingSpinner Component Examples</h1>
            
            <div style={{ marginBottom: '30px' }}>
                <h2>Variant Selector</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {variants.map(variant => (
                        <button
                            key={variant.id}
                            onClick={() => setActiveVariant(variant.id)}
                            style={{
                                padding: '8px 16px',
                                border: activeVariant === variant.id ? '2px solid #ff008a' : '1px solid #ccc',
                                borderRadius: '4px',
                                background: activeVariant === variant.id ? '#ff008a' : 'white',
                                color: activeVariant === variant.id ? 'white' : '#333',
                                cursor: 'pointer'
                            }}
                        >
                            {variant.name}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Basic Usage</h2>
                <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                    <LoadingSpinner 
                        variant={activeVariant} 
                        color="#ff008a" 
                        size={50}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>With Text</h2>
                <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                    <LoadingSpinner 
                        variant={activeVariant} 
                        color="#ff008a" 
                        size={50}
                        text="Loading your content..."
                    />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Different Sizes</h2>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                    <div>
                        <p>Small (25px):</p>
                        <LoadingSpinner variant={activeVariant} color="#ff008a" size={25} />
                    </div>
                    <div>
                        <p>Medium (50px):</p>
                        <LoadingSpinner variant={activeVariant} color="#ff008a" size={50} />
                    </div>
                    <div>
                        <p>Large (75px):</p>
                        <LoadingSpinner variant={activeVariant} color="#ff008a" size={75} />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Different Colors</h2>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                    <div>
                        <p>Primary:</p>
                        <LoadingSpinner variant={activeVariant} color="#ff008a" size={40} />
                    </div>
                    <div>
                        <p>Blue:</p>
                        <LoadingSpinner variant={activeVariant} color="#007bff" size={40} />
                    </div>
                    <div>
                        <p>Green:</p>
                        <LoadingSpinner variant={activeVariant} color="#28a745" size={40} />
                    </div>
                    <div>
                        <p>Orange:</p>
                        <LoadingSpinner variant={activeVariant} color="#fd7e14" size={40} />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Button Loading State</h2>
                <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                    <button 
                        style={{
                            padding: '12px 24px',
                            background: '#ff008a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <LoadingSpinner variant="clip" color="white" size={16} />
                        <span>Processing...</span>
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Full Screen Loading</h2>
                <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', height: '200px', position: 'relative' }}>
                    <LoadingSpinner 
                        variant={activeVariant} 
                        color="#ff008a" 
                        size={50}
                        text="Loading application..."
                        fullScreen={false}
                        style={{ height: '100%' }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Usage Examples</h2>
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                    <h3>Basic Loading:</h3>
                    <pre style={{ background: '#e9ecef', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`<LoadingSpinner variant="ring" color="#ff008a" />`}
                    </pre>

                    <h3>With Text:</h3>
                    <pre style={{ background: '#e9ecef', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`<LoadingSpinner 
  variant="ring" 
  color="#ff008a" 
  text="Loading your content..." 
/>`}
                    </pre>

                    <h3>Button Loading State:</h3>
                    <pre style={{ background: '#e9ecef', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`<button disabled={isLoading}>
  {isLoading ? (
    <div className="d-flex align-items-center">
      <LoadingSpinner variant="clip" color="white" size={16} />
      <span className="ms-2">Processing...</span>
    </div>
  ) : (
    'Submit'
  )}
</button>`}
                    </pre>

                    <h3>Full Screen Loading:</h3>
                    <pre style={{ background: '#e9ecef', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`<LoadingSpinner 
  variant="ring" 
  color="#ff008a" 
  text="Loading application..." 
  fullScreen={true}
/>`}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinnerExample; 