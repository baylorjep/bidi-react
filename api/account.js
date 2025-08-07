// api/createAccount.js for stripe account creation
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
      });
      res.status(200).json({ accountId: account.id });
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
