import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();

        const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMessage(`Error signing in: ${error.message}`);
        } else {
            // Fetch the user's profile information
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('category')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError.message);
            } else {
                if (profile.category === 'individual') {
                    navigate('/my-bids'); // Redirect individuals to the "My Bids" page
                } else if (profile.category === 'business') {
                    navigate('/open-requests'); // Redirect businesses to the "Open Requests" page
                }
            }
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <div className="mb-5 mb-lg-0 text-center">
                    <br/>
                    <h1 className="SignInPageHeader">Sign In</h1>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                </div>
                <form onSubmit={handleSignIn}>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <label htmlFor="email">Email Address</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <label htmlFor="password">Password</label>
                    </div>
                    <div className="d-grid">
                        <button type="submit" className="btn btn-secondary btn-lg w-100">Sign In</button>
                    </div>
                    <br/>
                    <h6 align='center'>Don't Have an Account?   
                            <a href='/Signup' > Sign Up Here.</a> 
                    </h6>
                </form>
            </div>
        </div>
    );
}

export default SignIn;
