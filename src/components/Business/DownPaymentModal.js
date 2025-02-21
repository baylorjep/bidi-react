import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { supabase } from "../../supabaseClient";

const DownPaymentModal = ({ showModal, setShowModal, userId }) => {
  const [paymentType, setPaymentType] = useState(""); // "percentage" or "flat fee"
  const [percentage, setPercentage] = useState("");
  const [number, setNumber] = useState("");

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    setPercentage(""); // Reset fields when switching
    setNumber("");
  };

  const handleChangePercentage = (e) => {
    let value = e.target.value;
    if (value >= 0 && value <= 100) {
      setPercentage(value);
    }
  };

  const handleChangeNumber = (e) => {
    setNumber(e.target.value);
  };

  const handleDownPaymentSubmit = async () => {
    if (!userId) {
      alert("User not found. Please log in again.");
      return;
    }

    if (!paymentType) {
      alert("Please select a down payment type.");
      return;
    }

    let downPaymentAmount = paymentType === "percentage" ? parseFloat(percentage) / 100 : parseFloat(number);

    if (!downPaymentAmount || downPaymentAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const { data, error } = await supabase
      .from("business_profiles")
      .update({
        down_payment_type: paymentType,
        amount: downPaymentAmount,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating down payment:", error);
      alert("An error occurred while updating your down payment details.");
    } else {
      setShowModal(false); // Close modal on successful update
    }
  };

  return (
    <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="text-center">Enter What You Charge For a Down Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ textAlign: "center", marginBottom: "20px", wordBreak: "break-word" }}>
          Do you charge a percentage or a flat fee upfront?
        </div>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
          <button className={`btn-${paymentType === "percentage" ? "secondary" : "primary"}`} onClick={() => handlePaymentTypeChange("percentage")}>
            Percentage
          </button>
          <button className={`btn-${paymentType === "flat fee" ? "secondary" : "primary"}`} onClick={() => handlePaymentTypeChange("flat fee")}>
            Flat Fee
          </button>
        </div>

        {paymentType === "percentage" && (
          <input type="number" value={percentage} onChange={handleChangePercentage} placeholder="Enter Percentage" className="form-control" min="0" max="100" />
        )}

        {paymentType === "flat fee" && (
          <input type="number" value={number} onChange={handleChangeNumber} placeholder="Enter Flat Fee" className="form-control" />
        )}
      </Modal.Body>

      <Modal.Footer>
        <div style={{ display: "flex", flexDirection: "row", gap: "20px", justifyContent: "center" }}>
          <button className="btn-primary" onClick={() => setShowModal(false)}>
            Close
          </button>
          <button className="btn-secondary" onClick={handleDownPaymentSubmit}>
            Submit
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default DownPaymentModal;