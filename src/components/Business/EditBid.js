import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SlidingBidModal from "../Request/SlidingBidModal";

const EditBid = () => {
  const { bidId, requestId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Close modal and navigate back
  const handleClose = () => {
    setIsModalOpen(false);
    navigate('/business-dashboard/bids');
  };

  // If user navigates directly to this route, ensure modal opens
  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  return (
    <SlidingBidModal
      isOpen={isModalOpen}
      onClose={handleClose}
      requestId={requestId}
      editMode={true}
      bidId={bidId}
    />
  );
};

export default EditBid;