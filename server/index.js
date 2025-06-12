const express = require('express');
const cors = require('cors');
const app = express();
const googleReviewsRouter = require('./routes/google-reviews');
const googlePlacesRoutes = require('./google-places/routes');

// Enable CORS with specific configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Mount routes with /api prefix
app.use('/api', googleReviewsRouter);
app.use('/api', googlePlacesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: err.message 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 