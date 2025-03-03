import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({});
  const [isBusiness, setIsBusiness] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentEmail, setCurrentEmail] = useState(""); // For preloading email
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [portfolioPic, setPortfolioPic] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const profileFileInputRef = useRef(null);

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
        let profileDetails;
        if (profile.role === "business") {
          const { data: businessProfile, error: businessError } = await supabase
            .from("business_profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (businessError) throw businessError;

          profileDetails = businessProfile;
          setIsBusiness(true);
        } else if (profile.role === "individual") {
          const { data: individualProfile, error: individualError } = await supabase
            .from("individual_profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (individualError) throw individualError;

          profileDetails = individualProfile;
          setIsBusiness(false);
        }

        setProfileData({ ...profileDetails, email: user.email });

        // Now that we have the user ID, fetch profile images
        await fetchProfileImages(user.id);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setErrorMessage("Failed to load profile data.");
        setLoading(false);
      }
    };

    // Fetch profile and portfolio images from Supabase
    const fetchProfileImages = async (userId) => {
        try {
            const { data, error } = await supabase
                .from("profile_photos")
                .select("photo_url, photo_type")
                .eq("user_id", userId);

            if (error) throw error;

            // Filter out profile and portfolio images
            const profileImage = data.find(photo => photo.photo_type === "profile");
            const portfolioImages = data.filter(photo => photo.photo_type === "portfolio");

            if (profileImage) setProfilePic(profileImage.photo_url);
            if (portfolioImages.length > 0) setPortfolioPic(portfolioImages.map(img => img.photo_url));
        } catch (err) {
            console.error("Error fetching profile images:", err);
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

  const handleFileChange = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    if (type === "profile") {
        setProfilePic(URL.createObjectURL(file)); // Show preview immediately
    } else {
        setPortfolioPic([...portfolioPic, URL.createObjectURL(file)]);
    }

    // 🔹 Pass the actual file to `handleUpload`
    await handleUpload(file, type);
};

const handleUpload = async (file, type) => {
  if (!file) {
      setUploadError(`Please select a ${type} picture first.`);
      return;
  }

  type === "profile" ? setUploadingProfile(true) : setUploadingPortfolio(true);
  setUploadError(null);
  setUploadSuccess(null);

  try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      const userId = user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      if (type === "profile") {
          // 🔹 1. Fetch the old profile picture file path
          const { data: existingProfilePic, error: fetchError } = await supabase
              .from("profile_photos")
              .select("file_path")
              .eq("user_id", userId)
              .eq("photo_type", "profile")
              .single();

          if (fetchError && fetchError.code !== "PGRST116") { // Ignore "no rows found" error
              throw fetchError;
          }

          if (existingProfilePic) {
              // 🔹 2. Delete the old profile picture from Supabase Storage
              const { error: deleteError } = await supabase.storage
                  .from("profile-photos")
                  .remove([existingProfilePic.file_path]);

              if (deleteError) {
                  console.error("Error deleting old profile picture:", deleteError);
              }

              // 🔹 3. Delete the old entry from the database
              await supabase
                  .from("profile_photos")
                  .delete()
                  .eq("user_id", userId)
                  .eq("photo_type", "profile");
          }
      }

      // 🔹 4. Upload new profile picture
      const { error: uploadError } = await supabase
          .storage
          .from('profile-photos')
          .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 🔹 5. Get public URL of new profile picture
      const { data } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);

      const photoUrl = data.publicUrl;

      // 🔹 6. Save new profile picture in the database
      const { error: dbError } = await supabase
          .from('profile_photos')
          .insert([
              {
                  user_id: userId,
                  photo_url: photoUrl,
                  file_path: filePath,
                  photo_type: type
              }
          ]);

      if (dbError) throw dbError;

      setUploadSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} picture uploaded successfully!`);
      if (type === "profile") setProfilePic(photoUrl); // Update UI immediately
  } catch (error) {
      console.error(error);
      setUploadError(`Failed to upload ${type} picture. Please try again.`);
  } finally {
      type === "profile" ? setUploadingProfile(false) : setUploadingPortfolio(false);
  }
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

          {/* Profile Picture Section */}
          <div className="profile-picture-container">
            <label>Profile Picture</label>
            <div className="profile-pic-wrapper">
                  <img 
                      src={profilePic || "/default-profile.png"} // Default image if no profile pic
                      alt="Profile"
                      className="profile-pic"
                  />
                  <input 
                      type="file" 
                      accept="image/*" 
                      ref={profileFileInputRef} 
                      style={{ display: "none" }} 
                      onChange={(e) => handleFileChange(e, "profile")}
                  />
                  <button 
                      className="edit-profile-button" 
                      onClick={() => profileFileInputRef.current.click()}
                  >
                      Edit Profile Picture
                  </button>
              </div>
          </div>

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
          {/* Portfolio Images Display */}
          <div className="portfolio-container">
              <p>Portfolio Images</p>
              <div className="portfolio-images">
                  {portfolioPic && portfolioPic.length > 0 ? (
                      portfolioPic.map((img, index) => (
                          <img key={index} src={img} alt={`Portfolio ${index}`} className="portfolio-image" />
                      ))
                  ) : (
                      <img src="/default-portfolio.png" alt="Default Portfolio" className="portfolio-image" />
                  )}
              </div>
              <input 
                  type="file" 
                  id="portfolioPicInput" 
                  accept="image/*" 
                  style={{ display: "none" }} 
                  onChange={(e) => handleFileChange(e, "portfolio")}
              />
              <button 
                  className="edit-profile-button"
                  onClick={() => document.getElementById("portfolioPicInput").click()}
              >
                  Add Portfolio Image
              </button>
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

      {/* Display upload messages */}
  {uploadError && <p className="text-danger">{uploadError}</p>}
  {uploadSuccess && <p className="text-success">{uploadSuccess}</p>}


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