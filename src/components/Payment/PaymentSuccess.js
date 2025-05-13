import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '../../supabaseClient';

// Base64 encoded Bidi logo
const BIDI_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDItMTNUMTU6NDc6NDctMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDItMTNUMTU6NDc6NDctMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAyLTEzVDE1OjQ3OjQ3LTA4OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4ZjM5LTM4ZTAtNDZiZC1hMzA2LTNmYzM5ZjM5ZjM5ZiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjY5ZDM4ZjM5LTM4ZTAtNDZiZC1hMzA2LTNmYzM5ZjM5ZjM5ZiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjY5ZDM4ZjM5LTM4ZTAtNDZiZC1hMzA2LTNmYzM5ZjM5ZjM5ZiIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4ZjM5LTM4ZTAtNDZiZC1hMzA2LTNmYzM5ZjM5ZjM5ZiIgc3RFdnQ6d2hlbj0iMjAyNC0wMi0xM1QxNTo0Nzo0Ny0wODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+';

export default function PaymentSuccess() {
    const location = useLocation();
    const navigate = useNavigate();

    const paymentData = location.state?.paymentData;

    useEffect(() => {
        const updateBidStatus = async () => {
            if (paymentData.bid_id) {
                try {
                    const newStatus = paymentData.payment_type === 'down_payment' ? 'down_payment_paid' : 'paid_in_full';
                    const { error } = await supabase
                        .from('bids')
                        .update({ 
                            status: newStatus,
                            payment_date: new Date().toISOString()
                        })
                        .eq('id', paymentData.bid_id);

                    if (error) {
                        console.error('Error updating bid status:', error);
                    }
                } catch (error) {
                    console.error('Error updating bid status:', error);
                }
            }
        };

        updateBidStatus();
    }, [paymentData]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Payment Receipt - Bidi</title>
                    <style>
                        @media print {
                            body {
                                margin: 0;
                                padding: 20px;
                                font-family: Arial, sans-serif;
                            }
                            .receipt {
                                max-width: 800px;
                                margin: 0 auto;
                                padding: 20px;
                            }
                            .receipt-header {
                                text-align: center;
                                margin-bottom: 30px;
                            }
                            .receipt-logo {
                                margin-bottom: 20px;
                            }
                            .receipt-logo img {
                                height: 40px;
                                width: auto;
                            }
                            .receipt-title {
                                font-size: 20px;
                                margin-bottom: 5px;
                            }
                            .receipt-date {
                                color: #666;
                                margin-bottom: 20px;
                            }
                            .receipt-details {
                                margin-bottom: 30px;
                            }
                            .receipt-row {
                                display: flex;
                                justify-content: space-between;
                                margin-bottom: 10px;
                                padding: 5px 0;
                                border-bottom: 1px solid #eee;
                            }
                            .receipt-label {
                                color: #666;
                            }
                            .receipt-value {
                                font-weight: bold;
                            }
                            .receipt-total {
                                font-size: 18px;
                                font-weight: bold;
                                margin-top: 20px;
                                padding-top: 10px;
                                border-top: 2px solid #9633eb;
                            }
                            .receipt-footer {
                                margin-top: 40px;
                                text-align: center;
                                color: #666;
                                font-size: 12px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="receipt-header">
                            <div class="receipt-logo" style="font-size: 32px; font-weight: bold; color: #9633eb; margin-bottom: 20px; letter-spacing: 1px;">Bidi</div>
                            <div class="receipt-title">Payment Receipt</div>
                            <div class="receipt-date">${new Date().toLocaleDateString()}</div>
                        </div>
                        
                        <div class="receipt-details">
                            <div class="receipt-row">
                                <span class="receipt-label">Business Name:</span>
                                <span class="receipt-value">${paymentData.business_name}</span>
                            </div>
                            <div class="receipt-row">
                                <span class="receipt-label">Payment Type:</span>
                                <span class="receipt-value">${paymentData.payment_type === 'down_payment' ? 'Down Payment' : 'Full Payment'}</span>
                            </div>
                            <div class="receipt-row">
                                <span class="receipt-label">Amount:</span>
                                <span class="receipt-value">$${paymentData.amount.toFixed(2)}</span>
                            </div>
                            <div class="receipt-row receipt-total">
                                <span>Total Paid:</span>
                                <span>$${paymentData.amount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="receipt-footer">
                            <p>Thank you for using Bidi!</p>
                            <p>This receipt serves as proof of payment.</p>
                            <p>For any questions, please contact support@bidi.com</p>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <>
            <Helmet>
                <title>Payment Successful - Bidi</title>
                <meta name="description" content="Your payment was successful. View your receipt and next steps." />
            </Helmet>
            <div className="payment-success-container" style={{
                maxWidth: '800px',
                margin: '40px auto',
                padding: '24px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 16px',
                        background: '#28a745',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <i className="fas fa-check" style={{ fontSize: '40px', color: 'white' }}></i>
                    </div>
                    <h1 style={{ color: '#333', marginBottom: '8px' }}>Payment Successful!</h1>
                    <p style={{ color: '#666' }}>Thank you for your payment to {paymentData.business_name}</p>
                </div>

                <div style={{
                    background: '#f8f9fa',
                    padding: '24px',
                    borderRadius: '8px',
                    marginBottom: '32px'
                }}>
                    <h2 style={{ color: '#333', marginBottom: '16px' }}>Receipt</h2>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#666' }}>Amount Paid:</span>
                            <span style={{ fontWeight: 'bold' }}>${paymentData.amount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#666' }}>Payment Type:</span>
                            <span style={{ fontWeight: 'bold' }}>
                                {paymentData.payment_type === 'down_payment' ? 'Down Payment' : 'Full Payment'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#666' }}>Date:</span>
                            <span style={{ fontWeight: 'bold' }}>{new Date().toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#666' }}>Business:</span>
                            <span style={{ fontWeight: 'bold' }}>{paymentData.business_name}</span>
                        </div>
                    </div>
                </div>

                <div style={{
                    background: '#f8f9fa',
                    padding: '24px',
                    borderRadius: '8px',
                    marginBottom: '32px'
                }}>
                    <h2 style={{ color: '#333', marginBottom: '16px' }}>Next Steps</h2>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0
                    }}>
                        <li style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px',
                            color: '#666'
                        }}>
                            <i className="fas fa-comments" style={{ color: '#9633eb' }}></i>
                            The business will contact you through Bidi's messenger to discuss service details
                        </li>
                        <li style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px',
                            color: '#666'
                        }}>
                            <i className="fas fa-calendar-check" style={{ color: '#9633eb' }}></i>
                            Finalize your booking details and schedule
                        </li>
                        <li style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#666'
                        }}>
                            <i className="fas fa-shield-alt" style={{ color: '#9633eb' }}></i>
                            Your payment is protected by Bidi's Money-Back Guarantee
                        </li>
                    </ul>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button
                        onClick={() => navigate('/bids')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '40px',
                            border: 'none',
                            background: '#9633eb',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <i className="fas fa-arrow-left"></i>
                        Back to Bids
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '40px',
                            border: '1px solid #9633eb',
                            background: 'white',
                            color: '#9633eb',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <i className="fas fa-print"></i>
                        Print Receipt
                    </button>
                </div>
            </div>
        </>
    );
} 