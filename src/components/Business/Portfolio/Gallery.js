import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "../../../styles/Gallery.css";
import ImageModal from "./ImageModal";
import { convertHeicToJpeg } from "../../../utils/imageUtils";
import LoadingPlaceholder from '../../Common/LoadingPlaceholder';
import ImageErrorBoundary from '../../Common/ImageErrorBoundary';

const Gallery = () => {
  const { businessId } = useParams();
  const [portfolioMedia, setPortfolioMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const navigate = useNavigate();
  const AUTO_PLAY_COUNT = 4; // Number of videos that will autoplay
  const [convertedUrls, setConvertedUrls] = useState({});
  const [convertingImages, setConvertingImages] = useState({});
  const [imageLoading, setImageLoading] = useState({});

  useEffect(() => {
    const fetchPortfolioMedia = async () => {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url, photo_type")
        .eq("user_id", businessId)
        .in("photo_type", ["portfolio", "video"]);

      if (error) {
        console.error("Error fetching portfolio media:", error);
      } else {
        setPortfolioMedia(data.map(item => ({
          url: item.photo_url,
          type: item.photo_type === "video" ? "video" : "image"
        })));
      }
      setLoading(false);
    };

    fetchPortfolioMedia();
  }, [businessId]);

  useEffect(() => {
    const convertImages = async () => {
      const converted = {};
      for (const photo of portfolioMedia.map(media => media.url)) {
        // Skip if already WebP
        if (photo.toLowerCase().endsWith('.webp')) {
          converted[photo] = photo;
          continue;
        }
        converted[photo] = await convertHeicToJpeg(photo);
      }
      setConvertedUrls(converted);
    };

    convertImages();

    // Cleanup function
    return () => {
      Object.values(convertedUrls).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [portfolioMedia]);

  const handleMediaClick = (media) => {
    setSelectedMedia({
      url: media.url,
      type: media.type === 'video' ? 'video' : 'image'
    });
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          Loading vendors and photos...
        </div>
      </div>
    );
  }

  return (
    <>
      <ImageModal
        isOpen={!!selectedMedia}
        mediaUrl={selectedMedia?.url}
        mediaType={selectedMedia?.type}
        onClose={handleCloseModal}
      />

      <div className="gallery-container">
        <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        <div className="gallery-grid">
          {portfolioMedia.length > 0
            ? portfolioMedia.map((media, index) => (
                <div key={index} className="gallery-item">
                  {media.type === 'video' ? (
                    <div className="video-container">
                      <video
                        src={media.url}
                        className="gallery-video"
                        poster={`${media.url}?thumb`}
                        preload="metadata"
                        muted
                        autoPlay={index < AUTO_PLAY_COUNT}
                        loop
                        playsInline
                        onClick={() => handleMediaClick(media)}
                      >
                        Your browser does not support the video tag.
                      </video>
                      {index >= AUTO_PLAY_COUNT && (
                        <div className="video-play-overlay">
                          <button 
                            className="play-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const video = e.currentTarget.parentElement.previousElementSibling;
                              if (video.paused) {
                                video.play();
                                e.currentTarget.parentElement.style.display = 'none';
                              }
                            }}
                          >
                            ▶
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <ImageErrorBoundary>
                      {imageLoading[`gallery-${index}`] ? (
                        <LoadingPlaceholder 
                          width="100%"
                          height="100%"
                          className="gallery-image"
                        />
                      ) : (
                        <img
                          src={convertedUrls[media.url] || media.url}
                          alt={`Portfolio ${index}`}
                          className={`gallery-image ${imageLoading[`gallery-${index}`] ? 'loading' : 'loaded'}`}
                          onClick={() => handleMediaClick(media)}
                          loading="lazy"
                          onLoad={() => setImageLoading(prev => ({ ...prev, [`gallery-${index}`]: false }))}
                          style={{
                            opacity: convertingImages[media.url] ? 0.5 : 1,
                            transition: 'opacity 0.3s ease-in-out'
                          }}
                        />
                      )}
                    </ImageErrorBoundary>
                  )}
                  {convertingImages[media.url] && (
                    <div className="converting-overlay">
                      <div className="converting-spinner"></div>
                    </div>
                  )}
                </div>
              ))
            : <p>No media available</p>}
        </div>
      </div>
    </>
  );
};

export default Gallery;