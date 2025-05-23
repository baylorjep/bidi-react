import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../supabaseClient';
import LoadingSpinner from '../LoadingSpinner';
import '../../styles/BusinessSettings.css';
import '../../styles/ContractTemplateEditor.css';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

// Custom Blot for variables
const Inline = ReactQuill.Quill.import('blots/inline');
class VariableBlot extends Inline {
  static create(value) {
    const node = super.create();
    node.setAttribute('class', 'variable-tag');
    node.setAttribute('data-variable', value);
    node.innerHTML = value;
    return node;
  }

  static formats(node) {
    return node.getAttribute('data-variable');
  }
}
VariableBlot.blotName = 'variable';
VariableBlot.tagName = 'span';

ReactQuill.Quill.register(VariableBlot);

const styles = `
  .quill-container {
    min-height: 400px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(150, 51, 235, 0.1);
  }
  .quill-container .ql-container {
    min-height: 400px;
    height: auto;
    border: none;
  }
  .quill-container .ql-editor {
    min-height: 400px;
    height: auto;
    padding: 2rem;
  }
  .ql-editor .variable-tag {
    background-color: #ffd6e7;
    padding: 2px 6px;
    border-radius: 4px;
    color: #d63384;
    font-family: monospace;
    font-weight: 500;
    display: inline-block;
    border: 1px solid #ff9ec4;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  .profile-pic-container {
    position: relative;
    width: 50px;
    height: 50px;
  }
  .profile-pic-upload {
    position: absolute;
    bottom: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .profile-pic-upload:hover {
    background: rgba(0, 0, 0, 0.8);
  }
  .ql-toolbar .ql-insertProfilePhoto::before {
    content: "👤";
    font-size: 16px;
  }
  .signature-placeholder {
    display: inline-block;
    margin: 20px 0;
    padding: 15px;
    border: 1px dashed #ff9ec4;
    border-radius: 5px;
    min-width: 200px;
    background-color: #ffd6e7;
  }
  .signature-line {
    border-bottom: 2.5px solid #d63384;
    width: 400px;
    margin: 0 auto 8px auto;
    height: 0;
  }
  .signature-label {
    font-weight: bold;
    margin-bottom: 5px;
    color: #d63384;
  }
  .signature-name {
    color: #d63384;
    margin-bottom: 5px;
  }
  .signature-date {
    font-size: 0.9em;
    color: #d63384;
  }
  .client-signature {
    border-color: #d63384;
  }
  .business-signature {
    border-color: #d63384;
  }
  .variable-item {
    user-select: none;
  }
  .variable-item:active {
    cursor: grabbing;
  }
  .sidebar-container {
    position: sticky;
    top: 80px;
    height: calc(100vh - 100px);
    overflow-y: auto;
    padding-top: 1rem;
  }
  .sidebar-container::-webkit-scrollbar {
    width: 6px;
  }
  .sidebar-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  .sidebar-container::-webkit-scrollbar-thumb {
    background: #9633eb;
    border-radius: 3px;
  }
  .sidebar-container::-webkit-scrollbar-thumb:hover {
    background: #7b2cbf;
  }
  .card {
    border: none;
    box-shadow: 0 0 20px rgba(150, 51, 235, 0.1);
    border-radius: 15px;
    margin-bottom: 1.5rem;
  }
  .card-header {
    background: white;
    color: #9633eb;
    border-radius: 15px 15px 0 0 !important;
    padding: 1.5rem;
    border: none;
  }
  .card-body {
    padding: 2rem;
  }
  .btn-outline-primary {
    color: #9633eb;
    border-color: #9633eb;
    border-radius: 40px;
    padding: 8px 24px;
    transition: all 0.3s ease;
  }
  .btn-outline-primary:hover {
    background-color: #9633eb;
    border-color: #9633eb;
    color: white;
    transform: translateY(-2px);
  }
  .btn-outline-secondary {
    color: #d63384;
    border-color: #d63384;
    border-radius: 40px;
    padding: 8px 24px;
    transition: all 0.3s ease;
  }
  .btn-outline-secondary:hover {
    background-color: #d63384;
    border-color: #d63384;
    color: white;
    transform: translateY(-2px);
  }
  .btn-outline-info {
    color: #9633eb;
    border-color: #9633eb;
    border-radius: 40px;
    padding: 8px 24px;
    transition: all 0.3s ease;
  }
  .btn-outline-info:hover {
    background-color: #9633eb;
    border-color: #9633eb;
    color: white;
    transform: translateY(-2px);
  }
  .btn-outline-success {
    color: #d63384;
    border-color: #d63384;
    border-radius: 40px;
    padding: 8px 24px;
    transition: all 0.3s ease;
  }
  .btn-outline-success:hover {
    background-color: #d63384;
    border-color: #d63384;
    color: white;
    transform: translateY(-2px);
  }
  .variables-list .btn {
    border-color: #d63384;
    color: #d63384;
    transition: all 0.3s ease;
    border-radius: 40px;
    padding: 12px 24px;
    margin-bottom: 1rem;
    background: white;
    box-shadow: 0 2px 4px rgba(150, 51, 235, 0.1);
  }
  .variables-list .btn:hover {
    background-color: #9633eb;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(150, 51, 235, 0.2);
  }
  .ql-toolbar.ql-snow {
    border: none;
    border-radius: 8px 8px 0 0;
    background: white;
    padding: 1rem;
  }
  .ql-container.ql-snow {
    border: none;
    border-radius: 0 0 8px 8px;
  }
  .ql-snow .ql-picker {
    color: #9633eb;
  }
  .ql-snow .ql-stroke {
    stroke: #9633eb;
  }
  .ql-snow .ql-fill {
    fill: #9633eb;
  }
  .ql-snow .ql-picker-options {
    background-color: white;
    border-color: #9633eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(150, 51, 235, 0.1);
  }
  .ql-snow .ql-picker-item:hover {
    color: #d63384;
  }
  .ql-snow .ql-picker-item.ql-selected {
    color: #9633eb;
  }
  .section-title {
    color: #333;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
  .section-description {
    color: #666;
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }
  .form-label {
    color: #333;
    font-weight: 500;
    margin-bottom: 1rem;
  }
  .alert {
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  .alert-danger {
    background-color: #ffd6e7;
    border-color: #ff9ec4;
    color: #d63384;
  }
  .mt-4 {
    margin-top: 2rem;
  }
  .mb-4 {
    margin-bottom: 2rem;
  }
  .gap-2 {
    gap: 1rem;
  }
  .text-muted {
    color: #666;
  }
  .text-muted small {
    font-size: 0.9rem;
  }
  .fa-info-circle {
    color: #9633eb;
  }
`;

const ContractTemplateEditor = ({ setActiveSection }) => {
  const [contractTemplate, setContractTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [businessName, setBusinessName] = useState("");
  const quillRef = useRef(null);
  const navigate = useNavigate();

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add these modules for the editor
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
      ["insertProfilePhoto"]
    ],
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "image",
    "variable"
  ];

  useEffect(() => {
    fetchContractTemplate();
    fetchProfilePicture();
  }, []);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const fetchContractTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not found");
      }

      const { data: profile, error: profileError } = await supabase
        .from("business_profiles")
        .select("contract_template, business_name")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.contract_template) {
        setContractTemplate(profile.contract_template);
      }
      if (profile?.business_name) {
        setBusinessName(profile.business_name);
      }
    } catch (error) {
      console.error("Error fetching contract template:", error);
      setError("Failed to load contract template. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfilePicture = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", user.id)
        .eq("photo_type", "profile")
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfilePic(data?.photo_url || null);
    } catch (error) {
      console.error("Error fetching profile picture:", error);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Convert image to WebP if it's not already
      let processedFile = file;
      if (file.type.startsWith('image/') && !file.type.includes('webp')) {
        const webpUrl = await convertToWebP(URL.createObjectURL(file));
        const response = await fetch(webpUrl);
        processedFile = await response.blob();
      }

      const fileExt = 'webp';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

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
        .eq("user_id", user.id)
        .eq("photo_type", "profile")
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
              user_id: user.id,
              photo_url: photoUrl,
              file_path: filePath,
              photo_type: "profile"
            }
          ]);

        if (insertError) throw insertError;
      }

      setProfilePic(photoUrl);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setUploadingProfile(false);
    }
  };

  const convertToWebP = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not found");
      }

      // Get the current content from the editor
      const editor = quillRef.current?.getEditor();
      if (!editor) {
        throw new Error("Editor not initialized");
      }

      // Get the content as Delta format first
      const delta = editor.getContents();
      
      // Convert Delta to HTML while preserving variables
      let content = editor.root.innerHTML;
      
      // Define all possible variables with their exact format
      const variables = {
        clientName: '{clientName}',
        eventDate: '{eventDate}',
        eventTime: '{eventTime}',
        eventLocation: '{eventLocation}',
        servicesDescription: '{servicesDescription}',
        priceBreakdown: '{priceBreakdown}',
        totalAmount: '{totalAmount}',
        downPaymentAmount: '{downPaymentAmount}',
        signatureDate: '{signatureDate}'
      };

      // Ensure variables are in the correct format
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`<span class="variable-tag"[^>]*>${value}</span>`, 'g');
        content = content.replace(regex, value);
      });

      // Clean up any malformed HTML
      content = content.replace(/<p><br><\/p>/g, '');
      content = content.replace(/<p><\/p>/g, '');

      // Ensure signature placeholders are properly formatted
      content = content.replace(
        /<div class="signature-placeholder (client|business)-signature"[^>]*>/g,
        (match) => {
          const type = match.includes('client-signature') ? 'client' : 'business';
          return `<div class="signature-placeholder ${type}-signature">`;
        }
      );

      // Ensure we have valid content
      if (!content || content.trim() === '') {
        throw new Error("No content to save");
      }

      // Save the template
      const { error } = await supabase
        .from("business_profiles")
        .update({ contract_template: content })
        .eq("id", user.id);

      if (error) throw error;

      toast.success('Contract template saved successfully');
      setActiveSection("settings");
    } catch (error) {
      console.error("Error saving contract template:", error);
      toast.error("Failed to save contract template. Please try again.");
    }
  };

  const insertProfilePhoto = () => {
    if (!profilePic) {
      alert('Please upload a profile photo first');
      return;
    }

    if (!quillRef.current) {
      alert('Editor not initialized');
      return;
    }

    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    
    // Create a wrapper div with the image inside
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: inline-block; width: 50px; height: 50px; border-radius: 50%; overflow: hidden; margin: 0 5px;';
    
    const img = document.createElement('img');
    img.src = profilePic;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    
    wrapper.appendChild(img);
    
    if (!range) {
      // If no selection, insert at the end of the document
      const length = editor.getLength();
      editor.insertEmbed(length - 1, 'image', profilePic);
      // Apply the circular styling after insertion
      const delta = editor.getContents();
      const lastIndex = delta.length() - 1;
      editor.formatLine(lastIndex, 1, { 'align': 'center' });
      editor.formatText(lastIndex, 1, { 'width': '50px', 'height': '50px', 'border-radius': '50%' });
    } else {
      editor.insertEmbed(range.index, 'image', profilePic);
      // Apply the circular styling after insertion
      editor.formatText(range.index, 1, { 'width': '50px', 'height': '50px', 'border-radius': '50%' });
    }
  };

  const insertSignature = (type) => {
    if (!quillRef.current) {
      alert('Editor not initialized');
      return;
    }

    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);

    // Use a string of underscores for the signature line
    const signatureLine = '__________________________________________';
    const signatureHtml = `
      <div style="text-align:center; margin: 40px 0 20px 0;">
        <div>${signatureLine}</div>
        <div><strong>${type === 'client' ? '{clientName}' : businessName}</strong></div>
        <div>Date: {signatureDate}</div>
      </div>
    `;

    // Insert a new line before the signature if at the start of a line
    if (range) {
      const [line] = editor.getLine(range.index);
      if (line && line.length() === 0) {
        editor.insertText(range.index, '\n');
      }
    }

    // Insert the signature HTML as a single block
    if (!range) {
      const length = editor.getLength();
      editor.clipboard.dangerouslyPasteHTML(length - 1, signatureHtml);
      editor.insertText(length, '\n');
    } else {
      editor.clipboard.dangerouslyPasteHTML(range.index, signatureHtml);
      editor.insertText(range.index + 1, '\n');
    }
  };

  const insertVariable = (variable) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) {
      alert('Editor not initialized');
      return;
    }

    const range = quill.getSelection(true);

    if (range) {
      // Delete selected text if any
      quill.deleteText(range.index, range.length, 'user');
      
      // Insert the variable with simple formatting
      const variableHtml = `<span class="variable-tag">${variable}</span>`;
      quill.clipboard.dangerouslyPasteHTML(range.index, variableHtml, 'user');
      
      // Move cursor after the inserted variable
      quill.setSelection(range.index + 1, 0, 'user');
    } else {
      // If no selection, insert at the end
      const length = quill.getLength();
      const variableHtml = `<span class="variable-tag">${variable}</span>`;
      quill.clipboard.dangerouslyPasteHTML(length - 1, variableHtml, 'user');
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarVisible(!isSidebarVisible);
    }
  };

  const handleVariableClick = (variable) => {
    insertVariable(variable.code);
    if (window.innerWidth <= 768) {
      setIsMobileSidebarOpen(false);
    }
  };

  const handleSignatureClick = (type) => {
    insertSignature(type);
    if (window.innerWidth <= 768) {
      setIsMobileSidebarOpen(false);
    }
  };

  const handleProfilePhotoClick = () => {
    insertProfilePhoto();
    if (window.innerWidth <= 768) {
      setIsMobileSidebarOpen(false);
    }
  };

  // Add this new function to handle loading the template
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("business_profiles")
          .select("contract_template")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (profile?.contract_template) {
          // Set the template content in the editor
          const editor = quillRef.current?.getEditor();
          if (editor) {
            editor.clipboard.dangerouslyPasteHTML(0, profile.contract_template);
          }
          setContractTemplate(profile.contract_template);
        }
      } catch (error) {
        console.error("Error loading template:", error);
        toast.error("Failed to load contract template");
      }
    };

    loadTemplate();
  }, []);

  if (isLoading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  return (
    <div className="contract-template-editor">
      <div className="editor-header d-flex justify-content-between align-items-center">
        <h3>Contract Template Editor</h3>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={toggleSidebar}
          >
            <i className={`fas fa-${isMobile ? 'bars' : (isSidebarVisible ? 'chevron-right' : 'chevron-left')} me-2`}></i>
            {isMobile ? 'Variables' : (isSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar')}
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setActiveSection("settings")}
          >
            <i className="fas fa-times me-2"></i>
            Back to Settings
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={handleSave}
          >
            <i className="fas fa-save me-2"></i>
            Save Template
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <div className="row">
            {/* Main Editor Column */}
            <div className={`${isSidebarVisible ? 'col-md-8' : 'col-md-12'}`}>
              <div className="mb-4">
                <label className="form-label">Your contract template:</label>
                <div className="quill-container">
                  <ReactQuill
                    theme="snow"
                    value={contractTemplate}
                    onChange={setContractTemplate}
                    modules={modules}
                    formats={formats}
                    ref={quillRef}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Sidebar */}
            {isSidebarVisible && (
              <div className="col-md-4">
                <div className="sidebar-container">
                  <div className="card mb-3">
                    <div className="card-header">
                      <h5>Available Variables</h5>
                    </div>
                    <div className="card-body">
                      <p className="text-muted mb-3">
                        <small>
                          <i className="fas fa-info-circle"></i> Click a variable to insert it at the cursor position
                        </small>
                      </p>
                      <div className="variables-list">
                        {[
                          { code: '{clientName}', description: "Client's full name" },
                          { code: '{eventDate}', description: 'Event date' },
                          { code: '{eventTime}', description: 'Event time' },
                          { code: '{eventLocation}', description: 'Event location' },
                          { code: '{servicesDescription}', description: 'Description of services being provided' },
                          { code: '{priceBreakdown}', description: 'Detailed breakdown of all costs and fees' },
                          { code: '{totalAmount}', description: 'Total contract amount' },
                          { code: '{downPaymentAmount}', description: 'Down payment amount' },
                          { code: '{signatureDate}', description: 'Date of signature' }
                        ].map((variable, index) => (
                          <button 
                            key={index} 
                            className="btn btn-outline-secondary"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleVariableClick(variable);
                            }}
                          >
                            <code className="me-2">{variable.code}</code>
                            <small className="text-muted">{variable.description}</small>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Signature Section */}
                  <div className="card">
                    <div className="card-header">
                      <h5>Signature Blocks</h5>
                    </div>
                    <div className="card-body">
                      <p className="text-muted mb-3">
                        <small>
                          <i className="fas fa-info-circle"></i> Click to insert a signature block at the cursor position
                        </small>
                      </p>
                      <div className="d-grid gap-2">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={handleProfilePhotoClick}
                        >
                          <i className="fas fa-user-circle me-2"></i>
                          Insert Profile Photo
                        </button>
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => handleSignatureClick('client')}
                        >
                          <i className="fas fa-signature me-2"></i>
                          Add Client Signature
                        </button>
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => handleSignatureClick('business')}
                        >
                          <i className="fas fa-signature me-2"></i>
                          Add Business Signature
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${isMobileSidebarOpen ? 'active' : ''}`}>
        <div className="mobile-sidebar-header">
          <h5>Insert Variables & Signatures</h5>
          <button className="mobile-sidebar-close" onClick={() => setIsMobileSidebarOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="card mb-3">
          <div className="card-header">
            <h5>Available Variables</h5>
          </div>
          <div className="card-body">
            <p className="text-muted mb-3">
              <small>
                <i className="fas fa-info-circle"></i> Click a variable to insert it at the cursor position
              </small>
            </p>
            <div className="variables-list">
              {[
                { code: '{clientName}', description: "Client's full name" },
                { code: '{eventDate}', description: 'Event date' },
                { code: '{eventTime}', description: 'Event time' },
                { code: '{eventLocation}', description: 'Event location' },
                { code: '{servicesDescription}', description: 'Description of services being provided' },
                { code: '{priceBreakdown}', description: 'Detailed breakdown of all costs and fees' },
                { code: '{totalAmount}', description: 'Total contract amount' },
                { code: '{downPaymentAmount}', description: 'Down payment amount' },
                { code: '{signatureDate}', description: 'Date of signature' }
              ].map((variable, index) => (
                <button 
                  key={index} 
                  className="btn btn-outline-secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleVariableClick(variable);
                  }}
                >
                  <code className="me-2">{variable.code}</code>
                  <small className="text-muted">{variable.description}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h5>Signature Blocks</h5>
          </div>
          <div className="card-body">
            <p className="text-muted mb-3">
              <small>
                <i className="fas fa-info-circle"></i> Click to insert a signature block at the cursor position
              </small>
            </p>
            <div className="d-grid gap-2">
              <button 
                className="btn btn-outline-primary"
                onClick={handleProfilePhotoClick}
              >
                <i className="fas fa-user-circle me-2"></i>
                Insert Profile Photo
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => handleSignatureClick('client')}
              >
                <i className="fas fa-signature me-2"></i>
                Add Client Signature
              </button>
              <button 
                className="btn btn-outline-primary"
                onClick={() => handleSignatureClick('business')}
              >
                <i className="fas fa-signature me-2"></i>
                Add Business Signature
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`mobile-sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />
    </div>
  );
};

export default ContractTemplateEditor; 