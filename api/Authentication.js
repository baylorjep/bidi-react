//with connect, 

(async () => {
    const stripe = require( 'stripe')(process.env.STRIPE_SECRET_KEY);
    const customer = await stripe.customers.retrieve('Cus_HDfWzCQ6UEVtfu', {
    stripeAccount: 'acct_1Ey3h1฿qeQDKpna'
}) ;
    console. log (customer);
}) ()