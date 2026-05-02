import api from './api/config';

/**
 * Compatibility layer for hotelPartner module (ported from Rukkoin)
 * This maps legacy service calls to the current backend API structure.
 */

export const authService = {
  // Map to existing seller registration/auth if needed
  saveOnboardingStep: async (data) => {
    try {
      const response = await api.post('/hotel/save-onboarding', data);
      return response.data;
    } catch (error) {
      console.warn("Draft Save Error:", error);
      return null;
    }
  },
  verifyPartnerOtp: async (data) => {
    // In current backend, this might be handled by the main seller verify-otp 
    // or a specialized hotel registration endpoint.
    // For now, mapping to a placeholder or existing endpoint
    try {
      const response = await api.post('/auth/seller/verify-otp', {
        mobile: data.phone,
        otp: data.otpCode,
        ...data
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const hotelService = {
  uploadImages: async (formData) => {
    try {
      // Use the dedicated upload service endpoint
      const response = await api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        urls: Array.isArray(response.data.data) 
          ? response.data.data.map(img => img.secureUrl || img.url)
          : [response.data.data.secureUrl || response.data.data.url]
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  // Add other methods if needed by PartnerDashboard.jsx etc.
  getMyHotels: async () => {
    const response = await api.get('/hotel/my-hotels');
    return response.data;
  }
};

export default api;
