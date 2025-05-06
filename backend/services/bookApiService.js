require('dotenv').config();
const axios = require('axios');
const NodeCache = require('node-cache');

class BookApiService {
  constructor(options = {}) {
    this.googleBooksBaseUrl = 'https://www.googleapis.com/books/v1/volumes';
    this.apiKeys = [
      process.env.GOOGLE_BOOKS_API_KEY_1,
      process.env.GOOGLE_BOOKS_API_KEY_2,
      process.env.GOOGLE_BOOKS_API_KEY_3,
      process.env.GOOGLE_BOOKS_API_KEY_4
    ].filter(Boolean);
    
    if (this.apiKeys.length === 0) {
      throw new Error('No API keys configured');
    }

    console.log(`Initialized with ${this.apiKeys.length} API keys`);

    this.currentKeyIndex = 0;
    this.cache = new NodeCache({ 
      stdTTL: options.cacheTTL || 86400,
      checkperiod: options.checkPeriod || 600
    });
    
    this.axiosInstance = axios.create({
      timeout: options.timeout || 5000,
      validateStatus: status => status >= 200 && status < 300
    });
  }

  isValidISBN(isbn) {
    if (!isbn) return false;
    
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    
    return /^(?:\d{10}|\d{13})$/.test(cleanIsbn);
  }

  async fetchBookDataByISBN(isbn) {
    if (!this.isValidISBN(isbn)) {
      throw new Error('ISBN invalide');
    }

    try {
      const cachedData = this.cache.get(isbn);
      if (cachedData) {
        console.log('Returning cached data for ISBN:', isbn);
        return cachedData;
      }

      const googleData = await this.fetchGoogleBooksDataWithRetry(isbn);
      if (googleData) {
        this.cache.set(isbn, googleData);
        return googleData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching book data:', error);
      throw new Error(`Failed to fetch book data for ISBN ${isbn}: ${error.message}`);
    }
  }

  async fetchGoogleBooksDataWithRetry(isbn, retryCount = 0) {
    if (retryCount >= this.apiKeys.length) {
      throw new Error('All API keys have been exhausted');
    }

    try {
      const currentKey = this.getCurrentApiKey();
      console.log(`Attempting request with API key ${currentKey.substr(0, 5)}... (key index: ${this.currentKeyIndex})`);
      
      const url = `${this.googleBooksBaseUrl}?q=isbn:${isbn}&key=${currentKey}`;
      
      const response = await this.axiosInstance.get(url);
      const { items } = response.data;
      
      if (!items?.length) {
        return null;
      }

      return this.formatBookData(items[0], isbn);
    } catch (error) {
      console.error('API request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        keyIndex: this.currentKeyIndex
      });

      const shouldRetry = this.handleApiError(error);
      console.log(`Should retry with next key? ${shouldRetry}`);
      
      if (shouldRetry) {
        console.log(`Switching from key index ${this.currentKeyIndex} to next key`);
        this.switchToNextApiKey();
        console.log(`New key index: ${this.currentKeyIndex}`);
        return this.fetchGoogleBooksDataWithRetry(isbn, retryCount + 1);
      }
      
      throw error;
    }
  }

  handleApiError(error) {
    if (!error.response) {
      console.log('Network error detected, will retry');
      return true;
    }

    const status = error.response.status;
    console.log(`Handling error with status ${status}`);

    switch (status) {
      case 429: 
        console.log('Rate limit reached, will switch to next key');
        return true;
      case 503: 
        console.log('Service unavailable, will retry');
        return true;
      case 400: 
      case 401:
      case 403: 
        console.log(`Error ${status}, won't retry`);
        return false;
      default:
        const shouldRetry = status >= 500;
        console.log(`Status ${status}, will${shouldRetry ? '' : ' not'} retry`);
        return shouldRetry;
    }
  }

  getCurrentApiKey() {
    return this.apiKeys[this.currentKeyIndex];
  }

  switchToNextApiKey() {
    const oldIndex = this.currentKeyIndex;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    console.log(`Switched API key from index ${oldIndex} to ${this.currentKeyIndex}`);
  }

  safeGet(obj, path, defaultValue) {
    return obj && obj[path] !== undefined ? obj[path] : defaultValue;
  }

  getImageLinks(imageLinks = {}) {
    return {
      small: imageLinks.smallThumbnail || '',
      thumbnail: imageLinks.thumbnail || '',
      normal: imageLinks.medium || '',
      large: imageLinks.large || '',
      extraLarge: imageLinks.extraLarge || ''
    };
  }

  formatBookData(data, isbn) {
    const { volumeInfo } = data;
    
    return {
      isbn,
      googleBooksId: data.id,
      etag: data.etag,
      selfLink: data.selfLink,
      titre: this.safeGet(volumeInfo, 'title', ''),
      sousTitre: this.safeGet(volumeInfo, 'subtitle', ''),
      auteurs: this.safeGet(volumeInfo, 'authors', []),
      editeur: this.safeGet(volumeInfo, 'publisher', ''),
      datePublication: this.safeGet(volumeInfo, 'publishedDate', ''),
      description: this.safeGet(volumeInfo, 'description', ''),
      nbPages: this.safeGet(volumeInfo, 'pageCount', '').toString(),
      categories: this.safeGet(volumeInfo, 'categories', []),
      langues: this.safeGet(volumeInfo, 'language', ''),
      images: this.getImageLinks(volumeInfo.imageLinks),
      previewLink: this.safeGet(volumeInfo, 'previewLink', ''),
      infoLink: this.safeGet(volumeInfo, 'infoLink', ''),
      averageRating: this.safeGet(volumeInfo, 'averageRating', null),
      ratingsCount: this.safeGet(volumeInfo, 'ratingsCount', 0)
    };
  }
}

module.exports = BookApiService;