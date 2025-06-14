import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import AuthModal from './Request/Authentication/AuthModal';

const PrivateRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        checkUser();
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);
                if (session?.user) {
                    setShowAuthModal(false);
                }
            }
        );

        return () => {
            if (authListener?.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, []);

    async function checkUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (!session?.user) {
                setShowAuthModal(true);
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return (
            <>
                {children}
                <AuthModal 
                    setIsModalOpen={setShowAuthModal} 
                    onSuccess={() => {
                        setShowAuthModal(false);
                        // Set active section to bids in localStorage before reloading
                        localStorage.setItem('activeSection', 'bids');
                        // Reload the page
                        window.location.reload();
                    }}
                />
            </>
        );
    }

    return children;
};

export default PrivateRoute;
