import express, {
  Express,
  Request,
  Response,
  Application,
  response,
} from "express";
import dotenv from "dotenv";
import puppeteer, { PuppeteerExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { Page } from "puppeteer";
import cors from "cors";
import { getCityWithLangGraph } from "./lib/agent";
dotenv.config();

const app: Application = express();
app.use(express.json());
//enable cors for all requests to the server
app.use(cors());

const port = process.env.PORT || 8000;
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

app.get("/", async (req: Request, res: Response) => {
  try {
    puppeteer
      .launch({ headless: true })
      .then(async (browser): Promise<void> => {
        console.log("Running tests..");
        const page = await browser.newPage();
        await page.goto("https://www.facebook.com/login");

        // wait for getRandomWaitTime before starting
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomWaitTime())
        );

        // Wait for login fields to load
        await page.waitForSelector("#email", {
          visible: true,
        });
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomWaitTime())
        );
        await page.waitForSelector("#pass");

        // Enter your Facebook credentials
        await page.type("#email", "orebopp@gmail.com");
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomWaitTime())
        );
        await page.type("#pass", "Mojolaoluwa13$");
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomWaitTime())
        );

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

        // await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));

        await page.waitForSelector('input[aria-label="Search groups"]');
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomWaitTime())
        );
        await page.type('input[aria-label="Search groups"]', "Football");
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomWaitTime())
        );
        await page.keyboard.press("Enter");
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomTypeSpeed())
        );

        // Wait for the list items to load
        await page.waitForSelector('div[role="listitem"]');

        // Select the second element with role "listitem"
        const secondListItem = await page.$$('div[role="listitem"]');
        await secondListItem[1].click(); // Selecting the second div element
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomTypeSpeed())
        );
        await page.waitForSelector('input[aria-label="City"]');
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomTypeSpeed())
        );
        await page.type('input[aria-label="City"]', "Lagos");
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomTypeSpeed())
        );
        await page.keyboard.press("ArrowDown"); // Move cursor down to highlight the first option
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomTypeSpeed())
        );
        await page.keyboard.press("Enter"); // Select the highlighted option

        // Wait for the button to be available
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomTypeSpeed())
        );

        const details = await scrapeInfintiteScrollingPage(page);

        await new Promise((resolve) =>
          setTimeout(resolve, getRandomTypeSpeed())
        );
        await page.screenshot({ path: "testresult.png", fullPage: true });
        await browser.close();
        console.log(`All done, check the screenshot. ✨`);
        res.status(200).send({
          details,
        });
      });
  } catch (error) {
    res.send;
  }
});

app.post("/ai", async (req: Request, res: Response) => {
  try {
    const { location, radius } = req.body;
    console.log(location, radius);
    const response = await getCityWithLangGraph(location, radius);
    res.status(200).send({
      response,
    });
  } catch (error) {
    res.send;
  }
});

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});

function getRandomTypeSpeed() {
  // Random typing speed between 50 and 100 ms
  return Math.floor(Math.random() * 10000) + 50;
}

function getRandomWaitTime() {
  // Random wait time between 1 and 3 seconds
  return Math.floor(Math.random() * 5000) + 1000;
}

function getRandomMouseMovement() {
  // Random mouse movement between 10 and 40 pixels
  return Math.floor(Math.random() * 30) + 10;
}

async function scrapeInfintiteScrollingPage(page: Page) {
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
    const name = await element.$eval(".x1rg5ohu", (div) =>
      div.textContent.trim()
    );
    const description = await element.$eval(".x1lliihq", (div) =>
      div.textContent.trim()
    );

    const textData = extractedDetails
      .map(
        ({ link, name, description }) => `${name}\n${link}\n${description}\n`
      )
      .join("\n");
    // fs.writeFileSync("extracted_details.txt", textData);

    // Push details to extractedDetails array
    extractedDetails.push({ link, name, description });
  }

  return extractedDetails;
}
