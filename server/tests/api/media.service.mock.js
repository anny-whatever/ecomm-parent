// Mock implementation for the media service
const unlinkAsync = jest.fn().mockResolvedValue(undefined);
const statAsync = jest.fn().mockResolvedValue({ size: 123456 });
const { NotFoundError } = require('../../src/utils/errorTypes');
const path = require('path');

const mediaService = {
  // Mock promisified fs functions that are defined at the top level
  unlinkAsync,
  statAsync,
  
  // Service functions
  createMedia: jest.fn().mockImplementation(async (fileData, metadata = {}, userId = null) => {
    const mediaId = 'media_' + Date.now();
    
    return {
      _id: mediaId,
      filename: fileData.originalname || 'test-image.jpg',
      originalFilename: fileData.originalname || 'test-image.jpg',
      mimetype: fileData.mimetype || 'image/jpeg',
      size: fileData.size || 12345,
      path: fileData.path || 'uploads/test-image.jpg',
      optimizedPath: fileData.optimizedPath || 'uploads/test-image-optimized.jpg',
      thumbnailPath: fileData.thumbnailPath || 'uploads/test-image-thumb.jpg',
      type: 'image',
      uploadedBy: userId,
      metadata: metadata || {},
      alt: metadata?.alt,
      title: metadata?.title,
      caption: metadata?.caption,
      tags: metadata?.tags || [],
      folder: metadata?.folder || 'default',
      isPublic: metadata?.isPublic !== undefined ? metadata.isPublic : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }),
  deleteMedia: jest.fn().mockImplementation(async (mediaId) => {
    if (!mediaId) {
      throw new NotFoundError('Media not found');
    }
    
    return true;
  }),
  getMediaById: jest.fn().mockImplementation(async (mediaId) => {
    if (!mediaId) {
      throw new NotFoundError('Media not found');
    }
    
    return {
      _id: mediaId,
      filename: 'test-image.jpg',
      originalFilename: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 12345,
      path: 'uploads/test-image.jpg',
      type: 'image',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }),
  updateMedia: jest.fn().mockImplementation(async (mediaId, updateData) => {
    if (!mediaId) {
      throw new NotFoundError('Media not found');
    }
    
    return {
      _id: mediaId,
      filename: 'test-image.jpg',
      originalFilename: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 12345,
      path: 'uploads/test-image.jpg',
      type: 'image',
      isPublic: true,
      ...updateData,
      updatedAt: new Date()
    };
  }),
  listMedia: jest.fn().mockImplementation(async (filters = {}, options = {}) => {
    return {
      media: [
        {
          _id: 'media_1',
          filename: 'test-image-1.jpg',
          originalFilename: 'test-image-1.jpg',
          mimetype: 'image/jpeg',
          size: 12345,
          path: 'uploads/test-image-1.jpg',
          type: 'image',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: 'media_2',
          filename: 'test-image-2.jpg',
          originalFilename: 'test-image-2.jpg',
          mimetype: 'image/jpeg',
          size: 12345,
          path: 'uploads/test-image-2.jpg',
          type: 'image',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10,
        totalDocs: 2,
        totalPages: 1
      }
    };
  }),
  getMediaByContent: jest.fn().mockResolvedValue([
    {
      _id: 'media_content_1',
      url: 'http://localhost:3001/uploads/content-image.jpg',
      mimeType: 'image/jpeg',
      size: 12345,
      metadata: {},
      createdAt: new Date()
    }
  ]),
  getMediaByProduct: jest.fn().mockResolvedValue([
    {
      _id: 'media_product_1',
      url: 'http://localhost:3001/uploads/product-image.jpg',
      mimeType: 'image/jpeg',
      size: 12345,
      metadata: {},
      createdAt: new Date()
    }
  ]),
  getMediaFolders: jest.fn().mockResolvedValue(['products', 'blog', 'users']),
  getMediaTags: jest.fn().mockResolvedValue(['featured', 'hero', 'thumbnail']),
  getMediaStats: jest.fn().mockResolvedValue({
    totalCount: 100,
    totalSize: 1024000,
    typeDistribution: {
      image: 80,
      video: 10,
      document: 8,
      other: 2
    }
  }),
  processAndSaveImage: jest.fn().mockImplementation(async (file, options = {}) => {
    // Mock processing image and return processed file info
    const filename = path.parse(file.originalname).name;
    const outputPath = `uploads/${filename}-${Date.now()}.webp`;
    const thumbnailPath = `uploads/${filename}-${Date.now()}-thumb.webp`;
    
    return {
      path: outputPath,
      thumbnailPath: thumbnailPath,
      mimetype: 'image/webp',
      size: 10000
    };
  })
};

module.exports = mediaService; 