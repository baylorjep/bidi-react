import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { v4 as uuidv4 } from 'uuid';
import "../../../styles/EditProfileModal.css";
import { convertToWebP } from "../../../utils/imageUtils";
import Cropper from 'react-easy-crop';

const EditProfileModal = ({ isOpen, onClose, businessId, initialData }) => {
  const [formData, setFormData] = useState(initialData || {}); // Store editable fields
  const [portfolioPics, setPortfolioPics] = useState([]);
  const [portfolioVideos, setPortfolioVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const profileFileInputRef = useRef(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [mediaOrder, setMediaOrder] = useState([]);
  const [touchStartY, setTouchStartY] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragFeedback, setDragFeedback] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {}); // Reset form when modal opens
      if (initialData.portfolio) {
        fetchPortfolioImages();
        fetchPortfolioVideos();
      }
      fetchProfilePicture(); // Fetch the current profile picture
    }
  }, [isOpen, initialData]);

  // 🔹 Fetch portfolio images if needed
  const fetchPortfolioImages = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url, display_order, photo_type")
        .eq("user_id", businessId)
        .or("photo_type.eq.portfolio,photo_type.eq.video")
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      const videos = [];
      const images = [];
      const order = [];
      
      data.forEach(item => {
        if (item.photo_type === 'video') {
          videos.push(item.photo_url);
        } else {
          images.push(item.photo_url);
        }
        order.push(item.photo_url);
      });
      
      setPortfolioVideos(videos);
      setPortfolioPics(images);
      setMediaOrder(order);
    } catch (err) {
      console.error("Error fetching portfolio media:", err);
    }
  };

  const fetchPortfolioVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "video");

      if (error) throw error;
      setPortfolioVideos(data.map(vid => vid.photo_url));
    } catch (err) {
      console.error("Error fetching portfolio videos:", err);
    }
  };

  // 🔹 Fetch the current profile picture
  const fetchProfilePicture = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "profile")
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No data found
          setProfilePic("/images/default.jpg");
          return;
        }
        throw error;
      }
      setProfilePic(data?.photo_url || "/images/default.jpg");
    } catch (err) {
      console.error("Error fetching profile picture:", err);
      setProfilePic("/images/default.jpg"); // Set default if error occurs
    }
  };

  // 🔹 Handle input changes dynamically
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Handle saving data back to Supabase
  const handleSave = async () => {
    try {
      // Create a copy of formData and remove UI-only fields
      const updatedData = { ...formData };
      delete updatedData.portfolio; // Remove portfolio field if it exists
      delete updatedData.profile_picture; // Remove profile_picture flag
      delete updatedData.currentSection; // Remove currentSection field

      // Only proceed if there are actual business profile fields to update
      if (Object.keys(updatedData).length > 0) {
        const { error } = await supabase
          .from("business_profiles")
          .update(updatedData)
          .eq("id", businessId);
          
        if (error) throw error;
      }
      onClose(); // Close modal after successful save
    } catch (error) {
      console.error("Error updating business data:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  // Add a function to check file type
  const isValidFileType = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime'];
    return validTypes.includes(file.type);
  };

  // Update handleFileChange to check file types
  const handleFileChange = async (e) => {
    console.log('Starting file upload process...');
    const files = Array.from(e.target.files);
    console.log('Files selected:', files);
    
    // Filter out HEIC files and warn user
    const invalidFiles = files.filter(file => !isValidFileType(file));
    if (invalidFiles.length > 0) {
      console.log('Invalid files found:', invalidFiles);
      alert('Only JPG, PNG, and MP4 files are supported. HEIC files are not accepted.');
      e.target.value = ''; // Clear the file input
      return;
    }

    setUploading(true);

    for (const file of files) {
      console.log('Processing file:', file.name);
      const fileType = file.type.startsWith('video/') ? 'video' : 'portfolio';
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${businessId}/${fileName}`;
      console.log('File path:', filePath);

      try {
        // Initialize progress for this file
        setUploadProgress(prev => ({
          ...prev,
          [fileName]: 0
        }));

        let fileToUpload = file;
        
        // Convert image to WebP if it's not a video
        if (fileType === 'portfolio') {
          console.log('Converting image to WebP...');
          try {
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create an image element
            const img = new Image();
            img.src = URL.createObjectURL(file);
            
            // Wait for image to load
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            
            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert to WebP
            const webpBlob = await new Promise((resolve) => {
              canvas.toBlob((blob) => {
                resolve(blob);
              }, 'image/webp', 0.8);
            });
            
            fileToUpload = webpBlob;
            console.log('WebP conversion successful');
            
            // Clean up
            URL.revokeObjectURL(img.src);
          } catch (error) {
            console.error('Error converting to WebP:', error);
            // If conversion fails, upload original file
            fileToUpload = file;
            console.log('Falling back to original file');
          }
        }

        console.log('Uploading file to storage...');
        // Upload file to storage with progress tracking
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              const percentCompleted = Math.round((progress.loaded * 100) / progress.total);
              setUploadProgress(prev => ({
                ...prev,
                [fileName]: percentCompleted
              }));
            }
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
        console.log('File uploaded successfully');

        // Get public URL
        console.log('Getting public URL...');
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);
        console.log('Public URL:', publicUrl);

        // Save to database with order
        const { error: insertError } = await supabase
          .from('profile_photos')
          .insert({
            user_id: businessId,
            photo_url: publicUrl,
            photo_type: fileType,
            file_path: filePath,
            display_order: mediaOrder.length
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
          throw new Error(`Failed to save file info: ${insertError.message}`);
        }
        console.log('Database entry created successfully');

        // Update local order state
        setMediaOrder(prev => [...prev, publicUrl]);

        // Set progress to 100% when complete
        setUploadProgress(prev => ({
          ...prev,
          [fileName]: 100
        }));

        // Remove progress after a short delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileName];
            return newProgress;
          });
        }, 1000);

      } catch (error) {
        console.error('Error in upload process:', error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
        
        // Remove progress bar on error
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileName];
          return newProgress;
        });
      }
    }

    setUploading(false);
    console.log('Upload process completed');
    fetchPortfolioImages();
    fetchPortfolioVideos();
  };

  const handleUpload = async (file, type) => {
    if (!file) {
      alert(`Please select a ${type} picture first.`);
      return null;
    }

    type === "profile" ? setUploadingProfile(true) : setUploading(true);

    try {
      // Convert image to WebP if it's not already
      let processedFile = file;
      if (file.type.startsWith('image/') && !file.type.includes('webp')) {
        const webpUrl = await convertToWebP(URL.createObjectURL(file));
        const response = await fetch(webpUrl);
        processedFile = await response.blob();
      }

      const fileExt = 'webp'; // Always use webp extension
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${businessId}/${fileName}`;

      // Upload new picture
      const { error: uploadError } = await supabase
        .storage
        .from('profile-photos')
        .upload(filePath, processedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL of the uploaded image
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const photoUrl = data.publicUrl;

      // Check if a profile picture already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profile_photos')
        .select("id")
        .eq("user_id", businessId)
        .eq("photo_type", type)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If a profile picture exists, update it, otherwise insert a new one
      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profile_photos')
          .update({ photo_url: photoUrl, file_path: filePath })
          .eq("id", existingProfile.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('profile_photos')
          .insert([
            {
              user_id: businessId,
              photo_url: photoUrl,
              file_path: filePath,
              photo_type: type
            }
          ]);

        if (insertError) throw insertError;
      }

      return photoUrl;
    } catch (error) {
      console.error(error);
      alert(`Failed to upload ${type} picture. Please try again.`);
      return null;
    } finally {
      type === "profile" ? setUploadingProfile(false) : setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaUrl, type) => {
    try {
      const filePath = mediaUrl.split("/profile-photos/")[1];
      console.log('Deleting media:', { mediaUrl, filePath, type });

      // Delete from storage
      const { error: deleteStorageError } = await supabase.storage
        .from("profile-photos")
        .remove([filePath]);

      if (deleteStorageError) {
        console.error('Storage deletion error:', deleteStorageError);
        throw deleteStorageError;
      }
      console.log('Successfully deleted from storage');

      // Delete from database
      const { error: deleteDbError } = await supabase
        .from("profile_photos")
        .delete()
        .eq("user_id", businessId)
        .eq("photo_url", mediaUrl)
        .eq("photo_type", type);

      if (deleteDbError) {
        console.error('Database deletion error:', deleteDbError);
        throw deleteDbError;
      }
      console.log('Successfully deleted from database');

      // Immediately update UI
      if (type === 'video') {
        setPortfolioVideos(prev => prev.filter(vid => vid !== mediaUrl));
      } else {
        setPortfolioPics(prev => prev.filter(img => img !== mediaUrl));
      }

      // Update media order
      setMediaOrder(prev => prev.filter(url => url !== mediaUrl));

      // Update display order for remaining items
      const { data: remainingMedia } = await supabase
        .from("profile_photos")
        .select("photo_url, display_order")
        .eq("user_id", businessId)
        .or("photo_type.eq.portfolio,photo_type.eq.video")
        .order("display_order", { ascending: true });

      if (remainingMedia) {
        console.log('Updating display order for remaining items:', remainingMedia);
        // Update display order for all remaining items
        const updates = remainingMedia.map((media, index) => 
          supabase
            .from("profile_photos")
            .update({ display_order: index })
            .eq("user_id", businessId)
            .eq("photo_url", media.photo_url)
        );

        await Promise.all(updates);
        console.log('Successfully updated display order');
      }

    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}. Please try again.`);
    }
  };

  const handleSpecializationAdd = () => {
    if (newSpecialization.trim() !== "") {
      setFormData({
        ...formData,
        specializations: [...(formData.specializations || []), newSpecialization.trim()]
      });
      setNewSpecialization("");
    }
  };

  const handleSpecializationRemove = (indexToRemove) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((_, index) => index !== indexToRemove)
    });
  };

  // Add this function to create a cropped image
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas size to desired dimensions
      canvas.width = 400;
      canvas.height = 400;

      // Calculate scaling factors based on the original image and crop area
      const scaleX = image.width / pixelCrop.width;
      const scaleY = image.height / pixelCrop.height;
      const scale = Math.min(scaleX, scaleY);

      // Calculate the actual crop dimensions in the original image
      const cropWidth = pixelCrop.width * scale;
      const cropHeight = pixelCrop.height * scale;

      // Calculate the actual crop position in the original image
      const cropX = pixelCrop.x * scale;
      const cropY = pixelCrop.y * scale;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the cropped portion of the image
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert to JPEG first
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.95
        );
      });
    } catch (error) {
      console.error('Error in getCroppedImg:', error);
      throw error;
    }
  };

  // Modify handleProfilePicChange to show cropper
  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidFileType(file)) {
      alert('Only JPG and PNG files are supported. HEIC files are not accepted.');
      e.target.value = '';
      return;
    }

    // Create temporary URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setTempImageUrl(imageUrl);
    setIsCropping(true);
  };

  // Add function to handle crop complete
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Modify handleResizeProfilePic to remove zoom calculations
  const handleResizeProfilePic = async () => {
    try {
      if (!profilePic || profilePic === "/images/default.jpg") {
        alert("No profile picture to resize");
        return;
      }

      // Create a temporary URL for the cropper
      const response = await fetch(profilePic);
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setTempImageUrl(imageUrl);
      setIsResizing(true);
      setIsCropping(true);
    } catch (error) {
      console.error("Error preparing image for resize:", error);
      alert("Failed to prepare image for resizing. Please try again.");
    }
  };

  // Modify handleCropConfirm to handle both new uploads and resizing
  const handleCropConfirm = async () => {
    try {
      setUploadingProfile(true);
      
      if (!croppedAreaPixels) {
        throw new Error('No crop area selected');
      }

      // Ensure crop area is valid
      if (croppedAreaPixels.width <= 0 || croppedAreaPixels.height <= 0) {
        throw new Error('Invalid crop area');
      }

      // Get the cropped image as JPEG
      const croppedImage = await getCroppedImg(tempImageUrl, croppedAreaPixels);
      
      // Create a new canvas for final processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Create an image from the cropped blob
      const img = new Image();
      const imgUrl = URL.createObjectURL(croppedImage);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgUrl;
      });
      
      // Set canvas dimensions
      canvas.width = 400;
      canvas.height = 400;
      
      // Clear and draw the image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Try to convert to WebP, but fall back to JPEG if needed
      let finalBlob;
      try {
        finalBlob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert to WebP'));
                return;
              }
              resolve(blob);
            },
            'image/webp',
            0.90
          );
        });
      } catch (error) {
        console.log('WebP conversion failed, using JPEG instead');
        finalBlob = croppedImage;
      }

      const fileExt = finalBlob.type === 'image/webp' ? 'webp' : 'jpg';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${businessId}/${fileName}`;

      // Upload the final image
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, finalBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const photoUrl = data.publicUrl;

      // Update or insert in profile_photos table
      const { data: existingProfile } = await supabase
        .from('profile_photos')
        .select("id")
        .eq("user_id", businessId)
        .eq("photo_type", "profile")
        .single();

      if (existingProfile) {
        // Delete old file if resizing
        if (isResizing) {
          const oldFilePath = profilePic.split("/profile-photos/")[1];
          await supabase.storage
            .from('profile-photos')
            .remove([oldFilePath]);
        }

        await supabase
          .from('profile_photos')
          .update({ photo_url: photoUrl, file_path: filePath })
          .eq("id", existingProfile.id);
      } else {
        await supabase
          .from('profile_photos')
          .insert([
            {
              user_id: businessId,
              photo_url: photoUrl,
              file_path: filePath,
              photo_type: "profile"
            }
          ]);
      }

      setProfilePic(photoUrl);
      setIsCropping(false);
      setIsResizing(false);
      URL.revokeObjectURL(tempImageUrl);
      URL.revokeObjectURL(imgUrl);
      setTempImageUrl(null);
    } catch (error) {
      console.error("Error processing profile picture:", error);
      alert("Failed to update profile picture. Please try again.");
    } finally {
      setUploadingProfile(false);
    }
  };

  // Modify handleCropCancel to handle resizing state
  const handleCropCancel = () => {
    setIsCropping(false);
    setIsResizing(false);
    URL.revokeObjectURL(tempImageUrl);
    setTempImageUrl(null);
  };

  const handleRemoveProfilePic = async () => {
    try {
      // Get the current profile photo record
      const { data, error: fetchError } = await supabase
        .from('profile_photos')
        .select('file_path')
        .eq('user_id', businessId)
        .eq('photo_type', 'profile')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (data) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('profile-photos')
          .remove([data.file_path]);

        if (storageError) throw storageError;

        // Delete from database
        const { error: dbError } = await supabase
          .from('profile_photos')
          .delete()
          .eq('user_id', businessId)
          .eq('photo_type', 'profile');

        if (dbError) throw dbError;
      }

      // Reset profile pic to default
      setProfilePic("/images/default.jpg");
    } catch (error) {
      console.error("Error removing profile picture:", error);
      alert("Failed to remove profile picture. Please try again.");
    }
  };

  const ProgressBar = ({ progress }) => (
    <div className="upload-progress">
      <div 
        className="progress-bar" 
        style={{ 
          width: `${progress}%`,
          transition: 'width 0.3s ease-in-out'
        }}
      ></div>
      <span>{progress}%</span>
    </div>
  );

  // Add this function to handle reordering
  const handleReorder = async (draggedUrl, droppedUrl) => {
    try {
      // Get current order
      const { data: currentMedia } = await supabase
        .from("profile_photos")
        .select("photo_url, display_order")
        .eq("user_id", businessId)
        .or("photo_type.eq.portfolio,photo_type.eq.video")
        .order("display_order", { ascending: true });

      if (!currentMedia) return;

      // Create new order array
      const newOrder = [...mediaOrder];
      const draggedIndex = newOrder.indexOf(draggedUrl);
      const droppedIndex = newOrder.indexOf(droppedUrl);
      
      // Remove dragged item and insert at new position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(droppedIndex, 0, draggedUrl);
      
      // Update display_order in database
      const updates = newOrder.map((url, index) => {
        const media = currentMedia.find(m => m.photo_url === url);
        if (media) {
          return supabase
            .from("profile_photos")
            .update({ display_order: index })
            .eq("user_id", businessId)
            .eq("photo_url", url);
        }
        return Promise.resolve();
      });

      await Promise.all(updates);
      setMediaOrder(newOrder);
    } catch (error) {
      console.error("Error reordering media:", error);
      alert("Failed to reorder media. Please try again.");
    }
  };

  // Update the touch event handlers to allow scrolling when not dragging
  const handleTouchStart = (e, url) => {
    // Only start drag if touching the drag handle
    if (!e.target.closest('.drag-handle')) {
      return; // Allow default scrolling behavior
    }
    
    const touch = e.touches[0];
    const element = e.currentTarget;
    
    setTouchStartY(touch.clientY);
    setDraggedElement(element);
    element.classList.add('dragging');
    
    // Store the original URL and position
    element.dataset.originalUrl = url;
    element.dataset.initialY = element.getBoundingClientRect().top;
    
    // Add feedback element
    setDragFeedback('Hold and drag to reorder');
    
    // Only prevent default when actually dragging
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (!draggedElement) {
      return; // Allow default scrolling behavior
    }
    
    const touch = e.touches[0];
    const elements = Array.from(document.querySelectorAll('.image-container:not(.dragging)'));
    
    // Calculate drag distance
    const deltaY = touch.clientY - touchStartY;
    draggedElement.style.transform = `translateY(${deltaY}px)`;
    
    // Remove existing drag-over states
    elements.forEach(el => {
      el.classList.remove('drag-over-above', 'drag-over-below');
    });
    
    // Find the element we're dragging over
    let closestElement = null;
    let closestDistance = Infinity;
    let isAbove = false;

    elements.forEach(el => {
      const box = el.getBoundingClientRect();
      const distance = Math.abs(touch.clientY - (box.top + box.height / 2));
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = el;
        isAbove = touch.clientY < box.top + box.height / 2;
      }
    });
    
    if (closestElement) {
      if (isAbove) {
        closestElement.classList.add('drag-over-above');
        setDragFeedback('Release to place before');
      } else {
        closestElement.classList.add('drag-over-below');
        setDragFeedback('Release to place after');
      }
    }
    
    // Only prevent default when actually dragging
    e.preventDefault();
  };

  const handleTouchEnd = async (e) => {
    if (!draggedElement) return;
    
    const dropTarget = document.querySelector('.drag-over-above, .drag-over-below');
    
    if (dropTarget) {
      const draggedUrl = draggedElement.dataset.originalUrl;
      const droppedUrl = dropTarget.querySelector('img, video').src;
      const dropAbove = dropTarget.classList.contains('drag-over-above');
      
      // Update the order based on drop position
      const newOrder = [...mediaOrder];
      const draggedIndex = newOrder.indexOf(draggedUrl);
      let droppedIndex = newOrder.indexOf(droppedUrl);
      
      if (!dropAbove) droppedIndex += 1;
      
      // Remove dragged item and insert at new position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(droppedIndex, 0, draggedUrl);
      
      // Update state immediately for smooth UI
      setMediaOrder(newOrder);
      
      try {
        // Get current order from database
        const { data: currentMedia } = await supabase
          .from("profile_photos")
          .select("photo_url, display_order")
          .eq("user_id", businessId)
          .or("photo_type.eq.portfolio,photo_type.eq.video")
          .order("display_order", { ascending: true });

        if (currentMedia) {
          // Update display_order in database
          const updates = newOrder.map((url, index) => 
            supabase
              .from("profile_photos")
              .update({ display_order: index })
              .eq("user_id", businessId)
              .eq("photo_url", url)
          );

          await Promise.all(updates);
        }
      } catch (error) {
        console.error("Error updating order:", error);
        // Revert to previous order if update fails
        setMediaOrder(mediaOrder);
      }
    }
    
    // Reset styles and states
    draggedElement.style.transform = '';
    draggedElement.classList.remove('dragging');
    document.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
      el.classList.remove('drag-over-above', 'drag-over-below');
    });
    
    setDraggedElement(null);
    setTouchStartY(null);
    setDragFeedback(null);
  };

  const handleMouseDown = (e, url) => {
    if (!e.target.closest('.drag-handle')) return;
    
    const element = e.currentTarget;
    setDraggedElement(element);
    element.classList.add('dragging');
    element.dataset.originalUrl = url;
    element.dataset.initialX = element.getBoundingClientRect().left;
    element.dataset.initialY = element.getBoundingClientRect().top;
    setDragFeedback('Drag to reorder');
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!draggedElement) return;
    
    const elements = Array.from(document.querySelectorAll('.image-container:not(.dragging)'));
    const deltaX = e.clientX - draggedElement.getBoundingClientRect().left;
    const deltaY = e.clientY - draggedElement.getBoundingClientRect().top;
    draggedElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    elements.forEach(el => el.classList.remove('drag-over-above', 'drag-over-below', 'drag-over-left', 'drag-over-right'));
    
    let closestElement = null;
    let closestDistance = Infinity;
    let position = '';

    elements.forEach(el => {
      const box = el.getBoundingClientRect();
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      const distanceX = Math.abs(e.clientX - centerX);
      const distanceY = Math.abs(e.clientY - centerY);
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = el;
        
        // Determine position relative to the closest element
        if (distanceX > distanceY) {
          position = e.clientX < centerX ? 'left' : 'right';
        } else {
          position = e.clientY < centerY ? 'above' : 'below';
        }
      }
    });
    
    if (closestElement) {
      closestElement.classList.add(`drag-over-${position}`);
      setDragFeedback(`Release to place ${position}`);
    }
  };

  const handleMouseUp = async (e) => {
    if (!draggedElement) return;
    
    const dropTarget = document.querySelector('.drag-over-above, .drag-over-below, .drag-over-left, .drag-over-right');
    if (dropTarget) {
      const draggedUrl = draggedElement.dataset.originalUrl;
      const droppedUrl = dropTarget.querySelector('img, video').src;
      const position = dropTarget.classList.contains('drag-over-above') ? 'above' :
                      dropTarget.classList.contains('drag-over-below') ? 'below' :
                      dropTarget.classList.contains('drag-over-left') ? 'left' : 'right';
      
      const newOrder = [...mediaOrder];
      const draggedIndex = newOrder.indexOf(draggedUrl);
      let droppedIndex = newOrder.indexOf(droppedUrl);
      
      // Adjust dropped index based on position
      if (position === 'below' || position === 'right') {
        droppedIndex += 1;
      }
      
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(droppedIndex, 0, draggedUrl);
      setMediaOrder(newOrder);
      
      try {
        const { data: currentMedia } = await supabase
          .from("profile_photos")
          .select("photo_url, display_order")
          .eq("user_id", businessId)
          .or("photo_type.eq.portfolio,photo_type.eq.video")
          .order("display_order", { ascending: true });

        if (currentMedia) {
          const updates = newOrder.map((url, index) => 
            supabase
              .from("profile_photos")
              .update({ display_order: index })
              .eq("user_id", businessId)
              .eq("photo_url", url)
          );
          await Promise.all(updates);
        }
      } catch (error) {
        console.error("Error updating order:", error);
        setMediaOrder(mediaOrder);
      }
    }
    
    draggedElement.style.transform = '';
    draggedElement.classList.remove('dragging');
    document.querySelectorAll('.drag-over-above, .drag-over-below, .drag-over-left, .drag-over-right').forEach(el => {
      el.classList.remove('drag-over-above', 'drag-over-below', 'drag-over-left', 'drag-over-right');
    });
    
    setDraggedElement(null);
    setDragFeedback(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    isOpen && (
      <div className="edit-portfolio-modal">
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Dynamic header based on section */}
            <h2>
              {(() => {
                switch (initialData.currentSection) {
                  case 'portfolio':
                    return 'Edit Portfolio';
                  case 'business_info':
                    return 'Edit Business Information';
                  case 'business_details':
                    return 'Edit Business Details';
                  case 'profile':
                    return 'Edit Profile';
                  case 'specialties':
                    return 'Edit Specialties';
                  default:
                    return 'Edit Profile';
                }
              })()}
            </h2>

            {/* Cropping Modal */}
            {isCropping && (
              <div className="cropper-container">
                <Cropper
                  image={tempImageUrl}
                  crop={crop}
                  zoom={1}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  showGrid={true}
                  restrictPosition={false}
                  cropShape="rect"
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      touchAction: 'none'
                    },
                    mediaStyle: {
                      width: '100%',
                      height: '100%',
                      touchAction: 'none',
                      objectFit: 'contain'
                    },
                    cropAreaStyle: {
                      width: '100%',
                      height: '100%',
                      touchAction: 'none'
                    }
                  }}
                  classes={{
                    containerClassName: 'cropper-container',
                    mediaClassName: 'cropper-media',
                    cropAreaClassName: 'cropper-area'
                  }}
                />
                <div className="cropper-controls">
                  <button onClick={handleCropConfirm} disabled={uploadingProfile}>
                    {uploadingProfile ? "Saving..." : "Save"}
                  </button>
                  <button onClick={handleCropCancel}>Cancel</button>
                </div>
              </div>
            )}

            {/* Profile Picture Section */}
            {initialData.currentSection === 'profile' && initialData.profile_picture && !isCropping && (
              <div className="profile-picture-container">
                <label>Profile Picture</label>
                <div className="profile-pic-wrapper">
                  <img 
                    src={profilePic || "/images/default.jpg"}
                    alt="Profile"
                    className="profile-pic-modal"
                  />
                  <div className="profile-pic-buttons">
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={profileFileInputRef} 
                      style={{ display: "none" }} 
                      onChange={handleProfilePicChange}
                    />
                    <button   
                      className="edit-profile-button" 
                      onClick={() => profileFileInputRef.current.click()}
                      disabled={uploadingProfile}
                    >
                      {uploadingProfile ? "Uploading..." : "Edit Profile Picture"}
                    </button>
                    {profilePic && profilePic !== "/images/default.jpg" && (
                      <>
                        <button
                          className="resize-profile-button"
                          onClick={handleResizeProfilePic}
                          disabled={uploadingProfile}
                        >
                          Resize Picture
                        </button>
                        <button
                          className="remove-profile-button"
                          onClick={handleRemoveProfilePic}
                          disabled={uploadingProfile}
                        >
                          Remove Picture
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Business Info Section */}
            {initialData.currentSection === 'business_info' && (
              <div>
                <div className="modal-input-group">
                  <label>Business Name</label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="modal-input-group">
                  <label>Business Description</label>
                  <input
                    type="text"
                    name="business_description"
                    value={formData.business_description || ""}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="Brief description of your business"
                  />
                  <div className="character-count">
                    {50 - (formData.business_description?.length || 0)} characters remaining
                  </div>
                </div>
              </div>
            )}

            {/* Business Details Section */}
            {initialData.currentSection === 'business_details' && (
              <div>
                <div className="modal-input-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="business_address"
                    value={formData.business_address || ""}
                    onChange={handleChange}
                    placeholder="Enter the areas you cover (e.g., Utah)"
                  />
                </div>
                <div className="modal-input-group">
                  <label>Base Price</label>
                  <input
                    type="text"
                    name="minimum_price"
                    value={formData.minimum_price || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Profile Section */}
            {initialData.currentSection === 'profile' && (
              <div>
                <div className="modal-input-group">
                  <label>Business Owner</label>
                  <input
                    type="text"
                    name="business_owner"
                    value={formData.business_owner || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="modal-input-group">
                  <label>Story</label>
                  <textarea
                    name="story"
                    value={formData.story || ""}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Write about you, your business, your story..."
                    style={{ resize: 'vertical', minHeight: '150px' }}
                  />
                </div>
              </div>
            )}

            {/* Specialties Section */}
            {initialData.currentSection === 'specialties' && (
              <div className="specializations-container">
                <div className="specializations-list">
                  {formData.specializations?.map((specialty, index) => (
                    <div key={index} className="specialization-item">
                      {specialty}
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleSpecializationRemove(index)}
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                </div>
                <div className="specialization-input">
                  <input
                    type="text"
                    placeholder="Add a specialization..."
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSpecializationAdd();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="add-button"
                    onClick={handleSpecializationAdd}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Portfolio Section */}
            {initialData.currentSection === 'portfolio' && (
              <div className="portfolio-preview-container">
                <h3>Portfolio Media</h3>
                
                {/* Add Media Button at the top */}
                <div className="upload-btn-container">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    multiple
                  />
                  <button
                    className="upload-btn"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Add Media"}
                  </button>
                </div>

                {/* Upload Progress */}
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="upload-progress-container">
                    <span>{fileName}</span>
                    <ProgressBar progress={progress} />
                  </div>
                ))}

                <div className="portfolio-preview" style={{ touchAction: 'pan-y' }}>
                  {mediaOrder.map((url, index) => {
                    const isVideo = url.toLowerCase().match(/\.(mp4|mov|avi|wmv|webm)$/);
                    return (
                      <div 
                        key={url} 
                        className="image-container"
                        style={{ touchAction: 'pan-y' }}
                        onTouchStart={(e) => handleTouchStart(e, url)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={(e) => handleMouseDown(e, url)}
                      >
                        {isVideo ? (
                          <video 
                            src={url} 
                            className="portfolio-image video" 
                            controls
                            playsInline
                            style={{ touchAction: 'pan-y' }}
                          />
                        ) : (
                          <img 
                            src={url} 
                            alt={`Portfolio ${index + 1}`} 
                            className="portfolio-image" 
                            loading="lazy"
                            style={{ touchAction: 'pan-y' }}
                          />
                        )}
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteMedia(url, isVideo ? 'video' : 'portfolio')}
                          aria-label="Delete media"
                        >
                          ✖
                        </button>
                        <div 
                          className="drag-handle" 
                          title="Drag to reorder"
                          aria-label="Drag to reorder"
                        >
                          ⋮⋮
                        </div>
                      </div>
                    );
                  })}
                </div>

                {dragFeedback && (
                  <div className="drag-feedback">
                    {dragFeedback}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <button className="close-btn" onClick={onClose}>Cancel</button>
              <button className="save-btn" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default EditProfileModal;