import {React, useState, useEffect} from 'react';
import { supabase } from '../supabaseClient';
import RotatingTextES from './Layout/RotatingTextES';
import TestimonialSlider from './Layout/Testimonials/TestimonialSlider';
import '../App.css';
import { Link } from 'react-router-dom';

function Homepage() {
    const [user, setUser] = useState(null);
    //const navigate = useNavigate();

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setUser(session.user);
            }
        };

        fetchSession();

    }, []);
    return (
        <>
            <header className="masthead-index">
                <div className="container px-5">
                    <div className="row gx-5 justify-content-center">
                        <div className="col-lg-10 text-center">
                            <div className="text-container">
                                <h1>
                                    Ofertas en tiempo real para tu próximo(a) <RotatingTextES />
                                </h1>
                                <br></br>
                                <p className='homepage-subtitle'>
                                    ¡No busques ofertas, deja que las ofertas te busquen a ti!
                                </p>
                                <div className="search-container">
                                {/* If no user is signed in, send them to sign up */}
                                {user === null && (
                                    <Link to="Signup">
                                        <button className="search-button">
                                            Comienza
                                        </button>
                                    </Link>
                                )}
                                {/* If a user is signed in, send them to request categories */}
                                {user != null && (
                                    <Link to="/request-categories">
                                        <button className="search-button">
                                            Comienza
                                        </button>
                                    </Link>
                                )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <div className='testimonials-container'>
                <div className="text-container">
                    <h2 className="testimonial-header">Clientes Satisfechos</h2>
                </div>
                <TestimonialSlider />
            </div>
        </>
    );
}

export default Homepage;

