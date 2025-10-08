const playwright = require('playwright');
const logger = require('../utils/logger');

/**
 * Centralized Playwright Service for managing browser instances
 * Provides consistent browser configuration and management across all services
 */
class PlaywrightService {
  constructor() {
    this.activeBrowsers = new Map(); // Track active browsers for cleanup
  }

  /**
   * Launch a Playwright browser with optimal Docker configuration
   * @param {Object} options - Browser launch options
   * @param {boolean} options.headless - Run in headless mode (default: true)
   * @param {Array<string>} options.extraArgs - Additional browser arguments
   * @param {Object} options.contextOptions - Browser context options
   * @param {string} options.identifier - Unique identifier for this browser instance
   * @param {string} options.executablePath - Optional custom executable path
   * @returns {Promise<{browser: Browser, context: BrowserContext, page: Page}>}
   */
  async launchBrowser(options = {}) {
    const {
      headless = true,
      extraArgs = [],
      contextOptions = {},
      identifier = `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executablePath = null
    } = options;

    try {
      // Base arguments optimized for Docker/containerized environments
      const baseArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ];

      // Combine base args with any extra args
      const args = [...baseArgs, ...extraArgs];

      // Determine executable path
      // Priority: 1. Options param, 2. CHROME_PATH (Docker/Alpine), 3. Auto-detect
      const browserExecutablePath = executablePath || 
                                     process.env.CHROME_PATH || 
                                     null;

      logger.info('Browser executable path configuration', { 
        executablePath: browserExecutablePath || 'auto-detect',
        CHROME_PATH: process.env.CHROME_PATH || 'not set',
        PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD || 'not set'
      });

      logger.info('Launching Playwright browser', { 
        identifier, 
        headless, 
        argsCount: args.length,
        executablePath: browserExecutablePath || 'auto-detect'
      });

      // Launch browser configuration
      const launchConfig = {
        headless,
        args,
      };

      // Only add executablePath if explicitly set (best practice is to omit it)
      if (browserExecutablePath) {
        launchConfig.executablePath = browserExecutablePath;
        logger.info('Using custom executable path', { path: browserExecutablePath });
      }

      // Launch browser - Playwright auto-detects if executablePath not set
      const browser = await playwright.chromium.launch(launchConfig);

      // Default context options with sensible defaults
      const defaultContextOptions = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        ...contextOptions
      };

      // Create browser context
      const context = await browser.newContext(defaultContextOptions);

      // Create a new page
      const page = await context.newPage();

      // Track this browser instance
      this.activeBrowsers.set(identifier, { browser, context, page });

      logger.info('Browser launched successfully', { identifier });

      return { browser, context, page, identifier };
    } catch (error) {
      logger.error('Failed to launch Playwright browser', { 
        error: error.message,
        identifier 
      });
      throw new Error(`Failed to launch browser: ${error.message}`);
    }
  }

  /**
   * Launch browser with Fathom-specific configuration
   * @param {Object} options - Additional options
   * @returns {Promise<{browser: Browser, context: BrowserContext, page: Page}>}
   */
  async launchFathomBrowser(options = {}) {
    const fathomArgs = [
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ];

    return this.launchBrowser({
      ...options,
      extraArgs: [...(options.extraArgs || []), ...fathomArgs],
      identifier: options.identifier || `fathom-${Date.now()}`
    });
  }

  /**
   * Launch browser with standard web scraping configuration
   * @param {Object} options - Additional options
   * @returns {Promise<{browser: Browser, context: BrowserContext, page: Page}>}
   */
  async launchScrapingBrowser(options = {}) {
    return this.launchBrowser({
      ...options,
      identifier: options.identifier || `scraping-${Date.now()}`
    });
  }

  /**
   * Safely close a browser instance
   * @param {string} identifier - Browser identifier
   * @param {Browser} browser - Browser instance (optional if identifier is provided)
   */
  async closeBrowser(identifier, browser = null) {
    try {
      if (identifier && this.activeBrowsers.has(identifier)) {
        const browserInstance = this.activeBrowsers.get(identifier);
        await browserInstance.browser.close();
        this.activeBrowsers.delete(identifier);
        logger.info('Browser closed successfully', { identifier });
      } else if (browser) {
        await browser.close();
        logger.info('Browser closed successfully (no identifier)');
      }
    } catch (error) {
      logger.error('Error closing browser', { 
        error: error.message,
        identifier 
      });
      // Don't throw - cleanup should be best effort
    }
  }

  /**
   * Close all active browser instances
   */
  async closeAllBrowsers() {
    const identifiers = Array.from(this.activeBrowsers.keys());
    logger.info(`Closing ${identifiers.length} active browsers`);

    await Promise.allSettled(
      identifiers.map(identifier => this.closeBrowser(identifier))
    );

    this.activeBrowsers.clear();
  }

  /**
   * Get page content with retry logic
   * @param {Page} page - Playwright page instance
   * @param {string} url - URL to navigate to
   * @param {Object} options - Navigation options
   * @returns {Promise<string>} Page content
   */
  async getPageContent(page, url, options = {}) {
    const {
      waitUntil = 'networkidle',
      timeout = 30000,
      retries = 3
    } = options;

    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        logger.info(`Navigating to URL (attempt ${i + 1}/${retries})`, { url });
        
        await page.goto(url, { 
          waitUntil, 
          timeout 
        });

        // Wait a bit for dynamic content
        await page.waitForTimeout(2000);

        const content = await page.content();
        logger.info('Page content retrieved successfully', { 
          url, 
          contentLength: content.length 
        });

        return content;
      } catch (error) {
        lastError = error;
        logger.warn(`Failed to get page content (attempt ${i + 1}/${retries})`, {
          url,
          error: error.message
        });

        if (i < retries - 1) {
          // Wait before retrying
          await page.waitForTimeout(1000 * (i + 1));
        }
      }
    }

    throw new Error(`Failed to get page content after ${retries} attempts: ${lastError.message}`);
  }

  /**
   * Wait for and extract element content
   * @param {Page} page - Playwright page instance
   * @param {string} selector - CSS selector
   * @param {Object} options - Wait options
   * @returns {Promise<string|null>} Element content or null
   */
  async waitForElement(page, selector, options = {}) {
    const { timeout = 10000, extractText = true } = options;

    try {
      await page.waitForSelector(selector, { timeout });
      
      if (extractText) {
        return await page.textContent(selector);
      }
      
      return await page.innerHTML(selector);
    } catch (error) {
      logger.warn(`Element not found: ${selector}`, { error: error.message });
      return null;
    }
  }

  /**
   * Execute JavaScript in page context
   * @param {Page} page - Playwright page instance
   * @param {Function|string} script - Script to execute
   * @returns {Promise<any>} Script result
   */
  async executeScript(page, script) {
    try {
      return await page.evaluate(script);
    } catch (error) {
      logger.error('Failed to execute script', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new PlaywrightService();

