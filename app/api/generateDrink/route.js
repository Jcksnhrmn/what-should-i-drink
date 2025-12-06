import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

// ----- DRINK DATABASE -----

const flavorProfiles = {
  tropical: {
    bases: ["rum", "coconut rum", "white rum"],
    mixers: ["pineapple juice", "orange juice", "mango puree"],
    accents: ["lime juice", "grenadine", "simple syrup"],
    garnishes: ["pineapple wedge", "maraschino cherry", "orange peel"]
  },

  citrus: {
    bases: ["vodka", "gin", "tequila"],
    mixers: ["lemon juice", "lime juice", "orange juice"],
    accents: ["triple sec", "simple syrup", "honey syrup"],
    garnishes: ["lemon twist", "lime wheel", "orange slice"]
  },

  herbal: {
    bases: ["gin", "bourbon", "vodka"],
    mixers: ["green tea", "tonic water", "club soda"],
    accents: ["mint", "rosemary", "basil syrup"],
    garnishes: ["mint sprig", "rosemary stalk", "cucumber slice"]
  },

  creamy: {
    bases: ["bourbon", "rum", "irish cream"],
    mixers: ["milk", "cream", "cold brew coffee"],
    accents: ["vanilla syrup", "cinnamon", "nutmeg"],
    garnishes: ["cocoa powder", "whipped cream", "cinnamon stick"]
  },

  bitter: {
    bases: ["whiskey", "gin", "campari"],
    mixers: ["club soda", "sweet vermouth", "aperol"],
    accents: ["orange bitters", "aromatic bitters"],
    garnishes: ["orange peel", "lemon peel"]
  }
};

// ----- NAME GENERATOR -----

const nameAdjectives = [
  "Sunset", "Midnight", "Velvet", "Golden", "Electric", "Crimson",
  "Frosted", "Blossom", "Neon", "Twilight", "Storm"
];

const nameNouns = [
  "Breeze", "Elixir", "Sour", "Fizz", "Cooler",
  "Spritz", "Dream", "Tonic", "Crush", "Glow", "Delight"
];

function generateDrinkName() {
  return `${rand(nameAdjectives)} ${rand(nameNouns)}`;
}

// ----- HELPERS -----

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickFlavorProfile() {
  return rand(Object.keys(flavorProfiles));
}

function buildSteps(drinkName) {
  return [
    "Add all ingredients to a shaker with ice.",
    "Shake vigorously for 10–15 seconds.",
    "Strain into a chilled glass.",
    "Garnish and serve.",
  ];
}

// ----- ROUTE HANDLER -----

export async function POST() {
  try {
    const profileKey = pickFlavorProfile();
    const profile = flavorProfiles[profileKey];

    const name = generateDrinkName();

    const ingredients = [
      `2 oz ${rand(profile.bases)}`,
      `1 oz ${rand(profile.mixers)}`,
      `0.5 oz ${rand(profile.accents)}`,
      `Garnish: ${rand(profile.garnishes)}`
    ];

    const description = `A ${profileKey}-style cocktail with bold flavors and a refreshing finish.`;

    return NextResponse.json(
      {
        id: nanoid(),
        name,
        description,
        ingredients,
        steps: buildSteps(name),
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("DRINK GEN ERROR:", err);
    return NextResponse.json(
      { error: "Failed to generate drink" },
      { status: 500 }
    );
  }
}
