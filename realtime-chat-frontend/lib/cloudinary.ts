import axios from 'axios';

const CLOUDINARY_BASE_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`;

export const cloudinary = axios.create({
  baseURL: CLOUDINARY_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const response = await cloudinary.post('/image/upload', formData);
    console.log(response)

    if (response.data.secure_url) {
      return response.data.secure_url;
    } else {
      throw new Error('Upload failed - no secure URL returned');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};