import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import logo from '../../assets/images/Bidi Logo.png';
import '../../App.css';

function Navbar() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();
    const navbarRef = useRef(null); // Create a ref for the navbar

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
            .select('role')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user role:', error.message);
        } else {
            setUserRole(data.role);
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

    // Function to close the navbar menu
    const closeMenu = () => {
        const navbarCollapse = document.getElementById('navbarResponsive');
        if (navbarCollapse) {
            navbarCollapse.classList.remove('show');
        }
    };

    // Event listener for clicks outside the navbar
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navbarRef.current && !navbarRef.current.contains(event.target)) {
                closeMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [navbarRef]);

    return (
        <nav className="navbar navbar-expand-lg" id="mainNav" ref={navbarRef}>
            <div className="container">
                <Link className="navbar-brand fw-bold" to="/">
                    <div className='bidi-logo'>Bidi</div>
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
                                <Link className="nav-link me-lg-3" to="/request-categories">Hire a Pro</Link>
                            </li>
                        )}

                        {userRole === 'individual' && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link me-lg-3" to="/my-bids">New Bids</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link me-lg-3" to="/approved-bids">Approved Bids</Link>
                                </li>
                            </>
                        )}

                        {userRole === 'business' && (
                            <>
                            <li className="nav-item">
                                <Link className="nav-link me-lg-3" to="/dashboard">Dashboard</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link me-lg-3" to="/open-requests">Open Requests</Link>
                            </li>
                            </>
                        )}

                        <li className="nav-item">
                            <Link className="nav-link me-lg-3" to="/contact-us">Contact Us</Link>
                        </li>

                        <li className="nav-item">
                            <Link className="nav-link me-lg-3" to="/about-us">About Us</Link>
                        </li>
                    </ul>

                    {user ? (
                        <button className="btn-nav-primary" onClick={handleSignOut}>
                            <span className="btn-text">
                                <span className="small">Log Out</span>
                            </span>
                        </button>
                    ) : (
                        <Link style={{textDecoration:'none'}}className="btn-nav-primary" to="/signin">
                            <span className="btn-text">
                                <span className="small">Log In</span>
                            </span>
                        </Link>
                    )}

                    {/* Conditionally render the Sign Up button */}
                    {!user && (
                        <Link className="btn-nav-secondary" style={{textDecoration:'none'}} to="/createaccount?source=navbar">
                            <span className="btn-text-secondary">
                                <span className="small">Sign Up</span>
                            </span>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
