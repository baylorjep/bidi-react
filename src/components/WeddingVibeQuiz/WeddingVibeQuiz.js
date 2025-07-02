import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaTimes, FaArrowLeft, FaArrowRight, FaUndo } from 'react-icons/fa';
import classicWedding from '../../assets/quiz/classic/classic-wedding.webp';
import rusticWedding from '../../assets/quiz/rustic/rustic-wedding.jpg';
import modernWedding from '../../assets/quiz/modern/modern-wedding.jpg';
import romanticWedding from '../../assets/quiz/romantic/romantic-wedding.jpg';
import bohoWedding from '../../assets/quiz/boho/boho-wedding.jpg';
import chicWedding from '../../assets/quiz/chic/chic-wedding.jpg';
import luxeWedding from '../../assets/quiz/luxe/luxe-wedding.jpg';
import naturalWedding from '../../assets/quiz/natural/natural-wedding.jpg';
import artisticWedding from '../../assets/quiz/artistic/artistic-wedding.jpg';
import classicPhoto from '../../assets/quiz/classic/classic-photo.jpg';
import candidPhoto from '../../assets/quiz/candid/candid-photo.jpg';
import editorialPhoto from '../../assets/quiz/editorial/editorial-photo.jpg';
import airyPhoto from '../../assets/quiz/airy/airy-photo.jpg';  
import cinematicVideo from '../../assets/quiz/cinematic/cinematic-video.jpg';
import documentaryVideo from '../../assets/quiz/documentary/documentary-video.jpg';
import romanticVideo from '../../assets/quiz/romantic/romantic-video.jpg';
import artisticVideo from '../../assets/quiz/artistic/artistic-video.jpg';
import classicBeauty from '../../assets/quiz/classic/classic-beauty.jpg';
import naturalBeauty from '../../assets/quiz/natural/natural-beauty.jpg';
import glamBeauty from '../../assets/quiz/glam/glam-beauty.jpg';
import bohoBeauty from '../../assets/quiz/boho/boho-beauty.jpg';
import fineDining from '../../assets/quiz/fine-dining/fine-dining-catering.jpg';
import modernCatering from '../../assets/quiz/modern/modern-catering.jpg';
import casualCatering from '../../assets/quiz/casual/casual-catering.jpg';
import farmTable from '../../assets/quiz/farm/farm-table-catering.jpg';
import classicDj from '../../assets/quiz/classic/classic-dj.jpg';
import modernDj from '../../assets/quiz/modern/modern-dj.jpg';
import eclecticDj from '../../assets/quiz/eclectic/eclectic-dj.jpg';
import relaxedDj from '../../assets/quiz/relaxed/relaxed-dj.jpg';
import classicFlowers from '../../assets/quiz/classic/classic-flowers.jpg';
import wildFlowers from '../../assets/quiz/wild/wild-flowers.jpg';
import modernFlowers from '../../assets/quiz/modern/modern-flowers.jpg';
import romanticFlowers from '../../assets/quiz/romantic/romantic-flowers.jpg';
import { Helmet } from 'react-helmet-async';
import LoadingSpinner from '../LoadingSpinner';

// At the top of the file, add this placeholder image mapping
const placeholderImages = {
  // Overall wedding styles
  'classic-wedding': classicWedding,
  'rustic-wedding': rusticWedding,
  'modern-wedding': modernWedding,
  'boho-wedding': bohoWedding,
  'luxe-wedding': luxeWedding,
  'romantic-wedding': romanticWedding,
  'chic-wedding': chicWedding,
  'natural-wedding': naturalWedding,
  'artistic-wedding': artisticWedding,

  // Photography styles
  'classic-photo': classicPhoto,
  'candid-photo': candidPhoto,
  'editorial-photo': editorialPhoto,
  'airy-photo': airyPhoto,

  // Videography styles
  'cinematic-video': cinematicVideo,
  'documentary-video': documentaryVideo,
  'romantic-video': romanticVideo,
  'artistic-video': artisticVideo,

  // Beauty styles
  'classic-beauty': classicBeauty,
  'natural-beauty': naturalBeauty,
  'glam-beauty': glamBeauty,
  'boho-beauty': bohoBeauty,

  // Catering styles
  'fine-dining': fineDining,
  'modern-catering': modernCatering,
  'casual-catering': casualCatering,
  'farm-table': farmTable,

  // DJ styles
  'classic-dj': classicDj,
  'modern-dj': modernDj,
  'eclectic-dj': eclecticDj,
  'relaxed-dj': relaxedDj,

  // Floral styles
  'classic-flowers': classicFlowers,
  'wild-flowers': wildFlowers,
  'modern-flowers': modernFlowers,
  'romantic-flowers': romanticFlowers
};

const questions = [
  {
    id: 1,
    question: "What's your overall wedding style?",
    options: [
      { text: "Classic & Elegant", image: placeholderImages['classic-wedding'], vibe: ["classic", "luxe"] },
      { text: "Rustic & Natural", image: placeholderImages['rustic-wedding'], vibe: ["rustic", "natural"] },
      { text: "Modern & Chic", image: placeholderImages['modern-wedding'], vibe: ["modern", "chic"] },
      { text: "Bohemian & Free-spirited", image: placeholderImages['boho-wedding'], vibe: ["bohemian", "relaxed"] },
    ]
  },
  {
    id: 2,
    question: "Choose your photography style:",
    category: "photography",
    options: [
      { 
        text: "Classic & Timeless", 
        image: placeholderImages['classic-photo'], 
        vibe: ["classic"],
        description: "Traditional posed shots with perfect lighting",
        vendorTags: ["traditional", "formal"]
      },    
      { 
        text: "Candid & Photojournalistic", 
        image: placeholderImages['candid-photo'], 
        vibe: ["modern"],
        description: "Natural moments captured as they happen",
        vendorTags: ["photojournalistic", "candid"]
      },
      { 
        text: "Artistic & Editorial", 
        image: placeholderImages['editorial-photo'], 
        vibe: ["artistic"],
        description: "Magazine-worthy creative shots",
        vendorTags: ["editorial", "creative"]
      },
      { 
        text: "Light & Airy", 
        image: placeholderImages['airy-photo'], 
        vibe: ["bohemian"],
        description: "Bright, ethereal images with natural light",
        vendorTags: ["light-and-airy", "natural"]
      }
    ]
  },
  {
    id: 3,
    question: "Pick your videography style:",
    category: "videography",
    options: [
      { 
        text: "Cinematic Film", 
        image: placeholderImages['cinematic-video'], 
        vibe: ["luxe"],
        description: "Movie-like storytelling with dramatic moments",
        vendorTags: ["cinematic", "luxury"]
      },
      { 
        text: "Documentary Style", 
        image: placeholderImages['documentary-video'], 
        vibe: ["modern"],
        description: "Natural coverage of your day as it unfolds",
        vendorTags: ["documentary", "journalistic"]
      },
      { 
        text: "Romantic Highlight", 
        image: placeholderImages['romantic-video'], 
        vibe: ["classic"],
        description: "Emotional moments set to music",
        vendorTags: ["romantic", "traditional"]
      },
      { 
        text: "Creative & Artistic", 
        image: placeholderImages['artistic-video'], 
        vibe: ["artistic"],
        description: "Unique angles and experimental editing",
        vendorTags: ["artistic", "experimental"]
      }
    ]
  },
  {
    id: 4,
    question: "What's your ideal beauty style?",
    category: "beauty",
    options: [
      { 
        text: "Classic Bridal", 
        image: placeholderImages['classic-beauty'], 
        vibe: ["classic"],
        description: "Timeless makeup and elegant hairstyles",
        vendorTags: ["traditional", "elegant"]
      },
      { 
        text: "Natural & Fresh", 
        image: placeholderImages['natural-beauty'], 
        vibe: ["natural"],
        description: "Enhanced natural beauty with a fresh look",
        vendorTags: ["natural", "minimal"]
      },
      { 
        text: "Glamorous", 
        image: placeholderImages['glam-beauty'], 
        vibe: ["luxe"],
        description: "Full glam with dramatic features",
        vendorTags: ["glamorous", "dramatic"]
      },
      { 
        text: "Boho Beauty", 
        image: placeholderImages['boho-beauty'], 
        vibe: ["bohemian"],
        description: "Effortless waves and glowing skin",
        vendorTags: ["bohemian", "natural"]
      }
    ]
  },
  {
    id: 5,
    question: "Choose your catering style:",
    category: "catering",
    options: [
      { 
        text: "Fine Dining", 
        image: placeholderImages['fine-dining'], 
        vibe: ["luxe"],
        description: "Gourmet plated service",
        vendorTags: ["fine-dining", "luxury"]
      },
      { 
        text: "Modern & Creative", 
        image: placeholderImages['modern-catering'], 
        vibe: ["modern"],
        description: "Innovative food presentations",
        vendorTags: ["innovative", "creative"]
      },
      { 
        text: "Casual & Fun", 
        image: placeholderImages['casual-catering'], 
        vibe: ["relaxed"],
        description: "Food stations and interactive experiences",
        vendorTags: ["casual", "stations"]
      },
      { 
        text: "Farm to Table", 
        image: placeholderImages['farm-table'], 
        vibe: ["rustic"],
        description: "Local, seasonal ingredients",
        vendorTags: ["farm-to-table", "organic"]
      }
    ]
  },
  {
    id: 6,
    question: "What's your music vibe?",
    category: "dj",
    options: [
      { 
        text: "Classic Party DJ", 
        image: placeholderImages['classic-dj'], 
        vibe: ["classic"],
        description: "Traditional wedding hits and crowd favorites",
        vendorTags: ["traditional", "party"]
      },
      { 
        text: "Modern Mix Master", 
        image: placeholderImages['modern-dj'], 
        vibe: ["modern"],
        description: "Current hits with creative mixing",
        vendorTags: ["modern", "trendy"]
      },
      { 
        text: "Eclectic Curator", 
        image: placeholderImages['eclectic-dj'], 
        vibe: ["artistic"],
        description: "Unique song selections and unexpected mixes",
        vendorTags: ["eclectic", "unique"]
      },
      { 
        text: "Laid-back Vibes", 
        image: placeholderImages['relaxed-dj'], 
        vibe: ["relaxed"],
        description: "Feel-good music that keeps the mood light",
        vendorTags: ["relaxed", "easy-going"]
      }
    ]
  },
  {
    id: 7,
    question: "Pick your floral style:",
    category: "florist",
    options: [
      { 
        text: "Classic & Elegant", 
        image: placeholderImages['classic-flowers'], 
        vibe: ["classic"],
        description: "Traditional arrangements with roses and peonies",
        vendorTags: ["traditional", "elegant"]
      },
      { 
        text: "Wild & Natural", 
        image: placeholderImages['wild-flowers'], 
        vibe: ["bohemian"],
        description: "Loose, garden-style arrangements",
        vendorTags: ["wild", "natural"]
      },
      { 
        text: "Modern & Structural", 
        image: placeholderImages['modern-flowers'], 
        vibe: ["modern"],
        description: "Architectural designs with unique elements",
        vendorTags: ["modern", "architectural"]
      },
      { 
        text: "Romantic & Lush", 
        image: placeholderImages['romantic-flowers'], 
        vibe: ["romantic"],
        description: "Abundant blooms with soft, flowing designs",
        vendorTags: ["romantic", "lush"]
      }
    ]
  }
];

// Add these vibe descriptions
const vibeDescriptions = {
  classic: {
    title: "Classic Elegance",
    description: "You're drawn to timeless sophistication and traditional elements. Your wedding will likely feature refined details, elegant touches, and a formal atmosphere that never goes out of style.",
    vendors: ["Luxury venues", "Classical musicians", "Fine dining caterers", "Traditional portrait photographers", "Cinematic videographers"],
    image: placeholderImages['classic-wedding']
  },
  luxe: {
    title: "Modern Luxury",
    description: "You appreciate the finer things and have an eye for luxury. Your wedding might include glamorous details, upscale elements, and sophisticated modern touches.",
    vendors: ["High-end venues", "Luxury florists", "Gourmet caterers"],
    image: placeholderImages['luxe-wedding']
  },
  bohemian: {
    title: "Free-Spirited Bohemian",
    description: "You have a free-spirited, artistic soul. Your wedding might feature natural elements, eclectic details, and a relaxed, unconventional atmosphere.",
    vendors: ["Outdoor venues", "Alternative photographers", "Food trucks"],
    image: placeholderImages['bohemian-wedding']
  },
  rustic: {
    title: "Rustic Charm",
    description: "You're drawn to natural beauty and countryside charm. Your wedding might include wooden elements, vintage touches, and a warm, cozy atmosphere.",
    vendors: ["Barn venues", "Vintage rentals", "Farm-to-table caterers"],
    image: placeholderImages['rustic-wedding']
  },
  modern: {
    title: "Contemporary Chic",
    description: "You have a contemporary style and appreciate clean lines. Your wedding might feature minimalist design, innovative elements, and unexpected touches.",
    vendors: ["Industrial venues", "Modern DJs", "Documentary photographers", "Contemporary videographers", "Innovative caterers"],
    image: placeholderImages['modern-wedding']
  },
  romantic: {
    title: "Romantic Dreams",
    description: "You're a romantic at heart who loves soft, dreamy details. Your wedding might include lots of flowers, candlelight, and intimate touches.",
    vendors: ["Garden venues", "String quartets", "Boutique bakeries"],
    image: placeholderImages['romantic-wedding']
  },
  relaxed: {
    title: "Laid-Back & Natural",
    description: "You prefer a casual, stress-free approach. Your wedding might feature comfortable seating, informal dining, and a relaxed schedule.",
    vendors: ["Beach venues", "Acoustic musicians", "Casual caterers"],
    image: placeholderImages['relaxed-wedding']
  },
  chic: {
    title: "Fashion-Forward Chic",
    description: "You have an eye for style and current trends. Your wedding might feature Instagram-worthy moments, fashion-forward choices, and sleek design.",
    vendors: ["Boutique venues", "Editorial photographers", "Trendy caterers"],
    image: placeholderImages['chic-wedding']
  },
  natural: {
    title: "Nature-Inspired",
    description: "You're inspired by the outdoors and natural beauty. Your wedding might feature organic elements, sustainable choices, and an eco-friendly approach.",
    vendors: ["Garden venues", "Green florists", "Organic caterers"],
    image: placeholderImages['natural-wedding']
  },
  artistic: {
    title: "Creative & Artistic",
    description: "You appreciate unique, creative expressions. Your wedding might feature artistic installations, unexpected color combinations, and innovative design.",
    vendors: ["Art galleries", "Creative photographers", "Experimental videographers", "Avant-garde caterers"],
    image: placeholderImages['artistic-wedding']
  }
};

// Update the category to request form mapping
const categoryToRequestPath = {
  photography: '/request/photography',
  videography: '/request/videography',
  beauty: '/request/beauty',
  catering: '/request/catering',
  dj: '/request/dj',
  florist: '/request/florist'
};

// Flatten all options into a single array
const allOptions = questions.reduce((acc, question) => {
  return acc.concat(question.options.map(option => ({
    ...option,
    category: question.category || 'overall' // Keep track of category
  })));
}, []);

// Add this shuffle function at the top level
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const WeddingVibeQuiz = () => {
  // Add shuffled options state
  const [shuffledOptions] = useState(() => shuffleArray(allOptions));
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [exitDirection, setExitDirection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preloadedImages, setPreloadedImages] = useState({});

  // Preload images function
  const preloadImages = async (startIndex) => {
    const imagesToPreload = 3; // Preload next 3 images
    const imagePromises = [];

    for (let i = startIndex; i < startIndex + imagesToPreload; i++) {
      if (i < shuffledOptions.length) {
        const option = shuffledOptions[i];
        if (!preloadedImages[option.image]) {
          imagePromises.push(
            new Promise((resolve, reject) => {
              const img = new Image();
              img.src = option.image;
              img.onload = () => {
                setPreloadedImages(prev => ({
                  ...prev,
                  [option.image]: true
                }));
                resolve();
              };
              img.onerror = reject;
            })
          );
        }
      }
    }

    try {
      await Promise.all(imagePromises);
    } catch (error) {
      console.error('Error preloading images:', error);
    }
  };

  // Preload initial images on mount
  useEffect(() => {
    preloadImages(0);
  }, []);

  // Preload next images when current index changes
  useEffect(() => {
    preloadImages(currentIndex + 1);
  }, [currentIndex]);

  const handleChoice = (liked) => {
    if (liked) {
      setSelections([...selections, shuffledOptions[currentIndex]]);
    }

    if (currentIndex < shuffledOptions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setExitDirection(null);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    // Count vibes from liked options
    const vibeCounts = selections.reduce((acc, option) => {
      option.vibe.forEach(v => {
        acc[v] = (acc[v] || 0) + 1;
      });
      return acc;
    }, {});

    // Group selections by category
    const categoryPreferences = selections.reduce((acc, option) => {
      if (option.category && option.category !== 'overall') {
        acc[option.category] = {
          vibe: option.vibe[0],
          tags: option.vendorTags
        };
      }
      return acc;
    }, {});

    // Find dominant vibes
    const maxCount = Math.max(...Object.values(vibeCounts));
    const dominantVibes = Object.entries(vibeCounts)
      .filter(([_, count]) => count === maxCount)
      .map(([vibe]) => vibe);

    setResults({
      overallStyle: dominantVibes,
      categoryPreferences
    });
    setShowResults(true);
  };

  const renderCard = () => {
    const option = shuffledOptions[currentIndex];

    return (
      <div className="tinder-container">
        <div className="quiz-progress">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${(currentIndex / shuffledOptions.length) * 100}%`,
              backgroundColor: '#A328F4' 
            }} 
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            className="tinder-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: 0
            }}
            exit={{ 
              x: exitDirection === 'right' ? 1000 : exitDirection === 'left' ? -1000 : 0,
              opacity: 0,
              transition: { duration: 0.5 }
            }}
            drag="x"
            dragElastic={1}
            dragConstraints={{ left: -1000, right: 1000 }}
            whileDrag={{ scale: 1.05 }}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x + velocity.x;
              if (Math.abs(swipe) > 100) {
                setExitDirection(swipe > 0 ? 'right' : 'left');
                handleChoice(swipe > 0);
              }
            }}
          >
            <div className="image-container-wedding-vibe-quiz" style={{width:'100%',height:'100%',position:'relative'}}>
              {isLoading && (
                <div className="loading-overlay">
                  <LoadingSpinner variant="pulse" color="white" size={40} />
                </div>
              )}
              <img
                src={option.image}
                alt={option.text}
                className={`tinder-image ${isLoading ? 'loading' : ''}`}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            </div>
            <div className="tinder-content">
              <h3>{option.text}</h3>
              {option.description && (
                <p>{option.description}</p>
              )}
            </div>
            
            <div className="swipe-hint left">
              <FaTimes />
            </div>
            <div className="swipe-hint right">
              <FaHeart />
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="quiz-controls">
          <button 
            className="tinder-button no"
            onClick={() => {
              setExitDirection('left');
              handleChoice(false);
            }}
          >
            <FaTimes />
          </button>

          <button 
            className="tinder-button yes"
            onClick={() => {
              setExitDirection('right');
              handleChoice(true);
            }}
          >
            <FaHeart />
          </button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!results.overallStyle?.length) {
      return (
        <div className="text-center">
          <h2 className="mb-4">Your Wedding Vibe Results!</h2>
          <p>We couldn't determine your style. Try taking the quiz again!</p>
          <button 
            className="btn-secondary"
            onClick={() => {
              setCurrentIndex(0);
              setSelections([]);
              setResults([]);
              setShowResults(false);
            }}
          >
            Retake Quiz
          </button>
        </div>
      );
    }

    return (
      <div className="text-center">
        <h2 className="mb-4">Your Wedding Style Profile</h2>
        
        {/* Overall Style */}
        <div className="row justify-content-center mb-5">
          {results.overallStyle.map((vibe, index) => (
            <div key={index} className="col-md-8 mb-4">
              <div className="result-card">
                <div className="result-image-container">
                  <img 
                    src={vibeDescriptions[vibe].image} 
                    alt={vibeDescriptions[vibe].title}
                    className="result-image"
                  />
                </div>
                <div className="result-content">
                  <h3 className="mb-3">{vibeDescriptions[vibe].title}</h3>
                  <p>{vibeDescriptions[vibe].description}</p>
                  <div className="suggested-vendors">
                    <h4>Suggested Vendors:</h4>
                    <ul>
                      {vibeDescriptions[vibe].vendors.map((vendor, i) => (
                        <li key={i}>{vendor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Recommendations */}
        <h3 className="mb-4">Ready to Find Your Perfect Vendors?</h3>
        <div className="row g-4">
          {Object.entries(results.categoryPreferences).map(([category, prefs]) => {
            // Find a matching option from the original questions for the image
            const categoryQuestion = questions.find(q => q.category === category);
            const matchingOption = categoryQuestion?.options.find(opt => 
              opt.vendorTags.some(tag => prefs.tags.includes(tag))
            );

            return (
              <div key={category} className="col-md-6 col-lg-4">
                <div className="vendor-card-quiz">
                  {matchingOption && (
                    <div className="vendor-image-container">
                      <img 
                        src={matchingOption.image}
                        alt={category}
                        className="vendor-image-quiz"
                      />
                    </div>
                  )}
                  <div className="vendor-content">
                    <h4 className="text-capitalize mb-3">{category}</h4>
                    <p>Your Style: {prefs.tags.join(', ')}</p>
                    <button 
                      className="btn-secondary"
                      style={{width: '100%',height:'60px'}}
                      onClick={() => {
                        localStorage.setItem('quizPreferences', JSON.stringify({
                          category,
                          style: prefs.vibe,
                          tags: prefs.tags
                        }));
                        window.location.href = categoryToRequestPath[category];
                      }}
                    >
                      Post {category} Request
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Retake Quiz Button */}
        <div className="mt-5">
          <button 
            className="btn-primary"
            onClick={() => {
              setCurrentIndex(0);
              setSelections([]);
              setResults([]);
              setShowResults(false);
            }}
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Wedding Style Quiz | Find Your Perfect Wedding Vibe | Bidi</title>
        <meta name="description" content="Take our interactive wedding style quiz to discover your perfect wedding aesthetic. Get matched with vendors who match your unique vision and style preferences." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Wedding Style Quiz | Find Your Perfect Wedding Vibe" />
        <meta property="og:description" content="Discover your wedding style and get matched with vendors who share your vision." />
        <meta property="og:image" content={rusticWedding} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Wedding Style Quiz | Find Your Perfect Wedding Vibe" />
        <meta name="twitter:description" content="Take our fun quiz to discover your wedding style and find your perfect vendors!" />
        <meta name="twitter:image" content={rusticWedding} />

        {/* Additional SEO tags */}
        <meta name="keywords" content="wedding style quiz, wedding aesthetic, wedding planning, wedding vendors, wedding inspiration, wedding theme, bridal style" />
        <link rel="canonical" href="https://savewithbidi.com/wedding-style-quiz" />
        
        {/* Structured Data for Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Quiz",
            "name": "Wedding Style Quiz",
            "description": "Interactive quiz to help couples discover their wedding style and find matching vendors",
            "provider": {
              "@type": "Organization",
              "name": "Bidi",
              "url": "https://savewithbidi.com"
            },
            "about": {
              "@type": "Thing",
              "name": "Wedding Planning"
            }
          })}
        </script>
      </Helmet>
      <div className="container py-5">
        <h1 className="text-center mb-3">
          What's Your Wedding Vibe?
        </h1>
        <div className="text-center mb-4">
          <p className="lead text-muted">
            Find your perfect wedding style in minutes! 💍
          </p>
        </div>
        {showTutorial && (
          <div className="tutorial-overlay" onClick={() => setShowTutorial(false)}>
            <div className="tutorial-content">
              <h3>Find Your Style</h3>
              <div className="tutorial-step">
                <FaHeart /> Swipe right or click Heart on what you love
              </div>
              <div className="tutorial-step">
                <FaTimes /> Swipe left or click X on what you don't
              </div>
              <button className="btn-secondary" onClick={() => setShowTutorial(false)}>
                Start Quiz
              </button>
            </div>
          </div>
        )}
        {!showResults ? renderCard() : renderResults()}
        <div className="text-center mt-3">
          <small className="text-muted">
            Style {currentIndex + 1} of {shuffledOptions.length}
          </small>
        </div>
      </div>
    </>
  );
};

export default WeddingVibeQuiz; 