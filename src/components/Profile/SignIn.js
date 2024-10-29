import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../../App.css';
import { Link } from 'react-router-dom';


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
            setErrorMessage(`Sign in error: ${error.message}`);
            console.log(`Sign in error: ${error.message}`);
            return;
        }

        // Fetch the user's profile information
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Fetch profile error:', profileError.message);
            return;
        }

        if (profile.role === 'individual') {
            navigate('/my-bids'); // Redirect individuals to the "My Bids" page
        } else if (profile.role === 'business') {
            navigate('/dashboard'); // Redirect businesses to the "Open Requests" page
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center" style={{marginTop:"120px"}}>
            <div className="col-lg-6">
                <div className="mb-5 mb-lg-0 text-center">
                    <br/>
                    <h1 className="Sign-Up-Page-Header">Sign In</h1>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                </div>
                <form onSubmit={handleSignIn}>
                    <div className="form-floating create-account-form mb-3">
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
                    <div className="form-floating create-account-form mb-3">
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
                    <div className="forgot-your-password">
                        <Link to="/request-password-reset" className="btn btn-link">
                            Forgot your password?
                        </Link>
                    </div>
                    <div className="sign-in-container">
                        <button type="submit" className="sign-up-button" style={{width:'160px'}}>Sign In</button>
                    </div>
                    <br/>
                    <div className="forgot-your-password"align='center' style={{textDecoration:'none'}}>Don't Have an Account?
                            <a href='/Signup' > Sign Up Here.</a> 
                    </div>
                    
                </form>
            </div>
        </div>
    );
}

export default SignIn;
