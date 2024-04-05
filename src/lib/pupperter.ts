import dotenv from "dotenv";
import puppeteer, { PuppeteerExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { Page } from "puppeteer";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export const scrapeFromFacebook = async (cities?: string[]) => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();
    await page.goto("https://www.facebook.com/login");

    // wait for getRandomWaitTime before starting
    await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));

    // Wait for login fields to load
    await page.waitForSelector("#email", {
      visible: true,
    });
    await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));
    await page.waitForSelector("#pass");

    // Enter your Facebook credentials
    await page.type("#email", "orebopp@gmail.com", {
      delay: getRandomTypeSpeed(),
    });
    await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));
    await page.type("#pass", "Mojolaoluwa13$", {
      delay: getRandomTypeSpeed(),
    });
    await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));

    await page.waitForSelector("#loginbutton");
    // Click the login button

    await Promise.all([
      page.click("#loginbutton"), // Click the login button
      page.waitForNavigation(), // Wait for navigation to complete
    ]);

    // Wait for the button to be available
    await page.waitForSelector('a[aria-label="Groups"]');

    // Click the button

    await Promise.all([
      page.click('a[aria-label="Groups"]'), // Click the login button
      page.waitForNavigation(), // Wait for navigation to complete
    ]);

    await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));

    let groups = [];
    // Search for groups and push to groups array
    for (let city of cities!) {
      const scrapedGroup = await searchGroup(page, city);
      groups.push(scrapedGroup);
    }

    // fs.writeFileSync(`extracted_details.json`, groups);
    //write a json file with the extracted details
    // in raw json format save the extracted details
    // fs.writeFileSync("extracted_details.json", JSON.stringify(groups));

    await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));

    await browser.close();

    return groups;
  } catch (error) {
    console.log(error);
  }
};

function getRandomTypeSpeed() {
  // Random typing speed between 50 and 100 ms
  return Math.floor(Math.random() * 500) + 50;
}

function getRandomWaitTime() {
  // Random wait time between 1 and 3 seconds
  return Math.floor(Math.random() * 5000) + 1000;
}

function getRandomMouseMovement() {
  // Random mouse movement between 10 and 40 pixels
  return Math.floor(Math.random() * 30) + 10;
}

async function scrapeInfintiteScrollingPage(page: Page, myCity: string) {
  // Scrape an infinite scrolling page
  let previousHeight;
  let scrollDelay = 5000;
  let scrollCounter = 0;
  let maxScrolls = 20;
  while (scrollCounter < maxScrolls) {
    previousHeight = await page.evaluate("document.body.scrollHeight");
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await page.waitForFunction(
      `document.body.scrollHeight > ${previousHeight}`
    );
    await new Promise((resolve) => setTimeout(resolve, scrollDelay));
    scrollCounter++;
  }
  // Extract details from div elements with class x1yztbdb
  const elements = await page.$$(".x1yztbdb");
  const extractedDetails = [];
  for (let element of elements) {
    const link = await element.$eval("a", (a) => a.getAttribute("href"));

    //add spaces after words to the description to make it easier to filter out the groups
    const description = await element.$eval(".x1lliihq", (div) =>
      div.textContent
        .trim()
        .toLowerCase()
        .replace(/(\b\w)/g, (match: string) => " " + match)
    );

    const groupDetails = await element.$$eval(".x1lliihq > *", (elements) =>
      elements.map((element) => element.textContent.trim().toLowerCase())
    );

    //make it not break if not avaible

    const name = groupDetails?.[1];

    const details = groupDetails?.[2];

    const summary = groupDetails?.[3];

    extractedDetails.push({
      link,
      description,
      myCity,
      name,
      details,
      summary,
    });
  }

  return extractedDetails;
}

async function searchGroup(page: Page, myCity: string) {
  await page.waitForSelector('input[aria-label="Search groups"]');
  await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));
  await page.type('input[aria-label="Search groups"]', myCity, {
    delay: getRandomTypeSpeed(),
  });
  await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));
  await page.keyboard.press("Enter");
  await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));
  const details = await scrapeInfintiteScrollingPage(page, myCity);

  return {
    ...details,
  };
}
