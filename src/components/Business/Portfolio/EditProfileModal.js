import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { v4 as uuidv4 } from 'uuid';
import "../../../styles/EditProfileModal.css";
import { convertToWebP } from "../../../utils/imageUtils";
import Cropper from 'react-easy-crop';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate } from 'react-router-dom';

const EditProfileModal = ({ isOpen, onClose, businessId, initialData }) => {
  const [formData, setFormData] = useState({
    business_address: initialData?.business_address || '',
    packages: Array.isArray(initialData?.packages) ? initialData.packages : []
  });
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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [minZoom, setMinZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  // Add Quill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

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

  useEffect(() => {
    if (isOpen && initialData.currentSection === 'portfolio') {
      fetchCategories();
    }
  }, [isOpen, initialData.currentSection]);

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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("portfolio_categories")
        .select("*")
        .eq("business_id", businessId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // 🔹 Handle input changes dynamically
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Handle saving data back to Supabase
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updates = {};

      // Ensure packages is an array before processing
      const packagesToSave = Array.isArray(formData.packages) ? formData.packages : [];

      switch (initialData.currentSection) {
        case 'business_details':
          updates.business_address = formData.business_address;
          // Save packages
          if (packagesToSave.length > 0) {
            // Delete existing packages
            await supabase
              .from('business_packages')
              .delete()
              .eq('business_id', businessId);

            // Insert new packages
            const { error: packagesError } = await supabase
              .from('business_packages')
              .insert(
                packagesToSave.map(pkg => ({
                  business_id: businessId,
                  name: pkg.name,
                  price: pkg.price,
                  description: pkg.description,
                  features: pkg.features || [],
                  image_url: pkg.image_url
                }))
              );

            if (packagesError) throw packagesError;
          }
          break;

        // ... rest of the switch cases ...
      }

      // ... rest of the function ...
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
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

    let selectedCategoryId = null;

    // If there are categories, show category selection dialog
    if (categories.length > 0) {
      const selectedCategory = window.prompt(
        'Enter category name for these files (or leave empty for uncategorized):',
        ''
      );
      
      if (selectedCategory === null) {
        // User cancelled the upload
        e.target.value = '';
        return;
      }

      // Find the category ID if it exists
      const category = categories.find(cat => 
        cat.name.toLowerCase() === selectedCategory.toLowerCase()
      );

      if (selectedCategory && !category) {
        // Create new category if it doesn't exist
        try {
          const { data: newCategory, error } = await supabase
            .from("portfolio_categories")
            .insert({
              business_id: businessId,
              name: selectedCategory.trim(),
              display_order: categories.length
            })
            .select()
            .single();

          if (error) throw error;
          
          setCategories(prev => [...prev, newCategory]);
          selectedCategoryId = newCategory.id;
        } catch (error) {
          console.error("Error creating category:", error);
          alert("Failed to create category. Files will be uploaded as uncategorized.");
          selectedCategoryId = null;
        }
      } else {
        selectedCategoryId = category?.id || null;
      }
    }

    setUploading(true);

    for (const file of files) {
      console.log('Processing file:', file.name);
      const fileType = file.type.startsWith('video/') ? 'video' : 'portfolio';
      
      // Sanitize the file name by removing spaces and special characters
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
      
      const fileName = `${Date.now()}_${sanitizedFileName}`;
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

        // Save to database with order and category
        const { error: insertError } = await supabase
          .from('profile_photos')
          .insert({
            user_id: businessId,
            photo_url: publicUrl,
            photo_type: fileType,
            file_path: filePath,
            display_order: mediaOrder.length,
            category_id: selectedCategoryId
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

      // Set canvas size to desired dimensions (400x400 for profile picture)
      canvas.width = 400;
      canvas.height = 400;

      // Draw the cropped area to fill the canvas
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        400,
        400
      );

      // Convert to JPEG with high quality
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
    setZoom(1); // Reset zoom
    setCrop({ x: 0, y: 0 }); // Reset crop position
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

      // Get the cropped image as JPEG
      const croppedImage = await getCroppedImg(tempImageUrl, croppedAreaPixels);
      
      const fileName = `${uuidv4()}.jpg`;
      const filePath = `${businessId}/${fileName}`;

      // Upload the cropped image
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, croppedImage, { upsert: true });

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

  // Replace handleReorder with a simpler function
  const handleOrderChange = async (mediaUrl, newOrder) => {
    try {
      // Ensure the new order is between 1 and 5
      const validOrder = Math.max(1, Math.min(5, parseInt(newOrder) || 1));
      
      // Update the database
      const { error } = await supabase
        .from("profile_photos")
        .update({ display_order: validOrder - 1 }) // Convert to 0-based index
        .eq("user_id", businessId)
        .eq("photo_url", mediaUrl);

      if (error) throw error;

      // Refresh the media order
      fetchPortfolioImages();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order. Please try again.");
    }
  };

  const handleOrderUp = async (url, currentOrder) => {
    if (currentOrder > 1) {
      await handleOrderChange(url, currentOrder - 1);
    }
  };

  const handleOrderDown = async (url, currentOrder) => {
    if (currentOrder < 5) {
      await handleOrderChange(url, currentOrder + 1);
    }
  };

  const handlePackageChange = (index, field, value) => {
    setFormData(prevData => {
      const updatedPackages = [...prevData.packages];
      updatedPackages[index] = {
        ...updatedPackages[index],
        [field]: value
      };
      return {
        ...prevData,
        packages: updatedPackages
      };
    });
  };

  const handleAddPackage = () => {
    setFormData({
      ...formData,
      packages: [
        ...formData.packages,
        {
          name: '',
          price: '',
          description: '',
          features: []
        }
      ]
    });
  };

  const handleDeletePackage = async (index) => {
    const packageToDelete = formData.packages[index];
    if (packageToDelete.id) {
      try {
        const { error } = await supabase
          .from('business_packages')
          .delete()
          .eq('id', packageToDelete.id);
        
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Failed to delete package. Please try again.');
        return;
      }
    }
    
    const updatedPackages = formData.packages.filter((_, i) => i !== index);
    setFormData({ ...formData, packages: updatedPackages });
  };

  const handleAddFeature = (packageIndex) => {
    const updatedPackages = [...formData.packages];
    updatedPackages[packageIndex].features = [
      ...(updatedPackages[packageIndex].features || []),
      ''
    ];
    setFormData({ ...formData, packages: updatedPackages });
  };

  const handleFeatureChange = (packageIndex, featureIndex, value) => {
    const updatedPackages = [...formData.packages];
    updatedPackages[packageIndex].features[featureIndex] = value;
    setFormData({ ...formData, packages: updatedPackages });
  };

  const handleDeleteFeature = (packageIndex, featureIndex) => {
    const updatedPackages = [...formData.packages];
    updatedPackages[packageIndex].features = updatedPackages[packageIndex].features.filter((_, i) => i !== featureIndex);
    setFormData({ ...formData, packages: updatedPackages });
  };

  const handlePackageImageUpload = async (packageIndex, file) => {
    console.log('Starting package image upload for package index:', packageIndex);
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    try {
      const packageToUpdate = formData.packages[packageIndex];
      console.log('Current package data:', packageToUpdate);

      // Convert image to WebP
      console.log('Starting WebP conversion...');
      const objectUrl = URL.createObjectURL(file);
      console.log('Created object URL:', objectUrl);

      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Create an image element
      const img = new Image();
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });
      
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0);
      
      // Convert to WebP
      console.log('Converting to WebP format...');
      const webpBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/webp', 0.8);
      });

      // Generate filename and path
      const fileName = `${uuidv4()}.webp`;
      const filePath = `${businessId}/packages/${fileName}`;
      console.log('File path for upload:', filePath);

      // Upload to storage
      console.log('Uploading to Supabase storage...');
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, webpBlob, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      console.log('Upload successful');

      // Get public URL
      console.log('Getting public URL...');
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
      console.log('Public URL:', data.publicUrl);

      // Update package with new image URL
      console.log('Updating package data with new image URL...');
      const updatedPackages = [...formData.packages];
      updatedPackages[packageIndex] = {
        ...updatedPackages[packageIndex],
        image_url: data.publicUrl
      };
      console.log('Updated package data:', updatedPackages[packageIndex]);

      setFormData(prev => {
        console.log('Previous form data:', prev);
        const newData = {
          ...prev,
          packages: updatedPackages
        };
        console.log('New form data:', newData);
        return newData;
      });

      // Clean up
      URL.revokeObjectURL(objectUrl);
      console.log('Temporary URL cleaned up');

    } catch (error) {
      console.error('Error in handlePackageImageUpload:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      alert('Failed to upload package image. Please try again.');
    }
  };

  const handleDeletePackageImage = async (packageIndex) => {
    try {
      const packageToUpdate = formData.packages[packageIndex];
      if (!packageToUpdate.image_url) return;

      // Delete from storage
      const filePath = packageToUpdate.image_url.split('/profile-photos/')[1];
      const { error: deleteError } = await supabase.storage
        .from('profile-photos')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update package to remove image URL
      const updatedPackages = [...formData.packages];
      updatedPackages[packageIndex] = {
        ...updatedPackages[packageIndex],
        image_url: null
      };
      setFormData({ ...formData, packages: updatedPackages });

    } catch (error) {
      console.error('Error deleting package image:', error);
      alert('Failed to delete package image. Please try again.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const { data, error } = await supabase
        .from("portfolio_categories")
        .insert({
          business_id: businessId,
          name: newCategory.trim(),
          display_order: categories.length
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setNewCategory("");
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category. Please try again.");
    }
  };

  const handleUpdateCategory = async (categoryId, newName) => {
    if (!newName.trim()) return;

    try {
      const { error } = await supabase
        .from("portfolio_categories")
        .update({ name: newName.trim() })
        .eq("id", categoryId);

      if (error) throw error;

      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId ? { ...cat, name: newName.trim() } : cat
        )
      );
      setEditingCategory(null);
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category. Please try again.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category? Media in this category will become uncategorized.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("portfolio_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      // Update media in this category to be uncategorized
      const { error: updateError } = await supabase
        .from("profile_photos")
        .update({ category_id: null })
        .eq("category_id", categoryId);

      if (updateError) throw updateError;

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  const handleReorderCategories = async (draggedId, droppedId) => {
    try {
      const draggedIndex = categories.findIndex(cat => cat.id === draggedId);
      const droppedIndex = categories.findIndex(cat => cat.id === droppedId);
      
      const newCategories = [...categories];
      const [draggedCategory] = newCategories.splice(draggedIndex, 1);
      newCategories.splice(droppedIndex, 0, draggedCategory);

      // Update display_order for all categories
      const updates = newCategories.map((category, index) => 
        supabase
          .from("portfolio_categories")
          .update({ display_order: index })
          .eq("id", category.id)
      );

      await Promise.all(updates);
      setCategories(newCategories);
    } catch (error) {
      console.error("Error reordering categories:", error);
      alert("Failed to reorder categories. Please try again.");
    }
  };

  return (
    isOpen && (
      <div className="edit-portfolio-modal">
        <div className="modal-overlay">
          <div className="modal-content-edit-profile">
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
              <div className="cropper-container" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  flex: 1,
                  position: 'relative',
                  width: '100%',
                  maxHeight: 'calc(100vh - 180px)',
                  marginBottom: '20px'
                }}>
                  <Cropper
                    image={tempImageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={(croppedArea, croppedAreaPixels) => {
                      setCroppedAreaPixels(croppedAreaPixels);
                    }}
                    onZoomChange={setZoom}
                    onMediaLoaded={(mediaSize) => {
                      // Calculate the minimum zoom so the whole image fits in the crop area (400x400)
                      const minZoomValue = Math.max(
                        400 / mediaSize.naturalWidth,
                        400 / mediaSize.naturalHeight
                      );
                      setMinZoom(minZoomValue);
                      setZoom(minZoomValue);
                    }}
                    minZoom={minZoom}
                    maxZoom={3}
                    showGrid={true}
                    restrictPosition={true}
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
                  />
                </div>
                <div className="cropper-controls" style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  <div className="zoom-controls" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px',
                    padding: '10px'
                  }}>
                    <button 
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      style={{
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#9633eb',
                        border: '1px solid #ddd',
                        borderRadius: '50%',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        userSelect: 'none',
                        touchAction: 'manipulation'
                      }}
                      onTouchStart={(e) => e.preventDefault()}
                    >
                      −
                    </button>
                    <div style={{
                      minWidth: '80px',
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      {Math.round(zoom * 100)}%
                    </div>
                    <button 
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                      style={{
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#9633eb',
                        border: '1px solid #ddd',
                        borderRadius: '50%',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        userSelect: 'none',
                        touchAction: 'manipulation'
                      }}
                      onTouchStart={(e) => e.preventDefault()}
                    >
                      +
                    </button>
                  </div>
                  <div className="action-buttons" style={{
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <button 
                      onClick={handleCropConfirm} 
                      disabled={uploadingProfile}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#d84888',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        opacity: uploadingProfile ? '0.7' : '1'
                      }}
                    >
                      {uploadingProfile ? "Saving..." : "Save"}
                    </button>
                    <button 
                      onClick={handleCropCancel}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Picture Section */}
            {initialData.currentSection === 'profile' && initialData.profile_picture && !isCropping && (
              <div className="profile-picture-container" style={{
                width: '100%',
                padding: '20px',
                boxSizing: 'border-box'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '15px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#333'
                }}>Profile Picture</label>
                <div className="profile-pic-wrapper" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                  width: '100%'
                }}>
                  <div style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <img 
                      src={profilePic || "/images/default.jpg"}
                      alt="Profile"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                  </div>
                  <div className="profile-pic-buttons" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    width: '100%',
                    maxWidth: '300px'
                  }}>
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
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#d84888',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease',
                        opacity: uploadingProfile ? '0.7' : '1'
                      }}
                    >
                      {uploadingProfile ? "Uploading..." : "Edit Profile Picture"}
                    </button>
                    {profilePic && profilePic !== "/images/default.jpg" && (
                      <>
                        <button
                          className="resize-profile-button"
                          onClick={handleResizeProfilePic}
                          disabled={uploadingProfile}
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            color: '#333',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            opacity: uploadingProfile ? '0.7' : '1'
                          }}
                        >
                          Resize Picture
                        </button>
                        <button
                          className="remove-profile-button"
                          onClick={handleRemoveProfilePic}
                          disabled={uploadingProfile}
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#fff',
                            color: '#dc3545',
                            border: '1px solid #dc3545',
                            borderRadius: '8px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            opacity: uploadingProfile ? '0.7' : '1'
                          }}
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
              <div className="section-content">
                <div className="modal-input-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="business_address"
                    value={formData.business_address}
                    onChange={handleChange}
                    placeholder="Enter your business address"
                    className="modal-input"
                  />
                </div>

                <div className="packages-editor">
                  <h3>Packages</h3>
                  {(formData.packages || []).map((pkg, packageIndex) => (
                    <div key={packageIndex} className="package-editor-card">
                      <div className="package-editor-header">
                        <input
                          type="text"
                          value={pkg.name}
                          onChange={(e) => handlePackageChange(packageIndex, 'name', e.target.value)}
                          placeholder="Package Name"
                        />
                        <input
                          type="number"
                          value={pkg.price}
                          onChange={(e) => handlePackageChange(packageIndex, 'price', e.target.value)}
                          placeholder="Price"
                        />
                        <button
                          className="delete-button"
                          onClick={() => handleDeletePackage(packageIndex)}
                        >
                          Delete Package
                        </button>
                      </div>
                      
                      {/* Add package image section */}
                      <div className="package-image-section">
                        {pkg.image_url ? (
                          <div className="package-image-preview">
                            <img src={pkg.image_url} alt={`${pkg.name} preview`} />
                            <button
                              className="delete-image-button"
                              onClick={() => handleDeletePackageImage(packageIndex)}
                            >
                              ✖
                            </button>
                          </div>
                        ) : (
                          <div className="package-image-upload">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                console.log('File input changed');
                                console.log('Event target:', e.target);
                                console.log('Files:', e.target.files);
                                const file = e.target.files[0];
                                console.log('Selected file:', file);
                                if (file) {
                                  console.log('Calling handlePackageImageUpload');
                                  handlePackageImageUpload(packageIndex, file);
                                }
                              }}
                              style={{ display: 'none' }}
                              id={`package-image-${packageIndex}`}
                            />
                            <label 
                              htmlFor={`package-image-${packageIndex}`} 
                              className="upload-image-button"
                              onClick={() => {
                                console.log('Upload button clicked');
                                console.log('Label clicked for package:', packageIndex);
                              }}
                            >
                              Add Package Image
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="modal-input-group">
                        <label>Description</label>
                        <ReactQuill
                          theme="snow"
                          value={pkg.description || ""}
                          onChange={(content) => {
                            // Use a debounced update for the description field
                            const timeoutId = setTimeout(() => {
                              handlePackageChange(packageIndex, 'description', content);
                            }, 300);
                            return () => clearTimeout(timeoutId);
                          }}
                          modules={quillModules}
                          formats={quillFormats}
                          className="package-description-editor"
                        />
                      </div>
                      <div className="features-section">
                        <h4>Features</h4>
                        {pkg.features && pkg.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="feature-input">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => handleFeatureChange(packageIndex, featureIndex, e.target.value)}
                              placeholder="Feature"
                            />
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteFeature(packageIndex, featureIndex)}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                        <button
                          className="add-button"
                          onClick={() => handleAddFeature(packageIndex)}
                        >
                          Add Feature
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="add-button"
                    onClick={handleAddPackage}
                  >
                    Add Package
                  </button>
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
                  <ReactQuill
                    theme="snow"
                    value={formData.story || ""}
                    onChange={(content) => setFormData(prev => ({ ...prev, story: content }))}
                    modules={quillModules}
                    formats={quillFormats}
                    className="story-editor"
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
                <h3>Top 5 Portfolio Photos</h3>
                <p className="portfolio-description">
                  Upload your best 5 photos to showcase on your main profile. Additional photos can be added in the gallery.
                </p>
                
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
                    disabled={uploading || mediaOrder.length >= 5}
                  >
                    {uploading ? "Uploading..." : mediaOrder.length >= 5 ? "Maximum 5 photos" : "Add Media"}
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
                  {mediaOrder.slice(0, 5).map((url, index) => {
                    const isVideo = url.toLowerCase().match(/\.(mp4|mov|avi|wmv|webm)$/);
                    return (
                      <div 
                        key={url} 
                        className="image-container"
                      >
                        {isVideo ? (
                          <video 
                            src={url} 
                            className="portfolio-image video" 
                            controls
                            playsInline
                          />
                        ) : (
                          <img 
                            src={url} 
                            alt={`Portfolio ${index + 1}`} 
                            className="portfolio-image" 
                            loading="lazy"
                          />
                        )}
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteMedia(url, isVideo ? 'video' : 'portfolio')}
                          aria-label="Delete media"
                        >
                          ✖
                        </button>
                        <div className="order-input">
                          <button 
                            className="order-btn up"
                            onClick={() => handleOrderUp(url, index + 1)}
                            disabled={index === 0}
                            aria-label="Move up"
                          >
                            ↑
                          </button>
                          <span className="order-number">{index + 1}</span>
                          <button 
                            className="order-btn down"
                            onClick={() => handleOrderDown(url, index + 1)}
                            disabled={index === mediaOrder.length - 1}
                            aria-label="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {mediaOrder.length >= 5 && (
                  <div className="gallery-link">
                    <p>You've reached the maximum number of photos for the main profile.</p>
                    <button 
                      className="gallery-btn"
                      onClick={() => navigate(`/portfolio/${businessId}/gallery`)}
                    >
                      Manage Gallery Photos
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <button 
                className="close-btn" 
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="loading-spinner"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default EditProfileModal;