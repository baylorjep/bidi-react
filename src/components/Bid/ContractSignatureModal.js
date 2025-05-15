import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Document, Page } from "react-pdf";
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.js`;

function ContractSignatureModal({
  isOpen,
  onClose,
  bid,
  pdfPage,
  setPdfPage,
  pdfData,
  pdfWrapperRef,
  handlePdfClick,
  signaturePos,
  setSignaturePos,
  placingSignature,
  setPlacingSignature,
  clientSignature,
  setClientSignature,
  clientSigning,
  clientSignError,
  clientSigned,
  handleClientSignContract,
  handleDownloadSignedPdf
}) {
  const [pdfError, setPdfError] = useState(null);
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30, 27, 38, 0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div className="modal-content" style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 650, width: '100%', position: 'relative', boxShadow: '0 8px 32px rgba(80,30,120,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#9633eb', fontWeight: 700, transition: 'color 0.2s' }} aria-label="Close">✕</button>
        <h2 style={{ marginBottom: 18, color: '#9633eb', fontWeight: 800, fontSize: 28, letterSpacing: 0.5 }}>Contract Signature</h2>
        <label style={{ fontWeight: 600, marginBottom: 8, color: '#333', alignSelf: 'flex-start' }}>Contract File:</label>
        <div ref={pdfWrapperRef} onClick={handlePdfClick} style={{ border: placingSignature ? '2px dashed #9633eb' : '1px solid #e0e0e0', cursor: placingSignature ? 'crosshair' : 'pointer', maxWidth: 600, minHeight: 400, position: 'relative', margin: '0 auto 16px auto', borderRadius: 8, background: '#faf8ff', boxShadow: '0 2px 8px rgba(150,51,235,0.04)' }}>
          <Document
            file={bid.contract_url}
            onLoadSuccess={({ numPages }) => { setPdfPage(1); setPdfError(null); }}
            onLoadError={err => setPdfError('Failed to load PDF file. Please check the contract file URL and try again.')}
          >
            <Page pageNumber={pdfPage} width={600} />
          </Document>
          {pdfError && (
            <div style={{ color: '#d32f2f', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>
              {pdfError}
              <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>
                URL: {bid.contract_url || 'No file specified'}
              </div>
            </div>
          )}
          {(signaturePos || (!placingSignature && !signaturePos && clientSignature)) && (clientSignature || bid.client_signature) && (
            <div style={{
              position: 'absolute',
              left: signaturePos?.x || 400,
              top: signaturePos?.y || 50,
              color: '#9633eb',
              fontWeight: 700,
              pointerEvents: 'none',
              background: 'rgba(255,255,255,0.85)',
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: 18,
              boxShadow: '0 1px 4px rgba(150,51,235,0.08)'
            }}>
              {clientSignature || bid.client_signature}
            </div>
          )}
          {bid.business_signature && (
            <div style={{
              position: 'absolute',
              left: 50,
              top: 550,
              color: '#388e3c',
              fontWeight: 700,
              pointerEvents: 'none',
              background: 'rgba(255,255,255,0.85)',
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: 18,
              boxShadow: '0 1px 4px rgba(56,142,60,0.08)'
            }}>
              {`Business: ${bid.business_signature}`}
            </div>
          )}
        </div>
        {!clientSigned && (
          <div style={{ marginTop: 16, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Type your name to sign"
              value={clientSignature}
              onChange={e => setClientSignature(e.target.value)}
              disabled={clientSigning}
              style={{ marginBottom: 12, padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', fontSize: 16, width: '80%', maxWidth: 320, background: clientSigning ? '#f3f3f3' : '#fff', transition: 'background 0.2s' }}
            />
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <button
                onClick={() => {
                  if (!clientSignature) return;
                  if (typeof setSignaturePos === 'function') setSignaturePos(null);
                  if (typeof setPlacingSignature === 'function') setPlacingSignature(true);
                }}
                disabled={!clientSignature}
                style={{ background: '#fff', color: '#9633eb', border: '1.5px solid #9633eb', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: !clientSignature ? 'not-allowed' : 'pointer', transition: 'background 0.2s, color 0.2s' }}
              >
                Move Signature
              </button>
              <button
                onClick={handleClientSignContract}
                disabled={clientSigning || !clientSignature}
                style={{ background: clientSigning ? '#e0e0e0' : '#9633eb', color: clientSigning ? '#888' : '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: clientSigning || !clientSignature ? 'not-allowed' : 'pointer', transition: 'background 0.2s, color 0.2s' }}
              >
                {clientSigning ? "Signing..." : "Sign Contract"}
              </button>
            </div>
            {placingSignature && (
              <div style={{ color: '#9633eb', fontWeight: 500, marginBottom: 8 }}>
                Click anywhere on the document to place your signature.
              </div>
            )}
            {clientSignError && <div style={{ color: '#d32f2f', marginTop: 4, fontWeight: 500 }}>{clientSignError}</div>}
          </div>
        )}
        {clientSigned && (
          <div style={{ marginTop: 8, color: '#388e3c', fontWeight: 700, fontSize: 18 }}>
            Signed by you: <b>{bid.client_signature || clientSignature}</b>
          </div>
        )}
        {bid.business_signature && (bid.client_signature || clientSigned) && (
          <button style={{ marginTop: 24, background: '#9633eb', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(150,51,235,0.08)' }} onClick={handleDownloadSignedPdf}>
            Download Signed Contract (PDF)
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export default ContractSignatureModal;
