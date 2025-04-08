import React from "react";
import { Modal } from "react-bootstrap";

const WithdrawConfirmationModal = ({ show, onClose, onConfirm }) => {
  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="text-center">
          Are you sure you want to withdraw your bid?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
            wordBreak: "break-word",
          }}
        >
          Withdrawing your bid cannot be undone.
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "20px",
            justifyContent: "center",
          }}
        >
          <button
            style={{ maxHeight: "32px" }}
            className="btn-danger"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{ maxHeight: "32px" }}
            className="btn-success"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default WithdrawConfirmationModal;
