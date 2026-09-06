# Admin workspace refinement

The admin workspace keeps the existing gold brand and separate Orders, Clients, Catalog, and Team pages. Primary navigation uses real page links in a sticky bar on desktop/tablet and a bottom dock on mobile. Orders remains at `admin-portal.html`; the other pages are `admin-clients.html`, `admin-catalog.html`, and `admin-team.html`. Shared behavior lives in `js/admin-workspace.js`.

## Workflow

- Removed duplicate section-navigation cards.
- Grouped card/table selection, search shortcut, and export inside Orders.
- Stage buttons filter the order workspace; All orders restores the continuous four-stage view.
- Search feedback reports the visible result count. Reset filters clears both stage and search.
- Client/team searches restore all stages so previous filters cannot conceal matching orders.
- Order value includes unpaid orders; it is not presented as collected revenue.
- Existing assignment, revision, pricing, reminder, invoice, client, catalog, and account workflows remain in place.

## Styling

`admin-workspace.css` is loaded only by the four admin pages. Its primitive colors map to semantic surface, text, border, selection, and shadow variables used by admin components. Primary gold remains #d4af35; light canvas remains #f8f7f6; dark canvas remains #201d12. Active stage filters use aria-pressed, controls retain visible keyboard focus, and motion respects reduced-motion preferences.

## Verification

Isolated browser checks use demo data with InsForge network requests blocked. They cover 1512×982, 834×1112, and 390×844 in light/dark themes; stage filtering, search/reset, card/table layout, navigation/search focus, account modal, and page overflow. Live data mutations are not part of visual verification.

No commit or push is required for these changes.
