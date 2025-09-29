const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/backend-config');
const logger = require('./logger');

class FileUtils {
  static async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
  }

  static async saveFile(file, subDir = '') {
    try {
      const uploadDir = path.join(config.uploadPath, subDir);
      await this.ensureDirectoryExists(uploadDir);

      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, file.buffer);
      
      logger.info(`File saved: ${fileName}`);
      
      return {
        fileName,
        filePath,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      };
    } catch (error) {
      logger.error('Error saving file:', error);
      throw new Error('Failed to save file');
    }
  }

  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to delete file: ${filePath}`, error.message);
    }
  }

  static async cleanupTempFiles(tempDir = config.tempPath) {
    try {
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          logger.info(`Cleaned up old temp file: ${file}`);
        }
      }
    } catch (error) {
      logger.warn('Error cleaning up temp files:', error.message);
    }
  }

  static async readTextFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      logger.error('Error reading text file:', error);
      throw new Error('Failed to read file');
    }
  }

  static async writeTextFile(filePath, content) {
    try {
      await fs.writeFile(filePath, content, 'utf8');
      logger.info(`Text file written: ${filePath}`);
    } catch (error) {
      logger.error('Error writing text file:', error);
      throw new Error('Failed to write file');
    }
  }

  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  static isValidAudioFile(filename) {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
    return audioExtensions.includes(this.getFileExtension(filename));
  }

  static isValidDocumentFile(filename) {
    const docExtensions = ['.pdf', '.txt', '.doc', '.docx'];
    return docExtensions.includes(this.getFileExtension(filename));
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = FileUtils;
