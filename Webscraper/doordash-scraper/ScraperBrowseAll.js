import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

// Configuration
const CONFIG = {
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
  retailStores: [], // New: To store retail store links
  convenienceStores: [], // New: To store convenience store links
  alcoholStores: [], // New To store alcohol store links
  PetsStores: [], // New: To store Pets products
  ElectronicsStores: [], // New: To store Pets products
  HealthStores: [], // New: To store Pets products
  TidyFreshStores: [], // New: To store Pets products
  BabyStores: [], // New: To store Pets products
  SportsStores: [], // New: To store Pets products
  ApparelStores: [],
  groceryProducts: {}, // Changed to an object to store products by StoreName -> CollectionName
  retailProducts: {}, // New: To store retail products
  alcoholProducts: {}, // New: To store alcohol products
  convenienceProducts: {}, // New: To store convenience products
  Pets: {}, // New: To store Pets products
  Electronics: {}, // New: To store Pets products
  Health: {}, // New: To store Pets products
  TidyFresh: {}, // New: To store Pets products
  Baby: {}, // New: To store Pets products
  Sports: {}, // New: To store Pets products
  Apparel: {}, // New: To store Pets products
  scrapedAt: new Date().toISOString(),
};

// Helper function to wait for a specified time
async function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
          rect.width > 0 &&
          rect.height > 0 && // Element has dimensions
          style.visibility !== "hidden" && // Element is not hidden
          style.display !== "none" && // Element is not display none
          style.opacity !== "0" // Element is not transparent
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
        element.scrollIntoView({ behavior: "smooth", block: "center" });
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

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        // Track product count changes
        const currentCount = document.querySelectorAll(
          '[data-testid="RetailItemCardPriceNameInfoBadgingFramework"]'
        ).length;
        window.lastProductCount = window.lastProductCount || 0;

        if (currentCount > window.lastProductCount) {
          window.lastProductCount = currentCount;
          window.noNewProductsCount = 0;
        } else {
          window.noNewProductsCount = (window.noNewProductsCount || 0) + 1;
        }

        // Stop conditions:
        // 1. Reached bottom AND no new products for 5 scrolls
        // 2. No new products for 15 scrolls (safety)
        if (
          (totalHeight >= scrollHeight && window.noNewProductsCount >= 5) ||
          window.noNewProductsCount >= 15
        ) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });
  });
}

// Handle bot verification (e.g., "verifying-container") and remove it
async function handleBotVerification(page) {
  const verifyingSelector = ".verifying-container, svg#verifying-i";
  try {
    const verifyingElement = await page
      .waitForSelector(verifyingSelector, { timeout: 5000 })
      .catch(() => null);
    if (verifyingElement) {
      console.log(
        "🤖 Bot verification detected. Waiting for it to resolve and attempting to remove..."
      );
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
        console.warn(
          "⚠️ Bot verification still present after attempted removal. Manual intervention might be required or the page might be stuck."
        );
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
    ".Modal-closeButton",
    ".x-button",
    "button.dismiss-button", // Added another common selector
    'button[aria-label="Close Sign in or Sign up"]', // Specific selector for the sign-in/sign-up modal
  ];
  for (const selector of closeButtonSelectors) {
    try {
      // Use page.waitForSelector with a short timeout, then click if found
      const button = await page
        .waitForSelector(selector, { timeout: 3000 })
        .catch(() => null);
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
// Updated addAddress — lands on /browse after address is set
async function addAddress(page, address) {
  console.log("🏠 Step 4: Adding address...");
  try {
    // 1. Land on DoorDash root
    await page.goto("https://www.doordash.com", {
      waitUntil: "networkidle2",
      timeout: CONFIG.timeout,
    });

    // 2. Manual Cloudflare (user handles) + bot checks
    await handleBotVerification(page);
    await waitFor(3000);
    await closePopups(page);

    // 3. Enter delivery address
    const addressInputSelector = 'input[placeholder*="Enter delivery address"]';
    await page.waitForSelector(addressInputSelector, { timeout: 150000 });
    await page.click(addressInputSelector);
    await waitFor(1000);
    await closePopups(page);
    await handleBotVerification(page);

    // clear → type → Enter
    await page.evaluate(
      (sel) => (document.querySelector(sel).value = ""),
      addressInputSelector
    );
    await page.type(addressInputSelector, address, { delay: 200 });
    await waitFor(2500);
    await page.keyboard.press("Enter");

    // 4. Let redirects settle
    await waitFor(3000);
    await closePopups(page);
    await handleBotVerification(page);

    // 5. Go straight to /browse instead of /tabs/grocery
    console.log("🧭 Redirecting to /browse...");
    await page.goto("https://www.doordash.com/browse", {
      waitUntil: "networkidle2",
      timeout: CONFIG.timeout,
    });
    await handleBotVerification(page);
    await waitFor(3000);

    await takeScreenshot(page, "address-set-and-browse-navigated.png");
    console.log("✅ Address set — now on /browse");
    return true;
  } catch (err) {
    console.error("❌ Error in addAddress:", err.message);
    await takeScreenshot(page, "address-error.png");
    return false;
  }
}

// Generic function to scrape store links for a given vertical
async function scrapeVerticalLinks(
  page,
  verticalName,
  targetUrl,
  scrapedDataKey,
  screenshotPrefix
) {
  try {
    console.log(
      `🛒 Step: Ensuring we are on the ${verticalName} page or navigating to it...`
    );
    const currentUrl = page.url();
    if (!currentUrl.includes(targetUrl)) {
      await page.goto(targetUrl, {
        waitUntil: "networkidle2",
        timeout: CONFIG.timeout,
      });
      await handleBotVerification(page);
      await waitFor(3000); // Small wait after navigating
    }

    await takeScreenshot(page, `${screenshotPrefix}-page.png`);

    console.log(
      `🔍 Looking for 'See All' button for ${verticalName} categories...`
    );
    const seeAllSelectors = [
      'a[data-anchor-id="SeeAll"][href*="/vertical_homepage"]', // General selector
      'a[aria-labelledby="see-all"]',
      'a[href*="/collection?vertical_id="]', // More specific for some verticals
    ];

    let seeAllClicked = false;
    for (const selector of seeAllSelectors) {
      const elementFound = await page.$(selector);
      if (elementFound) {
        console.log(
          `✅ Found 'See All' button with selector: ${selector}, attempting to click...`
        );
        seeAllClicked = await clickWithWait(page, selector, {
          waitTime: 3000,
          timeout: 20000, // Increased timeout for this specific click
        });
        if (seeAllClicked) {
          break;
        }
      }
    }

    if (seeAllClicked) {
      console.log(
        `✅ Clicked 'See All' button for ${verticalName} categories. Waiting for store cards to load...`
      );
      await page.waitForSelector('[data-anchor-id="StoreCard"]', {
        timeout: 120000, // Use a long timeout for this crucial element
      });
      await waitFor(5000); // Give some extra time for content to render
      await takeScreenshot(
        page,
        `${screenshotPrefix}-categories-see-all-page.png`
      );
      await handleBotVerification(page);
    } else {
      console.log(
        `⚠️ Could not click 'See All' button for ${verticalName} categories. Proceeding to scrape existing store links.`
      );
      await page.waitForSelector('[data-anchor-id="StoreCard"]', {
        timeout: CONFIG.timeout,
      });
      await waitFor(3000);
    }

    console.log(`🔍 Looking for ${verticalName} store links...`);
    await page.waitForSelector('[data-anchor-id="StoreCard"]', {
      timeout: CONFIG.timeout,
    });

    await autoScroll(page);
    await waitFor(5000);

    const storeLinks = await page.evaluate(() => {
      const links = Array.from(
        document.querySelectorAll('[data-anchor-id="StoreCard"]')
      );
      return links.map((link) => {
        const href = link.href.startsWith("/")
          ? "https://www.doordash.com" + link.getAttribute("href")
          : link.href;
        const text = link.textContent.trim();
        const title = link.title || "";
        const match = href.match(/\/store\/(\d+)/);
        const storeId = match ? match[1] : null;

        return {
          href,
          text,
          title,
          storeId,
        };
      });
    });

    console.log(`✅ Found ${storeLinks.length} ${verticalName} store links`);
    scrapedData[scrapedDataKey] = storeLinks;
    return storeLinks;
  } catch (error) {
    console.error(`❌ Error scraping ${verticalName} links:`, error.message);
    await takeScreenshot(page, `${screenshotPrefix}-error.png`);
    return [];
  }
}

async function scrapeProductsWithRetry(
  page,
  storeData,
  collectionLink,
  storeName,
  collectionName
) {
  let allProducts = [];
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(
      `🔄 Attempt ${attempts}/${maxAttempts} to scrape all products...`
    );

    // Scroll to ensure all products are loaded
    await autoScroll(page);
    await waitFor(3000);

    // Get current product count
    const currentProductCount = await page.evaluate(() => {
      return document.querySelectorAll(
        '[data-testid="RetailItemCardPriceNameInfoBadgingFramework"], [data-testid*="StoreItemCard"]'
      ).length;
    });

    console.log(
      `📊 Found ${currentProductCount} products in attempt ${attempts}`
    );

    // Scrape products with multiple selector options
    const products = await page.evaluate(
      (
        storeData,
        currentCollectionLink,
        currentStoreName,
        currentCollectionName
      ) => {
        const productElements = Array.from(
          document.querySelectorAll(
            '[data-testid="RetailItemCardPriceNameInfoBadgingFramework"], [data-testid*="StoreItemCard"]'
          )
        );

        return productElements.map((el) => {
          // Try multiple selectors for each field
          const name =
            el
              .querySelector(
                '[data-telemetry-id="priceNameInfo.name"], [data-testid*="name"]'
              )
              ?.textContent.trim() || "N/A";

          // Price extraction with fallbacks
          let currentPrice = "N/A";
          const priceElement = el.querySelector(
            '.sc-85923f71-0.hlWxbc, [data-testid*="price"], [class*="price"]'
          );
          if (priceElement) {
            const main =
              priceElement
                .querySelector('.sc-85923f71-2.cGEDSS, [class*="integer"]')
                ?.textContent.trim() || "";
            const decimal =
              priceElement
                .querySelector('.sc-85923f71-1.kQLTAj, [class*="decimal"]')
                ?.textContent.trim() || "";
            const symbol =
              priceElement
                .querySelector('.sc-85923f71-1.erPBol, [class*="currency"]')
                ?.textContent.trim() || "";
            currentPrice =
              `${symbol}${main}${decimal}` || priceElement.textContent.trim();
          }

          const originalPrice =
            el
              .querySelector('.sc-aXZVg.gQfTyJ, [data-testid*="originalPrice"]')
              ?.textContent.trim() || "N/A";
          const discount =
            el
              .querySelector(
                '[data-testid*="percent_discount"] span, [class*="discount"]'
              )
              ?.textContent.trim() || "N/A";
          const rating =
            el
              .querySelector('[data-testid*="rating"], [class*="rating"]')
              ?.textContent.trim() || "N/A";
          const ratingCount =
            el
              .querySelector(
                '[data-testid*="ratingCount"], [class*="ratingCount"]'
              )
              ?.textContent.trim() || "N/A";

          return {
            storeName: currentStoreName,
            storeUrl: storeData.href,
            storeId: storeData.storeId,
            collectionName: currentCollectionName,
            collectionUrl: currentCollectionLink,
            name,
            currentPrice,
            originalPrice,
            discount,
            rating,
            ratingCount,
          };
        });
      },
      storeData,
      collectionLink,
      storeName,
      collectionName
    );

    allProducts = products;

    // If we got a significant number of products, break early
    if (products.length > 50 && attempts > 1) {
      break;
    }

    await waitFor(2000);
  }

  console.log(`✅ Final result: ${allProducts.length} products scraped`);
  return allProducts;
}

async function scrapeStoreProducts(page, store, productDataKey) {
  console.log(
    `🛍️ Navigating to store: ${store.text || store.href} (ID: ${
      store.storeId || "N/A"
    })`
  );

  try {
    let navigationSuccess = false;

    // Try navigating up to 3 times
    for (let i = 0; i < 3; i++) {
      try {
        await page.goto(store.href, {
          waitUntil: "domcontentloaded",
          timeout: CONFIG.timeout,
        });
        navigationSuccess = true;
        break;
      } catch (navError) {
        console.warn(
          `⚠️ Navigation failed (attempt ${i + 1}/3): ${navError.message}`
        );
        await waitFor(5000);
      }
    }

    if (!navigationSuccess) {
      throw new Error(
        `Failed to navigate to store page after 3 retries: ${store.href}`
      );
    }

    await handleBotVerification(page);
    await waitFor(5000);
    await takeScreenshot(page, `store-${store.storeId || "unknown"}.png`);
    await closePopups(page);

    // Set delivery address
    const addressInputSelector = 'input[placeholder*="Enter delivery address"]';
    const addressInput = await page.$(addressInputSelector);
    if (addressInput) {
      await page.click(addressInputSelector, { clickCount: 3 }); // select all
      await page.keyboard.press("Backspace"); // clear existing value
      await page.type(addressInputSelector, CONFIG.location, { delay: 200 });
      await page.keyboard.press("Enter");
      console.log(`📍 Entered delivery address: ${CONFIG.location}`);
      await waitFor(5000); // wait for store reload if triggered
    }

    const storeNameElement = await page
      .waitForSelector(
        'h1[data-anchor-id="ConvenienceStoreHeaderInfoStoreName"]',
        { timeout: 10000 }
      )
      .catch(() => null);
    const storeName = storeNameElement
      ? await page.evaluate((el) => el.textContent.trim(), storeNameElement)
      : store.text || `Store ID ${store.storeId}`;
    console.log(`🏪 Extracted Store Name: ${storeName}`);
    // Ensure top-level and store-level buckets exist

    if (!scrapedData[productDataKey]) scrapedData[productDataKey] = {};
    if (!scrapedData[productDataKey][storeName])
      scrapedData[productDataKey][storeName] = {};

    console.log("🔍 Searching for 'See All' collection buttons...");
    await autoScroll(page);
    await waitFor(5000);

    const seeAllButtonSelectors = [
      'a[data-anchor-id="CarouselSeeAllButton"]',
      'button[aria-label="See All"]',
      'a[href*="/collection?store_id="]',
    ];

    const collectionLinks = await page.evaluate((selectors) => {
      const links = [];
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          let href = el.getAttribute("href");
          if (href && href.startsWith("/")) {
            href = "https://www.doordash.com" + href;
          }
          if (href) links.push(href);
        });
      });
      return [...new Set(links)];
    }, seeAllButtonSelectors);

    console.log(`🔗 Found ${collectionLinks.length} collection links`);

    if (collectionLinks.length === 0) {
      console.log(
        "⚠️ No collection links found — scraping main store page directly..."
      );
      const products = await scrapeProductsWithRetry(
        page,
        store,
        store.href,
        storeName,
        "Main Store Products"
      );

      if (!scrapedData[productDataKey][storeName]["Main Store Products"]) {
        scrapedData[productDataKey][storeName]["Main Store Products"] = [];
      }

      scrapedData[productDataKey][storeName]["Main Store Products"].push(
        ...products
      );
      await saveToJSON();
    } else {
      for (const collectionLink of collectionLinks) {
        console.log(`➡️ Navigating to collection: ${collectionLink}`);
        try {
          await page.goto(collectionLink, {
            waitUntil: "domcontentloaded",
            timeout: CONFIG.timeout,
          });

          await handleBotVerification(page);
          await waitFor(5000);
          await takeScreenshot(
            page,
            `store-${
              store.storeId || "unknown"
            }-collection-${collectionLinks.indexOf(collectionLink)}.png`
          );

          const collectionNameElement = await page
            .waitForSelector("h1.sc-aXZVg.sc-3f3d4ebd-2.ifaqAR.fqQcnW", {
              timeout: 10000,
            })
            .catch(() => null);
          const collectionName = collectionNameElement
            ? await page.evaluate(
                (el) => el.textContent.trim(),
                collectionNameElement
              )
            : "Unnamed Collection";

          console.log(`📚 Extracted Collection Name: ${collectionName}`);

          if (!scrapedData[productDataKey][storeName][collectionName]) {
            scrapedData[productDataKey][storeName][collectionName] = [];
          }

          const products = await scrapeProductsWithRetry(
            page,
            store,
            collectionLink,
            storeName,
            collectionName
          );
          console.log(
            `✅ Collected ${products.length} products for: ${collectionName}`
          );

          scrapedData[productDataKey][storeName][collectionName].push(
            ...products
          );
          await saveToJSON();
        } catch (collectionError) {
          console.error(
            `❌ Error scraping collection ${collectionLink}: ${collectionError.message}`
          );
          await takeScreenshot(
            page,
            `store-${
              store.storeId || "unknown"
            }-collection-error-${collectionLinks.indexOf(collectionLink)}.png`
          );
        }
      }
    }
  } catch (error) {
    console.error(
      `❌ Failed to scrape store: ${store.text || store.href} (${
        store.storeId || "N/A"
      }): ${error.message}`
    );
    await takeScreenshot(page, `store-${store.storeId || "unknown"}-error.png`);
  }
}

async function saveToJSON(filename = "doordash_scraped_data.json") {
  // Changed filename for overall data
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
    for (const verticalKey in scrapedData) {
      if (verticalKey.includes("Products")) {
        // Only iterate through product data
        for (const storeName in scrapedData[verticalKey]) {
          const collections = scrapedData[verticalKey][storeName];
          for (const collectionName in collections) {
            totalProductsCount += collections[collectionName].length;
          }
        }
      }
    }
    console.log(
      `📊 Total grocery stores scraped: ${
        scrapedData.groceryStores?.length || 0
      }`
    );
    console.log(
      `📊 Total retail stores scraped: ${scrapedData.retailStores?.length || 0}`
    );
    console.log(
      `📊 Total convenience stores scraped: ${
        scrapedData.convenienceStores?.length || 0
      }`
    );
    console.log(
      `📊 Total alcohol stores scraped: ${
        scrapedData.alcoholStores?.length || 0
      }`
    );
    console.log(
      `📊 Total products scraped across all verticals: ${totalProductsCount}`
    );
  } catch (error) {
    console.error("❌ Error saving data:", error.message);
  }
}

// Save data to CSV (updated to handle multiple product types)
async function saveToCSV(filename = "All_DoorDash_Products.csv") {
  try {
    console.log("📊 Converting and saving data to CSV...");
    const dataDir = path.join(process.cwd(), "scraped-data");
    await fs.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, filename);

    let allProducts = [];
    // Aggregate products from all categories
    for (const verticalKey in scrapedData) {
      if (verticalKey.includes("Products")) {
        for (const storeName in scrapedData[verticalKey]) {
          const collections = scrapedData[verticalKey][storeName];
          for (const collectionName in collections) {
            allProducts = allProducts.concat(collections[collectionName]);
          }
        }
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
    csvRows.push(headers.join(","));

    // Add data rows
    for (const product of allProducts) {
      const values = headers.map((header) => {
        const value = product[header];
        // Handle commas and newlines in values by enclosing in double quotes
        // Double double quotes for existing double quotes
        return typeof value === "string" &&
          (value.includes(",") || value.includes("\n") || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csvRows.push(values.join(","));
    }

    await fs.writeFile(filePath, csvRows.join("\n"));
    console.log(`✅ Data saved to CSV: ${filePath}`);
  } catch (error) {
    console.error("❌ Error saving data to CSV:", error.message);
  }
}

async function scrapeDoorDash() {
  let browser = null;
  try {
    // 1. Launch browser
    const { browser: browserInstance, page } = await initBrowser();
    browser = browserInstance;

    // 2. Skip login and add delivery address
    const addressSuccess = await addAddress(page, CONFIG.location);
    if (!addressSuccess) {
      throw new Error("Failed to set address and navigate to grocery page.");
    }

    console.log("✅ Address set — now going to /browse");

    // 3. Navigate to /browse
    await page.goto("https://www.doordash.com/browse", {
      waitUntil: "networkidle2",
      timeout: CONFIG.timeout,
    });
    await handleBotVerification(page);
    await waitFor(3000);

    // 4. Scroll to load all stores
    await page.waitForSelector('[data-anchor-id="StoreLayoutGridContainer"]', {
      timeout: CONFIG.timeout,
    });
    await autoScroll(page);
    await waitFor(3000);

    // 5. Collect every store link inside the grid
    const allStoreLinks = await page.evaluate(() => {
      const container = document.querySelector(
        '[data-anchor-id="StoreLayoutGridContainer"]'
      );
      if (!container) return [];

      return Array.from(container.querySelectorAll("a[href]")).map((a) => {
        const href = a.href.startsWith("/")
          ? `https://www.doordash.com${a.getAttribute("href")}`
          : a.href;
        const text = a.textContent?.trim() || "";
        const storeId = href.match(/\/store\/(\d+)/)?.[1] || null;
        return { href, text, storeId };
      });
    });

    console.log(`📦 Found ${allStoreLinks.length} stores from /browse`);

    // 6. Visit each store and scrape products
    for (const store of allStoreLinks) {
      // Decide product bucket based on URL
      // let productKey = "groceryProducts"; // default
      // if (store.href.includes("/alcohol/")) productKey = "alcoholProducts";
      // else if (store.href.includes("/retail/")) productKey = "retailProducts";
      // else if (store.href.includes("/convenience/")) productKey = "convenienceProducts";

      const segment = new URL(store.href).pathname
        .split("/")
        .filter(Boolean)[0];

      // 2️⃣  camel-case it + "Products"
      //     "pets"      -> "petsProducts"
      //     "electronics" -> "electronicsProducts"
      const productKey = segment + "Products";

      await scrapeStoreProducts(page, store, productKey);
    }

    // 7. Final save
    await saveToJSON();
    await saveToCSV();

    console.log("🎉 All scraping completed successfully!");
  } catch (error) {
    console.error("❌ Scraping failed:", error.message);
    console.log("💡 Check the screenshots folder for debugging information");
  } finally {
    console.log("🔒 Closing browser...");
    if (browser) await browser.close();
  }
}

scrapeDoorDash();
