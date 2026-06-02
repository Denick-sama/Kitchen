# 🍊 Kitchen App

A smart, glass-morphism kitchen companion with monochrome orange aesthetics.

## Pages
- **index.html** — Dashboard with live item counts
- **fridge.html** — Cold & perishable items with expiry tracking
- **pantry.html** — Dry goods and shelf-stable items with stock levels
- **grocery.html** — Shopping list with checkboxes and progress bar
- **bucket.html** — Dream ingredients, dishes, and cooking goals

## Features
- ✅ Add/edit/delete items across all sections
- ✅ Move items between Fridge, Pantry, Grocery, and Bucket List
- ✅ localStorage persistence — data survives page refreshes
- ✅ Search & filter by category on every page
- ✅ Expiry tracking with colour-coded tags (Fridge)
- ✅ Stock level indicator (Pantry)
- ✅ Checkboxes + progress bar (Grocery)
- ✅ Emoji picker + achieve tracking (Bucket)
- ✅ Toast notifications & confirm dialogs
- ✅ Fully responsive for mobile

## File Structure
```
kitchen/
├── index.html
├── fridge.html
├── pantry.html
├── grocery.html
├── bucket.html
├── css/
│   └── style.css
└── js/
    ├── app.js       ← shared utilities
    ├── fridge.js
    ├── pantry.js
    ├── grocery.js
    └── bucket.js
```

## Deploy to GitHub Pages (Free — works on any device!)

1. Create a free account at https://github.com
2. Click **New repository** → name it `kitchen` → set to **Public**
3. Upload all your files (keep the folder structure)
4. Go to **Settings → Pages**
5. Under **Source**, choose `main` branch and click **Save**
6. Your site will be live at: `https://YOUR-USERNAME.github.io/kitchen`

That's it! Share the link and open it on any phone or PC.

## Local Use on PC
Just open `index.html` in any browser — no server needed.
