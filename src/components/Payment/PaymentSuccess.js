import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '../../supabaseClient';
import '../../styles/PaymentSuccess.css';

// Base64 encoded Bidi logo
const BIDI_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDItMTNUMTU6NDc6NDctMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDItMTNUMTU6NDc6NDctMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAyLTEzVDE1OjQ3OjQ3LTA4OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4ZjM5LTM4ZTAtNDZiZC1hMzA2LTNmYzM5ZjM5ZjM5ZiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjY5ZDM4ZjM5LTM4ZTAtNDZiZC1hMzA2LTNmYzM5ZjM5ZjM5ZiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjY5ZDM4ZjM5LTM4ZTAtNDZiZC1hMzA2LTNmYzM5ZjM5ZjM5ZiIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4ZjM5LTM4ZTAtNDZiZC1hMzA2LTNmYzM5ZjM5ZjM5ZiIgc3RFdnQ6d2hlbj0iMjAyNC0wMi0xM1QxNTo0Nzo0Ny0wODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+';

const PaymentSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [paymentData, setPaymentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestClosed, setRequestClosed] = useState(false);

    // Helper function to close a request
    const closeRequest = async (requestId) => {
        try {
            // Try to find and close the request in all possible request tables
            const requestTables = [
                'requests',
                'photography_requests',
                'videography_requests',
                'catering_requests',
                'dj_requests',
                'florist_requests',
                'beauty_requests',
                'wedding_planning_requests'
            ];

            let requestClosed = false;

            for (const table of requestTables) {
                const { data, error } = await supabase
                    .from(table)
                    .update({ 
                        status: 'closed',
                        closed_at: new Date().toISOString()
                    })
                    .eq('id', requestId);

                if (!error && data && data.length > 0) {
                    console.log(`Successfully closed request in ${table}`);
                    requestClosed = true;
                    setRequestClosed(true);
                    break; // Found and closed the request, no need to check other tables
                }
            }

            if (!requestClosed) {
                console.log('Request not found in any table or already closed');
            }
        } catch (error) {
            console.error('Error closing request:', error);
        }
    };

    useEffect(() => {
        const getPaymentData = async () => {
            try {
                // Get data from URL parameters
                const params = new URLSearchParams(location.search);
                console.log('URL Parameters:', Object.fromEntries(params.entries()));
                
                const amount = params.get('amount');
                const paymentType = params.get('payment_type');
                const businessName = decodeURIComponent(params.get('business_name') || '');
                const bidId = params.get('bid_id');

                console.log('Parsed Parameters:', {
                    amount,
                    paymentType,
                    businessName,
                    bidId
                });

                if (amount && paymentType && businessName) {
                    const paymentDataObj = {
                        amount: parseFloat(amount),
                        payment_type: paymentType,
                        business_name: businessName,
                        date: new Date().toISOString(),
                        bid_id: bidId
                    };
                    console.log('Setting payment data:', paymentDataObj);
                    setPaymentData(paymentDataObj);

                    // Update bid status and close request if bidId is present
                    if (bidId) {
                        try {
                            // First, get the bid to find the request_id
                            const { data: bidData, error: bidError } = await supabase
                                .from('bids')
                                .select('request_id')
                                .eq('id', bidId)
                                .single();

                            if (bidError) {
                                console.error('Error fetching bid data:', bidError);
                            } else {
                                // Update bid status to paid
                                const { error: updateBidError } = await supabase
                                    .from('bids')
                                    .update({ 
                                        status: 'paid',
                                        paid_at: new Date().toISOString(),
                                        payment_amount: parseFloat(amount),
                                        payment_type: paymentType
                                    })
                                    .eq('id', bidId);

                                if (updateBidError) {
                                    console.error('Error updating bid status:', updateBidError);
                                } else {
                                    console.log('Successfully updated bid status to paid');
                                }

                                // Close the request if this is a full payment
                                if (paymentType === 'full' && bidData.request_id) {
                                    await closeRequest(bidData.request_id);
                                }
                            }
                        } catch (error) {
                            console.error('Error updating bid:', error);
                        }
                    }
                } else {
                    console.log('Missing required parameters:', { amount, paymentType, businessName });
                    // If no URL parameters, try to get data from location state
                    const stateData = location.state?.paymentData;
                    console.log('Location state data:', stateData);
                    if (stateData) {
                        setPaymentData({
                            ...stateData,
                            date: new Date().toISOString()
                        });

                        // Update bid status and close request if bidId is present in state data
                        if (stateData.bid_id) {
                            try {
                                // First, get the bid to find the request_id
                                const { data: bidData, error: bidError } = await supabase
                                    .from('bids')
                                    .select('request_id')
                                    .eq('id', stateData.bid_id)
                                    .single();

                                if (bidError) {
                                    console.error('Error fetching bid data:', bidError);
                                } else {
                                    // Update bid status to paid
                                    const { error: updateBidError } = await supabase
                                        .from('bids')
                                        .update({ 
                                            status: 'paid',
                                            paid_at: new Date().toISOString(),
                                            payment_amount: parseFloat(stateData.amount),
                                            payment_type: stateData.payment_type
                                        })
                                        .eq('id', stateData.bid_id);

                                    if (updateBidError) {
                                        console.error('Error updating bid status:', updateBidError);
                                    } else {
                                        console.log('Successfully updated bid status to paid');
                                    }

                                    // Close the request if this is a full payment
                                    if (stateData.payment_type === 'full' && bidData.request_id) {
                                        await closeRequest(bidData.request_id);
                                    }
                                }
                            } catch (error) {
                                console.error('Error updating bid:', error);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error getting payment data:', error);
            } finally {
                setLoading(false);
            }
        };

        getPaymentData();
    }, [location]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Payment Receipt</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 20px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        .receipt {
                            border: 1px solid #ddd;
                            padding: 20px;
                            border-radius: 8px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .logo {
                            font-size: 32px;
                            font-weight: bold;
                            color: #9633eb;
                            margin-bottom: 20px;
                        }
                        .details {
                            margin: 20px 0;
                        }
                        .row {
                            display: flex;
                            justify-content: space-between;
                            margin: 10px 0;
                            padding: 5px 0;
                            border-bottom: 1px solid #eee;
                        }
                        .total {
                            font-weight: bold;
                            font-size: 1.2em;
                            margin-top: 20px;
                            padding-top: 10px;
                            border-top: 2px solid #ddd;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 30px;
                            color: #666;
                            font-size: 0.9em;
                        }
                        @media print {
                            body {
                                padding: 0;
                            }
                            .receipt {
                                border: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="header">
                            <div class="logo">Bidi</div>
                            <h2>Payment Receipt</h2>
                        </div>
                        <div class="details">
                            <div class="row">
                                <span>Business:</span>
                                <span>${paymentData?.business_name || 'N/A'}</span>
                            </div>
                            <div class="row">
                                <span>Payment Type:</span>
                                <span>${paymentData?.payment_type === 'full' ? 'Full Payment' : 'Down Payment'}</span>
                            </div>
                            <div class="row">
                                <span>Date:</span>
                                <span>${new Date(paymentData?.date).toLocaleDateString()}</span>
                            </div>
                            <div class="row">
                                <span>Time:</span>
                                <span>${new Date(paymentData?.date).toLocaleTimeString()}</span>
                            </div>
                            <div class="row total">
                                <span>Amount:</span>
                                <span>$${paymentData?.amount?.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>
                        <div class="footer">
                            <p>Thank you for your payment!</p>
                            <p>This receipt serves as proof of payment.</p>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    if (loading) {
        return (
            <div className="payment-success-container">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (!paymentData) {
        return (
            <div className="payment-success-container">
                <div className="error-message">
                    <h2>No Payment Data Found</h2>
                    <p>Please complete a payment to view the receipt.</p>
                    <button onClick={() => navigate('/bids')} className="btn-primary">
                        Return to Bids
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Payment Successful - Bidi</title>
                <meta name="description" content="Your payment was successful. View your receipt and next steps." />
            </Helmet>
            <div className="payment-success-container">
                <div className="success-message">
                    <h2>Payment Successful!</h2>
                    <p>Your payment has been processed successfully.</p>
                    {requestClosed && (
                        <div className="request-closed-notification">
                            <i className="fas fa-lock"></i>
                            <span>Your request has been automatically closed since this was a full payment.</span>
                        </div>
                    )}
                    <i className="fas fa-check-circle check-icon"></i>
                </div>
                
                <div className="receipt-container">
                    <div className="receipt">
                        <div className="receipt-header">
                            <div className="logo">Bidi</div>
                            <h3>Payment Receipt</h3>
                        </div>
                        
                        <div className="receipt-details">
                            <div className="detail-row">
                                <span>Business:</span>
                                <span>{paymentData.business_name}</span>
                            </div>
                            <div className="detail-row">
                                <span>Payment Type:</span>
                                <span>{paymentData.payment_type === 'full' ? 'Full Payment' : 'Down Payment'}</span>
                            </div>
                            <div className="detail-row">
                                <span>Date:</span>
                                <span>{new Date(paymentData.date).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-row">
                                <span>Time:</span>
                                <span>{new Date(paymentData.date).toLocaleTimeString()}</span>
                            </div>
                            <div className="detail-row total">
                                <span>Amount:</span>
                                <span>${paymentData.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="receipt-actions">
                        <button onClick={() => navigate('/bids')} className="btn-secondary-payment-success">
                            <i className="fas fa-arrow-left"></i>
                            Return to Bids
                        </button>
                        <button onClick={handlePrint} className="btn-primary-payment-success">
                            <i className="fas fa-print"></i>
                            Print Receipt
                        </button>

                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentSuccess; 