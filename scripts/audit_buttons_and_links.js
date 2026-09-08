const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log(`Auditing ${htmlFiles.length} HTML files in ${rootDir}...\n`);

const results = [];

htmlFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    let rawContent = fs.readFileSync(filePath, 'utf8');

    // Strip script and style blocks so dynamic JS template strings are not treated as static DOM
    const content = rawContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // 1. Find all <a> tags
    const anchorRegex = /<a\s+([^>]*?)>(.*?)<\/a>/gis;
    let match;
    const brokenLinks = [];
    const hashLinks = [];

    while ((match = anchorRegex.exec(content)) !== null) {
        const attrs = match[1];
        const text = match[2].replace(/<[^>]*>/g, '').trim();
        const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
        const onclickMatch = attrs.match(/onclick=["']([^"']*)["']/i);
        const idMatch = attrs.match(/id=["']([^"']*)["']/i);

        if (hrefMatch) {
            const href = hrefMatch[1].trim();

            if (href === '#' || href === 'javascript:void(0)') {
                hashLinks.push({ text: text || '[Icon/Image]', attrs: attrs.slice(0, 100), onclick: onclickMatch ? onclickMatch[1] : null, id: idMatch ? idMatch[1] : null });
            } else if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
                // Local page check
                const baseHref = href.split('?')[0].split('#')[0];
                if (baseHref && !fs.existsSync(path.join(rootDir, baseHref))) {
                    brokenLinks.push({ href, text: text || '[Icon/Image]' });
                }
            }
        } else {
            brokenLinks.push({ href: '[MISSING HREF]', text });
        }
    }

    // 2. Find all <button> tags
    const buttonRegex = /<button\s+([^>]*?)>(.*?)<\/button>/gis;
    const buttonIssues = [];

    while ((match = buttonRegex.exec(content)) !== null) {
        const attrs = match[1];
        const text = match[2].replace(/<[^>]*>/g, '').trim();
        const onclickMatch = attrs.match(/onclick=["']([^"']*)["']/i);
        const typeMatch = attrs.match(/type=["']([^"']*)["']/i);
        const idMatch = attrs.match(/id=["']([^"']*)["']/i);
        const dataActionMatch = attrs.match(/data-[a-zA-Z0-9_-]+=["'][^"']*["']/i);

        const isSubmitInForm = typeMatch && typeMatch[1].toLowerCase() === 'submit';
        const hasClick = !!onclickMatch;
        const hasId = !!idMatch;
        const hasData = !!dataActionMatch;
        const hasClassListener = /theme-toggle-btn/.test(attrs);

        if (!isSubmitInForm && !hasClick && !hasId && !hasData && !hasClassListener) {
            buttonIssues.push({ text: text || '[Icon]', attrs: attrs.slice(0, 80) });
        }
    }

    results.push({
        file,
        brokenLinks,
        hashLinks,
        buttonIssues
    });
});

console.log('=== AUDIT RESULTS ===\n');
let issueCount = 0;

results.forEach(r => {
    const hasIssues = r.brokenLinks.length > 0 || r.buttonIssues.length > 0 || r.hashLinks.some(h => !h.onclick && !h.id);
    if (hasIssues) {
        console.log(`📄 ${r.file}:`);
        if (r.brokenLinks.length > 0) {
            console.log(`  ❌ Broken File Links (${r.brokenLinks.length}):`);
            r.brokenLinks.forEach(l => console.log(`     - href="${l.href}" (text: "${l.text}")`));
            issueCount += r.brokenLinks.length;
        }
        if (r.buttonIssues.length > 0) {
            console.log(`  ⚠️ Unbound Buttons (No onclick, id, data-*, or submit) (${r.buttonIssues.length}):`);
            r.buttonIssues.forEach(b => console.log(`     - text: "${b.text}" | attrs: ${b.attrs}`));
            issueCount += r.buttonIssues.length;
        }
        const unhandledHashes = r.hashLinks.filter(h => !h.onclick && !h.id);
        if (unhandledHashes.length > 0) {
            console.log(`  ℹ️ Hash Links without onclick/id (${unhandledHashes.length}):`);
            unhandledHashes.slice(0, 10).forEach(h => console.log(`     - text: "${h.text}" | attrs: ${h.attrs}`));
            if (unhandledHashes.length > 10) console.log(`     ... and ${unhandledHashes.length - 10} more`);
            issueCount += unhandledHashes.length;
        }
        console.log('');
    }
});

console.log(`Total potential link/button issues flagged: ${issueCount}`);
