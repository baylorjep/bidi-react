import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/images/Bidi Logo.png';

function Navbar() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setUser(session.user);
                fetchUserRole(session.user.id);
            }
        };

        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser(session.user);
                fetchUserRole(session.user.id);
            } else {
                setUser(null);
                setUserRole(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchUserRole = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('category')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user role:', error.message);
        } else {
            setUserRole(data.category);
        }
    };

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error.message);
        } else {
            navigate('/'); // Redirect to the home page after signing out
        }
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light fixed-top shadow-sm" id="mainNav">
            <div className="container px-5">
                <Link className="navbar-brand fw-bold" to="/">
                    <img src={logo} alt="Bidi Logo" style={{ height: '50px', width: 'auto' }} />
                </Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarResponsive"
                    aria-controls="navbarResponsive"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    Menu
                    <i className="bi-list"></i>
                </button>
                <div className="collapse navbar-collapse" id="navbarResponsive">
                    <ul className="navbar-nav ms-auto me-4 my-3 my-lg-0">
                        {(!userRole || userRole === 'individual') && (
                            <li className="nav-item">
                                <Link className="nav-link me-lg-3" to="/request">Request a Service</Link>
                            </li>
                        )}

                        {userRole === 'individual' && (
                            <li className="nav-item">
                                <Link className="nav-link me-lg-3" to="/my-bids">My Bids</Link>
                            </li>
                        )}
                        
                        {userRole === 'business' && (
                            <li className="nav-item">
                                <Link className="nav-link me-lg-3" to="/open-requests">Open Requests</Link>
                            </li>
                        )}
                    </ul>

                    {user ? (
                        <button className="btn btn-secondary rounded-pill px-3 mb-2 mb-lg-0" onClick={handleSignOut}>
                            <span className="d-flex align-items-center">
                                <span className="small">Sign Out</span>
                            </span>
                        </button>
                    ) : (
                        <Link className="btn btn-secondary rounded-pill px-3 mb-2 mb-lg-0" to="/signin">
                            <span className="d-flex align-items-center">
                                <span className="small">Sign In</span>
                            </span>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
