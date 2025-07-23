// import puppeteer from "puppeteer";
// import fs from "fs/promises";
// import path from "path";

// // Configuration
// const CONFIG = {
//   email: "jiten91.dcs@gmail.com",
//   password: "Jitu451234@",
//   location: "900 Market St San Francisco, CA 94102, USA",
//   headless: false, // Set to true for headless operation
//   timeout: 90000, // Increased global timeout to 90 seconds
// };

// // Global data storage
// let scrapedData = {
//   restaurants: [],
//   orders: [],
//   userProfile: {},
//   groceryStores: [], // To store basic grocery store links
//   groceryProducts: {}, // Changed to an object to store products by storeId
//   scrapedAt: new Date().toISOString(),
// };

// // Wait for any of multiple selectors
// async function waitForAnySelector(page, selectors, timeout = 10000) {
//   const promises = selectors.map((selector) =>
//     page.waitForSelector(selector, { timeout }).catch(() => null)
//   );

//   try {
//     const result = await Promise.race(promises);
//     return result;
//   } catch (error) {
//     console.log("⚠️ None of the selectors were found:", selectors);
//     return null;
//   }
// }

// // Helper function to wait for a specified time
// async function waitFor(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// // Wait for element to be ready for interaction
// async function waitForElementReady(page, selector, timeout = 10000) {
//   try {
//     await page.waitForSelector(selector, { timeout });
    
//     // Wait for element to be visible and interactable
//     await page.waitForFunction(
//       (sel) => {
//         const element = document.querySelector(sel);
//         if (!element) return false;
        
//         const rect = element.getBoundingClientRect();
//         const style = window.getComputedStyle(element);
        
//         return (
//           element.offsetParent !== null && // Element is visible
//           !element.disabled && // Element is not disabled
//           !element.readOnly && // Element is not readonly
//           rect.width > 0 && rect.height > 0 && // Element has dimensions
//           style.visibility !== 'hidden' && // Element is not hidden
//           style.display !== 'none' && // Element is not display none
//           style.opacity !== '0' // Element is not transparent
//         );
//       },
//       { timeout: timeout }, // Use passed timeout for function as well
//       selector
//     );
    
//     return true;
//   } catch (error) {
//     console.log(`⚠️ Element not ready: ${selector} - ${error.message}`);
//     return false;
//   }
// }

// // Enhanced typing function with better waiting
// async function typeWithWait(page, selector, text, options = {}) {
//   const { delay = 100, clearFirst = true, waitTime = 1000, retries = 3 } = options;
  
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       console.log(`🔄 Attempt ${attempt}/${retries} to type into ${selector}`);
      
//       // Wait for element to be ready
//       const isReady = await waitForElementReady(page, selector, 15000);
//       if (!isReady) {
//         if (attempt === retries) {
//           throw new Error(`Element not ready after ${retries} attempts: ${selector}`);
//         }
//         console.log(`⚠️ Element not ready, retrying in 2 seconds...`);
//         await waitFor(2000);
//         continue;
//       }

//       // Scroll element into view
//       await page.evaluate((sel) => {
//         const element = document.querySelector(sel);
//         if (element) {
//           element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         }
//       }, selector);
      
//       await waitFor(1000);

//       // Focus the element multiple times to ensure it's active
//       await page.focus(selector);
//       await waitFor(500);
//       await page.click(selector);
//       await waitFor(waitTime);

//       // Clear existing text if needed
//       if (clearFirst) {
//         await page.evaluate((sel) => {
//           const element = document.querySelector(sel);
//           if (element) {
//             element.value = '';
//             element.focus();
//             element.dispatchEvent(new Event('input', { bubbles: true }));
//             element.dispatchEvent(new Event('change', { bubbles: true }));
//           }
//         }, selector);
//         await waitFor(500);
//       }

//       // Type the text character by character
//       for (let i = 0; i < text.length; i++) {
//         await page.keyboard.type(text[i]);
//         await waitFor(delay);
//       }
      
//       await waitFor(waitTime);

//       // Verify the text was entered
//       const enteredText = await page.$eval(selector, el => el.value || el.textContent || '');
//       if (enteredText.trim() === text.trim()) {
//         console.log(`✅ Successfully typed into ${selector}`);
//         return true;
//       } else {
//         console.log(`⚠️ Text verification failed. Expected: "${text}", Got: "${enteredText}"`);
//         if (attempt === retries) {
//           throw new Error(`Text verification failed after ${retries} attempts`);
//         }
//         await waitFor(2000);
//       }

//     } catch (error) {
//       console.error(`❌ Error typing into ${selector} (attempt ${attempt}):`, error.message);
//       if (attempt === retries) {
//         return false;
//       }
//       await waitFor(2000);
//     }
//   }
  
//   return false;
// }

// // Enhanced click function with better waiting
// async function clickWithWait(page, selector, options = {}) {
//   const { waitTime = 1000, timeout = 10000 } = options;
  
//   try {
//     // Wait for element to be ready
//     await waitForElementReady(page, selector, timeout);

//     // Scroll element into view if needed
//     await page.evaluate((sel) => {
//       const element = document.querySelector(sel);
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//       }
//     }, selector);
    
//     await waitFor(waitTime);

//     // Click the element
//     await page.click(selector);
//     await waitFor(waitTime);

//     console.log(`✅ Successfully clicked ${selector}`);
//     return true;
//   } catch (error) {
//     console.error(`❌ Error clicking ${selector}:`, error.message);
//     return false;
//   }
// }

// // Take screenshot for debugging
// async function takeScreenshot(page, filename) {
//   try {
//     const screenshotDir = path.join(process.cwd(), "screenshots");
//     await fs.mkdir(screenshotDir, { recursive: true });

//     const screenshotPath = path.join(screenshotDir, filename);
//     await page.screenshot({ path: screenshotPath, fullPage: true });
//     console.log(`📸 Screenshot saved: ${screenshotPath}`);
//   } catch (error) {
//     console.log("❌ Error taking screenshot:", error.message);
//   }
// }

// // Auto scroll function
// async function autoScroll(page) {
//   await page.evaluate(async () => {
//     await new Promise((resolve) => {
//       let totalHeight = 0;
//       const distance = 100;
//       const timer = setInterval(() => {
//         const scrollHeight = document.body.scrollHeight;
//         window.scrollBy(0, distance);
//         totalHeight += distance;

//         if (totalHeight >= scrollHeight) {
//           clearInterval(timer);
//           resolve();
//         }
//       }, 100);
//     });
//   });
// }

// // Handle bot verification (e.g., "verifying-container") and remove it
// async function handleBotVerification(page) {
//   const verifyingSelector = '.verifying-container, svg#verifying-i';
//   try {
//     const verifyingElement = await page.waitForSelector(verifyingSelector, { timeout: 5000 }).catch(() => null);
//     if (verifyingElement) {
//       console.log("🤖 Bot verification detected. Waiting for it to resolve and attempting to remove...");
//       await waitFor(10000); // Wait for 10 seconds for it to resolve

//       // Attempt to remove the element from the DOM
//       await page.evaluate((selector) => {
//         const element = document.querySelector(selector);
//         if (element) {
//           element.remove();
//           console.log(`Removed bot verification element: ${selector}`);
//         }
//       }, verifyingSelector);

//       const stillVerifying = await page.$(verifyingSelector);
//       if (stillVerifying) {
//         console.warn("⚠️ Bot verification still present after attempted removal. Manual intervention might be required or the page might be stuck.");
//       } else {
//         console.log("✅ Bot verification resolved or removed.");
//       }
//     }
//   } catch (error) {
//     // Selector not found within timeout, which is expected if no verification is needed
//     // console.log("No bot verification detected (or it resolved quickly).");
//   }
// }

// // Initialize browser
// async function initBrowser() {
//   console.log("🚀 Step 1: Launching browser...");
//   const browser = await puppeteer.launch({
//     headless: CONFIG.headless,
//     defaultViewport: null,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-accelerated-2d-canvas",
//       "--no-first-run",
//       "--no-zygote",
//       "--disable-gpu",
//       "--disable-blink-features=AutomationControlled",
//     ],
//   });

//   const page = await browser.newPage();
//   await page.setViewport({ width: 1920, height: 1080 });
//   await page.setUserAgent(
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
//   );

//   // Remove automation indicators
//   await page.evaluateOnNewDocument(() => {
//     Object.defineProperty(navigator, "webdriver", {
//       get: () => undefined,
//     });
//   });

//   return { browser, page };
// }

// async function loginToDoorDash(page, email, password) {
//   try {
//     console.log("🔐 Step 2: Navigating to DoorDash login page...");
//     await page.goto("https://www.doordash.com/consumer/login", {
//       waitUntil: "domcontentloaded", // Changed to domcontentloaded
//       timeout: CONFIG.timeout,
//     });

//     await handleBotVerification(page); // Check for bot verification after initial load

//     // Wait for page to fully load
//     await waitFor(3000);
//     await takeScreenshot(page, "login-page.png");

//     console.log("📝 Step 3: Looking for email input...");
//     const emailSelectors = [
//       'input[name="email"]',
//       'input[type="email"]',
//       'input[data-testid="email-input"]',
//       'input[placeholder*="email"]',
//       'input[id*="email"]',
//       'input[autocomplete="email"]'
//     ];

//     // Try each selector until one works
//     let emailTyped = false;
//     let workingEmailSelector = null;
    
//     for (const selector of emailSelectors) {
//       console.log(`🔍 Trying email selector: ${selector}`);
//       const element = await page.$(selector);
//       if (element) {
//         console.log(`✅ Found email element with selector: ${selector}`);
//         workingEmailSelector = selector;
//         emailTyped = await typeWithWait(page, selector, email, {
//           delay: 150,
//           waitTime: 1500,
//           retries: 3
//         });
//         if (emailTyped) {
//           break;
//         }
//       }
//     }
    
//     if (!emailTyped) {
//       throw new Error("Failed to type email with any selector");
//     }

//     await takeScreenshot(page, "email-entered.png");

//     console.log("👆 Looking for continue button...");
//     const continueSelectors = [
//       "#guided-submit-button",
//       'button[type="submit"]',
//       'button[data-testid="login-button"]',
//       'button[data-testid="submit-button"]',
//       'input[type="submit"]',
//       'button[aria-label*="Continue"]',
//       'button[aria-label*="Submit"]',
//       ".login-button",
//       ".submit-button",
//     ];

//     let continueClicked = false;
//     let workingContinueSelector = null;
    
//     for (const selector of continueSelectors) {
//       console.log(`🔍 Trying continue button selector: ${selector}`);
//       const element = await page.$(selector);
//       if (element) {
//         console.log(`✅ Found continue button with selector: ${selector}`);
//         workingContinueSelector = selector;
//         continueClicked = await clickWithWait(page, selector, {
//           waitTime: 2000,
//           timeout: 10000
//         });
//         if (continueClicked) {
//           break;
//         }
//       }
//     }
    
//     if (!continueClicked) {
//       throw new Error("Failed to click continue button with any selector");
//     }

//     await takeScreenshot(page, "continue-clicked.png");
//     await handleBotVerification(page); // Check for bot verification after clicking continue

//     console.log("🔍 Looking for password input...");
//     const passwordSelectors = [
//       'input[data-anchor-id="IdentityLoginPagePasswordField"]',
//       'input[name="password"]',
//       'input[type="password"]',
//       'input[data-testid="password-input"]',
//       'input[placeholder*="password"]',
//       'input[id*="password"]',
//       'input[autocomplete="current-password"]'
//     ];
    
//     // Wait longer for password input and try multiple selectors
//     let passwordInput = null;
//     let workingPasswordSelector = null;
    
//     for (let i = 0; i < 10; i++) { // Try for up to 20 seconds
//       for (const selector of passwordSelectors) {
//         passwordInput = await page.$(selector);
//         if (passwordInput) {
//           workingPasswordSelector = selector;
//           console.log(`✅ Found password input with selector: ${selector}`);
//           break;
//         }
//       }
//       if (passwordInput) break;
//       console.log(`⏳ Waiting for password input... attempt ${i + 1}/10`);
//       await waitFor(2000);
//     }

//     if (!passwordInput) {
//       throw new Error("❌ Password input not found after multiple attempts");
//     }

//     console.log("✅ Password input found, typing password...");
//     const passwordTyped = await typeWithWait(page, workingPasswordSelector, password, {
//       delay: 150,
//       waitTime: 1500,
//       retries: 3
//     });
    
//     if (!passwordTyped) {
//       throw new Error("Failed to type password");
//     }

//     await takeScreenshot(page, "password-entered.png");

//     console.log("👆 Looking for login submit button...");
//     const loginSubmitSelectors = [
//       "#login-submit-button",
//       'button[type="submit"]',
//       'button[data-testid="submit-button"]',
//       'button[data-testid="login-submit-button"]',
//       'input[type="submit"]',
//       'button[aria-label*="Sign in"]',
//       'button[aria-label*="Log in"]',
//     ];
    
//     let loginClicked = false;
//     let workingLoginSelector = null;
    
//     for (const selector of loginSubmitSelectors) {
//       console.log(`🔍 Trying login submit selector: ${selector}`);
//       const element = await page.$(selector);
//       if (element) {
//         console.log(`✅ Found login submit button with selector: ${selector}`);
//         workingLoginSelector = selector;
//         loginClicked = await clickWithWait(page, selector, {
//           waitTime: 2000,
//           timeout: 10000
//         });
//         if (loginClicked) {
//           break;
//         }
//       }
//     }
    
//     if (!loginClicked) {
//       throw new Error("Failed to click login submit button with any selector");
//     }

//     await takeScreenshot(page, "login-submitted.png");
//     await handleBotVerification(page); // Check for bot verification after clicking login

//     // Wait for homepage to load with multiple possible indicators
//     console.log("⏳ Waiting for homepage to load...");
//     const homePageSelectors = [
//       '[data-testid="home-page"]',
//       'button[data-testid="addressTextButton"]',
//       '[data-testid="search-input"]',
//       '.homepage-content',
//       '[data-anchor-id="StoreCard"]',
//       '[data-testid="store-search-input"]',
//       '.DashPass-label'
//     ];

//     let homePageLoaded = null;
    
//     // Try waiting for homepage elements for up to 30 seconds
//     for (let i = 0; i < 50; i++) {
//       homePageLoaded = await waitForAnySelector(page, homePageSelectors, 2000);
//       if (homePageLoaded) {
//         break;
//       }
//       console.log(`⏳ Still waiting for homepage... attempt ${i + 1}/15`);
//       await waitFor(2000);
//     }

//     if (!homePageLoaded) {
//       // Check for error messages
//       const errorSelectors = [
//         '[data-testid="error-message"]',
//         '.error-message',
//         '[role="alert"]',
//         '.alert-error',
//         '.ErrorMessage',
//         '[data-testid="login-error"]'
//       ];
      
//       const errorElement = await waitForAnySelector(page, errorSelectors, 3000);
//       if (errorElement) {
//         const errorText = await page.evaluate(el => el.textContent, errorElement);
//         throw new Error(`Login error: ${errorText}`);
//       }
      
//       throw new Error("Homepage did not load after login");
//     }

//     await takeScreenshot(page, "homepage-loaded.png");

//     // Additional verification - check URL
//     const currentUrl = page.url();
//     console.log(`Current URL: ${currentUrl}`);
    
//     if (currentUrl.includes('login')) {
//       throw new Error("Still on login page - login may have failed");
//     }

//     console.log("✅ Successfully logged in and reached homepage!");
//     return true;
//   } catch (error) {
//     console.error("❌ Login failed:", error.message);
//     await takeScreenshot(page, "login-error.png");
//     return false;
//   }
// }

// async function addAddress(page, address) {
//   console.log("🏠 Step 4: Adding address...");

//   try {
//     // Wait for address button to show up
//     const addressButton = await page.waitForSelector(
//       'button[data-testid="addressTextButton"]',
//       {
//         timeout: 15000,
//       }
//     );

//     console.log("📍 Address button found, clicking...");
//     const addressClicked = await clickWithWait(page, 'button[data-testid="addressTextButton"]', {
//       waitTime: 2000
//     });
    
//     if (!addressClicked) {
//       throw new Error("Failed to click address button");
//     }

//     // Wait for the address input modal to show up
//     const addressInputSelector = 'input[placeholder*="Enter address"]';
//     await page.waitForSelector(addressInputSelector, {
//       timeout: 10000,
//     });

//     console.log("📥 Address input appeared, typing address...");
//     const addressTyped = await typeWithWait(page, addressInputSelector, CONFIG.location, {
//       delay: 150,
//       waitTime: 2000
//     });
    
//     if (!addressTyped) {
//       throw new Error("Failed to type address");
//     }

//     // Wait for suggestions to appear
//     await page.waitForTimeout(3000);
    
//     const suggestionSelector = 'li[data-anchor-id^="AddressSuggestion"]';
//     const suggestion = await page.waitForSelector(suggestionSelector, {
//       timeout: 10000
//     });
    
//     if (!suggestion) {
//       throw new Error("📭 No address suggestion found");
//     }

//     console.log("📌 Selecting address suggestion...");
//     const suggestionClicked = await clickWithWait(page, suggestionSelector, {
//       waitTime: 3000
//     });
    
//     if (!suggestionClicked) {
//       throw new Error("Failed to click address suggestion");
//     }

//     // Wait for location to finalize
//     await page.waitForTimeout(5000);
    
//     await takeScreenshot(page, "address-set.png");
//     console.log("✅ Address successfully set!");
//     return true;
//   } catch (err) {
//     console.error("❌ Error adding address:", err.message);
//     await takeScreenshot(page, "address-error.png");
//     return false;
//   }
// }

// async function scrapeGroceryLinks(page) {
//   try {
//     console.log("🛒 Step 5: Navigating to grocery page...");

//     await page.goto("https://www.doordash.com", {
//       waitUntil: "networkidle2", // Changed to networkidle2
//       timeout: CONFIG.timeout,
//     });
//     await page.goto("https://www.doordash.com/tabs/grocery", {
//       waitUntil: "networkidle2", // Changed to networkidle2
//       timeout: CONFIG.timeout,
//     });

//     await handleBotVerification(page); // Check for bot verification on grocery page

//     await takeScreenshot(page, "grocery-page.png");

//     // NEW: Click the "See All" button for grocery categories
//     console.log("🔍 Looking for 'See All' button for grocery categories...");
//     const grocerySeeAllSelectors = [
//       'a[data-anchor-id="SeeAll"][href*="/vertical_homepage?vertical_id=3"]',
//       'a[aria-labelledby="see-all"]',
//       'a[href*="/vertical_homepage"]',
//     ];

//     let seeAllGroceryClicked = false;
//     for (const selector of grocerySeeAllSelectors) {
//       const elementFound = await page.$(selector);
//       if (elementFound) {
//         console.log(`✅ Found 'See All' button with selector: ${selector}, attempting to click...`);
//         seeAllGroceryClicked = await clickWithWait(page, selector, {
//           waitTime: 3000,
//           timeout: 20000 // Increased timeout for this specific click
//         });
//         if (seeAllGroceryClicked) {
//           break;
//         }
//       }
//     }

//     if (!seeAllGroceryClicked) {
//       console.log("⚠️ Could not click 'See All' button for grocery categories. Proceeding to scrape existing store links.");
//     } else {
//       console.log("✅ Clicked 'See All' button for grocery categories. Waiting for new page to load...");
//       // Increased timeout for navigation and changed to networkidle2
//       await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 });
//       await waitFor(5000); // Give some extra time for content to render
//       await takeScreenshot(page, "grocery-categories-see-all-page.png");
//       await handleBotVerification(page); // Check for bot verification after navigation
//     }


//     console.log("🔍 Looking for store links...");
//     await page.waitForSelector('[data-anchor-id="StoreCard"]', {
//       timeout: CONFIG.timeout, // Use global timeout
//     });

//     // Scroll to load all content - Added for more robust store link collection
//     await autoScroll(page);
//     await waitFor(5000); // Give time for more store cards to load after initial scroll

//     // Extract all store links
//     const storeLinks = await page.evaluate(() => {
//       const links = Array.from(document.querySelectorAll('[data-anchor-id="StoreCard"]'));
//       return links.map((link) => {
//         const href = link.href.startsWith("/") ? "https://www.doordash.com" + link.getAttribute("href") : link.href;
//         const text = link.textContent.trim();
//         const title = link.title || "";
//         // Extract store ID from href
//         const match = href.match(/\/store\/(\d+)/);
//         const storeId = match ? match[1] : null;

//         return {
//           href,
//           text,
//           title,
//           storeId
//         };
//       });
//     });

//     console.log(`✅ Found ${storeLinks.length} store links`);

//     // Store the results
//     scrapedData.groceryStores = storeLinks;

//     return storeLinks;
//   } catch (error) {
//     console.error("❌ Error scraping grocery links:", error.message);
//     await takeScreenshot(page, "grocery-error.png");
//     return [];
//   }
// }

// async function scrapeStoreProducts(page, store) {
//   console.log(`🛍️ Step 6: Navigating to store: ${store.text || store.href} (ID: ${store.storeId || 'N/A'})`);
//   try {
//     // Retry navigation up to 3 times
//     let navigationSuccess = false;
//     for (let i = 0; i < 3; i++) {
//       try {
//         await page.goto(store.href, {
//           waitUntil: "domcontentloaded", // Changed to domcontentloaded for faster initial load
//           timeout: CONFIG.timeout, // Use global timeout
//         });
//         navigationSuccess = true;
//         break; // Exit retry loop if successful
//       } catch (navError) {
//         console.warn(`⚠️ Navigation to ${store.href} failed (attempt ${i + 1}/3): ${navError.message}`);
//         await waitFor(5000); // Wait before retrying
//       }
//     }

//     if (!navigationSuccess) {
//       throw new Error(`Failed to navigate to store page after multiple retries: ${store.href}`);
//     }

//     await handleBotVerification(page); // Check for bot verification on store page

//     await waitFor(5000); // Give more time for dynamic content to load
//     await takeScreenshot(page, `store-${store.storeId || 'unknown'}.png`);

//     // Handle potential pop-ups (e.g., location confirmation, sign-up prompts)
//     const closeButtonSelectors = [
//       'button[aria-label="Close"]',
//       'button[data-testid="close-button"]',
//       'svg[aria-label="Close"]',
//       '.Modal-closeButton',
//       '.x-button'
//     ];
//     for (const selector of closeButtonSelectors) {
//       const closeButton = await page.$(selector);
//       if (closeButton) {
//         console.log(`Found and closing pop-up with selector: ${selector}`);
//         await clickWithWait(page, selector, { waitTime: 500 });
//         await waitFor(1000); // Wait for modal to disappear
//         break;
//       }
//     }

//     console.log("🔍 Collecting 'See All' buttons for categories within the store...");
//     // Auto-scroll to load all 'See All' buttons within the store page
//     await autoScroll(page);
//     await waitFor(5000); // Give time for more 'See All' buttons to load

//     const seeAllButtonSelectors = [
//       'a[data-anchor-id="CarouselSeeAllButton"]',
//       'button[aria-label="See All"]',
//       'a[href*="/collection?store_id="]', // Generic link for collection
//     ];

//     const collectionLinks = await page.evaluate((selectors) => {
//       let links = [];
//       selectors.forEach(selector => {
//         document.querySelectorAll(selector).forEach(el => {
//           let href = el.getAttribute('href');
//           if (href) {
//             if (href.startsWith('/')) {
//               href = 'https://www.doordash.com' + href;
//             }
//             links.push(href);
//           }
//         });
//       });
//       return [...new Set(links)]; // Return unique links
//     }, seeAllButtonSelectors); // Pass selectors to page.evaluate

//     console.log(`Found ${collectionLinks.length} 'See All' collection links for store ${store.text || store.href}`);

//     // If no specific collection links are found, try to scrape products from the main store page
//     if (collectionLinks.length === 0) {
//       console.log("⚠️ No specific 'See All' collection links found for this store. Attempting to scrape products from the main store page.");
//       await autoScroll(page);
//       await waitFor(10000); // Increased wait for products to load on main page
//       const products = await page.evaluate((storeData) => {
//         const productElements = Array.from(document.querySelectorAll('[data-testid="RetailItemCardPriceNameInfoBadgingFramework"]'));
//         return productElements.map(el => {
//           const name = el.querySelector('span[data-telemetry-id="priceNameInfo.name"]')?.textContent.trim() || 'N/A';
//           let currentPrice = 'N/A';
//           let originalPrice = 'N/A';
//           let discount = 'N/A';

//           const currentPriceMain = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-2.cGEDSS')?.textContent.trim() || '';
//           const currentPriceDecimal = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.kQLTAj')?.textContent.trim() || '';
//           const currentPriceSymbol = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.erPBol')?.textContent.trim() || '';
          
//           if (currentPriceMain !== '') {
//               currentPrice = `${currentPriceSymbol}${currentPriceMain}${currentPriceDecimal}`;
//           } else {
//               currentPrice = el.querySelector('.sc-85923f71-0.hlWxbc')?.textContent.trim() || 'N/A';
//           }

//           originalPrice = el.querySelector('span.sc-aXZVg.gQfTyJ')?.textContent.trim() || 'N/A';
//           discount = el.querySelector('[data-testid*="percent_discount"] span.sc-aXZVg.iYfHGV')?.textContent.trim() || 'N/A';

//           const rating = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.sc-78b48fa8-2.jMkaIe')?.textContent.trim() || 'N/A';
//           const ratingCount = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.dxgIrH')?.textContent.trim() || 'N/A';

//           return {
//             storeName: storeData.text,
//             storeUrl: storeData.href,
//             storeId: storeData.storeId,
//             name,
//             currentPrice,
//             originalPrice,
//             discount,
//             rating,
//             ratingCount,
//           };
//         });
//       }, store);
//       console.log(`✅ Found ${products.length} products on main store page for ${store.text || store.href}`);
//       // Store products under the storeId key
//       if (!scrapedData.groceryProducts[store.storeId]) {
//         scrapedData.groceryProducts[store.storeId] = [];
//       }
//       scrapedData.groceryProducts[store.storeId].push(...products);
//       await saveToJSON(); // Save after scraping main page products
//     } else {
//       // Iterate through each collected collection link and scrape products
//       for (const collectionLink of collectionLinks) {
//         console.log(`➡️ Navigating to collection: ${collectionLink}`);
//         try {
//           await page.goto(collectionLink, {
//             waitUntil: "domcontentloaded",
//             timeout: CONFIG.timeout,
//           });
//           await handleBotVerification(page);
//           await waitFor(5000); // Give time for the collection page to load
//           await takeScreenshot(page, `store-${store.storeId || 'unknown'}-collection-${collectionLinks.indexOf(collectionLink)}.png`);

//           console.log("🔄 Auto-scrolling to load all products in collection...");
//           await autoScroll(page);
//           await waitFor(15000); // Increased wait after auto-scroll for products to load

//           console.log("⛏️ Scraping product details from collection...");
//           const products = await page.evaluate((storeData, currentCollectionLink) => { // Added currentCollectionLink
//             const productElements = Array.from(document.querySelectorAll('[data-testid="RetailItemCardPriceNameInfoBadgingFramework"]'));
//             return productElements.map(el => {
//               const name = el.querySelector('span[data-telemetry-id="priceNameInfo.name"]')?.textContent.trim() || 'N/A';
//               let currentPrice = 'N/A';
//               let originalPrice = 'N/A';
//               let discount = 'N/A';

//               const currentPriceMain = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-2.cGEDSS')?.textContent.trim() || '';
//               const currentPriceDecimal = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.kQLTAj')?.textContent.trim() || '';
//               const currentPriceSymbol = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.erPBol')?.textContent.trim() || '';
              
//               if (currentPriceMain !== '') {
//                   currentPrice = `${currentPriceSymbol}${currentPriceMain}${currentPriceDecimal}`;
//               } else {
//                   currentPrice = el.querySelector('.sc-85923f71-0.hlWxbc')?.textContent.trim() || 'N/A';
//               }

//               originalPrice = el.querySelector('span.sc-aXZVg.gQfTyJ')?.textContent.trim() || 'N/A';
//               discount = el.querySelector('[data-testid*="percent_discount"] span.sc-aXZVg.iYfHGV')?.textContent.trim() || 'N/A';

//               const rating = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.sc-78b48fa8-2.jMkaIe')?.textContent.trim() || 'N/A';
//               const ratingCount = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.dxgIrH')?.textContent.trim() || 'N/A';

//               return {
//                 storeName: storeData.text,
//                 storeUrl: storeData.href,
//                 storeId: storeData.storeId,
//                 collectionUrl: currentCollectionLink, // Use the passed argument here
//                 name,
//                 currentPrice,
//                 originalPrice,
//                 discount,
//                 rating,
//                 ratingCount,
//               };
//             });
//           }, store, collectionLink); // Passed collectionLink as the second argument

//           console.log(`✅ Found ${products.length} products for collection ${collectionLink}`);
//           // Store products under the storeId key
//           if (!scrapedData.groceryProducts[store.storeId]) {
//             scrapedData.groceryProducts[store.storeId] = [];
//           }
//           scrapedData.groceryProducts[store.storeId].push(...products);
//           await saveToJSON(); // Save after each collection scrape
//         } catch (collectionError) {
//           console.error(`❌ Error scraping collection ${collectionLink} for store ${store.text || store.href} (ID: ${store.storeId || 'N/A'}):`, collectionError.message);
//           await takeScreenshot(page, `store-${store.storeId || 'unknown'}-collection-error-${collectionLinks.indexOf(collectionLink)}.png`);
//         }
//       }
//     }

//   } catch (error) {
//     console.error(`❌ Error scraping products for ${store.text || store.href} (ID: ${store.storeId || 'N/A'}):`, error.message);
//     await takeScreenshot(page, `store-${store.storeId || 'unknown'}-error.png`);
//   }
// }


// // Save data to JSON
// async function saveToJSON(filename = "doordash_grocery_data.json") {
//   try {
//     console.log("💾 Saving data to JSON...");
//     const dataDir = path.join(process.cwd(), "scraped-data");

//     try {
//       await fs.access(dataDir);
//     } catch {
//       await fs.mkdir(dataDir, { recursive: true });
//     }

//     const filePath = path.join(dataDir, filename);
//     await fs.writeFile(filePath, JSON.stringify(scrapedData, null, 2));

//     console.log(`✅ Data saved to: ${filePath}`);
//     // Count total products for logging
//     let totalProductsCount = 0;
//     for (const storeId in scrapedData.groceryProducts) {
//       totalProductsCount += scrapedData.groceryProducts[storeId].length;
//     }
//     console.log(`📊 Total grocery stores scraped: ${scrapedData.groceryStores?.length || 0}`);
//     console.log(`📊 Total grocery products scraped: ${totalProductsCount}`);
//   } catch (error) {
//     console.error("❌ Error saving data:", error.message);
//   }
// }

// // Save data to CSV
// async function saveToCSV(filename = "Grocery.csv") {
//   try {
//     console.log("📊 Converting and saving data to CSV...");
//     const dataDir = path.join(process.cwd(), "scraped-data");
//     await fs.mkdir(dataDir, { recursive: true });
//     const filePath = path.join(dataDir, filename);

//     let allProducts = [];
//     for (const storeId in scrapedData.groceryProducts) {
//       allProducts = allProducts.concat(scrapedData.groceryProducts[storeId]);
//     }

//     if (allProducts.length === 0) {
//       console.log("⚠️ No products to save to CSV.");
//       return;
//     }

//     // Get headers from the first product object
//     const headers = Object.keys(allProducts[0]);
//     const csvRows = [];

//     // Add header row
//     csvRows.push(headers.join(','));

//     // Add data rows
//     for (const product of allProducts) {
//       const values = headers.map(header => {
//         const value = product[header];
//         // Handle commas and newlines in values by enclosing in double quotes
//         // Double double quotes for existing double quotes
//         return typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))
//           ? `"${value.replace(/"/g, '""')}"`
//           : value;
//       });
//       csvRows.push(values.join(','));
//     }

//     await fs.writeFile(filePath, csvRows.join('\n'));
//     console.log(`✅ Data saved to CSV: ${filePath}`);
//   } catch (error) {
//     console.error("❌ Error saving data to CSV:", error.message);
//   }
// }

// async function scrapeDoorDash() {
//   let browser = null;
//   try {
//     // Initialize browser
//     const { browser: browserInstance, page } = await initBrowser();
//     browser = browserInstance;

//     // Login with password flow
//     const loginSuccess = await loginToDoorDash(
//       page,
//       CONFIG.email,
//       CONFIG.password
//     );
//     if (!loginSuccess) {
//       throw new Error("Login failed - please check your credentials and try again");
//     }

//     console.log("✅ Logged in successfully and reached homepage.");

//     // ✅ Go to grocery tab now and scrape store links
//     const storeLinks = await scrapeGroceryLinks(page);
//     if (storeLinks.length === 0) {
//       console.log("⚠️ No store links found on grocery page");
//     } else {
//       // Iterate through each store link and scrape products
//       for (const store of storeLinks) {
//         await scrapeStoreProducts(page, store);
//       }
//     }

//     // Final save to JSON (incremental saves are now in place, but this ensures a final state)
//     await saveToJSON();
//     // Convert and save data to CSV
//     await saveToCSV();

//     console.log("🎉 Grocery scraping completed successfully!");
//   } catch (error) {
//     console.error("❌ Scraping failed:", error.message);
//     console.log("💡 Check the screenshots folder for debugging information");
//   } finally {
//     console.log("🔒 Closing browser...");
//     if (browser) {
//       await browser.close();
//     }
//   }
// }

// scrapeDoorDash();


// import puppeteer from "puppeteer";
// import fs from "fs/promises";
// import path from "path";

// // Configuration
// const CONFIG = {
//   // email: "jiten91.dcs@gmail.com", // Removed as login is skipped
//   // password: "Jitu451234@", // Removed as login is skipped
//   location: "900 Market St San Francisco, CA 94102, USA",
//   headless: false, // Set to true for headless operation
//   timeout: 90000, // Increased global timeout to 90 seconds
// };

// // Global data storage
// let scrapedData = {
//   restaurants: [],
//   orders: [],
//   userProfile: {},
//   groceryStores: [], // To store basic grocery store links
//   groceryProducts: {}, // Changed to an object to store products by StoreName -> CollectionName
//   scrapedAt: new Date().toISOString(),
// };

// // Wait for any of multiple selectors
// async function waitForAnySelector(page, selectors, timeout = 10000) {
//   const promises = selectors.map((selector) =>
//     page.waitForSelector(selector, { timeout }).catch(() => null)
//   );

//   try {
//     const result = await Promise.race(promises);
//     return result;
//   } catch (error) {
//     console.log("⚠️ None of the selectors were found:", selectors);
//     return null;
//   }
// }

// // Helper function to wait for a specified time
// async function waitFor(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// // Wait for element to be ready for interaction
// async function waitForElementReady(page, selector, timeout = 10000) {
//   try {
//     await page.waitForSelector(selector, { timeout });
    
//     // Wait for element to be visible and interactable
//     await page.waitForFunction(
//       (sel) => {
//         const element = document.querySelector(sel);
//         if (!element) return false;
        
//         const rect = element.getBoundingClientRect();
//         const style = window.getComputedStyle(element);
        
//         return (
//           element.offsetParent !== null && // Element is visible
//           !element.disabled && // Element is not disabled
//           !element.readOnly && // Element is not readonly
//           rect.width > 0 && rect.height > 0 && // Element has dimensions
//           style.visibility !== 'hidden' && // Element is not hidden
//           style.display !== 'none' && // Element is not display none
//           style.opacity !== '0' // Element is not transparent
//         );
//       },
//       { timeout: timeout }, // Use passed timeout for function as well
//       selector
//     );
    
//     return true;
//   } catch (error) {
//     console.log(`⚠️ Element not ready: ${selector} - ${error.message}`);
//     return false;
//   }
// }

// // Enhanced typing function with better waiting
// async function typeWithWait(page, selector, text, options = {}) {
//   const { delay = 100, clearFirst = true, waitTime = 1000, retries = 3 } = options;
  
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       console.log(`🔄 Attempt ${attempt}/${retries} to type into ${selector}`);
      
//       // Wait for element to be ready
//       const isReady = await waitForElementReady(page, selector, 15000);
//       if (!isReady) {
//         if (attempt === retries) {
//           throw new Error(`Element not ready after ${retries} attempts: ${selector}`);
//         }
//         console.log(`⚠️ Element not ready, retrying in 2 seconds...`);
//         await waitFor(2000);
//         continue;
//       }

//       // Scroll element into view
//       await page.evaluate((sel) => {
//         const element = document.querySelector(sel);
//         if (element) {
//           element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         }
//       }, selector);
      
//       await waitFor(1000);

//       // Focus the element multiple times to ensure it's active
//       await page.focus(selector);
//       await waitFor(500);
//       await page.click(selector);
//       await waitFor(waitTime);

//       // Clear existing text if needed
//       if (clearFirst) {
//         await page.evaluate((sel) => {
//           const element = document.querySelector(sel);
//           if (element) {
//             element.value = '';
//             element.focus();
//             element.dispatchEvent(new Event('input', { bubbles: true }));
//             element.dispatchEvent(new Event('change', { bubbles: true }));
//           }
//         }, selector);
//         await waitFor(500);
//       }

//       // Type the text character by character
//       for (let i = 0; i < text.length; i++) {
//         await page.keyboard.type(text[i]);
//         await waitFor(delay);
//       }
      
//       await waitFor(waitTime);

//       // Verify the text was entered
//       const enteredText = await page.$eval(selector, el => el.value || el.textContent || '');
//       if (enteredText.trim() === text.trim()) {
//         console.log(`✅ Successfully typed into ${selector}`);
//         return true;
//       } else {
//         console.log(`⚠️ Text verification failed. Expected: "${text}", Got: "${enteredText}"`);
//         if (attempt === retries) {
//           throw new Error(`Text verification failed after ${retries} attempts`);
//         }
//         await waitFor(2000);
//       }

//     } catch (error) {
//       console.error(`❌ Error typing into ${selector} (attempt ${attempt}):`, error.message);
//       if (attempt === retries) {
//         return false;
//       }
//       await waitFor(2000);
//     }
//   }
  
//   return false;
// }

// // Enhanced click function with better waiting
// async function clickWithWait(page, selector, options = {}) {
//   const { waitTime = 1000, timeout = 10000 } = options;
  
//   try {
//     // Wait for element to be ready
//     await waitForElementReady(page, selector, timeout);

//     // Scroll element into view if needed
//     await page.evaluate((sel) => {
//       const element = document.querySelector(sel);
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//       }
//     }, selector);
    
//     await waitFor(waitTime);

//     // Click the element
//     await page.click(selector);
//     await waitFor(waitTime);

//     console.log(`✅ Successfully clicked ${selector}`);
//     return true;
//   } catch (error) {
//     console.error(`❌ Error clicking ${selector}:`, error.message);
//     return false;
//   }
// }

// // Take screenshot for debugging
// async function takeScreenshot(page, filename) {
//   try {
//     const screenshotDir = path.join(process.cwd(), "screenshots");
//     await fs.mkdir(screenshotDir, { recursive: true });

//     const screenshotPath = path.join(screenshotDir, filename);
//     await page.screenshot({ path: screenshotPath, fullPage: true });
//     console.log(`📸 Screenshot saved: ${screenshotPath}`);
//   } catch (error) {
//     console.log("❌ Error taking screenshot:", error.message);
//   }
// }

// // Auto scroll function
// async function autoScroll(page) {
//   await page.evaluate(async () => {
//     await new Promise((resolve) => {
//       let totalHeight = 0;
//       const distance = 100;
//       const timer = setInterval(() => {
//         const scrollHeight = document.body.scrollHeight;
//         window.scrollBy(0, distance);
//         totalHeight += distance;

//         if (totalHeight >= scrollHeight) {
//           clearInterval(timer);
//           resolve();
//         }
//       }, 100);
//     });
//   });
// }

// // Handle bot verification (e.g., "verifying-container") and remove it
// async function handleBotVerification(page) {
//   const verifyingSelector = '.verifying-container, svg#verifying-i';
//   try {
//     const verifyingElement = await page.waitForSelector(verifyingSelector, { timeout: 5000 }).catch(() => null);
//     if (verifyingElement) {
//       console.log("🤖 Bot verification detected. Waiting for it to resolve and attempting to remove...");
//       await waitFor(10000); // Wait for 10 seconds for it to resolve

//       // Attempt to remove the element from the DOM
//       await page.evaluate((selector) => {
//         const element = document.querySelector(selector);
//         if (element) {
//           element.remove();
//           console.log(`Removed bot verification element: ${selector}`);
//         }
//       }, verifyingSelector);

//       const stillVerifying = await page.$(verifyingSelector);
//       if (stillVerifying) {
//         console.warn("⚠️ Bot verification still present after attempted removal. Manual intervention might be required or the page might be stuck.");
//       } else {
//         console.log("✅ Bot verification resolved or removed.");
//       }
//     }
//   } catch (error) {
//     // Selector not found within timeout, which is expected if no verification is needed
//     // console.log("No bot verification detected (or it resolved quickly).");
//   }
// }

// // New helper function to attempt closing common pop-ups
// async function closePopups(page) {
//   const closeButtonSelectors = [
//     'button[aria-label="Close"]',
//     'button[data-testid="close-button"]',
//     'svg[aria-label="Close"]',
//     '.Modal-closeButton',
//     '.x-button',
//     'button.dismiss-button' // Added another common selector
//   ];
//   for (const selector of closeButtonSelectors) {
//     try {
//       // Use page.waitForSelector with a short timeout, then click if found
//       const button = await page.waitForSelector(selector, { timeout: 3000 }).catch(() => null);
//       if (button) {
//         console.log(`Found and closing pop-up with selector: ${selector}`);
//         await clickWithWait(page, selector, { waitTime: 500 });
//         await waitFor(1000); // Wait for modal to disappear
//         // Re-check if another modal appeared or if this one didn't fully close
//         const stillPresent = await page.$(selector);
//         if (!stillPresent) {
//           console.log(`✅ Pop-up closed successfully with ${selector}.`);
//           return true; // Return true if one was successfully closed
//         }
//       }
//     } catch (error) {
//       // Ignore errors if selector not found within timeout
//     }
//   }
//   return false; // Return false if no pop-up was found and closed
// }


// // Initialize browser
// async function initBrowser() {
//   console.log("🚀 Step 1: Launching browser...");
//   const browser = await puppeteer.launch({
//     headless: CONFIG.headless,
//     defaultViewport: null,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-accelerated-2d-canvas",
//       "--no-first-run",
//       "--no-zygote",
//       "--disable-gpu",
//       "--disable-blink-features=AutomationControlled",
//     ],
//   });

//   const page = await browser.newPage();
//   await page.setViewport({ width: 1920, height: 1080 });
//   await page.setUserAgent(
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
//   );

//   // Remove automation indicators
//   await page.evaluateOnNewDocument(() => {
//     Object.defineProperty(navigator, "webdriver", {
//       get: () => undefined,
//     });
//   });

//   return { browser, page };
// }

// // Modified addAddress function to handle initial navigation and address input
// async function addAddress(page, address) {
//   console.log("🏠 Step 4: Adding address...");
//   try {
//     // Navigate to base URL first
//     await page.goto("https://www.doordash.com", {
//       waitUntil: "networkidle2",
//       timeout: CONFIG.timeout,
//     });
//     await handleBotVerification(page);
//     await waitFor(3000); // Give time for initial page to settle

//     // Attempt to close any initial pop-ups
//     await closePopups(page);

//     // Enter address
//     const addressInputSelector = 'input[placeholder*="Enter delivery address"]';
//     await page.waitForSelector(addressInputSelector, { timeout: 150000 });
//     await page.click(addressInputSelector);
//     await waitFor(1000); // Wait after clicking to allow any address modal to appear

//     // Attempt to close any modal that opened after clicking the address input
//     await closePopups(page);

//     // Clear the input field before typing
//     await page.evaluate((selector) => {
//       const element = document.querySelector(selector);
//       if (element) {
//         element.value = '';
//         element.dispatchEvent(new Event('input', { bubbles: true }));
//       }
//     }, addressInputSelector);
//     await waitFor(500); // Small wait after clearing
    
//     await page.type(addressInputSelector, address, { delay: 200 });
//     await waitFor(2500);
//     console.log('✅ Address handled.');

//     // Press Enter after typing the address
//     await page.keyboard.press('Enter');
//     await waitFor(3000); // Wait for the page to react to the Enter key

//     // Auto-redirects to https://www.doordash.com/home?newUser=true (or similar) after address is set.
//     // We will explicitly navigate to ensure the correct page.
//     console.log('🚪 Navigating to /home?newUser=true...');
//     await page.goto('https://www.doordash.com/home?newUser=true', {
//       waitUntil: 'networkidle2',
//       timeout: CONFIG.timeout,
//     });
//     await handleBotVerification(page); // Check for bot verification on home page
//     await waitFor(5000); // Wait 5 seconds as requested

//     console.log('🚪 Navigating to /tabs/grocery...');
//     await page.goto('https://www.doordash.com/tabs/grocery', {
//       waitUntil: 'networkidle2',
//       timeout: CONFIG.timeout,
//     });
//     await handleBotVerification(page); // Check for bot verification on grocery page
//     await waitFor(3000); // Small wait after navigating to grocery

//     await takeScreenshot(page, "address-set-and-grocery-navigated.png");
//     console.log("✅ Address successfully set and navigated to grocery page!");
//     return true;
//   } catch (err) {
//     console.error("❌ Error adding address and navigating to grocery:", err.message);
//     await takeScreenshot(page, "address-error.png");
//     return false;
//   }
// }

// async function scrapeGroceryLinks(page) {
//   try {
//     console.log("🛒 Step 5: Ensuring we are on the grocery page...");
//     // This function now primarily ensures we are on the grocery page if not already.
//     // The navigation to /tabs/grocery is handled by addAddress.
//     const currentUrl = page.url();
//     if (!currentUrl.includes("/tabs/grocery")) {
//       console.log("⚠️ Not on grocery page, navigating now...");
//       await page.goto("https://www.doordash.com/tabs/grocery", {
//         waitUntil: "networkidle2",
//         timeout: CONFIG.timeout,
//       });
//       await handleBotVerification(page); // Check for bot verification on grocery page
//       await waitFor(3000); // Small wait after navigating
//     }

//     await takeScreenshot(page, "grocery-page.png");

//     // NEW: Click the "See All" button for grocery categories
//     console.log("🔍 Looking for 'See All' button for grocery categories...");
//     const grocerySeeAllSelectors = [
//       'a[data-anchor-id="SeeAll"][href*="/vertical_homepage?vertical_id=3"]',
//       'a[aria-labelledby="see-all"]',
//       'a[href*="/vertical_homepage"]',
//     ];

//     let seeAllGroceryClicked = false;
//     for (const selector of grocerySeeAllSelectors) {
//       const elementFound = await page.$(selector);
//       if (elementFound) {
//         console.log(`✅ Found 'See All' button with selector: ${selector}, attempting to click...`);
//         seeAllGroceryClicked = await clickWithWait(page, selector, {
//           waitTime: 3000,
//           timeout: 20000 // Increased timeout for this specific click
//         });
//         if (seeAllGroceryClicked) {
//           break;
//         }
//       }
//     }

//     if (seeAllGroceryClicked) {
//       console.log("✅ Clicked 'See All' button for grocery categories. Waiting for store cards to load...");
//       // Wait for the store cards to appear directly
//       await page.waitForSelector('[data-anchor-id="StoreCard"]', {
//         timeout: 120000, // Use a long timeout for this crucial element
//       });
//       await waitFor(5000); // Give some extra time for content to render
//       await takeScreenshot(page, "grocery-categories-see-all-page.png");
//       await handleBotVerification(page); // Check for bot verification after navigation
//     } else {
//       console.log("⚠️ Could not click 'See All' button for grocery categories. Proceeding to scrape existing store links.");
//       // If the button wasn't clicked, we still need to wait for store cards on the current page
//       await page.waitForSelector('[data-anchor-id="StoreCard"]', {
//         timeout: CONFIG.timeout, // Use global timeout
//       });
//       await waitFor(3000); // Small wait if we were already on the page
//     }


//     console.log("🔍 Looking for store links...");
//     // This waitForSelector is now redundant if the above block successfully waited for StoreCard
//     // but kept for safety in case the initial click fails and it proceeds without error.
//     await page.waitForSelector('[data-anchor-id="StoreCard"]', {
//       timeout: CONFIG.timeout, // Use global timeout
//     });

//     // Scroll to load all content - Added for more robust store link collection
//     await autoScroll(page);
//     await waitFor(5000); // Give time for more store cards to load after initial scroll

//     // Extract all store links
//     const storeLinks = await page.evaluate(() => {
//       const links = Array.from(document.querySelectorAll('[data-anchor-id="StoreCard"]'));
//       return links.map((link) => {
//         const href = link.href.startsWith("/") ? "https://www.doordash.com" + link.getAttribute("href") : link.href;
//         const text = link.textContent.trim();
//         const title = link.title || "";
//         // Extract store ID from href
//         const match = href.match(/\/store\/(\d+)/);
//         const storeId = match ? match[1] : null;

//         return {
//           href,
//           text,
//           title,
//           storeId
//         };
//       });
//     });

//     console.log(`✅ Found ${storeLinks.length} store links`);

//     // Store the results
//     scrapedData.groceryStores = storeLinks;

//     return storeLinks;
//   } catch (error) {
//     console.error("❌ Error scraping grocery links:", error.message);
//     await takeScreenshot(page, "grocery-error.png");
//     return [];
//   }
// }

// async function scrapeStoreProducts(page, store) {
//   console.log(`🛍️ Step 6: Navigating to store: ${store.text || store.href} (ID: ${store.storeId || 'N/A'})`);
//   try {
//     // Retry navigation up to 3 times
//     let navigationSuccess = false;
//     for (let i = 0; i < 3; i++) {
//       try {
//         await page.goto(store.href, {
//           waitUntil: "domcontentloaded", // Changed to domcontentloaded for faster initial load
//           timeout: CONFIG.timeout, // Use global timeout
//         });
//         navigationSuccess = true;
//         break; // Exit retry loop if successful
//       } catch (navError) {
//         console.warn(`⚠️ Navigation to ${store.href} failed (attempt ${i + 1}/3): ${navError.message}`);
//         await waitFor(5000); // Wait before retrying
//       }
//     }

//     if (!navigationSuccess) {
//       throw new Error(`Failed to navigate to store page after multiple retries: ${store.href}`);
//     }

//     await handleBotVerification(page); // Check for bot verification on store page

//     await waitFor(5000); // Give more time for dynamic content to load
//     await takeScreenshot(page, `store-${store.storeId || 'unknown'}.png`);

//     // Handle potential pop-ups (e.g., location confirmation, sign-up prompts)
//     const closeButtonSelectors = [
//       'button[aria-label="Close"]',
//       'button[data-testid="close-button"]',
//       'svg[aria-label="Close"]',
//       '.Modal-closeButton',
//       '.x-button'
//     ];
//     for (const selector of closeButtonSelectors) {
//       const closeButton = await page.$(selector);
//       if (closeButton) {
//         console.log(`Found and closing pop-up with selector: ${selector}`);
//         await clickWithWait(page, selector, { waitTime: 500 });
//         await waitFor(1000); // Wait for modal to disappear
//         break;
//       }
//     }

//     // Extract Store Name
//     const storeNameElement = await page.waitForSelector('h1[data-anchor-id="ConvenienceStoreHeaderInfoStoreName"]', { timeout: 10000 }).catch(() => null);
//     const storeName = storeNameElement ? await page.evaluate(el => el.textContent.trim(), storeNameElement) : store.text || `Store ID ${store.storeId}`;
//     console.log(`Extracted Store Name: ${storeName}`);

//     // Initialize store entry in scrapedData.groceryProducts
//     if (!scrapedData.groceryProducts[storeName]) {
//       scrapedData.groceryProducts[storeName] = {};
//     }

//     console.log("🔍 Collecting 'See All' buttons for categories within the store...");
//     // Auto-scroll to load all 'See All' buttons within the store page
//     await autoScroll(page);
//     await waitFor(5000); // Give time for more 'See All' buttons to load

//     const seeAllButtonSelectors = [
//       'a[data-anchor-id="CarouselSeeAllButton"]',
//       'button[aria-label="See All"]',
//       'a[href*="/collection?store_id="]', // Generic link for collection
//     ];

//     const collectionLinks = await page.evaluate((selectors) => {
//       let links = [];
//       selectors.forEach(selector => {
//         document.querySelectorAll(selector).forEach(el => {
//           let href = el.getAttribute('href');
//           if (href) {
//             if (href.startsWith('/')) {
//               href = 'https://www.doordash.com' + href;
//             }
//             links.push(href);
//           }
//         });
//       });
//       return [...new Set(links)]; // Return unique links
//     }, seeAllButtonSelectors); // Pass selectors to page.evaluate

//     console.log(`Found ${collectionLinks.length} 'See All' collection links for store ${store.text || store.href}`);

//     // If no specific collection links are found, try to scrape products from the main store page
//     if (collectionLinks.length === 0) {
//       console.log("⚠️ No specific 'See All' collection links found for this store. Attempting to scrape products from the main store page.");
//       await autoScroll(page);
//       await waitFor(10000); // Increased wait for products to load on main page
//       const products = await page.evaluate((storeData, currentStoreName) => {
//         const productElements = Array.from(document.querySelectorAll('[data-testid="RetailItemCardPriceNameInfoBadgingFramework"]'));
//         return productElements.map(el => {
//           const name = el.querySelector('span[data-telemetry-id="priceNameInfo.name"]')?.textContent.trim() || 'N/A';
//           let currentPrice = 'N/A';
//           let originalPrice = 'N/A';
//           let discount = 'N/A';

//           const currentPriceMain = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-2.cGEDSS')?.textContent.trim() || '';
//           const currentPriceDecimal = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.kQLTAj')?.textContent.trim() || '';
//           const currentPriceSymbol = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.erPBol')?.textContent.trim() || '';
          
//           if (currentPriceMain !== '') {
//               currentPrice = `${currentPriceSymbol}${currentPriceMain}${currentPriceDecimal}`;
//           } else {
//               currentPrice = el.querySelector('.sc-85923f71-0.hlWxbc')?.textContent.trim() || 'N/A';
//           }

//           originalPrice = el.querySelector('span.sc-aXZVg.gQfTyJ')?.textContent.trim() || 'N/A';
//           discount = el.querySelector('[data-testid*="percent_discount"] span.sc-aXZVg.iYfHGV')?.textContent.trim() || 'N/A';

//           const rating = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.sc-78b48fa8-2.jMkaIe')?.textContent.trim() || 'N/A';
//           const ratingCount = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.dxgIrH')?.textContent.trim() || 'N/A';

//           return {
//             storeName: currentStoreName, // Use the extracted storeName
//             storeUrl: storeData.href,
//             storeId: storeData.storeId,
//             collectionName: "Main Store Products", // Default collection name
//             collectionUrl: storeData.href,
//             name,
//             currentPrice,
//             originalPrice,
//             discount,
//             rating,
//             ratingCount,
//           };
//         });
//       }, store, storeName); // Pass storeName
      
//       if (!scrapedData.groceryProducts[storeName]["Main Store Products"]) {
//         scrapedData.groceryProducts[storeName]["Main Store Products"] = [];
//       }
//       scrapedData.groceryProducts[storeName]["Main Store Products"].push(...products);
//       await saveToJSON(); // Save after scraping main page products
//     } else {
//       // Iterate through each collected collection link and scrape products
//       for (const collectionLink of collectionLinks) {
//         console.log(`➡️ Navigating to collection: ${collectionLink}`);
//         try {
//           await page.goto(collectionLink, {
//             waitUntil: "domcontentloaded",
//             timeout: CONFIG.timeout,
//           });
//           await handleBotVerification(page);
//           await waitFor(5000); // Give time for the collection page to load
//           await takeScreenshot(page, `store-${store.storeId || 'unknown'}-collection-${collectionLinks.indexOf(collectionLink)}.png`);

//           // Extract Collection Name
//           const collectionNameElement = await page.waitForSelector('h1.sc-aXZVg.sc-3f3d4ebd-2.ifaqAR.fqQcnW', { timeout: 10000 }).catch(() => null);
//           const collectionName = collectionNameElement ? await page.evaluate(el => el.textContent.trim(), collectionNameElement) : 'Unnamed Collection';
//           console.log(`Extracted Collection Name: ${collectionName}`);

//           // Initialize collection array under store name
//           if (!scrapedData.groceryProducts[storeName][collectionName]) {
//             scrapedData.groceryProducts[storeName][collectionName] = [];
//           }

//           console.log("🔄 Auto-scrolling to load all products in collection...");
//           await autoScroll(page);
//           await waitFor(15000); // Increased wait after auto-scroll for products to load

//           console.log("⛏️ Scraping product details from collection...");
//           const products = await page.evaluate((storeData, currentCollectionLink, currentStoreName, currentCollectionName) => { // Added currentStoreName, currentCollectionName
//             const productElements = Array.from(document.querySelectorAll('[data-testid="RetailItemCardPriceNameInfoBadgingFramework"]'));
//             return productElements.map(el => {
//               const name = el.querySelector('span[data-telemetry-id="priceNameInfo.name"]')?.textContent.trim() || 'N/A';
//               let currentPrice = 'N/A';
//               let originalPrice = 'N/A';
//               let discount = 'N/A';

//               const currentPriceMain = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-2.cGEDSS')?.textContent.trim() || '';
//               const currentPriceDecimal = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.kQLTAj')?.textContent.trim() || '';
//               const currentPriceSymbol = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.erPBol')?.textContent.trim() || '';
              
//               if (currentPriceMain !== '') {
//                   currentPrice = `${currentPriceSymbol}${currentPriceMain}${currentPriceDecimal}`;
//               } else {
//                   currentPrice = el.querySelector('.sc-85923f71-0.hlWxbc')?.textContent.trim() || 'N/A';
//               }

//               originalPrice = el.querySelector('span.sc-aXZVg.gQfTyJ')?.textContent.trim() || 'N/A';
//               discount = el.querySelector('[data-testid*="percent_discount"] span.sc-aXZVg.iYfHGV')?.textContent.trim() || 'N/A';

//               const rating = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.sc-78b48fa8-2.jMkaIe')?.textContent.trim() || 'N/A';
//               const ratingCount = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.dxgIrH')?.textContent.trim() || 'N/A';

//               return {
//                 storeName: currentStoreName, // Use the passed argument here
//                 storeUrl: storeData.href,
//                 storeId: storeData.storeId,
//                 collectionName: currentCollectionName, // Use the passed argument here
//                 collectionUrl: currentCollectionLink, 
//                 name,
//                 currentPrice,
//                 originalPrice,
//                 discount,
//                 rating,
//                 ratingCount,
//               };
//             });
//           }, store, collectionLink, storeName, collectionName); // Passed storeName and collectionName

//           console.log(`✅ Found ${products.length} products for collection ${collectionLink}`);
//           scrapedData.groceryProducts[storeName][collectionName].push(...products);
//           await saveToJSON(); // Save after each collection scrape
//         } catch (collectionError) {
//           console.error(`❌ Error scraping collection ${collectionLink} for store ${store.text || store.href} (ID: ${store.storeId || 'N/A'}):`, collectionError.message);
//           await takeScreenshot(page, `store-${store.storeId || 'unknown'}-collection-error-${collectionLinks.indexOf(collectionLink)}.png`);
//         }
//       }
//     }

//   } catch (error) {
//     console.error(`❌ Error scraping products for ${store.text || store.href} (ID: ${store.storeId || 'N/A'}):`, error.message);
//     await takeScreenshot(page, `store-${store.storeId || 'unknown'}-error.png`);
//   }
// }


// // Save data to JSON
// async function saveToJSON(filename = "doordash_grocery_data.json") {
//   try {
//     console.log("💾 Saving data to JSON...");
//     const dataDir = path.join(process.cwd(), "scraped-data");

//     try {
//       await fs.access(dataDir);
//     } catch {
//       await fs.mkdir(dataDir, { recursive: true });
//     }

//     const filePath = path.join(dataDir, filename);
//     await fs.writeFile(filePath, JSON.stringify(scrapedData, null, 2));

//     console.log(`✅ Data saved to: ${filePath}`);
//     // Count total products for logging
//     let totalProductsCount = 0;
//     for (const storeName in scrapedData.groceryProducts) {
//       const collections = scrapedData.groceryProducts[storeName];
//       for (const collectionName in collections) {
//         totalProductsCount += collections[collectionName].length;
//       }
//     }
//     console.log(`📊 Total grocery stores scraped: ${scrapedData.groceryStores?.length || 0}`);
//     console.log(`📊 Total grocery products scraped: ${totalProductsCount}`);
//   } catch (error) {
//     console.error("❌ Error saving data:", error.message);
//   }
// }

// // Save data to CSV
// async function saveToCSV(filename = "Grocery.csv") {
//   try {
//     console.log("📊 Converting and saving data to CSV...");
//     const dataDir = path.join(process.cwd(), "scraped-data");
//     await fs.mkdir(dataDir, { recursive: true });
//     const filePath = path.join(dataDir, filename);

//     let allProducts = [];
//     for (const storeName in scrapedData.groceryProducts) {
//       const collections = scrapedData.groceryProducts[storeName];
//       for (const collectionName in collections) {
//         allProducts = allProducts.concat(collections[collectionName]);
//       }
//     }

//     if (allProducts.length === 0) {
//       console.log("⚠️ No products to save to CSV.");
//       return;
//     }

//     // Get headers from the first product object
//     const headers = Object.keys(allProducts[0]);
//     const csvRows = [];

//     // Add header row
//     csvRows.push(headers.join(','));

//     // Add data rows
//     for (const product of allProducts) {
//       const values = headers.map(header => {
//         const value = product[header];
//         // Handle commas and newlines in values by enclosing in double quotes
//         // Double double quotes for existing double quotes
//         return typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))
//           ? `"${value.replace(/"/g, '""')}"`
//           : value;
//       });
//       csvRows.push(values.join(','));
//     }

//     await fs.writeFile(filePath, csvRows.join('\n'));
//     console.log(`✅ Data saved to CSV: ${filePath}`);
//   } catch (error) {
//     console.error("❌ Error saving data to CSV:", error.message);
//   }
// }

// async function scrapeDoorDash() {
//   let browser = null;
//   try {
//     // Initialize browser
//     const { browser: browserInstance, page } = await initBrowser();
//     browser = browserInstance;

//     // Skip login and directly add address, then navigate to grocery
//     const addressSuccess = await addAddress(page, CONFIG.location);
//     if (!addressSuccess) {
//       throw new Error("Failed to set address and navigate to grocery page.");
//     }

//     console.log("✅ Successfully set address and reached grocery page.");

//     // ✅ Go to grocery tab now and scrape store links
//     const storeLinks = await scrapeGroceryLinks(page);
//     if (storeLinks.length === 0) {
//       console.log("⚠️ No store links found on grocery page");
//     } else {
//       // Iterate through each store link and scrape products
//       for (const store of storeLinks) {
//         await scrapeStoreProducts(page, store);
//       }
//     }

//     // Final save to JSON (incremental saves are now in place, but this ensures a final state)
//     await saveToJSON();
//     // Convert and save data to CSV
//     await saveToCSV();

//     console.log("🎉 Grocery scraping completed successfully!");
//   } catch (error) {
//     console.error("❌ Scraping failed:", error.message);
//     console.log("💡 Check the screenshots folder for debugging information");
//   } finally {
//     console.log("🔒 Closing browser...");
//     if (browser) {
//       await browser.close();
//     }
//   }
// }

// scrapeDoorDash();




// import puppeteer from "puppeteer";
// import fs from "fs/promises";
// import path from "path";

// // Configuration
// const CONFIG = {
//   // email: "jiten91.dcs@gmail.com", // Removed as login is skipped
//   // password: "Jitu451234@", // Removed as login is skipped
//   location: "900 Market St San Francisco, CA 94102, USA",
//   headless: false, // Set to true for headless operation
//   timeout: 90000, // Increased global timeout to 90 seconds
// };

// // Global data storage
// let scrapedData = {
//   restaurants: [],
//   orders: [],
//   userProfile: {},
//   groceryStores: [], // To store basic grocery store links
//   groceryProducts: {}, // Changed to an object to store products by StoreName -> CollectionName
//   scrapedAt: new Date().toISOString(),
// };

// // Wait for any of multiple selectors
// async function waitForAnySelector(page, selectors, timeout = 10000) {
//   const promises = selectors.map((selector) =>
//     page.waitForSelector(selector, { timeout }).catch(() => null)
//   );

//   try {
//     const result = await Promise.race(promises);
//     return result;
//   } catch (error) {
//     console.log("⚠️ None of the selectors were found:", selectors);
//     return null;
//   }
// }

// // Helper function to wait for a specified time
// async function waitFor(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// // Wait for element to be ready for interaction
// async function waitForElementReady(page, selector, timeout = 10000) {
//   try {
//     await page.waitForSelector(selector, { timeout });
    
//     // Wait for element to be visible and interactable
//     await page.waitForFunction(
//       (sel) => {
//         const element = document.querySelector(sel);
//         if (!element) return false;
        
//         const rect = element.getBoundingClientRect();
//         const style = window.getComputedStyle(element);
        
//         return (
//           element.offsetParent !== null && // Element is visible
//           !element.disabled && // Element is not disabled
//           !element.readOnly && // Element is not readonly
//           rect.width > 0 && rect.height > 0 && // Element has dimensions
//           style.visibility !== 'hidden' && // Element is not hidden
//           style.display !== 'none' && // Element is not display none
//           style.opacity !== '0' // Element is not transparent
//         );
//       },
//       { timeout: timeout }, // Use passed timeout for function as well
//       selector
//     );
    
//     return true;
//   } catch (error) {
//     console.log(`⚠️ Element not ready: ${selector} - ${error.message}`);
//     return false;
//   }
// }

// // Enhanced typing function with better waiting
// async function typeWithWait(page, selector, text, options = {}) {
//   const { delay = 100, clearFirst = true, waitTime = 1000, retries = 3 } = options;
  
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       console.log(`🔄 Attempt ${attempt}/${retries} to type into ${selector}`);
      
//       // Wait for element to be ready
//       const isReady = await waitForElementReady(page, selector, 15000);
//       if (!isReady) {
//         if (attempt === retries) {
//           throw new Error(`Element not ready after ${retries} attempts: ${selector}`);
//         }
//         console.log(`⚠️ Element not ready, retrying in 2 seconds...`);
//         await waitFor(2000);
//         continue;
//       }

//       // Scroll element into view
//       await page.evaluate((sel) => {
//         const element = document.querySelector(sel);
//         if (element) {
//           element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         }
//       }, selector);
      
//       await waitFor(1000);

//       // Focus the element multiple times to ensure it's active
//       await page.focus(selector);
//       await waitFor(500);
//       await page.click(selector);
//       await waitFor(waitTime);

//       // Clear existing text if needed
//       if (clearFirst) {
//         await page.evaluate((sel) => {
//           const element = document.querySelector(sel);
//           if (element) {
//             element.value = '';
//             element.focus();
//             element.dispatchEvent(new Event('input', { bubbles: true }));
//             element.dispatchEvent(new Event('change', { bubbles: true }));
//           }
//         }, selector);
//         await waitFor(500);
//       }

//       // Type the text character by character
//       for (let i = 0; i < text.length; i++) {
//         await page.keyboard.type(text[i]);
//         await waitFor(delay);
//       }
      
//       await waitFor(waitTime);

//       // Verify the text was entered
//       const enteredText = await page.$eval(selector, el => el.value || el.textContent || '');
//       if (enteredText.trim() === text.trim()) {
//         console.log(`✅ Successfully typed into ${selector}`);
//         return true;
//       } else {
//         console.log(`⚠️ Text verification failed. Expected: "${text}", Got: "${enteredText}"`);
//         if (attempt === retries) {
//           throw new Error(`Text verification failed after ${retries} attempts`);
//         }
//         await waitFor(2000);
//       }

//     } catch (error) {
//       console.error(`❌ Error typing into ${selector} (attempt ${attempt}):`, error.message);
//       if (attempt === retries) {
//         return false;
//       }
//       await waitFor(2000);
//     }
//   }
  
//   return false;
// }

// // Enhanced click function with better waiting
// async function clickWithWait(page, selector, options = {}) {
//   const { waitTime = 1000, timeout = 10000 } = options;
  
//   try {
//     // Wait for element to be ready
//     await waitForElementReady(page, selector, timeout);

//     // Scroll element into view if needed
//     await page.evaluate((sel) => {
//       const element = document.querySelector(sel);
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//       }
//     }, selector);
    
//     await waitFor(waitTime);

//     // Click the element
//     await page.click(selector);
//     await waitFor(waitTime);

//     console.log(`✅ Successfully clicked ${selector}`);
//     return true;
//   } catch (error) {
//     console.error(`❌ Error clicking ${selector}:`, error.message);
//     return false;
//   }
// }

// // Take screenshot for debugging
// async function takeScreenshot(page, filename) {
//   try {
//     const screenshotDir = path.join(process.cwd(), "screenshots");
//     await fs.mkdir(screenshotDir, { recursive: true });

//     const screenshotPath = path.join(screenshotDir, filename);
//     await page.screenshot({ path: screenshotPath, fullPage: true });
//     console.log(`📸 Screenshot saved: ${screenshotPath}`);
//   } catch (error) {
//     console.log("❌ Error taking screenshot:", error.message);
//   }
// }

// // Improved auto scroll for lazy-loaded/infinite content
// async function autoScroll(page) {
//   await page.evaluate(async () => {
//     const delay = (ms) => new Promise(res => setTimeout(res, ms));
//     let previousHeight = 0;
//     let sameHeightCount = 0;
//     while (sameHeightCount < 3) {
//       window.scrollBy(0, 500);
//       await delay(500);
//       const currentHeight = document.body.scrollHeight;
//       if (currentHeight === previousHeight) {
//         sameHeightCount++;
//       } else {
//         sameHeightCount = 0;
//         previousHeight = currentHeight;
//       }
//     }
//     await delay(2000); // Wait extra for lazy elements to render
//   });
// }

// // Handle bot verification (e.g., "verifying-container") and remove it
// async function handleBotVerification(page) {
//   const verifyingSelector = '.verifying-container, svg#verifying-i';
//   try {
//     const verifyingElement = await page.waitForSelector(verifyingSelector, { timeout: 5000 }).catch(() => null);
//     if (verifyingElement) {
//       console.log("🤖 Bot verification detected. Waiting for it to resolve and attempting to remove...");
//       await waitFor(10000); // Wait for 10 seconds for it to resolve

//       // Attempt to remove the element from the DOM
//       await page.evaluate((selector) => {
//         const element = document.querySelector(selector);
//         if (element) {
//           element.remove();
//           console.log(`Removed bot verification element: ${selector}`);
//         }
//       }, verifyingSelector);

//       const stillVerifying = await page.$(verifyingSelector);
//       if (stillVerifying) {
//         console.warn("⚠️ Bot verification still present after attempted removal. Manual intervention might be required or the page might be stuck.");
//       } else {
//         console.log("✅ Bot verification resolved or removed.");
//       }
//     }
//   } catch (error) {
//     // Selector not found within timeout, which is expected if no verification is needed
//     // console.log("No bot verification detected (or it resolved quickly).");
//   }
// }

// // New helper function to attempt closing common pop-ups
// async function closePopups(page) {
//   const closeButtonSelectors = [
//     'button[aria-label="Close"]',
//     'button[data-testid="close-button"]',
//     'svg[aria-label="Close"]',
//     '.Modal-closeButton',
//     '.x-button',
//     'button.dismiss-button', // Added another common selector
//     'button[aria-label="Close Sign in or Sign up"]' // Specific selector for the sign-in/sign-up modal
//   ];
//   for (const selector of closeButtonSelectors) {
//     try {
//       // Use page.waitForSelector with a short timeout, then click if found
//       const button = await page.waitForSelector(selector, { timeout: 3000 }).catch(() => null);
//       if (button) {
//         console.log(`Found and closing pop-up with selector: ${selector}`);
//         await clickWithWait(page, selector, { waitTime: 500 });
//         await waitFor(1000); // Wait for modal to disappear
//         // Re-check if another modal appeared or if this one didn't fully close
//         const stillPresent = await page.$(selector);
//         if (!stillPresent) {
//           console.log(`✅ Pop-up closed successfully with ${selector}.`);
//           return true; // Return true if one was successfully closed
//         }
//       }
//     } catch (error) {
//       // Ignore errors if selector not found within timeout
//     }
//   }
//   return false; // Return false if no pop-up was found and closed
// }

// // New function to handle Cloudflare verification checkbox
// async function handleCloudflareVerification(page) {
//   // More specific selectors for the Cloudflare checkbox
//   const checkboxSelectors = [
//     'input[type="checkbox"][aria-label="Verify you are human"]',
//     '.cb-c input[type="checkbox"]',
//     '#content input[type="checkbox"]' // Targeting the checkbox within the provided #content div
//   ];

//   for (const selector of checkboxSelectors) {
//     try {
//       console.log(`🔍 Checking for Cloudflare verification checkbox with selector: ${selector}...`);
//       const checkbox = await page.waitForSelector(selector, { timeout: 15000 }).catch(() => null); // Increased timeout
//       if (checkbox) {
//         console.log("✅ Cloudflare verification checkbox found. Clicking it...");
//         await checkbox.click();
//         await waitFor(7000); // Increased wait for verification to process
//         console.log("✅ Cloudflare verification handled (clicked checkbox).");
//         // After clicking, wait for the verification to complete and the element to disappear
//         await page.waitForFunction((sel) => !document.querySelector(sel), { timeout: 10000 }, selector)
//           .catch(() => console.log("Cloudflare checkbox did not disappear after clicking, but proceeding."));
//         return true;
//       }
//     } catch (error) {
//       console.log(`⚠️ Cloudflare verification checkbox not found or could not be clicked with selector ${selector}: ${error.message}`);
//     }
//   }
//   console.log("❌ Could not handle Cloudflare verification with any selector.");
//   return false;
// }


// // Initialize browser
// async function initBrowser() {
//   console.log("🚀 Step 1: Launching browser...");
//   const browser = await puppeteer.launch({
//     headless: CONFIG.headless,
//     defaultViewport: null,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-accelerated-2d-canvas",
//       "--no-first-run",
//       "--no-zygote",
//       "--disable-gpu",
//       "--disable-blink-features=AutomationControlled",
//     ],
//   });

//   const page = await browser.newPage();
//   await page.setViewport({ width: 1920, height: 1080 });
//   await page.setUserAgent(
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
//   );

//   // Remove automation indicators
//   await page.evaluateOnNewDocument(() => {
//     Object.defineProperty(navigator, "webdriver", {
//       get: () => undefined,
//     });
//   });

//   return { browser, page };
// }

// // Modified addAddress function to handle initial navigation and address input
// async function addAddress(page, address) {
//   console.log("🏠 Step 4: Adding address...");
//   try {
//     // Navigate to base URL first
//     await page.goto("https://www.doordash.com", {
//       waitUntil: "networkidle2",
//       timeout: CONFIG.timeout,
//     });
    
//     // Handle Cloudflare verification immediately after initial page load
//     await handleCloudflareVerification(page);

//     await handleBotVerification(page);
//     await waitFor(3000); // Give time for initial page to settle

//     // Attempt to close any initial pop-ups
//     await closePopups(page);

//     // Enter address
//     const addressInputSelector = 'input[placeholder*="Enter delivery address"]';
//     await page.waitForSelector(addressInputSelector, { timeout: 150000 });
//     await page.click(addressInputSelector);
//     await waitFor(1000); // Wait after clicking to allow any address modal to appear

//     // Attempt to close any modal that opened after clicking the address input
//     await closePopups(page);

//     // Clear the input field before typing
//     await page.evaluate((selector) => {
//       const element = document.querySelector(selector);
//       if (element) {
//         element.value = '';
//         element.dispatchEvent(new Event('input', { bubbles: true }));
//       }
//     }, addressInputSelector);
//     await waitFor(500); // Small wait after clearing
    
//     await page.type(addressInputSelector, address, { delay: 200 });
//     await waitFor(2500);
//     console.log('✅ Address handled.');

//     // Press Enter after typing the address
//     await page.keyboard.press('Enter');
//     await waitFor(3000); // Wait for the page to react to the Enter key

//     // Auto-redirects to https://www.doordash.com/home?newUser=true (or similar) after address is set.
//     // We will explicitly navigate to ensure the correct page.
//     console.log('🚪 Navigating to /home?newUser=true...');
//     await page.goto('https://www.doordash.com/home?newUser=true', {
//       waitUntil: 'networkidle2',
//       timeout: CONFIG.timeout,
//     });
//     await handleBotVerification(page); // Check for bot verification on home page
//     await waitFor(5000); // Wait 5 seconds as requested

//     console.log('🚪 Navigating to /tabs/grocery...');
//     await page.goto('https://www.doordash.com/tabs/grocery', {
//       waitUntil: 'networkidle2',
//       timeout: CONFIG.timeout,
//     });
//     await handleBotVerification(page); // Check for bot verification on grocery page
//     await waitFor(3000); // Small wait after navigating to grocery

//     await takeScreenshot(page, "address-set-and-grocery-navigated.png");
//     console.log("✅ Address successfully set and navigated to grocery page!");
//     return true;
//   } catch (err) {
//     console.error("❌ Error adding address and navigating to grocery:", err.message);
//     await takeScreenshot(page, "address-error.png");
//     return false;
//   }
// }

// async function scrapeGroceryLinks(page) {
//   try {
//     console.log("🛒 Step 5: Ensuring we are on the grocery page...");
//     // This function now primarily ensures we are on the grocery page if not already.
//     // The navigation to /tabs/grocery is handled by addAddress.
//     const currentUrl = page.url();
//     if (!currentUrl.includes("/tabs/grocery")) {
//       console.log("⚠️ Not on grocery page, navigating now...");
//       await page.goto("https://www.doordash.com/tabs/grocery", {
//         waitUntil: "networkidle2",
//         timeout: CONFIG.timeout,
//       });
//       await handleBotVerification(page); // Check for bot verification on grocery page
//       await waitFor(3000); // Small wait after navigating
//     }

//     await takeScreenshot(page, "grocery-page.png");

//     // NEW: Click the "See All" button for grocery categories
//     console.log("🔍 Looking for 'See All' button for grocery categories...");
//     const grocerySeeAllSelectors = [
//       'a[data-anchor-id="SeeAll"][href*="/vertical_homepage?vertical_id=3"]',
//       'a[aria-labelledby="see-all"]',
//       'a[href*="/vertical_homepage"]',
//     ];

//     let seeAllGroceryClicked = false;
//     for (const selector of grocerySeeAllSelectors) {
//       const elementFound = await page.$(selector);
//       if (elementFound) {
//         console.log(`✅ Found 'See All' button with selector: ${selector}, attempting to click...`);
//         seeAllGroceryClicked = await clickWithWait(page, selector, {
//           waitTime: 3000,
//           timeout: 20000 // Increased timeout for this specific click
//         });
//         if (seeAllGroceryClicked) {
//           break;
//         }
//       }
//     }

//     if (seeAllGroceryClicked) {
//       console.log("✅ Clicked 'See All' button for grocery categories. Waiting for store cards to load...");
//       // Wait for the store cards to appear directly
//       await page.waitForSelector('[data-anchor-id="StoreCard"]', {
//         timeout: 120000, // Use a long timeout for this crucial element
//       });
//       await waitFor(5000); // Give some extra time for content to render
//       await takeScreenshot(page, "grocery-categories-see-all-page.png");
//       await handleBotVerification(page); // Check for bot verification after navigation
//     } else {
//       console.log("⚠️ Could not click 'See All' button for grocery categories. Proceeding to scrape existing store links.");
//       // If the button wasn't clicked, we still need to wait for store cards on the current page
//       await page.waitForSelector('[data-anchor-id="StoreCard"]', {
//         timeout: CONFIG.timeout, // Use global timeout
//       });
//       await waitFor(3000); // Small wait if we were already on the page
//     }


//     console.log("🔍 Looking for store links...");
//     // This waitForSelector is now redundant if the above block successfully waited for StoreCard
//     // but kept for safety in case the initial click fails and it proceeds without error.
//     await page.waitForSelector('[data-anchor-id="StoreCard"]', {
//       timeout: CONFIG.timeout, // Use global timeout
//     });

//     // Scroll to load all content - Added for more robust store link collection
//     await autoScroll(page);
//     await waitFor(5000); // Give time for more store cards to load after initial scroll

//     // Extract all store links
//     const storeLinks = await page.evaluate(() => {
//       const links = Array.from(document.querySelectorAll('[data-anchor-id="StoreCard"]'));
//       return links.map((link) => {
//         const href = link.href.startsWith("/") ? "https://www.doordash.com" + link.getAttribute("href") : link.href;
//         const text = link.textContent.trim();
//         const title = link.title || "";
//         // Extract store ID from href
//         const match = href.match(/\/store\/(\d+)/);
//         const storeId = match ? match[1] : null;

//         return {
//           href,
//           text,
//           title,
//           storeId
//         };
//       });
//     });

//     console.log(`✅ Found ${storeLinks.length} store links`);

//     // Store the results
//     scrapedData.groceryStores = storeLinks;

//     return storeLinks;
//   } catch (error) {
//     console.error("❌ Error scraping grocery links:", error.message);
//     await takeScreenshot(page, "grocery-error.png");
//     return [];
//   }
// }

// async function scrapeStoreProducts(page, store) {
//   console.log(`🛍️ Step 6: Navigating to store: ${store.text || store.href} (ID: ${store.storeId || 'N/A'})`);
//   try {
//     // Retry navigation up to 3 times
//     let navigationSuccess = false;
//     for (let i = 0; i < 3; i++) {
//       try {
//         await page.goto(store.href, {
//           waitUntil: "domcontentloaded", // Changed to domcontentloaded for faster initial load
//           timeout: CONFIG.timeout, // Use global timeout
//         });
//         navigationSuccess = true;
//         break; // Exit retry loop if successful
//       } catch (navError) {
//         console.warn(`⚠️ Navigation to ${store.href} failed (attempt ${i + 1}/3): ${navError.message}`);
//         await waitFor(5000); // Wait before retrying
//       }
//     }

//     if (!navigationSuccess) {
//       throw new Error(`Failed to navigate to store page after multiple retries: ${store.href}`);
//     }

//     await handleBotVerification(page); // Check for bot verification on store page

//     await waitFor(5000); // Give more time for dynamic content to load
//     await takeScreenshot(page, `store-${store.storeId || 'unknown'}.png`);

//     // Handle potential pop-ups (e.g., location confirmation, sign-up prompts)
//     const closeButtonSelectors = [
//       'button[aria-label="Close"]',
//       'button[data-testid="close-button"]',
//       'svg[aria-label="Close"]',
//       '.Modal-closeButton',
//       '.x-button'
//     ];
//     for (const selector of closeButtonSelectors) {
//       const closeButton = await page.$(selector);
//       if (closeButton) {
//         console.log(`Found and closing pop-up with selector: ${selector}`);
//         await clickWithWait(page, selector, { waitTime: 500 });
//         await waitFor(1000); // Wait for modal to disappear
//         break;
//       }
//     }

//     // Extract Store Name
//     const storeNameElement = await page.waitForSelector('h1[data-anchor-id="ConvenienceStoreHeaderInfoStoreName"]', { timeout: 10000 }).catch(() => null);
//     const storeName = storeNameElement ? await page.evaluate(el => el.textContent.trim(), storeNameElement) : store.text || `Store ID ${store.storeId}`;
//     console.log(`Extracted Store Name: ${storeName}`);

//     // Initialize store entry in scrapedData.groceryProducts
//     if (!scrapedData.groceryProducts[storeName]) {
//       scrapedData.groceryProducts[storeName] = {};
//     }

//     console.log("🔍 Collecting 'See All' buttons for categories within the store...");
//     // Auto-scroll to load all 'See All' buttons within the store page
//     await autoScroll(page);
//     await waitFor(5000); // Give time for more 'See All' buttons to load

//     const seeAllButtonSelectors = [
//       'a[data-anchor-id="CarouselSeeAllButton"]',
//       'button[aria-label="See All"]',
//       'a[href*="/collection?store_id="]', // Generic link for collection
//     ];

//     const collectionLinks = await page.evaluate((selectors) => {
//       let links = [];
//       selectors.forEach(selector => {
//         document.querySelectorAll(selector).forEach(el => {
//           let href = el.getAttribute('href');
//           if (href) {
//             if (href.startsWith('/')) {
//               href = 'https://www.doordash.com' + href;
//             }
//             links.push(href);
//           }
//         });
//       });
//       return [...new Set(links)]; // Return unique links
//     }, seeAllButtonSelectors); // Pass selectors to page.evaluate

//     console.log(`Found ${collectionLinks.length} 'See All' collection links for store ${store.text || store.href}`);

//     // If no specific collection links are found, try to scrape products from the main store page
//     if (collectionLinks.length === 0) {
//       console.log("⚠️ No specific 'See All' collection links found for this store. Attempting to scrape products from the main store page.");
//       await autoScroll(page);
//       await waitFor(10000); // Increased wait for products to load on main page
//       const products = await page.evaluate((storeData, currentStoreName) => {
//         const productElements = Array.from(document.querySelectorAll('[data-testid="RetailItemCardPriceNameInfoBadgingFramework"]'));
//         return productElements.map(el => {
//           const name = el.querySelector('span[data-telemetry-id="priceNameInfo.name"]')?.textContent.trim() || 'N/A';
//           let currentPrice = 'N/A';
//           let originalPrice = 'N/A';
//           let discount = 'N/A';

//           const currentPriceMain = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-2.cGEDSS')?.textContent.trim() || '';
//           const currentPriceDecimal = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.kQLTAj')?.textContent.trim() || '';
//           const currentPriceSymbol = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.erPBol')?.textContent.trim() || '';
          
//           if (currentPriceMain !== '') {
//               currentPrice = `${currentPriceSymbol}${currentPriceMain}${currentPriceDecimal}`;
//           } else {
//               currentPrice = el.querySelector('.sc-85923f71-0.hlWxbc')?.textContent.trim() || 'N/A';
//           }

//           originalPrice = el.querySelector('span.sc-aXZVg.gQfTyJ')?.textContent.trim() || 'N/A';
//           discount = el.querySelector('[data-testid*="percent_discount"] span.sc-aXZVg.iYfHGV')?.textContent.trim() || 'N/A';

//           const rating = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.sc-78b48fa8-2.jMkaIe')?.textContent.trim() || 'N/A';
//           const ratingCount = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.dxgIrH')?.textContent.trim() || 'N/A';

//           return {
//             storeName: currentStoreName, // Use the extracted storeName
//             storeUrl: storeData.href,
//             storeId: storeData.storeId,
//             collectionName: "Main Store Products", // Default collection name
//             collectionUrl: storeData.href,
//             name,
//             currentPrice,
//             originalPrice,
//             discount,
//             rating,
//             ratingCount,
//           };
//         });
//       }, store, storeName); // Pass storeName
      
//       if (!scrapedData.groceryProducts[storeName]["Main Store Products"]) {
//         scrapedData.groceryProducts[storeName]["Main Store Products"] = [];
//       }
//       scrapedData.groceryProducts[storeName]["Main Store Products"].push(...products);
//       await saveToJSON(); // Save after scraping main page products
//     } else {
//       // Iterate through each collected collection link and scrape products
//       for (const collectionLink of collectionLinks) {
//         console.log(`➡️ Navigating to collection: ${collectionLink}`);
//         try {
//           await page.goto(collectionLink, {
//             waitUntil: "domcontentloaded",
//             timeout: CONFIG.timeout,
//           });
//           await handleBotVerification(page);
//           await waitFor(5000); // Give time for the collection page to load
//           await takeScreenshot(page, `store-${store.storeId || 'unknown'}-collection-${collectionLinks.indexOf(collectionLink)}.png`);

//           // Extract Collection Name
//           const collectionNameElement = await page.waitForSelector('h1.sc-aXZVg.sc-3f3d4ebd-2.ifaqAR.fqQcnW', { timeout: 10000 }).catch(() => null);
//           const collectionName = collectionNameElement ? await page.evaluate(el => el.textContent.trim(), collectionNameElement) : 'Unnamed Collection';
//           console.log(`Extracted Collection Name: ${collectionName}`);

//           // Initialize collection array under store name
//           if (!scrapedData.groceryProducts[storeName][collectionName]) {
//             scrapedData.groceryProducts[storeName][collectionName] = [];
//           }

//           console.log("🔄 Auto-scrolling to load all products in collection...");
//           await autoScroll(page);
//           await waitFor(15000); // Increased wait after auto-scroll for products to load

//           console.log("⛏️ Scraping product details from collection...");
//           const products = await page.evaluate((storeData, currentCollectionLink, currentStoreName, currentCollectionName) => { // Added currentStoreName, currentCollectionName
//             const productElements = Array.from(document.querySelectorAll('[data-testid="RetailItemCardPriceNameInfoBadgingFramework"]'));
//             return productElements.map(el => {
//               const name = el.querySelector('span[data-telemetry-id="priceNameInfo.name"]')?.textContent.trim() || 'N/A';
//               let currentPrice = 'N/A';
//               let originalPrice = 'N/A';
//               let discount = 'N/A';

//               const currentPriceMain = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-2.cGEDSS')?.textContent.trim() || '';
//               const currentPriceDecimal = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.kQLTAj')?.textContent.trim() || '';
//               const currentPriceSymbol = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.erPBol')?.textContent.trim() || '';
              
//               if (currentPriceMain !== '') {
//                   currentPrice = `${currentPriceSymbol}${currentPriceMain}${currentPriceDecimal}`;
//               } else {
//                   currentPrice = el.querySelector('.sc-85923f71-0.hlWxbc')?.textContent.trim() || 'N/A';
//               }

//               originalPrice = el.querySelector('span.sc-aXZVg.gQfTyJ')?.textContent.trim() || 'N/A';
//               discount = el.querySelector('[data-testid*="percent_discount"] span.sc-aXZVg.iYfHGV')?.textContent.trim() || 'N/A';

//               const rating = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.sc-78b48fa8-2.jMkaIe')?.textContent.trim() || 'N/A';
//               const ratingCount = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.dxgIrH')?.textContent.trim() || 'N/A';

//               return {
//                 storeName: currentStoreName, // Use the passed argument here
//                 storeUrl: storeData.href,
//                 storeId: storeData.storeId,
//                 collectionName: currentCollectionName, // Use the passed argument here
//                 collectionUrl: currentCollectionLink, 
//                 name,
//                 currentPrice,
//                 originalPrice,
//                 discount,
//                 rating,
//                 ratingCount,
//               };
//             });
//           }, store, collectionLink, storeName, collectionName); // Passed storeName and collectionName

//           console.log(`✅ Found ${products.length} products for collection ${collectionLink}`);
//           scrapedData.groceryProducts[storeName][collectionName].push(...products);
//           await saveToJSON(); // Save after each collection scrape
//         } catch (collectionError) {
//           console.error(`❌ Error scraping collection ${collectionLink} for store ${store.text || store.href} (ID: ${store.storeId || 'N/A'}):`, collectionError.message);
//           await takeScreenshot(page, `store-${store.storeId || 'unknown'}-collection-error-${collectionLinks.indexOf(collectionLink)}.png`);
//         }
//       }
//     }

//   } catch (error) {
//     console.error(`❌ Error scraping products for ${store.text || store.href} (ID: ${store.storeId || 'N/A'}):`, error.message);
//     await takeScreenshot(page, `store-${store.storeId || 'unknown'}-error.png`);
//   }
// }


// // Save data to JSON
// async function saveToJSON(filename = "doordash_grocery_data.json") {
//   try {
//     console.log("💾 Saving data to JSON...");
//     const dataDir = path.join(process.cwd(), "scraped-data");

//     try {
//       await fs.access(dataDir);
//     } catch {
//       await fs.mkdir(dataDir, { recursive: true });
//     }

//     const filePath = path.join(dataDir, filename);
//     await fs.writeFile(filePath, JSON.stringify(scrapedData, null, 2));

//     console.log(`✅ Data saved to: ${filePath}`);
//     // Count total products for logging
//     let totalProductsCount = 0;
//     for (const storeName in scrapedData.groceryProducts) {
//       const collections = scrapedData.groceryProducts[storeName];
//       for (const collectionName in collections) {
//         totalProductsCount += collections[collectionName].length;
//       }
//     }
//     console.log(`📊 Total grocery stores scraped: ${scrapedData.groceryStores?.length || 0}`);
//     console.log(`📊 Total grocery products scraped: ${totalProductsCount}`);
//   } catch (error) {
//     console.error("❌ Error saving data:", error.message);
//   }
// }

// // Save data to CSV
// async function saveToCSV(filename = "Grocery.csv") {
//   try {
//     console.log("📊 Converting and saving data to CSV...");
//     const dataDir = path.join(process.cwd(), "scraped-data");
//     await fs.mkdir(dataDir, { recursive: true });
//     const filePath = path.join(dataDir, filename);

//     let allProducts = [];
//     for (const storeName in scrapedData.groceryProducts) {
//       const collections = scrapedData.groceryProducts[storeName];
//       for (const collectionName in collections) {
//         allProducts = allProducts.concat(collections[collectionName]);
//       }
//     }

//     if (allProducts.length === 0) {
//       console.log("⚠️ No products to save to CSV.");
//       return;
//     }

//     // Get headers from the first product object
//     const headers = Object.keys(allProducts[0]);
//     const csvRows = [];

//     // Add header row
//     csvRows.push(headers.join(','));

//     // Add data rows
//     for (const product of allProducts) {
//       const values = headers.map(header => {
//         const value = product[header];
//         // Handle commas and newlines in values by enclosing in double quotes
//         // Double double quotes for existing double quotes
//         return typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))
//           ? `"${value.replace(/"/g, '""')}"`
//           : value;
//       });
//       csvRows.push(values.join(','));
//     }

//     await fs.writeFile(filePath, csvRows.join('\n'));
//     console.log(`✅ Data saved to CSV: ${filePath}`);
//   } catch (error) {
//     console.error("❌ Error saving data to CSV:", error.message);
//   }
// }

// async function scrapeDoorDash() {
//   let browser = null;
//   try {
//     // Initialize browser
//     const { browser: browserInstance, page } = await initBrowser();
//     browser = browserInstance;

//     // Skip login and directly add address, then navigate to grocery
//     const addressSuccess = await addAddress(page, CONFIG.location);
//     if (!addressSuccess) {
//       throw new Error("Failed to set address and navigate to grocery page.");
//     }

//     console.log("✅ Successfully set address and reached grocery page.");

//     // ✅ Go to grocery tab now and scrape store links
//     const storeLinks = await scrapeGroceryLinks(page);
//     if (storeLinks.length === 0) {
//       console.log("⚠️ No store links found on grocery page");
//     } else {
//       // Iterate through each store link and scrape products
//       for (const store of storeLinks) {
//         await scrapeStoreProducts(page, store);
//       }
//     }

//     // Final save to JSON (incremental saves are now in place, but this ensures a final state)
//     await saveToJSON();
//     // Convert and save data to CSV
//     await saveToCSV();

//     console.log("🎉 Grocery scraping completed successfully!");
//   } catch (error) {
//     console.error("❌ Scraping failed:", error.message);
//     console.log("💡 Check the screenshots folder for debugging information");
//   } finally {
//     console.log("🔒 Closing browser...");
//     if (browser) {
//       await browser.close();
//     }
//   }
// }

// scrapeDoorDash();



import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

// Configuration
const CONFIG = {
  // email: "jiten91.dcs@gmail.com", // Removed as login is skipped
  // password: "Jitu451234@", // Removed as login is skipped
  location: "900 Market St San Francisco, CA 94102, USA",
  headless: false, // Set to true for headless operation
  timeout: 90000, // Increased global timeout to 90 seconds
};

// Global data storage
let scrapedData = {
  restaurants: [],
  orders: [],
  userProfile: {},
  groceryStores: [], // To store basic grocery store links
  groceryProducts: {}, // Changed to an object to store products by StoreName -> CollectionName
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
      { timeout: timeout }, // Use passed timeout for function as well
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
    await waitForElementReady(page, selector, timeout);

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

// Handle bot verification (e.g., "verifying-container") and remove it
async function handleBotVerification(page) {
  const verifyingSelector = '.verifying-container, svg#verifying-i';
  try {
    const verifyingElement = await page.waitForSelector(verifyingSelector, { timeout: 5000 }).catch(() => null);
    if (verifyingElement) {
      console.log("🤖 Bot verification detected. Waiting for it to resolve and attempting to remove...");
      await waitFor(10000); // Wait for 10 seconds for it to resolve

      // Attempt to remove the element from the DOM
      await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.remove();
          console.log(`Removed bot verification element: ${selector}`);
        }
      }, verifyingSelector);

      const stillVerifying = await page.$(verifyingSelector);
      if (stillVerifying) {
        console.warn("⚠️ Bot verification still present after attempted removal. Manual intervention might be required or the page might be stuck.");
      } else {
        console.log("✅ Bot verification resolved or removed.");
      }
    }
  } catch (error) {
    // Selector not found within timeout, which is expected if no verification is needed
    // console.log("No bot verification detected (or it resolved quickly).");
  }
}

// New helper function to attempt closing common pop-ups
async function closePopups(page) {
  const closeButtonSelectors = [
    'button[aria-label="Close"]',
    'button[data-testid="close-button"]',
    'svg[aria-label="Close"]',
    '.Modal-closeButton',
    '.x-button',
    'button.dismiss-button', // Added another common selector
    'button[aria-label="Close Sign in or Sign up"]' // Specific selector for the sign-in/sign-up modal
  ];
  for (const selector of closeButtonSelectors) {
    try {
      // Use page.waitForSelector with a short timeout, then click if found
      const button = await page.waitForSelector(selector, { timeout: 3000 }).catch(() => null);
      if (button) {
        console.log(`Found and closing pop-up with selector: ${selector}`);
        await clickWithWait(page, selector, { waitTime: 500 });
        await waitFor(1000); // Wait for modal to disappear
        // Re-check if another modal appeared or if this one didn't fully close
        const stillPresent = await page.$(selector);
        if (!stillPresent) {
          console.log(`✅ Pop-up closed successfully with ${selector}.`);
          return true; // Return true if one was successfully closed
        }
      }
    } catch (error) {
      // Ignore errors if selector not found within timeout
    }
  }
  return false; // Return false if no pop-up was found and closed
}

// New function to handle Cloudflare verification checkbox
async function handleCloudflareVerification(page) {
  console.log("🔍 Attempting to handle Cloudflare verification...");
  await waitFor(5000); // Give Cloudflare some time to load its challenge

  let targetFrame = page; // Assume main frame initially

  // Check for Cloudflare iframe
  const iframeSelector = 'iframe[title="Widget containing a Cloudflare security challenge"]';
  try {
    const iframeElement = await page.waitForSelector(iframeSelector, { timeout: 10000 }).catch(() => null);
    if (iframeElement) {
      console.log("✅ Cloudflare iframe detected. Switching context...");
      targetFrame = await iframeElement.contentFrame();
      if (!targetFrame) {
        console.warn("⚠️ Could not get content frame of Cloudflare iframe. Falling back to main page.");
        targetFrame = page; // Fallback to main page if frame not found
      } else {
        console.log("✅ Switched to Cloudflare iframe context.");
      }
    }
  } catch (error) {
    console.log("⚠️ No Cloudflare iframe found or error getting iframe:", error.message);
  }

  // More specific selectors for the Cloudflare checkbox within the targetFrame
  const checkboxSelectors = [
    'input[type="checkbox"][aria-label="Verify you are human"]',
    'label.cb-lb input[type="checkbox"]', // Direct checkbox inside the label
    'label.cb-lb', // Clicking the label itself
    '.cb-c input[type="checkbox"]',
    '#content input[type="checkbox"]'
  ];

  for (const selector of checkboxSelectors) {
    try {
      console.log(`🔍 Checking for Cloudflare verification element with selector: ${selector} in target frame...`);
      const elementFound = await targetFrame.waitForSelector(selector, { timeout: 10000 }).catch(() => null); // Reduced timeout for individual selector checks
      if (elementFound) {
        console.log(`✅ Cloudflare verification element found with selector: ${selector}. Clicking it...`);
        // Use clickWithWait for robustness
        const clicked = await clickWithWait(targetFrame, selector, { waitTime: 1000, timeout: 10000 });
        if (clicked) {
          console.log("✅ Cloudflare verification handled (clicked checkbox/label).");
          // Wait for the challenge to resolve, either by navigation or element disappearance
          try {
            await Promise.race([
              page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }), // Wait for navigation
              targetFrame.waitForFunction((sel) => !document.querySelector(sel), { timeout: 30000 }, selector) // Wait for element to disappear
            ]);
            console.log("✅ Cloudflare challenge resolved or element disappeared.");
          } catch (raceError) {
            console.log("⚠️ Cloudflare challenge did not immediately resolve or element disappear, but proceeding:", raceError.message);
          }
          await waitFor(5000); // Additional wait for page stability
          return true;
        }
      }
    } catch (error) {
      console.log(`⚠️ Error with Cloudflare selector ${selector}: ${error.message}`);
    }
  }
  console.log("❌ Could not handle Cloudflare verification with any selector or method.");
  return false;
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

// Modified addAddress function to handle initial navigation and address input
async function addAddress(page, address) {
  console.log("🏠 Step 4: Adding address...");
  try {
    // Navigate to base URL first
    await page.goto("https://www.doordash.com", {
      waitUntil: "networkidle2",
      timeout: CONFIG.timeout,
    });
    
    // Handle Cloudflare verification immediately after initial page load
    await handleCloudflareVerification(page);

    await handleBotVerification(page);
    await waitFor(3000); // Give time for initial page to settle

    // Attempt to close any initial pop-ups
    await closePopups(page);

    // Enter address
    const addressInputSelector = 'input[placeholder*="Enter delivery address"]';
    await page.waitForSelector(addressInputSelector, { timeout: 150000 });
    await page.click(addressInputSelector);
    await waitFor(1000); // Wait after clicking to allow any address modal to appear

    // Attempt to close any modal that opened after clicking the address input
    await closePopups(page);

    // Clear the input field before typing
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, addressInputSelector);
    await waitFor(500); // Small wait after clearing
    
    await page.type(addressInputSelector, address, { delay: 200 });
    await waitFor(2500);
    console.log('✅ Address handled.');

    // Press Enter after typing the address
    await page.keyboard.press('Enter');
    await waitFor(3000); // Wait for the page to react to the Enter key

    // Auto-redirects to https://www.doordash.com/home?newUser=true (or similar) after address is set.
    // We will explicitly navigate to ensure the correct page.
    console.log('🚪 Navigating to /home?newUser=true...');
    await page.goto('https://www.doordash.com/home?newUser=true', {
      waitUntil: 'networkidle2',
      timeout: CONFIG.timeout,
    });
    await handleBotVerification(page); // Check for bot verification on home page
    await waitFor(5000); // Wait 5 seconds as requested

    console.log('🚪 Navigating to /tabs/grocery...');
    await page.goto('https://www.doordash.com/tabs/grocery', {
      waitUntil: 'networkidle2',
      timeout: CONFIG.timeout,
    });
    await handleBotVerification(page); // Check for bot verification on grocery page
    await waitFor(3000); // Small wait after navigating to grocery

    await takeScreenshot(page, "address-set-and-grocery-navigated.png");
    console.log("✅ Address successfully set and navigated to grocery page!");
    return true;
  } catch (err) {
    console.error("❌ Error adding address and navigating to grocery:", err.message);
    await takeScreenshot(page, "address-error.png");
    return false;
  }
}

async function scrapeGroceryLinks(page) {
  try {
    console.log("🛒 Step 5: Ensuring we are on the grocery page...");
    // This function now primarily ensures we are on the grocery page if not already.
    // The navigation to /tabs/grocery is handled by addAddress.
    const currentUrl = page.url();
    if (!currentUrl.includes("/tabs/grocery")) {
      console.log("⚠️ Not on grocery page, navigating now...");
      await page.goto("https://www.doordash.com/tabs/grocery", {
        waitUntil: "networkidle2",
        timeout: CONFIG.timeout,
      });
      await handleBotVerification(page); // Check for bot verification on grocery page
      await waitFor(3000); // Small wait after navigating
    }

    await takeScreenshot(page, "grocery-page.png");

    // NEW: Click the "See All" button for grocery categories
    console.log("🔍 Looking for 'See All' button for grocery categories...");
    const grocerySeeAllSelectors = [
      'a[data-anchor-id="SeeAll"][href*="/vertical_homepage?vertical_id=3"]',
      'a[aria-labelledby="see-all"]',
      'a[href*="/vertical_homepage"]',
    ];

    let seeAllGroceryClicked = false;
    for (const selector of grocerySeeAllSelectors) {
      const elementFound = await page.$(selector);
      if (elementFound) {
        console.log(`✅ Found 'See All' button with selector: ${selector}, attempting to click...`);
        seeAllGroceryClicked = await clickWithWait(page, selector, {
          waitTime: 3000,
          timeout: 20000 // Increased timeout for this specific click
        });
        if (seeAllGroceryClicked) {
          break;
        }
      }
    }

    if (seeAllGroceryClicked) {
      console.log("✅ Clicked 'See All' button for grocery categories. Waiting for store cards to load...");
      // Wait for the store cards to appear directly
      await page.waitForSelector('[data-anchor-id="StoreCard"]', {
        timeout: 120000, // Use a long timeout for this crucial element
      });
      await waitFor(5000); // Give some extra time for content to render
      await takeScreenshot(page, "grocery-categories-see-all-page.png");
      await handleBotVerification(page); // Check for bot verification after navigation
    } else {
      console.log("⚠️ Could not click 'See All' button for grocery categories. Proceeding to scrape existing store links.");
      // If the button wasn't clicked, we still need to wait for store cards on the current page
      await page.waitForSelector('[data-anchor-id="StoreCard"]', {
        timeout: CONFIG.timeout, // Use global timeout
      });
      await waitFor(3000); // Small wait if we were already on the page
    }


    console.log("🔍 Looking for store links...");
    // This waitForSelector is now redundant if the above block successfully waited for StoreCard
    // but kept for safety in case the initial click fails and it proceeds without error.
    await page.waitForSelector('[data-anchor-id="StoreCard"]', {
      timeout: CONFIG.timeout, // Use global timeout
    });

    // Scroll to load all content - Added for more robust store link collection
    await autoScroll(page);
    await waitFor(5000); // Give time for more store cards to load after initial scroll

    // Extract all store links
    const storeLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('[data-anchor-id="StoreCard"]'));
      return links.map((link) => {
        const href = link.href.startsWith("/") ? "https://www.doordash.com" + link.getAttribute("href") : link.href;
        const text = link.textContent.trim();
        const title = link.title || "";
        // Extract store ID from href
        const match = href.match(/\/store\/(\d+)/);
        const storeId = match ? match[1] : null;

        return {
          href,
          text,
          title,
          storeId
        };
      });
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

async function scrapeStoreProducts(page, store) {
  console.log(`🛍️ Step 6: Navigating to store: ${store.text || store.href} (ID: ${store.storeId || 'N/A'})`);
  try {
    // Retry navigation up to 3 times
    let navigationSuccess = false;
    for (let i = 0; i < 3; i++) {
      try {
        await page.goto(store.href, {
          waitUntil: "domcontentloaded", // Changed to domcontentloaded for faster initial load
          timeout: CONFIG.timeout, // Use global timeout
        });
        navigationSuccess = true;
        break; // Exit retry loop if successful
      } catch (navError) {
        console.warn(`⚠️ Navigation to ${store.href} failed (attempt ${i + 1}/3): ${navError.message}`);
        await waitFor(5000); // Wait before retrying
      }
    }

    if (!navigationSuccess) {
      throw new Error(`Failed to navigate to store page after multiple retries: ${store.href}`);
    }

    await handleBotVerification(page); // Check for bot verification on store page

    await waitFor(5000); // Give more time for dynamic content to load
    await takeScreenshot(page, `store-${store.storeId || 'unknown'}.png`);

    // Handle potential pop-ups (e.g., location confirmation, sign-up prompts)
    const closeButtonSelectors = [
      'button[aria-label="Close"]',
      'button[data-testid="close-button"]',
      'svg[aria-label="Close"]',
      '.Modal-closeButton',
      '.x-button'
    ];
    for (const selector of closeButtonSelectors) {
      const closeButton = await page.$(selector);
      if (closeButton) {
        console.log(`Found and closing pop-up with selector: ${selector}`);
        await clickWithWait(page, selector, { waitTime: 500 });
        await waitFor(1000); // Wait for modal to disappear
        break;
      }
    }

    // Extract Store Name
    const storeNameElement = await page.waitForSelector('h1[data-anchor-id="ConvenienceStoreHeaderInfoStoreName"]', { timeout: 10000 }).catch(() => null);
    const storeName = storeNameElement ? await page.evaluate(el => el.textContent.trim(), storeNameElement) : store.text || `Store ID ${store.storeId}`;
    console.log(`Extracted Store Name: ${storeName}`);

    // Initialize store entry in scrapedData.groceryProducts
    if (!scrapedData.groceryProducts[storeName]) {
      scrapedData.groceryProducts[storeName] = {};
    }

    console.log("🔍 Collecting 'See All' buttons for categories within the store...");
    // Auto-scroll to load all 'See All' buttons within the store page
    await autoScroll(page);
    await waitFor(5000); // Give time for more 'See All' buttons to load

    const seeAllButtonSelectors = [
      'a[data-anchor-id="CarouselSeeAllButton"]',
      'button[aria-label="See All"]',
      'a[href*="/collection?store_id="]', // Generic link for collection
    ];

    const collectionLinks = await page.evaluate((selectors) => {
      let links = [];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          let href = el.getAttribute('href');
          if (href) {
            if (href.startsWith('/')) {
              href = 'https://www.doordash.com' + href;
            }
            links.push(href);
          }
        });
      });
      return [...new Set(links)]; // Return unique links
    }, seeAllButtonSelectors); // Pass selectors to page.evaluate

    console.log(`Found ${collectionLinks.length} 'See All' collection links for store ${store.text || store.href}`);

    // If no specific collection links are found, try to scrape products from the main store page
    if (collectionLinks.length === 0) {
      console.log("⚠️ No specific 'See All' collection links found for this store. Attempting to scrape products from the main store page.");
      await autoScroll(page);
      await waitFor(10000); // Increased wait for products to load on main page
      const products = await page.evaluate((storeData, currentStoreName) => {
        const productElements = Array.from(document.querySelectorAll('[data-testid="RetailItemCardPriceNameInfoBadgingFramework"]'));
        return productElements.map(el => {
          const name = el.querySelector('span[data-telemetry-id="priceNameInfo.name"]')?.textContent.trim() || 'N/A';
          let currentPrice = 'N/A';
          let originalPrice = 'N/A';
          let discount = 'N/A';

          const currentPriceMain = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-2.cGEDSS')?.textContent.trim() || '';
          const currentPriceDecimal = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.kQLTAj')?.textContent.trim() || '';
          const currentPriceSymbol = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.erPBol')?.textContent.trim() || '';
          
          if (currentPriceMain !== '') {
              currentPrice = `${currentPriceSymbol}${currentPriceMain}${currentPriceDecimal}`;
          } else {
              currentPrice = el.querySelector('.sc-85923f71-0.hlWxbc')?.textContent.trim() || 'N/A';
          }

          originalPrice = el.querySelector('span.sc-aXZVg.gQfTyJ')?.textContent.trim() || 'N/A';
          discount = el.querySelector('[data-testid*="percent_discount"] span.sc-aXZVg.iYfHGV')?.textContent.trim() || 'N/A';

          const rating = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.sc-78b48fa8-2.jMkaIe')?.textContent.trim() || 'N/A';
          const ratingCount = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.dxgIrH')?.textContent.trim() || 'N/A';

          return {
            storeName: currentStoreName, // Use the extracted storeName
            storeUrl: storeData.href,
            storeId: storeData.storeId,
            collectionName: "Main Store Products", // Default collection name
            collectionUrl: storeData.href,
            name,
            currentPrice,
            originalPrice,
            discount,
            rating,
            ratingCount,
          };
        });
      }, store, storeName); // Pass storeName
      
      if (!scrapedData.groceryProducts[storeName]["Main Store Products"]) {
        scrapedData.groceryProducts[storeName]["Main Store Products"] = [];
      }
      scrapedData.groceryProducts[storeName]["Main Store Products"].push(...products);
      await saveToJSON(); // Save after scraping main page products
    } else {
      // Iterate through each collected collection link and scrape products
      for (const collectionLink of collectionLinks) {
        console.log(`➡️ Navigating to collection: ${collectionLink}`);
        try {
          await page.goto(collectionLink, {
            waitUntil: "domcontentloaded",
            timeout: CONFIG.timeout,
          });
          await handleBotVerification(page);
          await waitFor(5000); // Give time for the collection page to load
          await takeScreenshot(page, `store-${store.storeId || 'unknown'}-collection-${collectionLinks.indexOf(collectionLink)}.png`);

          // Extract Collection Name
          const collectionNameElement = await page.waitForSelector('h1.sc-aXZVg.sc-3f3d4ebd-2.ifaqAR.fqQcnW', { timeout: 10000 }).catch(() => null);
          const collectionName = collectionNameElement ? await page.evaluate(el => el.textContent.trim(), collectionNameElement) : 'Unnamed Collection';
          console.log(`Extracted Collection Name: ${collectionName}`);

          // Initialize collection array under store name
          if (!scrapedData.groceryProducts[storeName][collectionName]) {
            scrapedData.groceryProducts[storeName][collectionName] = [];
          }

          console.log("🔄 Auto-scrolling to load all products in collection...");
          await autoScroll(page);
          await waitFor(15000); // Increased wait after auto-scroll for products to load

          console.log("⛏️ Scraping product details from collection...");
          const products = await page.evaluate((storeData, currentCollectionLink, currentStoreName, currentCollectionName) => { // Added currentStoreName, currentCollectionName
            const productElements = Array.from(document.querySelectorAll('[data-testid="RetailItemCardPriceNameInfoBadgingFramework"]'));
            return productElements.map(el => {
              const name = el.querySelector('span[data-telemetry-id="priceNameInfo.name"]')?.textContent.trim() || 'N/A';
              let currentPrice = 'N/A';
              let originalPrice = 'N/A';
              let discount = 'N/A';

              const currentPriceMain = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-2.cGEDSS')?.textContent.trim() || '';
              const currentPriceDecimal = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.kQLTAj')?.textContent.trim() || '';
              const currentPriceSymbol = el.querySelector('.sc-85923f71-0.hlWxbc .sc-85923f71-1.erPBol')?.textContent.trim() || '';
              
              if (currentPriceMain !== '') {
                  currentPrice = `${currentPriceSymbol}${currentPriceMain}${currentPriceDecimal}`;
              } else {
                  currentPrice = el.querySelector('.sc-85923f71-0.hlWxbc')?.textContent.trim() || 'N/A';
              }

              originalPrice = el.querySelector('span.sc-aXZVg.gQfTyJ')?.textContent.trim() || 'N/A';
              discount = el.querySelector('[data-testid*="percent_discount"] span.sc-aXZVg.iYfHGV')?.textContent.trim() || 'N/A';

              const rating = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.sc-78b48fa8-2.jMkaIe')?.textContent.trim() || 'N/A';
              const ratingCount = el.querySelector('.sc-eqUAAy.jddrGr span.sc-aXZVg.sc-78b48fa8-1.dxgIrH')?.textContent.trim() || 'N/A';

              return {
                storeName: currentStoreName, // Use the passed argument here
                storeUrl: storeData.href,
                storeId: storeData.storeId,
                collectionName: currentCollectionName, // Use the passed argument here
                collectionUrl: currentCollectionLink, 
                name,
                currentPrice,
                originalPrice,
                discount,
                rating,
                ratingCount,
              };
            });
          }, store, collectionLink, storeName, collectionName); // Passed storeName and collectionName

          console.log(`✅ Found ${products.length} products for collection ${collectionLink}`);
          scrapedData.groceryProducts[storeName][collectionName].push(...products);
          await saveToJSON(); // Save after each collection scrape
        } catch (collectionError) {
          console.error(`❌ Error scraping collection ${collectionLink} for store ${store.text || store.href} (ID: ${store.storeId || 'N/A'}):`, collectionError.message);
          await takeScreenshot(page, `store-${store.storeId || 'unknown'}-collection-error-${collectionLinks.indexOf(collectionLink)}.png`);
        }
      }
    }

  } catch (error) {
    console.error(`❌ Error scraping products for ${store.text || store.href} (ID: ${store.storeId || 'N/A'}):`, error.message);
    await takeScreenshot(page, `store-${store.storeId || 'unknown'}-error.png`);
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
    // Count total products for logging
    let totalProductsCount = 0;
    for (const storeName in scrapedData.groceryProducts) {
      const collections = scrapedData.groceryProducts[storeName];
      for (const collectionName in collections) {
        totalProductsCount += collections[collectionName].length;
      }
    }
    console.log(`📊 Total grocery stores scraped: ${scrapedData.groceryStores?.length || 0}`);
    console.log(`📊 Total grocery products scraped: ${totalProductsCount}`);
  } catch (error) {
    console.error("❌ Error saving data:", error.message);
  }
}

// Save data to CSV
async function saveToCSV(filename = "Grocery.csv") {
  try {
    console.log("📊 Converting and saving data to CSV...");
    const dataDir = path.join(process.cwd(), "scraped-data");
    await fs.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, filename);

    let allProducts = [];
    for (const storeName in scrapedData.groceryProducts) {
      const collections = scrapedData.groceryProducts[storeName];
      for (const collectionName in collections) {
        allProducts = allProducts.concat(collections[collectionName]);
      }
    }

    if (allProducts.length === 0) {
      console.log("⚠️ No products to save to CSV.");
      return;
    }

    // Get headers from the first product object
    const headers = Object.keys(allProducts[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const product of allProducts) {
      const values = headers.map(header => {
        const value = product[header];
        // Handle commas and newlines in values by enclosing in double quotes
        // Double double quotes for existing double quotes
        return typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csvRows.push(values.join(','));
    }

    await fs.writeFile(filePath, csvRows.join('\n'));
    console.log(`✅ Data saved to CSV: ${filePath}`);
  } catch (error) {
    console.error("❌ Error saving data to CSV:", error.message);
  }
}

async function scrapeDoorDash() {
  let browser = null;
  try {
    // Initialize browser
    const { browser: browserInstance, page } = await initBrowser();
    browser = browserInstance;

    // Skip login and directly add address, then navigate to grocery
    const addressSuccess = await addAddress(page, CONFIG.location);
    if (!addressSuccess) {
      throw new Error("Failed to set address and navigate to grocery page.");
    }

    console.log("✅ Successfully set address and reached grocery page.");

    // ✅ Go to grocery tab now and scrape store links
    const storeLinks = await scrapeGroceryLinks(page);
    if (storeLinks.length === 0) {
      console.log("⚠️ No store links found on grocery page");
    } else {
      // Iterate through each store link and scrape products
      for (const store of storeLinks) {
        await scrapeStoreProducts(page, store);
      }
    }

    // Final save to JSON (incremental saves are now in place, but this ensures a final state)
    await saveToJSON();
    // Convert and save data to CSV
    await saveToCSV();

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

