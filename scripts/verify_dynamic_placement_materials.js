const { chromium } = require('playwright');
const path = require('path');

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
    console.log('🚀 Starting Dynamic Placement-Materials Verification Suite...\n');
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(() => {
        localStorage.setItem('dezan_consent', 'all');
        sessionStorage.setItem('dezan_consent', 'all');
    });
    const page = await context.newPage();

    let passedTests = 0;
    const assert = (condition, msg) => {
        if (!condition) {
            console.error(`❌ FAILED: ${msg}`);
            throw new Error(msg);
        }
        console.log(`  ✓ ${msg}`);
        passedTests++;
    };

    try {
        console.log('--- Test 1: Public Order Modal (Desktop Viewport) ---');
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await page.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
        });

        // Open Order Modal
        await page.evaluate(() => {
            window.openOrderQuoteModal({ service: 'Digitizing' });
        });
        await page.waitForSelector('#dig-fabric', { state: 'visible', timeout: 5000 });

        // Default placement is Left Chest
        const initialLabel = await page.$eval('#dig-fabric-label', el => el.textContent.trim());
        assert(initialLabel.includes('Fabric / Garment Material'), `Initial label is "Fabric / Garment Material", got: "${initialLabel}"`);

        // Check Left Chest options
        const leftChestOptions = await page.$$eval('#dig-fabric option', opts => opts.map(o => o.textContent.trim()));
        console.log('  Left Chest options:', leftChestOptions);
        assert(leftChestOptions.includes('Polo / Pique Knit'), 'Left chest contains "Polo / Pique Knit"');
        assert(leftChestOptions.includes('T-Shirt'), 'Left chest contains "T-Shirt"');
        assert(leftChestOptions.includes('Hoodie / Sweatshirt'), 'Left chest contains "Hoodie / Sweatshirt"');
        assert(leftChestOptions.includes('Performance / Dri-Fit'), 'Left chest contains "Performance / Dri-Fit"');
        assert(leftChestOptions.includes('Workwear'), 'Left chest contains "Workwear"');
        assert(leftChestOptions.includes('Jacket'), 'Left chest contains "Jacket"');
        assert(leftChestOptions.includes('Other / Custom'), 'Left chest contains "Other / Custom"');
        assert(!leftChestOptions.includes('Structured Cap'), 'Left chest does NOT contain "Structured Cap"');
        assert(!leftChestOptions.includes('Snapback'), 'Left chest does NOT contain "Snapback"');

        // Select Polo
        await page.selectOption('#dig-fabric', 'Polo / Pique Knit');
        let selectedVal = await page.$eval('#dig-fabric', el => el.value);
        assert(selectedVal === 'Polo / Pique Knit', 'Polo / Pique Knit is selected');

        console.log('\n--- Test 2: Switch to Cap / Hat Front & Automatic Reset ---');
        // Switch placement to Cap / Hat Front — $15
        await page.selectOption('#dig-placement', 'Cap / Hat Front — $15');
        await page.waitForTimeout(100);

        // Verify label changed to Hat / Cap Type
        const capLabel = await page.$eval('#dig-fabric-label', el => el.textContent.trim());
        assert(capLabel.includes('Hat / Cap Type'), `Label changed to "Hat / Cap Type", got: "${capLabel}"`);

        // Verify selection was automatically RESET and Polo is removed
        selectedVal = await page.$eval('#dig-fabric', el => el.value);
        assert(selectedVal === '', `Polo was automatically removed and select reset to prompt (value=""), got: "${selectedVal}"`);

        // Check prompt text
        const capPrompt = await page.$eval('#dig-fabric option:first-child', el => el.textContent.trim());
        assert(capPrompt.includes('Select hat / cap type'), `Prompt shows "Select hat / cap type", got: "${capPrompt}"`);

        // Check hat options
        const capOptions = await page.$$eval('#dig-fabric option', opts => opts.map(o => o.textContent.trim()));
        console.log('  Cap / Hat options:', capOptions);
        assert(capOptions.includes('Structured Cap'), 'Cap contains "Structured Cap"');
        assert(capOptions.includes('Unstructured Cap / Dad Hat'), 'Cap contains "Unstructured Cap / Dad Hat"');
        assert(capOptions.includes('Trucker / Mesh Cap'), 'Cap contains "Trucker / Mesh Cap"');
        assert(capOptions.includes('Snapback'), 'Cap contains "Snapback"');
        assert(capOptions.includes('Fitted Cap'), 'Cap contains "Fitted Cap"');
        assert(capOptions.includes('Performance / Athletic Cap'), 'Cap contains "Performance / Athletic Cap"');
        assert(capOptions.includes('Beanie / Knit Hat'), 'Cap contains "Beanie / Knit Hat"');
        assert(capOptions.includes('Other / Custom'), 'Cap contains "Other / Custom"');
        assert(!capOptions.includes('Polo / Pique Knit'), 'Cap does NOT contain "Polo / Pique Knit"');
        assert(!capOptions.includes('T-Shirt'), 'Cap does NOT contain "T-Shirt"');
        assert(!capOptions.includes('Denim'), 'Cap does NOT contain "Denim"');
        assert(!capOptions.includes('Leather'), 'Cap does NOT contain "Leather"');

        console.log('\n--- Test 3: "Other / Custom" Field for Hat / Cap Type ---');
        // Before selecting Other / Custom, custom field is hidden
        let isCustomHidden = await page.$eval('#custom-fabric-container', el => el.classList.contains('hidden'));
        assert(isCustomHidden, 'Custom fabric container is initially hidden');

        // Select Other / Custom
        await page.selectOption('#dig-fabric', 'Other / Custom');
        await page.waitForTimeout(100);

        isCustomHidden = await page.$eval('#custom-fabric-container', el => el.classList.contains('hidden'));
        assert(!isCustomHidden, 'Custom fabric container is now visible after choosing Other / Custom');

        const customLabel = await page.$eval('#custom-fabric-label', el => el.textContent.trim());
        assert(customLabel.includes('Please enter hat / cap type'), `Custom field label says "Please enter hat / cap type", got: "${customLabel}"`);

        await page.fill('#dig-custom-fabric', '5-Panel High Crown Rope Hat');
        const customInputVal = await page.$eval('#dig-custom-fabric', el => el.value);
        assert(customInputVal === '5-Panel High Crown Rope Hat', 'Custom hat type text input accepted input');

        console.log('\n--- Test 4: Switch to Jacket Back / Large & Automatic Custom Field Reset ---');
        await page.selectOption('#dig-placement', 'Jacket Back / Large — $25');
        await page.waitForTimeout(100);

        const jbLabel = await page.$eval('#dig-fabric-label', el => el.textContent.trim());
        assert(jbLabel.includes('Fabric / Garment Material'), `Label returned to "Fabric / Garment Material", got: "${jbLabel}"`);

        // Verify selection reset to prompt
        const jbSelected = await page.$eval('#dig-fabric', el => el.value);
        assert(jbSelected === '', 'Jacket back reset selection to empty prompt');

        // Verify custom input was hidden and cleared
        isCustomHidden = await page.$eval('#custom-fabric-container', el => el.classList.contains('hidden'));
        const customClearedVal = await page.$eval('#dig-custom-fabric', el => el.value);
        assert(isCustomHidden, 'Custom fabric container automatically hidden on placement change');
        assert(customClearedVal === '', 'Custom fabric text input automatically cleared on placement change');

        // Check jacket back options
        const jbOptions = await page.$$eval('#dig-fabric option', opts => opts.map(o => o.textContent.trim()));
        console.log('  Jacket Back options:', jbOptions);
        assert(jbOptions.includes('Jacket'), 'Jacket Back contains "Jacket"');
        assert(jbOptions.includes('Denim'), 'Jacket Back contains "Denim"');
        assert(jbOptions.includes('Heavy Twill / Workwear'), 'Jacket Back contains "Heavy Twill / Workwear"');
        assert(jbOptions.includes('Hoodie / Fleece'), 'Jacket Back contains "Hoodie / Fleece"');
        assert(jbOptions.includes('Leather'), 'Jacket Back contains "Leather"');
        assert(jbOptions.includes('Other / Custom'), 'Jacket Back contains "Other / Custom"');
        assert(!jbOptions.includes('Structured Cap'), 'Jacket Back does NOT contain "Structured Cap"');

        console.log('\n--- Test 5: Custom Placement Options ---');
        await page.selectOption('#dig-placement', 'Custom Placement');
        await page.waitForTimeout(100);

        const customOptions = await page.$$eval('#dig-fabric option', opts => opts.map(o => o.textContent.trim()));
        console.log('  Custom Placement options:', customOptions);
        assert(customOptions.includes('Cotton / Pique Knit'), 'Custom contains "Cotton / Pique Knit"');
        assert(customOptions.includes('T-Shirt / Jersey'), 'Custom contains "T-Shirt / Jersey"');
        assert(customOptions.includes('Hoodie / Fleece'), 'Custom contains "Hoodie / Fleece"');
        assert(customOptions.includes('Cap / Hat'), 'Custom contains "Cap / Hat"');
        assert(customOptions.includes('Jacket / Outerwear'), 'Custom contains "Jacket / Outerwear"');
        assert(customOptions.includes('Workwear / Heavy Twill'), 'Custom contains "Workwear / Heavy Twill"');
        assert(customOptions.includes('Patches / Leather / Substrate'), 'Custom contains "Patches / Leather / Substrate"');
        assert(customOptions.includes('Other / Custom'), 'Custom contains "Other / Custom"');

        console.log('\n--- Test 6: Step 1 -> Step 2 Validation & Review Summary ---');
        // Switch back to Cap / Hat Front
        await page.selectOption('#dig-placement', 'Cap / Hat Front — $15');
        await page.waitForTimeout(100);
        await page.fill('#dig-job-name', 'Falcon Front Cap');
        await page.fill('#dig-size', '2.5');
        await page.fill('#order-client-name', 'Test Customer');
        await page.fill('#order-client-email', 'test.customer@example.com');

        // Add dummy file to artwork
        const sampleArtPath = path.join(__dirname, '..', 'logo.webp');
        await page.setInputFiles('#artwork-file', sampleArtPath);
        await page.waitForTimeout(200);

        // Listen for alert when trying to proceed with unselected hat type
        let dialogMessage = '';
        page.once('dialog', async dialog => {
            dialogMessage = dialog.message();
            await dialog.accept();
        });

        // Try clicking Review & Pay while hat type is still unselected
        await page.click('#order-goto-review-btn');
        await page.waitForTimeout(300);
        assert(dialogMessage.toLowerCase().includes('hat') || dialogMessage.toLowerCase().includes('cap'), 
            `Validation alert triggered for unselected hat type, message: "${dialogMessage}"`);

        // Now select "Structured Cap"
        await page.selectOption('#dig-fabric', 'Structured Cap');
        await page.click('#order-goto-review-btn');
        await page.waitForTimeout(400);

        // Verify Step 3 (Review) is visible
        const step3Visible = await page.$eval('#order-step-3-view', el => !el.classList.contains('hidden'));
        assert(step3Visible, 'Navigated to Step 2 Review & Pay successfully');

        // Verify Review Summary reflects Hat / Cap Type
        const reviewLabel = await page.$eval('#review-summary-material-label', el => el.textContent.trim());
        const reviewVal = await page.$eval('#review-summary-material', el => el.textContent.trim());
        assert(reviewLabel === 'Hat / Cap Type', `Review summary label is "Hat / Cap Type", got: "${reviewLabel}"`);
        assert(reviewVal === 'Structured Cap', `Review summary material is "Structured Cap", got: "${reviewVal}"`);

        console.log('\n--- Test 7: Mobile Viewport Verification (390x844) ---');
        const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
        await mobileContext.addInitScript(() => {
            localStorage.setItem('dezan_consent', 'all');
            sessionStorage.setItem('dezan_consent', 'all');
        });
        const mobilePage = await mobileContext.newPage();
        await mobilePage.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
        await mobilePage.waitForTimeout(500);
        await mobilePage.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
        });

        await mobilePage.evaluate(() => {
            window.openOrderQuoteModal({ isQuote: true, plan: 'Cap / Hat Front' });
        });
        await mobilePage.waitForSelector('#dig-fabric', { state: 'visible', timeout: 5000 });

        const mobileCapLabel = await mobilePage.$eval('#dig-fabric-label', el => el.textContent.trim());
        assert(mobileCapLabel.includes('Hat / Cap Type'), `Mobile Quote Modal has label "Hat / Cap Type", got: "${mobileCapLabel}"`);

        const mobileCapOptions = await mobilePage.$$eval('#dig-fabric option', opts => opts.map(o => o.textContent.trim()));
        assert(mobileCapOptions.includes('Snapback'), 'Mobile has "Snapback" option');
        assert(!mobileCapOptions.includes('Cotton Polo'), 'Mobile does not have "Cotton Polo"');

        // Test mobile Other / Custom
        await mobilePage.selectOption('#dig-fabric', 'Other / Custom');
        await mobilePage.waitForTimeout(100);
        const mobileCustomVisible = await mobilePage.$eval('#custom-fabric-container', el => !el.classList.contains('hidden'));
        assert(mobileCustomVisible, 'Mobile custom text field opens cleanly');

        await mobilePage.fill('#dig-custom-fabric', 'Foam Trucker Cap');
        const mobileTyped = await mobilePage.$eval('#dig-custom-fabric', el => el.value);
        assert(mobileTyped === 'Foam Trucker Cap', 'Mobile custom input works');

        await mobileContext.close();
        await context.close();

        console.log(`\n🎉 ALL ${passedTests} ASSERTIONS PASSED PERFECTLY!`);
    } catch (err) {
        console.error('Error during verification:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runTests();
