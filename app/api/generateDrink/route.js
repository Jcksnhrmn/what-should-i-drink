// SUPER SIMPLE TEST VERSION
// Always returns the same drink with a guaranteed-working image.

export async function POST(req) {
  // Just read the body so Next.js doesn't complain, but we ignore it
  try {
    await req.json().catch(() => ({}));
  } catch (e) {
    // ignore
  }

  const drink = {
    name: "Test Drink",
    description:
      "If you can see this card and the image below, your API and image rendering are working.",
    ingredients: [
      "2 oz something",
      "4 oz something else",
      "Ice",
      "Vibes"
    ],
    steps: [
      "Put ice in a cup.",
      "Dump in the first thing.",
      "Dump in the second thing.",
      "Stir and pretend you are a pro bartender."
    ],
    imageUrl:
      "https://via.placeholder.com/800x450.png?text=Test+Drink+Image"
  };

  return new Response(JSON.stringify({ drink }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
