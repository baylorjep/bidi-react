import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useMissingProfile = (user) => {
    const [hasProfile, setHasProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkProfile = async () => {
            if (!user) {
                setHasProfile(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Check if user has a profile in the profiles table
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    if (profileError.code === 'PGRST116') {
                        // No profile found - this is the missing profile case
                        setHasProfile(false);
                    } else {
                        // Other error
                        setError(profileError);
                        setHasProfile(null);
                    }
                } else {
                    // Profile exists
                    setHasProfile(true);
                }
            } catch (err) {
                console.error('Error checking profile:', err);
                setError(err);
                setHasProfile(null);
            } finally {
                setLoading(false);
            }
        };

        checkProfile();
    }, [user]);

    return {
        hasProfile,
        loading,
        error,
        isMissingProfile: hasProfile === false
    };
};
