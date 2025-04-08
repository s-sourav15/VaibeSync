// src/services/recommendationService.js
import axios from 'axios';
import { auth } from '../config/firebase';

// API Configuration - replace with your deployed API endpoint
// For production: 'https://api.vaibesync.com/recommendations'
// For local development with IP address that's accessible from simulator
const API_BASE_URL = 'http://localhost:8000/recommendations';

/**
 * Service for interacting with the recommendation API
 */
class RecommendationService {
  /**
   * Get the current user's auth token
   * @returns {Promise<string>} JWT token
   */
  async getAuthToken() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  }

  /**
   * Get headers with authentication token
   * @returns {Promise<Object>} Headers object
   */
  async getHeaders() {
    try {
      const token = await this.getAuthToken();
      
      // Print token for debugging (remove in production)
      console.log('Token length:', token.length);
      
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Make sure there are no spaces in the token string
      };
    } catch (error) {
      console.error('Error getting headers:', error);
      return {
        'Content-Type': 'application/json'
      };
    }
  }

  /**
   * Get personalized activity recommendations
   * @param {number} limit - Maximum number of recommendations
   * @returns {Promise<Array>} Recommended activities
   */
  async getRecommendedActivities(limit = 10) {
    try {
      const headers = await this.getHeaders();
      
      console.log('Fetching recommendations from:', `${API_BASE_URL}/activities`);
      
      const response = await axios.post(
        `${API_BASE_URL}/activities`,
        { limit },
        { headers }
      );
      
      console.log('Recommendations response:', response.data);
      return response.data.results || [];
    } catch (error) {
      console.error('Error getting activity recommendations:', error);
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get activity recommendations based on natural language description
   * @param {string} text - Natural language description
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Matching activities
   */
  async getRecommendationsByText(text, limit = 10) {
    try {
      const headers = await this.getHeaders();
      
      console.log('Fetching text recommendations from:', `${API_BASE_URL}/text`);
      console.log('Text query:', text);
      
      const response = await axios.post(
        `${API_BASE_URL}/text`,
        { text },
        { 
          headers,
          params: { limit }
        }
      );
      
      console.log('Text recommendations response:', response.data);
      return response.data.results || [];
    } catch (error) {
      console.error('Error getting text-based recommendations:', error);
      
      // Return empty array on error
      return [];
    }
  }

  async generateEmbeddingsTest() {
    try {
      const response = await axios.post(
        `${API_BASE_URL.split('/recommendations')[0]}/recommendations/generate-embeddings-test`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error generating embeddings (test):', error);
      return { success: false, error: error.message };
    }
  }



  async generateAllEmbeddings() {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.post(
        `${API_BASE_URL.split('/recommendations')[0]}/recommendations/generate-all-embeddings`,
        {},
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search for activities by keyword
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Search results
   */
  async searchActivities(query, limit = 10) {
    try {
      const headers = await this.getHeaders();
      
      console.log('Searching activities from:', `${API_BASE_URL}/search`);
      
      const response = await axios.post(
        `${API_BASE_URL}/search`,
        { query, limit },
        { headers }
      );
      
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching activities:', error);
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get similar users to the current user
   * @param {number} limit - Maximum number of similar users
   * @returns {Promise<Array>} Similar users
   */
  async getSimilarUsers(limit = 10) {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.post(
        `${API_BASE_URL}/users`,
        { limit },
        { headers }
      );
      
      return response.data.results || [];
    } catch (error) {
      console.error('Error getting similar users:', error);
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Analyze text using Claude to extract structured information
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Structured analysis
   */
  async analyzeText(text) {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.post(
        `${API_BASE_URL}/analyze`,
        { text },
        { headers }
      );
      
      return response.data.analysis || {};
    } catch (error) {
      console.error('Error analyzing text:', error);
      
      // Return empty object on error
      return {};
    }
  }

  /**
   * Update the current user's profile embedding
   * @returns {Promise<boolean>} Success indicator
   */
  async updateProfileEmbedding() {
    try {
      const headers = await this.getHeaders();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      await axios.post(
        `${API_BASE_URL}/update-profile`,
        { user_id: user.uid },
        { headers }
      );
      
      return true;
    } catch (error) {
      console.error('Error updating profile embedding:', error);
      return false;
    }
  }
  
  /**
   * Check the API connection
   * @returns {Promise<boolean>} Connection status
   */
  async checkConnection() {
    try {
      const response = await axios.get(`${API_BASE_URL.split('/recommendations')[0]}/health`);
      console.log('API health check response:', response.data);
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('API connection error:', error);
      return false;
    }
  }
}

// Export a singleton instance
export default new RecommendationService();