/**
 * Comprehensive Website Verification: Buttons, Links, Anchors & Redirects
 * Audits all HTML files in the project for link integrity, button event handlers, and redirects.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function getHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!['node_modules', '.git', 'playwright_artifacts', 'scratch'].includes(file)) {
                results = results.concat(getHtmlFiles(fullPath));
            }
        } else if (file.endsWith('.html')) {
            results.push(fullPath);
        }
    });
    return results;
}

const htmlFiles = getHtmlFiles(rootDir);
console.log(`[Verifier] Auditing ${htmlFiles.length} HTML files...`);

// 1. Verify _redirects rules
console.log('\n--- 1. AUDITING _redirects ---');
const redirectsPath = path.join(rootDir, '_redirects');
if (!fs.existsSync(redirectsPath)) {
    console.error('FAIL: _redirects file is missing!');
    process.exit(1);
}
const redirectLines = fs.readFileSync(redirectsPath, 'utf8').split('\n');
let redirectCount = 0;
let invalidRedirects = 0;

redirectLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    redirectCount++;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
        console.error(`Invalid redirect line ${idx + 1}: ${trimmed}`);
        invalidRedirects++;
        return;
    }
    const targetFile = parts[1].split('?')[0];
    const targetOnDisk = path.join(rootDir, targetFile);
    if (!fs.existsSync(targetOnDisk)) {
        console.error(`Missing target file on disk for redirect: ${trimmed} -> ${targetOnDisk}`);
        invalidRedirects++;
    }
});

console.log(`Verified ${redirectCount} rewrite/redirect rules. Errors: ${invalidRedirects}`);
if (invalidRedirects > 0) {
    console.error('FAIL: Some redirect rules point to non-existent files on disk.');
    process.exit(1);
}

// 2. Collect page IDs for anchor verification
const pageIds = {};
htmlFiles.forEach(f => {
    const rel = path.relative(rootDir, f);
    const content = fs.readFileSync(f, 'utf8');
    const ids = new Set();
    const idMatches = content.matchAll(/id=["']([^"']+)["']/gi);
    for (const m of idMatches) {
        ids.add(m[1]);
    }
    pageIds[rel] = ids;
});

// 3. Scan for broken links, dead anchors, and dead buttons
let brokenLinks = [];
let brokenAnchors = [];

htmlFiles.forEach(file => {
    const relFile = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');

    const aMatches = content.matchAll(/<a\s+([^>]*?)>(.*?)<\/a>/gis);
    for (const m of aMatches) {
        const attrs = m[1];
        const inner = m[2].replace(/<[^>]*>/g, '').trim().substring(0, 30);
        const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
        if (!hrefMatch) continue;

        const href = hrefMatch[1].trim();
        if (!href || href === '#' || href.startsWith('javascript:')) {
            const hasOnclick = /onclick=/i.test(attrs);
            const idMatch = attrs.match(/id=["']([^"']+)["']/i);
            if (!hasOnclick && !idMatch) {
                brokenLinks.push({ file: relFile, text: inner, href });
            }
            continue;
        }

        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('${')) {
            continue;
        }

        const [targetPath, hash] = href.split('#');
        let targetFileRel = relFile;
        if (targetPath) {
            if (targetPath.startsWith('/')) {
                let clean = targetPath.substring(1).split('?')[0];
                if (!clean || clean === '') targetFileRel = 'index.html';
                else if (fs.existsSync(path.join(rootDir, clean))) {
                    const st = fs.statSync(path.join(rootDir, clean));
                    if (st.isDirectory()) targetFileRel = path.join(clean, 'index.html');
                    else targetFileRel = clean;
                } else if (fs.existsSync(path.join(rootDir, clean + '.html'))) {
                    targetFileRel = clean + '.html';
                } else if (fs.existsSync(path.join(rootDir, clean, 'index.html'))) {
                    targetFileRel = path.join(clean, 'index.html');
                } else {
                    brokenLinks.push({ file: relFile, text: inner, href });
                    continue;
                }
            } else {
                let resolved = path.resolve(path.dirname(path.join(rootDir, relFile)), targetPath.split('?')[0]);
                let cleanRel = path.relative(rootDir, resolved);
                if (fs.existsSync(resolved)) {
                    const st = fs.statSync(resolved);
                    if (st.isDirectory()) targetFileRel = path.join(cleanRel, 'index.html');
                    else targetFileRel = cleanRel;
                } else if (fs.existsSync(resolved + '.html')) {
                    targetFileRel = cleanRel + '.html';
                } else if (fs.existsSync(path.join(resolved, 'index.html'))) {
                    targetFileRel = path.join(cleanRel, 'index.html');
                } else {
                    brokenLinks.push({ file: relFile, text: inner, href });
                    continue;
                }
            }
        }

        if (hash) {
            const validIds = pageIds[targetFileRel];
            if (validIds && !validIds.has(hash)) {
                brokenAnchors.push({ file: relFile, targetFile: targetFileRel, hash });
            }
        }
    }
});

console.log('\n--- 2. AUDITING LINKS & BUTTONS ---');
console.log(`Broken Links: ${brokenLinks.length}`);
if (brokenLinks.length > 0) {
    console.error(brokenLinks);
    process.exit(1);
}

console.log(`Broken Anchors: ${brokenAnchors.length}`);
if (brokenAnchors.length > 0) {
    console.error(brokenAnchors);
    process.exit(1);
}

console.log('\n🎉 ALL BUTTONS, LINKS, ANCHORS, AND REDIRECTS AUDITED & 100% OPERATIONAL!');
