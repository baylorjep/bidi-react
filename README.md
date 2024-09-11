# Bidi - The Bidding Marketplace

Welcome to **Bidi**, the platform that connects photographers, videographers, and other wedding service providers with clients in need of professional photography services. **Bidi** simplifies the process of finding, hiring, and paying for photography services, allowing businesses and individuals to collaborate seamlessly. Whether you're a photographer looking to grow your client base or an individual searching for the right photographer for your event, **Bidi** makes it easy.

## Getting Started

To run the **Bidi** platform locally, follow the steps below:

### Prerequisites

Ensure that you have the following installed:

- [Node.js](https://nodejs.org/) (version 14.x or later)
- [npm](https://www.npmjs.com/get-npm) (comes with Node.js)
- [Supabase CLI](https://supabase.com/docs/guides/cli) for backend integration with Supabase (optional but recommended)
- A Stripe account for payment processing

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/bidi.git
cd bidi

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env file in the root directory and add the following:

REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key


Make sure you replace the placeholders (`your-supabase-url`, `your-supabase-anon-key`, `your-stripe-publishable-key`) with your actual credentials.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified, and the filenames include the hashes.\
Your app is ready to be deployed!

### `npm run eject`

**Note: this is a one-way operation. Once you eject, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Deployment

Follow the instructions in this guide to deploy your app to various platforms such as Vercel, Net​⬤