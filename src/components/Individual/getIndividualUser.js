import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Ensure this path is correct

// Custom hook to fetch the user
export const useIndividualUser = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserAndIndividual = async () => {
            try {
                const { data: userResponse, error: userError } = await supabase.auth.getUser();
                if (userError) { throw userError; }

                const userData = userResponse.user;

                if (userData) {
                    // Fetch corresponding profile data
                    const { data: profileData, error: profileError } = await supabase
                        .from('individual_profiles')
                        .select('*')
                        .eq('id', userData.id)
                        .single();

                    if (profileError) {
                        throw profileError;
                    }

                    setUser({ ...userData, profile: profileData });
                }

            } catch (error) {
                setError('Failed to fetch user or profile');
                console.error(error);
            }
        };

        fetchUserAndIndividual();
    }, []);

    return { user, error };
};