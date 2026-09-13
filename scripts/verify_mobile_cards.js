const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
console.log('Serving from:', rootDir);

const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    let filePath = path.join(rootDir, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found: ' + filePath);
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4'
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(4322, async () => {
    console.log('Server running at http://localhost:4322');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    const artifactDir = '/Users/macbookair/.gemini/antigravity-ide/brain/1f959792-d5db-4b0c-847b-551ee5e3eadf';

    // Mobile check (iPhone 14 / modern mobile 390x844)
    const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:4322/embroidery-digitizing/cap-hat-digitizing/', { waitUntil: 'networkidle' });

    // Section 3: Deliverables
    const sec3 = await mobilePage.$('section:has-text("What You Get With Cap Digitizing")');
    if (sec3) {
        await sec3.scrollIntoViewIfNeeded();
        await mobilePage.waitForTimeout(400);
        await mobilePage.screenshot({
            path: path.join(artifactDir, 'mobile_sec3_deliverables.png')
        });
    }

    // Section 4: Why Cap Digitizing Is Different
    const sec4 = await mobilePage.$('section:has-text("Why Cap Digitizing Is Different")');
    if (sec4) {
        await sec4.scrollIntoViewIfNeeded();
        await mobilePage.waitForTimeout(400);
        await mobilePage.screenshot({
            path: path.join(artifactDir, 'mobile_sec4_different.png')
        });
    }

    // Section 5: Things We Check Before Digitizing
    const sec5 = await mobilePage.$('section:has-text("Things We Check Before Digitizing a Hat File")');
    if (sec5) {
        await sec5.scrollIntoViewIfNeeded();
        await mobilePage.waitForTimeout(400);
        await mobilePage.screenshot({
            path: path.join(artifactDir, 'mobile_sec5_checks.png')
        });
    }

    // Desktop check (1440x900)
    const desktopContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto('http://localhost:4322/embroidery-digitizing/cap-hat-digitizing/', { waitUntil: 'networkidle' });

    const sec3Desktop = await desktopPage.$('section:has-text("What You Get With Cap Digitizing")');
    if (sec3Desktop) {
        await sec3Desktop.scrollIntoViewIfNeeded();
        await desktopPage.waitForTimeout(400);
        await desktopPage.screenshot({
            path: path.join(artifactDir, 'desktop_sec3_deliverables.png')
        });
    }

    await browser.close();
    server.close();
    console.log('Verification screenshots captured!');
    process.exit(0);
});
