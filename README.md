# Ayush's Design Drawer

A birthday gift for Ayush: 24 cleverly designed physical products, each with the story, the one smart decision behind it, and a lesson to steal. Sources are linked on every card.

The page is a single file (`index.html`). A small build step (`scripts/build.mjs`, no dependencies) runs on Vercel: it downloads the product photos from Wikimedia Commons into the site, along with each photographer's name and licence.

## Deploy on Vercel
1. Go to https://vercel.com/new and import this GitHub repo.
2. Framework preset: **Other**. Leave the build settings alone; `vercel.json` sets them.
3. Click **Deploy**. The build log lists each photo it downloaded.

## Edit
- Products live in the `ITEMS` array inside `index.html`.
- Product photos are freely licensed images from Wikimedia Commons, listed in the `PHOTOS` map. Each photo links to its Commons page, which credits the photographer and licence. If a photo fails to load, the card shows its drawing instead.
- The quote collections are plain HTML in the `#quotes` section.
- The birthday note and closing letter are plain HTML near the top and bottom of the file.
- Easter egg: type `ayush` anywhere on the page.
