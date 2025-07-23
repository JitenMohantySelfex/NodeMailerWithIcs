import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

// Configuration
const CONFIG = {
  email: "jiten91.dcs@gmail.com",
  password: "Jitu451234@",
  location: "900 Market St San Francisco, CA 94102, USA",
  headless: false,
  timeout: 30000,
};

// Global data storage
let scrapedData = {
  restaurants: [],
  orders: [],
  userProfile: {},
  scrapedAt: new Date().toISOString(),
};

// Wait for any of multiple selectors
async function waitForAnySelector(page, selectors, timeout = 10000) {
  const promises = selectors.map((selector) =>
    page.waitForSelector(selector, { timeout }).catch(() => null)
  );

  try {
    const result = await Promise.race(promises);
    return result;
  } catch (error) {
    console.log("⚠️ None of the selectors were found:", selectors);
    return null;
  }
}

// Helper function to wait for a specified time
async function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wait for element to be ready for interaction
async function waitForElementReady(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    
    // Wait for element to be visible and interactable
    await page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return (
          element.offsetParent !== null && // Element is visible
          !element.disabled && // Element is not disabled
          !element.readOnly && // Element is not readonly
          rect.width > 0 && rect.height > 0 && // Element has dimensions
          style.visibility !== 'hidden' && // Element is not hidden
          style.display !== 'none' && // Element is not display none
          style.opacity !== '0' // Element is not transparent
        );
      },
      { timeout: 10000 },
      selector
    );
    
    return true;
  } catch (error) {
    console.log(`⚠️ Element not ready: ${selector} - ${error.message}`);
    return false;
  }
}

// Enhanced typing function with better waiting
async function typeWithWait(page, selector, text, options = {}) {
  const { delay = 100, clearFirst = true, waitTime = 1000, retries = 3 } = options;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${retries} to type into ${selector}`);
      
      // Wait for element to be ready
      const isReady = await waitForElementReady(page, selector, 15000);
      if (!isReady) {
        if (attempt === retries) {
          throw new Error(`Element not ready after ${retries} attempts: ${selector}`);
        }
        console.log(`⚠️ Element not ready, retrying in 2 seconds...`);
        await waitFor(2000);
        continue;
      }

      // Scroll element into view
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, selector);
      
      await waitFor(1000);

      // Focus the element multiple times to ensure it's active
      await page.focus(selector);
      await waitFor(500);
      await page.click(selector);
      await waitFor(waitTime);

      // Clear existing text if needed
      if (clearFirst) {
        await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (element) {
            element.value = '';
            element.focus();
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, selector);
        await waitFor(500);
      }

      // Type the text character by character
      for (let i = 0; i < text.length; i++) {
        await page.keyboard.type(text[i]);
        await waitFor(delay);
      }
      
      await waitFor(waitTime);

      // Verify the text was entered
      const enteredText = await page.$eval(selector, el => el.value || el.textContent || '');
      if (enteredText.trim() === text.trim()) {
        console.log(`✅ Successfully typed into ${selector}`);
        return true;
      } else {
        console.log(`⚠️ Text verification failed. Expected: "${text}", Got: "${enteredText}"`);
        if (attempt === retries) {
          throw new Error(`Text verification failed after ${retries} attempts`);
        }
        await waitFor(2000);
        continue;
      }

    } catch (error) {
      console.error(`❌ Error typing into ${selector} (attempt ${attempt}):`, error.message);
      if (attempt === retries) {
        return false;
      }
      await waitFor(2000);
    }
  }
  
  return false;
}

// Enhanced click function with better waiting
async function clickWithWait(page, selector, options = {}) {
  const { waitTime = 1000, timeout = 10000 } = options;
  
  try {
    // Wait for element to be ready
    const isReady = await waitForElementReady(page, selector, timeout);
    if (!isReady) {
      throw new Error(`Element not ready for clicking: ${selector}`);
    }

    // Scroll element into view if needed
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, selector);
    
    await waitFor(waitTime);

    // Click the element
    await page.click(selector);
    await waitFor(waitTime);

    console.log(`✅ Successfully clicked ${selector}`);
    return true;
  } catch (error) {
    console.error(`❌ Error clicking ${selector}:`, error.message);
    return false;
  }
}

// Take screenshot for debugging
async function takeScreenshot(page, filename) {
  try {
    const screenshotDir = path.join(process.cwd(), "screenshots");
    await fs.mkdir(screenshotDir, { recursive: true });

    const screenshotPath = path.join(screenshotDir, filename);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.log("❌ Error taking screenshot:", error.message);
  }
}

// Auto scroll function
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Initialize browser
async function initBrowser() {
  console.log("🚀 Step 1: Launching browser...");
  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  // Remove automation indicators
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  return { browser, page };
}

async function loginToDoorDash(page, email, password) {
  try {
    console.log("🔐 Step 2: Navigating to DoorDash login page...");
    await page.goto("https://www.doordash.com/consumer/login", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for page to fully load
    await waitFor(3000);
    await takeScreenshot(page, "login-page.png");

    console.log("📝 Step 3: Looking for email input...");
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[data-testid="email-input"]',
      'input[placeholder*="email"]',
      'input[id*="email"]',
      'input[autocomplete="email"]'
    ];

    // Try each selector until one works
    let emailTyped = false;
    let workingEmailSelector = null;
    
    for (const selector of emailSelectors) {
      console.log(`🔍 Trying email selector: ${selector}`);
      const element = await page.$(selector);
      if (element) {
        console.log(`✅ Found email element with selector: ${selector}`);
        workingEmailSelector = selector;
        emailTyped = await typeWithWait(page, selector, email, {
          delay: 150,
          waitTime: 1500,
          retries: 3
        });
        if (emailTyped) {
          break;
        }
      }
    }
    
    if (!emailTyped) {
      throw new Error("Failed to type email with any selector");
    }

    await takeScreenshot(page, "email-entered.png");

    console.log("👆 Looking for continue button...");
    const continueSelectors = [
      "#guided-submit-button",
      'button[type="submit"]',
      'button[data-testid="login-button"]',
      'button[data-testid="submit-button"]',
      'input[type="submit"]',
      'button[aria-label*="Continue"]',
      'button[aria-label*="Submit"]',
      'button:has-text("Continue")',
      'button:has-text("Submit")',
      ".login-button",
      ".submit-button",
    ];

    let continueClicked = false;
    let workingContinueSelector = null;
    
    for (const selector of continueSelectors) {
      console.log(`🔍 Trying continue button selector: ${selector}`);
      const element = await page.$(selector);
      if (element) {
        console.log(`✅ Found continue button with selector: ${selector}`);
        workingContinueSelector = selector;
        continueClicked = await clickWithWait(page, selector, {
          waitTime: 2000,
          timeout: 10000
        });
        if (continueClicked) {
          break;
        }
      }
    }
    
    if (!continueClicked) {
      throw new Error("Failed to click continue button with any selector");
    }

    await takeScreenshot(page, "continue-clicked.png");

    console.log("🔍 Looking for password input...");
    const passwordSelectors = [
      'input[data-anchor-id="IdentityLoginPagePasswordField"]',
      'input[name="password"]',
      'input[type="password"]',
      'input[data-testid="password-input"]',
      'input[placeholder*="password"]',
      'input[id*="password"]',
      'input[autocomplete="current-password"]'
    ];
    
    // Wait longer for password input and try multiple selectors
    let passwordInput = null;
    let workingPasswordSelector = null;
    
    for (let i = 0; i < 10; i++) { // Try for up to 20 seconds
      for (const selector of passwordSelectors) {
        passwordInput = await page.$(selector);
        if (passwordInput) {
          workingPasswordSelector = selector;
          console.log(`✅ Found password input with selector: ${selector}`);
          break;
        }
      }
      if (passwordInput) break;
      console.log(`⏳ Waiting for password input... attempt ${i + 1}/10`);
      await waitFor(2000);
    }

    if (!passwordInput) {
      throw new Error("❌ Password input not found after multiple attempts");
    }

    console.log("✅ Password input found, typing password...");
    const passwordTyped = await typeWithWait(page, workingPasswordSelector, password, {
      delay: 150,
      waitTime: 1500,
      retries: 3
    });
    
    if (!passwordTyped) {
      throw new Error("Failed to type password");
    }

    await takeScreenshot(page, "password-entered.png");

    console.log("👆 Looking for login submit button...");
    const loginSubmitSelectors = [
      "#login-submit-button",
      'button[type="submit"]',
      'button[data-testid="submit-button"]',
      'button[data-testid="login-submit-button"]',
      'input[type="submit"]',
      'button[aria-label*="Sign in"]',
      'button[aria-label*="Log in"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
      'button:has-text("Login")'
    ];
    
    let loginClicked = false;
    let workingLoginSelector = null;
    
    for (const selector of loginSubmitSelectors) {
      console.log(`🔍 Trying login submit selector: ${selector}`);
      const element = await page.$(selector);
      if (element) {
        console.log(`✅ Found login submit button with selector: ${selector}`);
        workingLoginSelector = selector;
        loginClicked = await clickWithWait(page, selector, {
          waitTime: 2000,
          timeout: 10000
        });
        if (loginClicked) {
          break;
        }
      }
    }
    
    if (!loginClicked) {
      throw new Error("Failed to click login submit button with any selector");
    }

    await takeScreenshot(page, "login-submitted.png");

    // Wait for homepage to load with multiple possible indicators
    console.log("⏳ Waiting for homepage to load...");
    const homePageSelectors = [
      '[data-testid="home-page"]',
      'button[data-testid="addressTextButton"]',
      '[data-testid="search-input"]',
      '.homepage-content',
      '[data-anchor-id="StoreCard"]',
      '[data-testid="store-search-input"]',
      '.DashPass-label'
    ];

    let homePageLoaded = null;
    
    // Try waiting for homepage elements for up to 30 seconds
    for (let i = 0; i < 50; i++) {
      homePageLoaded = await waitForAnySelector(page, homePageSelectors, 2000);
      if (homePageLoaded) {
        break;
      }
      console.log(`⏳ Still waiting for homepage... attempt ${i + 1}/15`);
      await waitFor(2000);
    }

    if (!homePageLoaded) {
      // Check for error messages
      const errorSelectors = [
        '[data-testid="error-message"]',
        '.error-message',
        '[role="alert"]',
        '.alert-error',
        '.ErrorMessage',
        '[data-testid="login-error"]'
      ];
      
      const errorElement = await waitForAnySelector(page, errorSelectors, 3000);
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        throw new Error(`Login error: ${errorText}`);
      }
      
      throw new Error("Homepage did not load after login");
    }

    await takeScreenshot(page, "homepage-loaded.png");

    // Additional verification - check URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('login')) {
      throw new Error("Still on login page - login may have failed");
    }

    console.log("✅ Successfully logged in and reached homepage!");
    return true;
  } catch (error) {
    console.error("❌ Login failed:", error.message);
    await takeScreenshot(page, "login-error.png");
    return false;
  }
}

async function addAddress(page, address) {
  console.log("🏠 Step 4: Adding address...");

  try {
    // Wait for address button to show up
    const addressButton = await page.waitForSelector(
      'button[data-testid="addressTextButton"]',
      {
        timeout: 15000,
      }
    );

    console.log("📍 Address button found, clicking...");
    const addressClicked = await clickWithWait(page, 'button[data-testid="addressTextButton"]', {
      waitTime: 2000
    });
    
    if (!addressClicked) {
      throw new Error("Failed to click address button");
    }

    // Wait for the address input modal to show up
    const addressInputSelector = 'input[placeholder*="Enter address"]';
    await page.waitForSelector(addressInputSelector, {
      timeout: 10000,
    });

    console.log("📥 Address input appeared, typing address...");
    const addressTyped = await typeWithWait(page, addressInputSelector, CONFIG.location, {
      delay: 150,
      waitTime: 2000
    });
    
    if (!addressTyped) {
      throw new Error("Failed to type address");
    }

    // Wait for suggestions to appear
    await page.waitForTimeout(3000);
    
    const suggestionSelector = 'li[data-anchor-id^="AddressSuggestion"]';
    const suggestion = await page.waitForSelector(suggestionSelector, {
      timeout: 10000
    });
    
    if (!suggestion) {
      throw new Error("📭 No address suggestion found");
    }

    console.log("📌 Selecting address suggestion...");
    const suggestionClicked = await clickWithWait(page, suggestionSelector, {
      waitTime: 3000
    });
    
    if (!suggestionClicked) {
      throw new Error("Failed to click address suggestion");
    }

    // Wait for location to finalize
    await page.waitForTimeout(5000);
    
    await takeScreenshot(page, "address-set.png");
    console.log("✅ Address successfully set!");
    return true;
  } catch (err) {
    console.error("❌ Error adding address:", err.message);
    await takeScreenshot(page, "address-error.png");
    return false;
  }
}

async function scrapeGroceryLinks(page) {
  try {
    console.log("🛒 Step 5: Navigating to grocery page...");

    await page.goto("https://www.doordash.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await page.goto("https://www.doordash.com/tabs/grocery", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await takeScreenshot(page, "grocery-page.png");

    console.log("🔍 Looking for store links...");
   await page.waitForSelector('[data-anchor-id="StoreCard"]', {
  timeout: 20000,
});

// Scroll to load all content
await autoScroll(page);

// Extract all store links
const storeLinks = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('[data-anchor-id="StoreCard"]'));
  return links.map((link) => ({
    href: link.href.startsWith("/") ? "https://www.doordash.com" + link.getAttribute("href") : link.href,
    text: link.textContent.trim(),
    title: link.title || "",
  }));
});

    console.log(`✅ Found ${storeLinks.length} store links`);

    // Store the results
    scrapedData.groceryStores = storeLinks;

    return storeLinks;
  } catch (error) {
    console.error("❌ Error scraping grocery links:", error.message);
    await takeScreenshot(page, "grocery-error.png");
    return [];
  }
}

// Save data to JSON
async function saveToJSON(filename = "doordash_grocery_data.json") {
  try {
    console.log("💾 Saving data to JSON...");
    const dataDir = path.join(process.cwd(), "scraped-data");

    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(scrapedData, null, 2));

    console.log(`✅ Data saved to: ${filePath}`);
    console.log(`📊 Total grocery stores scraped: ${scrapedData.groceryStores?.length || 0}`);
  } catch (error) {
    console.error("❌ Error saving data:", error.message);
  }
}

async function scrapeDoorDash() {
  let browser = null;
  try {
    // Initialize browser
    const { browser: browserInstance, page } = await initBrowser();
    browser = browserInstance;

    // Login with password flow
    const loginSuccess = await loginToDoorDash(
      page,
      CONFIG.email,
      CONFIG.password
    );
    if (!loginSuccess) {
      throw new Error("Login failed - please check your credentials and try again");
    }

    console.log("✅ Logged in successfully and reached homepage.");

    // ✅ Go to grocery tab now
    const storeLinks = await scrapeGroceryLinks(page);
    if (storeLinks.length === 0) {
      console.log("⚠️ No store links found on grocery page");
    }

    // Save to JSON
    await saveToJSON();

    console.log("🎉 Grocery scraping completed successfully!");
  } catch (error) {
    console.error("❌ Scraping failed:", error.message);
    console.log("💡 Check the screenshots folder for debugging information");
  } finally {
    console.log("🔒 Closing browser...");
    if (browser) {
      await browser.close();
    }
  }
}

scrapeDoorDash();