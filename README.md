# Ayush's Design Drawer

A birthday gift for Ayush: 24 cleverly designed physical products, each with the story, the one smart decision behind it, and a lesson to steal. Sources are linked on every card.

It's a single static file (`index.html`), no build step.

## Deploy on Vercel
1. Go to https://vercel.com/new and import this GitHub repo.
2. Framework preset: **Other**. Leave build command and output directory empty.
3. Click **Deploy**.

## Edit
- Products live in the `ITEMS` array inside `index.html`.
- Product photos are freely licensed images from Wikimedia Commons, listed in the `PHOTOS` map. Each photo links to its Commons page, which credits the photographer and licence. If a photo fails to load, the card shows its drawing instead.
- The quote collections are plain HTML in the `#quotes` section.
- The birthday note and closing letter are plain HTML near the top and bottom of the file.
- Easter egg: type `ayush` anywhere on the page.
