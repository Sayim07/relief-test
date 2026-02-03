/**
 * Cloudinary Service
 * 
 * Handles media uploads to Cloudinary using unsigned presets.
 */

const CLOUDINARY_CLOUD_NAME = 'db5zllems';
const CLOUDINARY_UPLOAD_PRESET = 'verification_unsigned';

export const cloudinaryService = {
    /**
     * Upload a file (image or video) to Cloudinary
     * @param file The file object to upload
     * @param folder Optional folder path in Cloudinary
     */
    async uploadFile(file: File, folder: string = 'verification_tickets'): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', folder);

        // Determine resource type (image or video)
        const resourceType = file.type.startsWith('image/') ? 'image' : 'video';
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

        try {
            console.log(`[CLOUDINARY] Uploading ${file.type} to ${folder}...`);
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Failed to upload to Cloudinary (Status: ${response.status})`);
            }

            const data = await response.json();
            console.log(`[CLOUDINARY] Upload successful:`, data.secure_url);
            return data.secure_url;
        } catch (error: any) {
            console.error('[CLOUDINARY] Upload error:', error);
            throw error;
        }
    },

    /**
     * Helper to upload multiple files in parallel
     */
    async uploadMultiple(files: File[], folder: string = 'verification_tickets'): Promise<string[]> {
        if (!files || files.length === 0) return [];

        const uploadPromises = files.map(file => this.uploadFile(file, folder));
        return Promise.all(uploadPromises);
    }
};
