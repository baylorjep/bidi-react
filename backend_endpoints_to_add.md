# Backend Endpoints to Add

Add these endpoints to your backend server's index.js file:

## 1. Verify Account Endpoint

```javascript
// Endpoint to verify a Stripe connected account
app.post("/verify-account", async (req, res) => {
  try {
    const { accountId } = req.body;
    
    if (!accountId) {
      return res.status(400).json({ error: "Account ID is required" });
    }

    // Retrieve the account from Stripe
    const account = await stripe.accounts.retrieve(accountId);
    
    // Check if the account is valid and properly set up
    const isValid = account && 
                   account.details_submitted && 
                   account.charges_enabled && 
                   account.payouts_enabled;

    res.json({ isValid });
  } catch (error) {
    console.error("Error verifying account:", error);
    res.status(500).json({ error: error.message });
  }
});
```

## 2. Delete Account Endpoint

```javascript
// Endpoint to delete a Stripe connected account
app.post("/delete-account", async (req, res) => {
  try {
    const { accountId } = req.body;
    
    if (!accountId) {
      return res.status(400).json({ error: "Account ID is required" });
    }

    // Delete the account from Stripe
    const deletedAccount = await stripe.accounts.del(accountId);
    
    res.json({ 
      success: true, 
      message: "Account deleted successfully",
      accountId: deletedAccount.id 
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: error.message });
  }
});
```

## 3. Update CORS Configuration

Make sure your CORS configuration allows requests from your frontend domain:

```javascript
// Update your CORS configuration
app.use(cors({
  origin: [
    'https://www.savewithbidi.com',
    'https://savewithbidi.com',
    'http://localhost:3000', // for development
    'http://localhost:3001'  // for development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 4. Error Handling Middleware

Add this error handling middleware to catch and log errors:

```javascript
// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});
```

## 5. Health Check for Stripe Connection

```javascript
// Health check for Stripe connection
app.get("/stripe-health", async (req, res) => {
  try {
    // Test Stripe connection by making a simple API call
    const balance = await stripe.balance.retrieve();
    res.json({ 
      status: "healthy", 
      stripe_connected: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Stripe health check failed:", error);
    res.status(500).json({ 
      status: "unhealthy", 
      stripe_connected: false,
      error: error.message 
    });
  }
});
```

## Implementation Notes:

1. **Add these endpoints to your backend server** (the one running on `bidi-express.vercel.app`)
2. **Test the endpoints** using curl or Postman before deploying
3. **Update CORS** to allow requests from your frontend domain
4. **Add proper error handling** to catch and log any issues
5. **Deploy the changes** to your backend server

## Testing the Endpoints:

```bash
# Test verify-account endpoint
curl -X POST https://bidi-express.vercel.app/verify-account \
  -H "Content-Type: application/json" \
  -d '{"accountId":"acct_test123"}'

# Test delete-account endpoint  
curl -X POST https://bidi-express.vercel.app/delete-account \
  -H "Content-Type: application/json" \
  -d '{"accountId":"acct_test123"}'

# Test health check
curl https://bidi-express.vercel.app/stripe-health
```

Once these endpoints are added to your backend, the Stripe onboarding process should work correctly without the 404 errors. 