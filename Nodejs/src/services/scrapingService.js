const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

/**
 * Generic Web Scraping Service
 * Provides lightweight, fast scraping for product/service URLs and general website content
 * Uses axios + cheerio for efficient HTML parsing without browser overhead
 */
class ScrapingService {
  constructor() {
    this.defaultConfig = {
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };
  }

  /**
   * Scrape website content from URL
   * @param {string} url - The URL to scrape
   * @param {Object} options - Scraping options
   * @returns {Promise<Object>} Scraped content with metadata
   */
  async scrapeWebsite(url, options = {}) {
    const {
      timeout = this.defaultConfig.timeout,
      maxRedirects = this.defaultConfig.maxRedirects,
      retries = 3,
      includeMetadata = true,
      cleanContent = true
    } = options;

    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info(`Scraping website (attempt ${attempt}/${retries})`, { url });

        // Ensure URL has proper protocol
        const normalizedUrl = this.normalizeUrl(url);

        // Fetch the HTML content
        const response = await axios.get(normalizedUrl, {
          timeout,
          maxRedirects,
          headers: this.defaultConfig.headers,
          validateStatus: (status) => status >= 200 && status < 400
        });

        // Parse HTML with cheerio
        const $ = cheerio.load(response.data);

        // Extract content
        const content = this.extractContent($, cleanContent);

        // Extract metadata if requested
        const metadata = includeMetadata ? this.extractMetadata($, normalizedUrl) : {};

        // Calculate word count
        const wordCount = content.text.split(/\s+/).filter(word => word.length > 0).length;

        logger.info('Website scraped successfully', {
          url: normalizedUrl,
          contentLength: content.text.length,
          wordCount,
          title: metadata.title
        });

        return {
          success: true,
          url: normalizedUrl,
          text: content.text,
          html: content.html,
          title: metadata.title || '',
          description: metadata.description || '',
          keywords: metadata.keywords || [],
          headings: content.headings || [],
          links: content.links || [],
          images: content.images || [],
          wordCount,
          scrapedAt: new Date().toISOString()
        };

      } catch (error) {
        lastError = error;
        logger.warn(`Scraping attempt ${attempt} failed for ${url}:`, {
          error: error.message,
          code: error.code
        });

        if (attempt < retries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    logger.error(`Failed to scrape website after ${retries} attempts:`, {
      url,
      error: lastError.message
    });

    throw new Error(`Failed to scrape website: ${lastError.message}`);
  }

  /**
   * Normalize URL to ensure it has proper protocol
   * @param {string} url - The URL to normalize
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    if (!url) {
      throw new Error('URL is required');
    }

    let normalized = url.trim();

    // Add https:// if no protocol is specified
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = `https://${normalized}`;
    }

    return normalized;
  }

  /**
   * Extract main content from the page
   * @param {CheerioStatic} $ - Cheerio instance
   * @param {boolean} cleanContent - Whether to clean the content
   * @returns {Object} Extracted content
   */
  extractContent($, cleanContent = true) {
    // Remove unwanted elements
    if (cleanContent) {
      $('script, style, nav, header, footer, aside, .navigation, .menu, .sidebar, .advertisement, .ad, .cookie-notice, .popup, .modal').remove();
    }

    // Try to find main content area with priority order
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
      '.page-content',
      'body'
    ];

    let contentElement = null;
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        contentElement = element.first();
        break;
      }
    }

    if (!contentElement) {
      contentElement = $('body');
    }

    // Extract text content
    const text = contentElement.text()
      .replace(/\s+/g, ' ')
      .trim();

    // Extract HTML content
    const html = contentElement.html() || '';

    // Extract headings
    const headings = [];
    contentElement.find('h1, h2, h3, h4, h5, h6').each((i, elem) => {
      const level = elem.tagName.toLowerCase();
      const text = $(elem).text().trim();
      if (text) {
        headings.push({ level, text });
      }
    });

    // Extract links
    const links = [];
    contentElement.find('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      if (href && text) {
        links.push({ href, text });
      }
    });

    // Extract images
    const images = [];
    contentElement.find('img[src]').each((i, elem) => {
      const src = $(elem).attr('src');
      const alt = $(elem).attr('alt') || '';
      if (src) {
        images.push({ src, alt });
      }
    });

    return {
      text,
      html,
      headings: headings.slice(0, 20), // Limit to first 20 headings
      links: links.slice(0, 50), // Limit to first 50 links
      images: images.slice(0, 20) // Limit to first 20 images
    };
  }

  /**
   * Extract metadata from the page
   * @param {CheerioStatic} $ - Cheerio instance
   * @param {string} url - The page URL
   * @returns {Object} Extracted metadata
   */
  extractMetadata($, url) {
    // Extract title
    const title = $('title').text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  '';

    // Extract description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="twitter:description"]').attr('content') ||
                       '';

    // Extract keywords
    const keywordsContent = $('meta[name="keywords"]').attr('content') || '';
    const keywords = keywordsContent
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    // Extract canonical URL
    const canonical = $('link[rel="canonical"]').attr('href') || url;

    // Extract language
    const language = $('html').attr('lang') ||
                    $('meta[http-equiv="content-language"]').attr('content') ||
                    'en';

    // Extract author
    const author = $('meta[name="author"]').attr('content') ||
                  $('meta[property="article:author"]').attr('content') ||
                  '';

    // Extract Open Graph data
    const ogData = {
      type: $('meta[property="og:type"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      siteName: $('meta[property="og:site_name"]').attr('content') || ''
    };

    return {
      title,
      description,
      keywords,
      canonical,
      language,
      author,
      ogData
    };
  }

  /**
   * Scrape multiple URLs in parallel
   * @param {Array<string>} urls - Array of URLs to scrape
   * @param {Object} options - Scraping options
   * @returns {Promise<Array<Object>>} Array of scraped results
   */
  async scrapeMultiple(urls, options = {}) {
    const {
      concurrency = 3,
      continueOnError = true
    } = options;

    logger.info(`Scraping ${urls.length} URLs with concurrency ${concurrency}`);

    const results = [];
    const chunks = [];

    // Split URLs into chunks based on concurrency
    for (let i = 0; i < urls.length; i += concurrency) {
      chunks.push(urls.slice(i, i + concurrency));
    }

    // Process each chunk
    for (const chunk of chunks) {
      const promises = chunk.map(url =>
        this.scrapeWebsite(url, options)
          .catch(error => {
            if (continueOnError) {
              logger.warn(`Failed to scrape ${url}, continuing...`, { error: error.message });
              return {
                success: false,
                url,
                error: error.message
              };
            }
            throw error;
          })
      );

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    const successful = results.filter(r => r.success).length;
    logger.info(`Scraping complete: ${successful}/${urls.length} successful`);

    return results;
  }

  /**
   * Extract specific content using CSS selectors
   * @param {string} url - The URL to scrape
   * @param {Array<Object>} selectors - Array of selector objects
   * @returns {Promise<Object>} Extracted content
   */
  async scrapeWithSelectors(url, selectors) {
    try {
      logger.info('Scraping with custom selectors', { url, selectorCount: selectors.length });

      const normalizedUrl = this.normalizeUrl(url);
      const response = await axios.get(normalizedUrl, {
        timeout: this.defaultConfig.timeout,
        headers: this.defaultConfig.headers
      });

      const $ = cheerio.load(response.data);
      const results = {};

      for (const { name, selector, type = 'text', multiple = false } of selectors) {
        try {
          if (multiple) {
            // Extract multiple elements
            const elements = [];
            $(selector).each((i, elem) => {
              if (type === 'text') {
                elements.push($(elem).text().trim());
              } else if (type === 'html') {
                elements.push($(elem).html());
              } else if (type === 'attr') {
                elements.push($(elem).attr(selector.attr));
              }
            });
            results[name] = elements;
          } else {
            // Extract single element
            const element = $(selector).first();
            if (type === 'text') {
              results[name] = element.text().trim();
            } else if (type === 'html') {
              results[name] = element.html();
            } else if (type === 'attr') {
              results[name] = element.attr(selector.attr);
            }
          }
        } catch (error) {
          logger.warn(`Failed to extract ${name} with selector ${selector}:`, error.message);
          results[name] = multiple ? [] : null;
        }
      }

      logger.info('Custom selector scraping complete', { url, extractedFields: Object.keys(results).length });

      return {
        success: true,
        url: normalizedUrl,
        data: results
      };

    } catch (error) {
      logger.error('Scraping with selectors failed:', error);
      throw new Error(`Failed to scrape with selectors: ${error.message}`);
    }
  }

  /**
   * Test if a URL is accessible
   * @param {string} url - The URL to test
   * @returns {Promise<Object>} Accessibility test result
   */
  async testUrl(url) {
    try {
      const normalizedUrl = this.normalizeUrl(url);
      const startTime = Date.now();

      const response = await axios.head(normalizedUrl, {
        timeout: 10000,
        headers: this.defaultConfig.headers,
        validateStatus: (status) => status >= 200 && status < 500
      });

      const responseTime = Date.now() - startTime;

      return {
        success: response.status >= 200 && response.status < 400,
        url: normalizedUrl,
        statusCode: response.status,
        statusText: response.statusText,
        responseTime,
        contentType: response.headers['content-type'],
        accessible: response.status >= 200 && response.status < 400
      };

    } catch (error) {
      return {
        success: false,
        url,
        error: error.message,
        accessible: false
      };
    }
  }
}

// Export singleton instance
module.exports = new ScrapingService();

