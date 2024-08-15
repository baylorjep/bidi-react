import React, { useState, useEffect } from 'react';
import '../../App.css';
import { supabase } from '../../supabaseClient';


const IndividualUser = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');

    const getUser = async () => {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) {
            setError('Failed to fetch user.');
            console.error(userError);
            return;
        }

        setUser(userData.user);
    }

    getUser();

    return user;
}

export default IndividualUser;