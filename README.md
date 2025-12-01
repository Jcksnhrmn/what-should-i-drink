# What Should I Drink?

A small Next.js web app that helps you decide **what drink to make** based on what you already have at home.

You tell the app what alcohol, mixers, and fruit you have. It then generates a suggested drink (name, description, ingredients, and steps) and shows a fun “photo” card for the drink. There is also a **Drunk Mode** that makes the UI louder, simpler, and more readable if the user is… not exactly sober.

> Please drink responsibly and only if you are of legal drinking age.  
> This app is for fun / educational purposes only.

---

## Features

- ✅ Multi-select inputs for:
  - Alcohol: vodka, rum, tequila, whiskey, etc.
  - Mixers: orange juice, cola, tonic, soda water, etc.
  - Fruit / garnish: lime, lemon, berries, mint, etc.
- ✅ “Show me a drink” button that:
  - Switches to a result screen
  - Generates a drink idea completely on the client (no external API calls)
- ✅ Drink result card:
  - Drink name + short description
  - Ingredients list
  - Step-by-step instructions
  - Auto-generated “photo” using an inline SVG (renders even offline)
- ✅ “Next drink →” button:
  - Uses the same ingredients to get a **different** random drink idea
- ✅ Like / Dislike buttons:
  - Track how many suggestions the user liked or disliked during this session
- ✅ Drunk Mode:
  - Big, exaggerated fonts and buttons
  - Goofy, simplified instructions (e.g., “Put ice in cup 🧊”, “Dump in”)
  - Different button text (e.g., “HIT THE BIG GOLD BUTTON 👉🍹”, “ANOTHER ONE 🔁”)

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** React with modern JavaScript (ES modules)
- **Styling:** Global CSS (custom black + gold theme)
- **No backend / DB required** – drink ideas are generated in the browser

---

## How It Works

All the logic lives in `app/page.jsx`:

1. The user selects any combination of:
   - Alcohols (`alcoholOptions`)
   - Mixers (`mixerOptions`)
   - Fruits/garnishes (`fruitOptions`)

2. When the user clicks **“Show me a drink”**:
   - The app switches from the input view to a result view.
   - A helper function `createRandomDrink()` looks at the selected ingredients.
   - It picks a matching drink “template” from a small library of recipes
     (e.g., vodka + orange juice → screwdriver-style ideas).
   - It builds an **inline SVG image** string and encodes it as a `data:` URL,
     which becomes `drink.imageUrl`.

3. The result screen renders:
   - `<img src={drink.imageUrl} />`
   - The drink name, description, ingredients, and steps
   - Like / Dislike / Next drink buttons

4. Clicking **“Next drink →”**:
   - Re-runs `createRandomDrink()` with the same selected ingredients
   - Returns a different random idea if more than one recipe matches

5. **Drunk Mode**:
   - A boolean `drunkMode` state toggles special CSS classes and text.
   - When `drunkMode` is on:
     - The main title animates and gets extra emphasis.
     - Button labels change to simpler / funnier wording.
     - Instructions for steps are post-processed to be dumber and emoji-filled.

---

## Getting Started (for the grader)

```bash
# clone the repo
git clone https://github.com/USERNAME/what-should-i-drink.git
cd what-should-i-drink

# install dependencies
npm install

# run dev server
npm run dev
