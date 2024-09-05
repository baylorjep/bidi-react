// api/createAccountLink.js
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { accountId } = req.body;
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${req.headers.origin}/dashboard`,
        return_url: `${req.headers.origin}/dashboard`,
        type: 'account_onboarding',
      });
      res.status(200).json({ url: accountLink.url });
    } catch (error) {
      console.error('Error creating account link:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
