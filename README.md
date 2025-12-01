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

📡 API Attempts & Pivot Explanation (Solo Developer)
Initial Plan: Use AI-generated drink recipes

At the beginning of the project, I integrated the OpenAI API to automatically generate:

Drink names

Ingredient lists

Step-by-step instructions

Custom variations based on whatever ingredients the user selected

My implementation used the OpenAI Responses API, with requests shaped like:

const response = await client.responses.create({
  model: "gpt-4.1-mini",
  input: prompt
});


I also experimented with:

OpenAI Image Generation API for drink photos

Unsplash Source API for cocktail images
(https://source.unsplash.com/...)

Why I Pivoted Away From External APIs

During development, I ran into multiple real-world issues:

1. API quota limits

My OpenAI account hit 429 “quota exceeded” errors quickly, even after a few test requests.
This meant the app wouldn’t reliably run during my class presentation.

2. Unreliable image loading

Unsplash images didn’t always load because of:

School network filtering

Authentication/CORS quirks

Hot reload inconsistencies

This caused blank cards and broken image previews.

3. Presentation stability

Since this project is graded and demonstrated live, I wanted something:

Free

Offline-capable

Guaranteed to work on any machine

Not dependent on API key issues or network instability

So I decided to remove external API calls entirely.

Final Approach: Local, Self-Contained Drink Generator

I rebuilt the drink generator to run 100% locally in page.jsx using JavaScript:

The app analyzes the chosen alcohol, mixers, and fruit

It selects from curated drink “templates” I wrote manually

It generates a unique drink suggestion each time

It creates a custom SVG “photo” on the fly, encoded as a data URL
→ This guarantees the image loads instantly every time, even offline

Benefits:

No API keys

No errors

No cost

No reliance on internet

Perfect for consistent classroom demos

💡 What I Learned

Real development often requires adapting when APIs introduce cost or reliability issues.

Simpler local logic can be more stable than AI-generated responses.

Offline-capable apps are much easier to demo and distribute.

The OpenAI version can still be added later — but I built a solid fallback first.

## Getting Started (for the grader)

```bash
# clone the repo
git clone https://github.com/USERNAME/what-should-i-drink.git
cd what-should-i-drink

# install dependencies
npm install

# run dev server
npm run dev
