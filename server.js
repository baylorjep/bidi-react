const express = require("express");
const app = express();
const cors = require("cors"); // Ensure your frontend can make requests
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

app.use(express.json());
app.use(cors()); // Enable CORS for frontend requests

// Endpoint to create a Stripe account
app.post("/create-account", async (req, res) => {
  try {
    const account = await stripe.accounts.create({
      type: "express", // Use express account for Stripe Connect
    });
    res.status(200).json({ accountId: account.id });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create an account link for onboarding
app.post("/create-account-link", async (req, res) => {
  const { accountId } = req.body;
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.origin}/dashboard`,
      return_url: `${req.headers.origin}/dashboard`,
      type: "account_onboarding",
    });
    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error("Error creating account link:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
