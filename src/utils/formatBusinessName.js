/**
 * Formats a business name for use in URLs by:
 * 1. Converting to lowercase
 * 2. Replacing non-alphanumeric characters with hyphens
 * 3. Removing leading/trailing hyphens
 * 4. Replacing multiple consecutive hyphens with a single hyphen
 */
export const formatBusinessName = (businessName) => {
    if (!businessName) return '';
    
    return businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric characters with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
        .replace(/-+/g, '-'); // Replace multiple consecutive hyphens with a single hyphen
}; 