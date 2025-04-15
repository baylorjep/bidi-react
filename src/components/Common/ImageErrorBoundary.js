import React from 'react';

class ImageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Image loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="image-error-fallback">
          <img 
            src="/images/default.jpg" 
            alt="Image failed to load"
            className="error-fallback-image"
          />
          <div className="error-message">Image failed to load</div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ImageErrorBoundary; 