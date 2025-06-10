/**
 * Generates a SEO-friendly URL for a portfolio page
 * @param {string} businessId - The business ID
 * @param {string} businessName - The business name
 * @param {string} category - The business category
 * @returns {string} The SEO-friendly URL
 */
export const generatePortfolioUrl = (businessId, businessName, category) => {
  // Convert business name to URL-friendly format
  const seoFriendlyName = businessName
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    || 'vendor';

  // Convert category to URL-friendly format
  const seoFriendlyCategory = category
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || '';

  // Construct the URL
  return `/vendor/${businessId}/${seoFriendlyName}${seoFriendlyCategory ? `/${seoFriendlyCategory}` : ''}`;
};

/**
 * Generates a SEO-friendly URL for a portfolio gallery page
 * @param {string} businessId - The business ID
 * @param {string} businessName - The business name
 * @returns {string} The SEO-friendly URL
 */
export const generateGalleryUrl = (businessId, businessName) => {
  const baseUrl = generatePortfolioUrl(businessId, businessName);
  return `${baseUrl}/gallery`;
}; 