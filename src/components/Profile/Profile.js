import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({});
  const [isBusiness, setIsBusiness] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentEmail, setCurrentEmail] = useState(""); // For preloading email
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        setCurrentEmail(user.email); // Preload current email

        // Fetch from profiles table to determine role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profileError) throw profileError;

        // Fetch data from the respective table
        if (profile.role === "business") {
          const { data: businessProfile, error: businessError } = await supabase
            .from("business_profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (businessError) throw businessError;

          setProfileData({ ...businessProfile, email: user.email }); // Merge email into profile data
          setIsBusiness(true);
        } else if (profile.role === "individual") {
          const { data: individualProfile, error: individualError } = await supabase
            .from("individual_profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (individualError) throw individualError;

          setProfileData({ ...individualProfile, email: user.email }); // Merge email into profile data
          setIsBusiness(false);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setErrorMessage("Failed to load profile data.");
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { email, ...restProfileData } = profileData;

      // Update email in supabase.auth if it has changed
      if (email !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        setCurrentEmail(email); // Update current email after successful change

        // Update email in the profiles table
        const { error: profilesError } = await supabase
        .from("profiles")
        .update({ email })
        .eq("id", profileData.id);

        if (profilesError) throw profilesError;
      }

      // Update other profile data
      const tableName = isBusiness ? "business_profiles" : "individual_profiles";

      const { error: updateError } = await supabase
        .from(tableName)
        .update(restProfileData)
        .eq("id", profileData.id);

      if (updateError) throw updateError;

      setSuccessMessage("Profile updated successfully!");

       // Automatically clear the success message after 5 seconds
        setTimeout(() => {
            setSuccessMessage("");
        }, 5000);

      setLoading(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile.");

      // Automatically clear the error message after 5 seconds
    setTimeout(() => {
        setErrorMessage("");
      }, 5000);

      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div classname="profile-form-overall-container">
    <div className="profile-form-container-details">
      <h1>
        {isBusiness ? profileData.business_name : `${profileData.first_name} ${profileData.last_name}`}
      </h1>
      {errorMessage && <p className="text-danger">{errorMessage}</p>}
      {successMessage && <p className="text-success">{successMessage}</p>}

      <div className="form-group mt-4">
        <label>Email</label>
        <input
          type="email"
          className="form-control"
          name="email"
          value={profileData.email || ""}
          onChange={handleInputChange}
        />
      </div>

      {isBusiness ? (
        <>
          <div className="form-group mt-3">
            <label>Business Name</label>
            <input
              type="text"
              className="form-control"
              name="business_name"
              value={profileData.business_name || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group mt-3">
            <label>Business Category</label>
            <input
              type="text"
              className="form-control"
              name="business_category"
              value={profileData.business_category || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group mt-3">
            <label>Business Address</label>
            <input
              type="text"
              className="form-control"
              name="business_address"
              value={profileData.business_address || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group mt-3">
            <label>Phone</label>
            <input
              type="text"
              className="form-control"
              name="phone"
              value={profileData.phone || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group mt-3">
            <label>Website</label>
            <input
              type="text"
              className="form-control"
              name="website"
              value={profileData.website || ""}
              onChange={handleInputChange}
            />
          </div>
        </>
      ) : (
        <>
          <div className="form-group mt-3">
            <label>First Name</label>
            <input
              type="text"
              className="form-control"
              name="first_name"
              value={profileData.first_name || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group mt-3">
            <label>Last Name</label>
            <input
              type="text"
              className="form-control"
              name="last_name"
              value={profileData.last_name || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group mt-3">
            <label>Phone</label>
            <input
              type="text"
              className="form-control"
              name="phone"
              value={profileData.phone || ""}
              onChange={handleInputChange}
            />
          </div>
        </>
      )}

      <button
        className="btn btn-secondary mt-4"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
      <button
          className="btn btn-secondary mt-3"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
    </div>
    </div>
  );
};

export default ProfilePage;