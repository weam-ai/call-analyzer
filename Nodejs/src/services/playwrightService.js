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

      // Set default timeout for all page operations (60 seconds)
      // Increased timeout to prevent premature failures on slow pages
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(60000);

      // Track this browser instance
      this.activeBrowsers.set(identifier, { browser, context, page });
      
      logger.info('Browser instance tracked', { 
        identifier,
        activeBrowsersCount: this.activeBrowsers.size,
        allActiveIdentifiers: Array.from(this.activeBrowsers.keys())
      });

      logger.info('Browser launched successfully', { 
        identifier,
        defaultTimeout: '60s',
        navigationTimeout: '60s',
        contextOptions: defaultContextOptions
      });

      return { browser, context, page, identifier };
    } catch (error) {
      logger.error('Failed to launch Playwright browser', { 
        error: error.message,
        errorName: error.name,
        errorStack: error.stack,
        identifier,
        headless,
        executablePath: browserExecutablePath || 'auto-detect'
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
    logger.info('Launching Fathom-specific browser', { 
      hasExtraArgs: !!(options.extraArgs && options.extraArgs.length > 0),
      identifier: options.identifier || `fathom-${Date.now()}`
    });

    const fathomArgs = [
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ];

    logger.info('Fathom browser args configured', { 
      fathomArgsCount: fathomArgs.length,
      fathomArgs 
    });

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
    logger.info('Launching scraping browser', { 
      identifier: options.identifier || `scraping-${Date.now()}`,
      hasContextOptions: !!(options.contextOptions && Object.keys(options.contextOptions).length > 0)
    });

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
    const startTime = Date.now();
    
    try {
      if (identifier && this.activeBrowsers.has(identifier)) {
        logger.info('Closing browser by identifier', { 
          identifier,
          activeBrowsersCount: this.activeBrowsers.size 
        });
        
        const browserInstance = this.activeBrowsers.get(identifier);
        await browserInstance.browser.close();
        this.activeBrowsers.delete(identifier);
        
        const closeTime = Date.now() - startTime;
        logger.info('Browser closed successfully', { 
          identifier,
          closeTime: `${closeTime}ms`,
          remainingActiveBrowsers: this.activeBrowsers.size
        });
      } else if (browser) {
        logger.info('Closing browser without identifier', { 
          activeBrowsersCount: this.activeBrowsers.size 
        });
        
        await browser.close();
        
        const closeTime = Date.now() - startTime;
        logger.info('Browser closed successfully (no identifier)', {
          closeTime: `${closeTime}ms`
        });
      } else {
        logger.warn('No browser to close', { 
          identifier,
          hasIdentifier: !!identifier,
          hasBrowser: !!browser,
          activeBrowsersCount: this.activeBrowsers.size
        });
      }
    } catch (error) {
      const closeTime = Date.now() - startTime;
      logger.error('Error closing browser', { 
        error: error.message,
        errorName: error.name,
        errorStack: error.stack,
        identifier,
        closeTime: `${closeTime}ms`,
        activeBrowsersCount: this.activeBrowsers.size
      });
      // Don't throw - cleanup should be best effort
    }
  }

  /**
   * Close all active browser instances
   */
  async closeAllBrowsers() {
    const startTime = Date.now();
    const identifiers = Array.from(this.activeBrowsers.keys());
    
    logger.info('Closing all active browsers', { 
      activeBrowsersCount: identifiers.length,
      identifiers 
    });

    const results = await Promise.allSettled(
      identifiers.map(identifier => this.closeBrowser(identifier))
    );

    const closeTime = Date.now() - startTime;
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info('All browsers closed', { 
      totalBrowsers: identifiers.length,
      successful,
      failed,
      closeTime: `${closeTime}ms`
    });

    if (failed > 0) {
      logger.warn('Some browsers failed to close', { 
        failed,
        failedResults: results
          .filter(r => r.status === 'rejected')
          .map(r => r.reason?.message || 'Unknown error')
      });
    }

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
      waitUntil = 'domcontentloaded',
      timeout = 45000, // Increased from 20s to 45s
      retries = 3, // Increased from 2 to 3
      dynamicContentDelay = 3000 // Increased from 2s to 3s
    } = options;

    logger.info('Starting getPageContent', { 
      url, 
      waitUntil, 
      timeout, 
      retries,
      dynamicContentDelay 
    });

    let lastError;
    for (let i = 0; i < retries; i++) {
      const attemptStartTime = Date.now();
      try {
        logger.info(`[Attempt ${i + 1}/${retries}] Navigating to URL`, { 
          url,
          timeout: `${timeout}ms`,
          waitUntil 
        });
        
        await page.goto(url, { 
          waitUntil, 
          timeout 
        });

        const navigationTime = Date.now() - attemptStartTime;
        logger.info(`[Attempt ${i + 1}/${retries}] Navigation completed`, { 
          url,
          navigationTime: `${navigationTime}ms` 
        });

        // Wait a bit for dynamic content
        logger.info(`[Attempt ${i + 1}/${retries}] Waiting for dynamic content`, { 
          delay: `${dynamicContentDelay}ms` 
        });
        await page.waitForTimeout(dynamicContentDelay);

        const content = await page.content();
        const totalTime = Date.now() - attemptStartTime;
        
        logger.info(`[Attempt ${i + 1}/${retries}] Page content retrieved successfully`, { 
          url, 
          contentLength: content.length,
          totalTime: `${totalTime}ms`,
          navigationTime: `${navigationTime}ms`
        });

        return content;
      } catch (error) {
        lastError = error;
        const attemptTime = Date.now() - attemptStartTime;
        
        logger.error(`[Attempt ${i + 1}/${retries}] Failed to get page content`, {
          url,
          error: error.message,
          errorName: error.name,
          errorStack: error.stack,
          attemptTime: `${attemptTime}ms`,
          remainingRetries: retries - i - 1
        });

        if (i < retries - 1) {
          const retryDelay = 2000 * (i + 1); // Increased base delay
          logger.info(`[Attempt ${i + 1}/${retries}] Retrying after delay`, { 
            retryDelay: `${retryDelay}ms` 
          });
          await page.waitForTimeout(retryDelay);
        }
      }
    }

    logger.error('All retry attempts exhausted', {
      url,
      totalAttempts: retries,
      finalError: lastError.message,
      finalErrorStack: lastError.stack
    });

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
    const { timeout = 20000, extractText = true } = options; // Increased from 10s to 20s

    const startTime = Date.now();
    logger.info('Waiting for element', { 
      selector, 
      timeout: `${timeout}ms`, 
      extractText 
    });

    try {
      await page.waitForSelector(selector, { timeout });
      const waitTime = Date.now() - startTime;
      
      logger.info('Element found', { 
        selector, 
        waitTime: `${waitTime}ms` 
      });
      
      if (extractText) {
        const text = await page.textContent(selector);
        logger.info('Element text content extracted', { 
          selector, 
          textLength: text ? text.length : 0,
          textPreview: text ? text.substring(0, 100) : null
        });
        return text;
      }
      
      const html = await page.innerHTML(selector);
      logger.info('Element HTML content extracted', { 
        selector, 
        htmlLength: html ? html.length : 0 
      });
      return html;
    } catch (error) {
      const waitTime = Date.now() - startTime;
      logger.warn('Element not found or timeout', { 
        selector, 
        error: error.message,
        errorName: error.name,
        waitTime: `${waitTime}ms`,
        timeout: `${timeout}ms`
      });
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
    const startTime = Date.now();
    const scriptPreview = typeof script === 'string' 
      ? script.substring(0, 100) 
      : script.toString().substring(0, 100);
    
    logger.info('Executing script in page context', { 
      scriptType: typeof script,
      scriptPreview 
    });

    try {
      const result = await page.evaluate(script);
      const executionTime = Date.now() - startTime;
      
      logger.info('Script executed successfully', { 
        executionTime: `${executionTime}ms`,
        resultType: typeof result,
        resultPreview: result ? JSON.stringify(result).substring(0, 200) : null
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Failed to execute script', { 
        error: error.message,
        errorName: error.name,
        errorStack: error.stack,
        executionTime: `${executionTime}ms`,
        scriptPreview
      });
      
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new PlaywrightService();

