const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { amount, currency } = req.body;

            // Create a payment intent with Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount, // Amount in cents
                currency,
            });

            // Send back the client secret for the payment
            res.status(200).json({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}