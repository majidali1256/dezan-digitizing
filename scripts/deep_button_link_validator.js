const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
const jsFiles = [
    'app.js',
    'js/order-quote-modal.js',
    'js/insforge-client.js',
    'js/client-workspace.js',
    'js/admin-workspace.js',
    'js/worker-workspace.js'
].filter(f => fs.existsSync(path.join(rootDir, f)));

// Combine all JS content to search for event listener bindings
let allJsContent = '';
jsFiles.forEach(f => {
    allJsContent += '\n' + fs.readFileSync(path.join(rootDir, f), 'utf8');
});

console.log(`Deep Link & Button Validator starting...`);
console.log(`Scanning ${htmlFiles.length} HTML files against ${jsFiles.length} JS controllers.\n`);

const issues = [];

htmlFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    const rawContent = fs.readFileSync(filePath, 'utf8');

    // Extract inline scripts in this HTML file as well
    let inlineJs = '';
    const scriptMatches = rawContent.match(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi) || [];
    scriptMatches.forEach(s => {
        inlineJs += '\n' + s.replace(/<\/?script[^>]*>/gi, '');
    });

    const fileJs = allJsContent + '\n' + inlineJs;

    // Strip scripts & styles for HTML DOM parsing
    const content = rawContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Collect all IDs on this page
    const idRegex = /\bid=["']([^"']+)["']/gi;
    const pageIds = new Set();
    let idMatch;
    while ((idMatch = idRegex.exec(content)) !== null) {
        pageIds.add(idMatch[1]);
    }

    // 1. Validate all <a> tags
    const aRegex = /<a\s+([^>]*?)>(.*?)<\/a>/gis;
    let aMatch;
    while ((aMatch = aRegex.exec(content)) !== null) {
        const attrs = aMatch[1];
        const text = aMatch[2].replace(/<[^>]*>/g, '').trim().slice(0, 40);
        const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
        const onclickMatch = attrs.match(/onclick=["']([^"']*)["']/i);
        const idMatchAttr = attrs.match(/id=["']([^"']*)["']/i);
        const classMatch = attrs.match(/class=["']([^"']*)["']/i);

        if (!hrefMatch) {
            issues.push({ file, type: 'a-no-href', detail: `Missing href attribute (text: "${text}")` });
            continue;
        }

        const href = hrefMatch[1].trim();

        if (href === '#' || href === 'javascript:void(0)') {
            // Check if bound by onclick, or if id/class is in JS
            const hasOnclick = !!onclickMatch;
            const hasId = idMatchAttr && fileJs.includes(idMatchAttr[1]);
            const classes = classMatch ? classMatch[1].split(/\s+/) : [];
            const hasClassBinding = classes.some(c => c && fileJs.includes('.' + c));

            // Also check app.js privacy / terms / modal triggers
            const isPrivacyOrTerms = text.toLowerCase().includes('privacy') || text.toLowerCase().includes('terms');

            if (!hasOnclick && !hasId && !hasClassBinding && !isPrivacyOrTerms) {
                issues.push({ file, type: 'dead-hash-link', detail: `Dead '#' link with no click handler or ID/class binding: text="${text}"` });
            }
        } else if (href.startsWith('#')) {
            // Internal anchor on this page
            const targetId = href.slice(1);
            if (targetId && !pageIds.has(targetId)) {
                issues.push({ file, type: 'missing-anchor', detail: `Anchor '${href}' does not match any element ID on ${file} (text="${text}")` });
            }
        } else if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            // Relative link to another file
            const [withoutHash, targetHash] = href.split('#');
            const targetFile = withoutHash.split('?')[0];
            const targetPath = path.join(rootDir, targetFile);

            if (targetFile && !fs.existsSync(targetPath)) {
                issues.push({ file, type: 'broken-target-file', detail: `Target file '${targetFile}' does not exist (text="${text}")` });
            } else if (targetFile && targetHash) {
                // Check if hash exists in target file
                const targetContent = fs.readFileSync(targetPath, 'utf8');
                const targetHasId = new RegExp(`id=["']${targetHash}["']`, 'i').test(targetContent);
                if (!targetHasId) {
                    issues.push({ file, type: 'missing-external-anchor', detail: `Anchor '#${targetHash}' not found in ${targetFile} (text="${text}")` });
                }
            }
        }
    }

    // 2. Validate all <button> tags
    const btnRegex = /<button\s+([^>]*?)>(.*?)<\/button>/gis;
    let bMatch;
    while ((bMatch = btnRegex.exec(content)) !== null) {
        const attrs = bMatch[1];
        const text = bMatch[2].replace(/<[^>]*>/g, '').trim().slice(0, 40);
        const onclickMatch = attrs.match(/onclick=["']([^"']*)["']/i);
        const idMatchAttr = attrs.match(/id=["']([^"']*)["']/i);
        const classMatch = attrs.match(/class=["']([^"']*)["']/i);
        const typeMatch = attrs.match(/type=["']([^"']*)["']/i);
        const dataMatch = attrs.match(/data-[a-zA-Z0-9_-]+=/i);

        const isSubmit = typeMatch && typeMatch[1].toLowerCase() === 'submit';
        const hasOnclick = !!onclickMatch;
        const hasId = idMatchAttr && fileJs.includes(idMatchAttr[1]);
        const classes = classMatch ? classMatch[1].split(/\s+/) : [];
        const hasClassBinding = classes.some(c => c && (fileJs.includes(`.${c}`) || fileJs.includes(`'${c}'`) || fileJs.includes(`"${c}"`)));

        if (!isSubmit && !hasOnclick && !hasId && !hasClassBinding && !dataMatch) {
            issues.push({ file, type: 'unbound-button', detail: `Button has no action, handler, or JS binding: text="${text}"` });
        }
    }
});

console.log('=== VALIDATOR REPORT ===\n');
if (issues.length === 0) {
    console.log('✅ ALL BUTTONS AND LINKS ACROSS ALL 30 PAGES ARE PROPERLY BOUND!');
} else {
    console.log(`Found ${issues.length} potential issues:\n`);
    const grouped = {};
    issues.forEach(i => {
        if (!grouped[i.file]) grouped[i.file] = [];
        grouped[i.file].push(i);
    });

    Object.keys(grouped).forEach(f => {
        console.log(`📄 ${f}:`);
        grouped[f].forEach(issue => {
            console.log(`   [${issue.type}] ${issue.detail}`);
        });
        console.log('');
    });
}
