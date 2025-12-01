"use client";

import { useState } from "react";

const alcoholOptions = [
  "Vodka",
  "Rum",
  "Gin",
  "Tequila",
  "Whiskey",
  "Wine",
  "Beer",
];

const mixerOptions = [
  "Orange juice",
  "Cranberry juice",
  "Pineapple juice",
  "Soda water",
  "Cola",
  "Tonic water",
  "Lemonade",
  "Milk / Cream",
  "Lime juice",
];

const fruitOptions = [
  "Lime",
  "Lemon",
  "Orange",
  "Strawberries",
  "Blueberries",
  "Mint",
  "No fruit",
];

// ---------- local drink generator (no API) ----------

function createRandomDrink(alcohols = [], mixers = [], fruits = []) {
  const lower = (arr) => arr.map((x) => x.toLowerCase());
  const alc = lower(alcohols);
  const mix = lower(mixers);
  const fruit = lower(fruits);

  const hasAlc = (name) => alc.includes(name.toLowerCase());
  const hasMix = (name) => mix.includes(name.toLowerCase());
  const hasFruit = (name) => fruit.includes(name.toLowerCase());

  const ideas = [];
  let isAlcoholic = alcohols.length > 0;

  // Vodka + OJ
  if (hasAlc("vodka") && hasMix("orange juice")) {
    ideas.push(
      {
        name: "Lazy Screwdriver",
        description: "Classic vodka and orange juice, easy and bright.",
        ingredients: [
          "2 oz vodka",
          "4–6 oz orange juice",
          hasFruit("orange") ? "Orange slice for garnish" : null,
        ].filter(Boolean),
        steps: [
          "Fill a glass with ice.",
          "Pour in the vodka.",
          "Top with orange juice.",
          "Stir and sip.",
        ],
      },
      {
        name: "Dorm Room Sunrise",
        description: "A sweeter twist on a screwdriver for late nights.",
        ingredients: [
          "2 oz vodka",
          "4–6 oz orange juice",
          "Splash of red juice or soda (optional)",
        ],
        steps: [
          "Add ice to a cup.",
          "Dump in vodka.",
          "Pour in orange juice almost to the top.",
          "Drizzle a splash of red juice or soda on top.",
        ],
      }
    );
  }

  // Rum + Cola
  if (hasAlc("rum") && hasMix("cola")) {
    ideas.push(
      {
        name: "Dorm Room Rum and Coke",
        description: "Zero effort, maximum nostalgia.",
        ingredients: [
          "2 oz rum",
          "4–6 oz cola",
          hasFruit("lime") ? "Lime wedge" : null,
        ].filter(Boolean),
        steps: [
          "Fill a glass with ice.",
          "Pour rum over the ice.",
          "Top with cola.",
          hasFruit("lime")
            ? "Squeeze a lime wedge and drop it in."
            : "Give it a quick stir.",
        ],
      },
      {
        name: "Midnight Cuba Libre",
        description: "Rum and Coke with extra lime attitude.",
        ingredients: [
          "2 oz rum",
          "4–6 oz cola",
          hasFruit("lime") ? "Juice of 1 lime" : "Any citrus squeeze you have",
        ].filter(Boolean),
        steps: [
          "Fill your cup with ice.",
          "Pour in the rum.",
          "Add citrus juice.",
          "Top with cola and stir.",
        ],
      }
    );
  }

  // Tequila + lime-ish
  if (hasAlc("tequila") && (hasMix("lime juice") || hasFruit("lime"))) {
    ideas.push(
      {
        name: "Barebones Tequila Sour",
        description: "Like a stripped-down margarita using what you have.",
        ingredients: [
          "2 oz tequila",
          hasMix("lime juice") ? "1 oz lime juice" : "Juice of 1 lime",
          "0.5–1 oz simple syrup or sugar (if available)",
        ],
        steps: [
          "Add tequila, lime, and sweetener to a jar with ice.",
          "Shake or stir until cold.",
          "Pour into a glass with fresh ice.",
        ],
      },
      {
        name: "Kitchen Counter Margarita",
        description: "A rough-around-the-edges margarita that still hits.",
        ingredients: [
          "2 oz tequila",
          hasMix("lime juice") ? "1 oz lime juice" : "Juice of 1–2 limes",
          "Splash of any sweet soda or juice",
        ],
        steps: [
          "Fill a glass with ice.",
          "Add tequila and lime.",
          "Top with sweet soda or juice.",
          "Stir and taste.",
        ],
      }
    );
  }

  // Mocktails (no alcohol)
  if (!alcohols.length && mixers.length) {
    const base = mixers[0];
    isAlcoholic = false;
    ideas.push(
      {
        name: "House Mocktail",
        description: "Non-alcoholic but still cute and tasty.",
        ingredients: [
          base,
          fruits.length ? fruits.join(", ") + " for garnish" : null,
        ].filter(Boolean),
        steps: [
          "Add ice to a glass.",
          "Pour in your base drink.",
          fruits.length
            ? "Use your fruit as garnish or squeeze it into the drink."
            : "Stir and enjoy.",
        ],
      },
      {
        name: "Fizz-Free Zone",
        description: "Simple, refreshing, and totally zero-proof.",
        ingredients: [
          base,
          hasMix("soda water") ? "Splash of soda water" : null,
        ].filter(Boolean),
        steps: [
          "Fill a glass with ice.",
          "Pour your base drink in about three-quarters of the way.",
          hasMix("soda water")
            ? "Top with soda water and stir."
            : "Stir once or twice and sip.",
        ],
      }
    );
  }

  // Generic combo if nothing else matched
  if (alcohols.length && mixers.length && !ideas.length) {
    const a = alcohols[0];
    const m = mixers[0];
    ideas.push({
      name: a + " " + m + " Highball",
      description:
        "A simple mix of " +
        a.toLowerCase() +
        " and " +
        m.toLowerCase() +
        ", built over ice.",
      ingredients: [
        "2 oz " + a.toLowerCase(),
        "4–6 oz " + m.toLowerCase(),
        fruits.length ? fruits[0] + " for garnish" : null,
      ].filter(Boolean),
      steps: [
        "Fill a glass with ice.",
        "Pour in the " + a.toLowerCase() + ".",
        "Top with " + m.toLowerCase() + ".",
        fruits.length
          ? "Garnish with your " + fruits[0].toLowerCase() + "."
          : "Give it a quick stir.",
      ],
    });
  }

  // Total fallback
  if (!ideas.length) {
    isAlcoholic = false;
    ideas.push({
      name: "Water or Juice Break",
      description:
        "Looks like you are low on ingredients. Hydrate and reset.",
      ingredients: ["Whatever drink you have", "Ice, if you want"],
      steps: [
        "Pour your drink into a cup.",
        "Add ice if you want it cold.",
        "Take a breather and enjoy.",
      ],
    });
  }

  // Pick one at random
  const index = Math.floor(Math.random() * ideas.length);
  const baseDrink = ideas[index];

  // Inline SVG image (always works, no network)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#020617"/>
        <stop offset="50%" stop-color="#111827"/>
        <stop offset="100%" stop-color="#78350f"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" />
    <text x="50%" y="40%" fill="#facc15" font-size="38" text-anchor="middle" font-family="system-ui" font-weight="700">
      ${baseDrink.name}
    </text>
    <text x="50%" y="60%" fill="#e5e7eb" font-size="20" text-anchor="middle" font-family="system-ui">
      What Should I Drink App
    </text>
  </svg>`;

  const imageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return { ...baseDrink, imageUrl, isAlcoholic };
}

// ---------- pill multi-select component ----------

function MultiSelect({ label, options, selected, onChange, drunkMode }) {
  const toggle = (item) => {
    if (selected.includes(item)) {
      onChange(selected.filter((x) => x !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div className="section">
      <h2 className={drunkMode ? "section-title drunk" : "section-title"}>
        {label}
      </h2>
      <div className={drunkMode ? "pill-row drunk" : "pill-row"}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={selected.includes(opt) ? "pill pill-selected" : "pill"}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- main page ----------

export default function HomePage() {
  const [drunkMode, setDrunkMode] = useState(false);
  const [alcohols, setAlcohols] = useState([]);
  const [mixers, setMixers] = useState([]);
  const [fruits, setFruits] = useState([]);

  const [view, setView] = useState("input");
  const [drink, setDrink] = useState(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = () => {
    setView("result");
    setIsLoading(true);
    setDrink(null);

    setTimeout(() => {
      const d = createRandomDrink(alcohols, mixers, fruits);
      setDrink(d);
      setIsLoading(false);
    }, 400);
  };

  const handleNextDrink = () => {
    setIsLoading(true);
    setTimeout(() => {
      const d = createRandomDrink(alcohols, mixers, fruits);
      setDrink(d);
      setIsLoading(false);
    }, 300);
  };

  const handleLike = () => {
    if (!drink) return;
    setLikes((prev) => prev + 1);
  };

  const handleDislike = () => {
    if (!drink) return;
    setDislikes((prev) => prev + 1);
  };

  const handleReset = () => {
    setAlcohols([]);
    setMixers([]);
    setFruits([]);
    setDrink(null);
    setLikes(0);
    setDislikes(0);
    setView("input");
  };

  const handleBackToInput = () => {
    setView("input");
  };

  return (
    <div className={drunkMode ? "page drunk-mode" : "page"}>
      <header className="header">
        <div>
          <h1 className={drunkMode ? "drunk-title" : ""}>
            {drunkMode ? "WHAT SHOULD I DRINK 😵‍💫🍺" : "What Should I Drink?"}
          </h1>
          <p className="tagline">
            {drunkMode
              ? "Tap stuff you see. I'll make you a drink idea. 🍹"
              : "Tap in what you've got. I'll invent a drink idea for you. 🍸"}
          </p>
        </div>
        <button
          type="button"
          className={drunkMode ? "drunk-toggle on" : "drunk-toggle"}
          onClick={() => setDrunkMode((prev) => !prev)}
        >
          {drunkMode ? "🍹 Drunk Mode: ON" : "🥂 Drunk Mode"}
        </button>
      </header>

      <p className="disclaimer">
        Please drink responsibly and only if you are of legal drinking age.
      </p>

      {view === "input" && (
        <>
          <MultiSelect
            label="1. What alcohol do you have?"
            options={alcoholOptions}
            selected={alcohols}
            onChange={setAlcohols}
            drunkMode={drunkMode}
          />

          <MultiSelect
            label="2. What mixers / other drinks do you have?"
            options={mixerOptions}
            selected={mixers}
            onChange={setMixers}
            drunkMode={drunkMode}
          />

          <MultiSelect
            label="3. Any fruit or garnish?"
            options={fruitOptions}
            selected={fruits}
            onChange={setFruits}
            drunkMode={drunkMode}
          />

          <div className="actions">
            <button
              type="button"
              className={drunkMode ? "primary-btn big" : "primary-btn"}
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading
                ? drunkMode
                  ? "HOLD ONNN I'M THINKING 🧠🍹"
                  : "Mixing an idea..."
                : drunkMode
                ? "HIT THE BIG GOLD BUTTON 👉🍹"
                : "Show me a drink"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </button>
          </div>
        </>
      )}

      {view === "result" && (
        <main className="result-area">
          <button
            type="button"
            className="secondary-btn back-btn"
            onClick={handleBackToInput}
            disabled={isLoading}
          >
            {drunkMode ? "← FIX MY STUFF" : "← Edit my ingredients"}
          </button>

          {isLoading && (
            <p className="loading-text">
              Shaking up something based on your ingredients...
            </p>
          )}

          {drink && !isLoading && (
            <div className="drink-card">
              <img
                src={drink.imageUrl}
                alt={drink.name}
                className="drink-image"
              />
              <h2>{drink.name}</h2>
              <p className="drink-description">{drink.description}</p>

              <div className="drink-columns">
                <div>
                  <h3>Ingredients</h3>
                  <ul>
                    {drink.ingredients.map((item, idx) => (
                      <li key={idx}>
                        {drunkMode
                          ? item.replace("oz", " oz").toUpperCase()
                          : item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3>Steps</h3>
                  <ol>
                    {drink.steps.map((step, idx) => (
                      <li key={idx}>
                        {drunkMode
                          ? step
                              .replace(
                                "Fill a glass with ice.",
                                "Put ice in cup. 🧊"
                              )
                              .replace(
                                "Fill a glass with ice",
                                "Put ice in cup. 🧊"
                              )
                              .replace(
                                "Add ice to a glass.",
                                "Put ice in cup. 🧊"
                              )
                              .replace("Pour in", "Dump in")
                              .replace("Pour your", "Dump your")
                              .replace("Top with", "Throw on top")
                              .replace(
                                "Give it a quick stir",
                                "Stir it a few times, it's fine."
                              )
                              .replace(
                                "Give it a gentle stir",
                                "Stir it a few times, it's fine."
                              )
                              .replace(
                                "Shake or stir until it feels very cold.",
                                "Shake it like a maraca. 🎶"
                              )
                              .replace(
                                "Stir and enjoy.",
                                "Stir and drink it, champ. 🥂"
                              )
                          : step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="feedback-row">
                <button
                  type="button"
                  className="like-btn"
                  onClick={handleLike}
                  disabled={isLoading}
                >
                  👍 Like
                </button>

                <button
                  type="button"
                  className="dislike-btn"
                  onClick={handleDislike}
                  disabled={isLoading}
                >
                  👎 Dislike
                </button>

                <button
                  type="button"
                  className="next-btn"
                  onClick={handleNextDrink}
                  disabled={isLoading}
                >
                  {drunkMode ? "ANOTHER ONE 🔁" : "Next drink →"}
                </button>
              </div>

              <p className="feedback-stats">
                Likes this session: {likes} | Dislikes this session: {dislikes}
              </p>
            </div>
          )}

          {!drink && !isLoading && (
            <p className="empty-state">
              Pick what you have on the previous screen, then hit{" "}
              <strong>Show me a drink</strong>.
            </p>
          )}
        </main>
      )}

      <footer className="footer">
        <p>Built with Next.js • What Should I Drink group project</p>
      </footer>
    </div>
  );
}
