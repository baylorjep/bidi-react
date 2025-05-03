export const saveFormData = (formData) => {
  try {
    localStorage.setItem('masterRequest', JSON.stringify(formData));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
};

export const loadFormData = () => {
  try {
    const savedData = localStorage.getItem('masterRequest');
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (err) {
    console.error('Error loading from localStorage:', err);
  }
  return null;
};

export const clearFormData = () => {
  try {
    localStorage.removeItem('masterRequest');
  } catch (err) {
    console.error('Error clearing localStorage:', err);
  }
}; 