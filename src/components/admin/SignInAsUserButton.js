import React from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

function SignInAsUserButton({ userId, buttonText = "Sign in as user" }) {
    const handleSignIn = async () => {
        try {
            const { data, error } = await supabaseAdmin.auth.admin.signIn({
                user_id: userId
            });

            if (error) throw error;
            
            // Redirect to home page or dashboard
            window.location.href = '/';
        } catch (error) {
            console.error('Failed to sign in as user:', error.message);
            alert('Failed to sign in as user: ' + error.message);
        }
    };

    return (
        <button 
            onClick={handleSignIn}
            className="btn btn-sm"
            style={{
                backgroundColor: '#A328F4',
                color: 'white',
                fontFamily: 'Outfit',
                fontWeight: '600',
                fontSize: '0.8rem',
                padding: '2px 8px'
            }}
        >
            {buttonText}
        </button>
    );
}

export default SignInAsUserButton; 