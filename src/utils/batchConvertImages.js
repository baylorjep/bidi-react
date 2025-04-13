import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

const BUCKET_NAME = 'profile-photos';
const BATCH_SIZE = 10; // Process 10 images at a time to avoid memory issues
const STORAGE_URL = 'https://splafvfbznewlbeqaocv.supabase.co/storage/v1/object/public/profile-photos/';

export const batchConvertImages = async () => {
  try {
    // First check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('User must be authenticated to convert images');
    }

    // Check if user is an admin
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !businessProfile?.is_admin) {
      console.error('Authorization error:', profileError);
      throw new Error('Only administrators can convert all images');
    }

    console.log('Starting batch conversion process...');
    
    // Get all photos that aren't already WebP
    const { data: photos, error: photosError } = await supabase
      .from('profile_photos')
      .select('*')
      .not('photo_url', 'ilike', '%.webp')
      .not('photo_url', 'is', null);

    if (photosError) {
      console.error('Error fetching photos:', photosError);
      throw photosError;
    }

    // Filter out non-image files and extract paths
    const imageFiles = photos
      .filter(photo => photo.photo_url?.match(/\.(jpg|jpeg|png|gif)$/i))
      .map(photo => {
        // Extract the path by removing the storage URL prefix
        const path = photo.photo_url.replace(STORAGE_URL, '');
        return {
          id: photo.id,
          fullUrl: photo.photo_url,
          path: path,
          userId: photo.user_id
        };
      });

    console.log(`Found ${imageFiles.length} images to convert`);
    console.log('Image files to convert:', imageFiles.map(f => f.path));

    if (imageFiles.length === 0) {
      console.log('No images found to convert');
      return;
    }

    // Process images in batches
    for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
      const batch = imageFiles.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(imageFiles.length / BATCH_SIZE)}`);
      console.log('Current batch:', batch.map(f => f.path));

      await Promise.all(batch.map(async (file) => {
        try {
          console.log(`Starting conversion for ${file.path}`);
          
          // Download the original image
          const { data: imageData, error: downloadError } = await supabase
            .storage
            .from(BUCKET_NAME)
            .download(file.path);

          if (downloadError) {
            console.error(`Error downloading ${file.path}:`, downloadError);
            throw downloadError;
          }

          console.log(`Successfully downloaded ${file.path}`);
          console.log(`Original blob size for ${file.path}: ${imageData.size} bytes`);
          
          // Compress and convert to WebP
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp'
          };

          console.log(`Starting compression for ${file.path}`);
          const compressedBlob = await imageCompression(imageData, options);
          console.log(`Compressed blob size for ${file.path}: ${compressedBlob.size} bytes`);

          // Create new filename with .webp extension
          const newFileName = file.path.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
          console.log(`New filename for ${file.path}: ${newFileName}`);

          // Upload the WebP version
          const { error: uploadError } = await supabase
            .storage
            .from(BUCKET_NAME)
            .upload(newFileName, compressedBlob, {
              contentType: 'image/webp',
              upsert: true
            });

          if (uploadError) {
            console.error(`Error uploading ${newFileName}:`, uploadError);
            throw uploadError;
          }

          console.log(`Successfully uploaded ${newFileName}`);

          // Create the full URL for the new WebP file
          const newFullUrl = `${STORAGE_URL}${newFileName}`;

          // Update the database record using the photo ID
          const { error: updateError } = await supabase
            .from('profile_photos')
            .update({ 
              photo_url: newFullUrl,
              file_path: newFileName
            })
            .eq('id', file.id);

          if (updateError) {
            console.warn(`Failed to update database record for ${file.path}:`, updateError);
          } else {
            console.log(`Successfully updated database record for ${file.path} to ${newFullUrl}`);
          }
        } catch (error) {
          console.error(`Error processing ${file.path}:`, error);
        }
      }));
    }

    console.log('Batch conversion completed');
  } catch (error) {
    console.error('Error in batch conversion:', error);
    throw error;
  }
}; 