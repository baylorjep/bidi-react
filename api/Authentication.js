//with connect, 

(async () => {
    const stripe = require( 'stripe')('sk_test_51Pv13ZF25aBU3RMPjAxWeSf0Cvnp6OI0n5MlmU8dLopD2g5gBDOcD0oRs6RAj56SfF5pVACra3BSjJIRDphUNoJm00KUr0QoqJ');
    const customer = await stripe.customers.retrieve('Cus_HDfWzCQ6UEVtfu', {
    stripeAccount: 'acct_1Ey3h1฿qeQDKpna'
}) ;
    console. log (customer);
}) ()