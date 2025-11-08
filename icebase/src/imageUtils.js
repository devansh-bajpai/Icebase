import io from 'socket.io-client';

/**
 * Validates if a blob is an image by checking its MIME type
 * @param {Blob} blob - The blob to validate
 * @returns {boolean} - True if the blob is an image, false otherwise
 */
const isValidImage = (blob) => {
  return blob.type.startsWith('image/');
};

/**
 * Converts a blob to base64 string
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} - Promise that resolves to base64 string
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Fetches an image from a URL and converts it to a blob
 * @param {string} imageUrl - The URL of the image to fetch
 * @returns {Promise<Blob>} - Promise that resolves to the image blob
 * @throws {Error} - If the URL doesn't point to a valid image
 */
const fetchImageAsBlob = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    if (!isValidImage(blob)) {
      throw new Error('The URL does not point to a valid image file');
    }

    return blob;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Failed to fetch image. This might be a CORS issue.');
    }
    throw error;
  }
};

/**
 * Sends an image blob through socket to the backend
 * @param {string} imageUrl - The URL of the image to send
 * @param {string} backendUrl - The backend socket URL (default: "http://localhost:5000")
 * @param {string} eventName - The socket event name to emit (default: "verify_face")
 * @returns {Promise<void>} - Promise that resolves when the image is sent
 * @throws {Error} - If image fetching, validation, or socket communication fails
 */
export const sendImageToVerify = async (
  imageUrl,
  backendUrl = "http://localhost:5000",
  eventName = "findUserWithImage"
) => {
  if (!imageUrl) {
    throw new Error('Image URL is required');
  }

  // Validate URL format
  try {
    new URL(imageUrl);
  } catch (error) {
    throw new Error('Invalid URL format');
  }

  // Fetch and validate image
  const blob = await fetchImageAsBlob(imageUrl);
  
  // Convert blob to base64 for socket transmission
  const base64Image = await blobToBase64(blob);

  // Create socket connection
  const socket = io(backendUrl, {
    transports: ['websocket'],
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket connection timeout'));
    }, 15000);

    socket.on('connect', () => {
      console.log('Connected to backend socket');
      
      // Send image data
      socket.emit(eventName, { image: base64Image });
      
      // Wait a moment to ensure data is sent, then disconnect
      setTimeout(() => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve();
      }, 100);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`Failed to connect to backend: ${error.message}`));
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`Socket error: ${error.message || error}`));
    });
  });
};

/**
 * Alternative function that keeps the socket connection open for multiple sends
 * Returns a function that can be used to send multiple images
 * @param {string} backendUrl - The backend socket URL (default: "http://localhost:5000")
 * @param {string} eventName - The socket event name to emit (default: "verify_face")
 * @returns {Object} - Object with send method and disconnect method
 */
export const createImageSocketSender = (
  backendUrl = "http://localhost:5000",
  eventName = "findUserWithImage"
) => {
  const socket = io(backendUrl, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('Connected to backend socket');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from backend socket');
  });

  return {
    /**
     * Sends an image URL through the socket
     * @param {string} imageUrl - The URL of the image to send
     * @returns {Promise<void>} - Promise that resolves when the image is sent
     */
    send: async (imageUrl) => {
      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      try {
        new URL(imageUrl);
      } catch (error) {
        throw new Error('Invalid URL format');
      }

      if (!socket.connected) {
        throw new Error('Socket is not connected');
      }

      const blob = await fetchImageAsBlob(imageUrl);
      const base64Image = await blobToBase64(blob);
      socket.emit(eventName, { image: base64Image });
    },

    /**
     * Disconnects the socket
     */
    disconnect: () => {
      socket.disconnect();
    },

    /**
     * Gets the socket instance for advanced usage
     * @returns {Socket} - The socket.io socket instance
     */
    getSocket: () => socket,
  };
};

