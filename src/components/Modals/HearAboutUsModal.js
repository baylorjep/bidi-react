import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const HearAboutUsModal = ({ isOpen, onClose, userId }) => {
    const [source, setSource] = useState('');
    const [otherSource, setOtherSource] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalSource = source === 'other' ? otherSource : source;

        // First, get the user's role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            return;
        }

        // Update the profile with heard_from and has_seen_source_modal
        const { error } = await supabase
            .from('profiles')
            .update({ heard_from: finalSource, has_seen_source_modal: true })
            .eq('id', userId);

        if (error) {
            console.error('Error updating profile:', error);
            return;
        }

        onClose();
        navigate(profile.role === 'individual' ? '/bids' : '/dashboard');
    };

    const handleSkip = async () => {
        // Get the user's role first
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            return;
        }

        // Just mark the modal as seen without saving a source
        const { error } = await supabase
            .from('profiles')
            .update({ has_seen_source_modal: true })
            .eq('id', userId);

        if (error) {
            console.error('Error updating profile:', error);
            return;
        }

        onClose();
        navigate(profile.role === 'individual' ? '/bids' : '/dashboard');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button 
                    className="modal-close-btn" 
                    onClick={handleSkip}
                    style={{
                        position: 'absolute',
                        right: '15px',
                        top: '15px',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        color: '#666',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    ×
                </button>
                <h2 style={{fontFamily:'Outfit', marginTop: '20px'}}>Where did you hear about us?</h2>
                <form onSubmit={handleSubmit}>
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        required
                        className="sign-in-form"
                        style={{ marginBottom: '10px' }}
                    >
                        <option value="">Select an option...</option>
                        <option value="google">Google</option>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="tradeshow">Tradeshow/Event</option>
                        <option value="friend">Friend/Family</option>
                        <option value="other">Other</option>
                    </select>

                    {source === 'other' && (
                        <input
                            type="text"
                            value={otherSource}
                            onChange={(e) => setOtherSource(e.target.value)}
                            placeholder="Please specify"
                            required
                            className="sign-in-form"
                            style={{ marginTop: '10px', marginBottom: '10px' }}
                        />
                    )}

                    <button type="submit" className="sign-up-button">
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
};

export default HearAboutUsModal;
