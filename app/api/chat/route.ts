import { NextRequest } from "next/server";
import menu from "@/data/menu.json" assert { type: "json" };

type MenuItem = {
  id: string;
  name: string;
  category: string;
  calories: number;
  priceUSD: number;
  allergens: string[];
  tags?: string[];
};

type AgentResult = {
  text: string;
  actions?: { label: string; value: string }[];
  notice?: string;
};

const STORE_LOCATOR = "https://www.mcdonalds.com/us/en-us/restaurant-locator.html";
const DEALS_URL = "https://www.mcdonalds.com/us/en-us/deals.html";

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function findItem(query: string, items: MenuItem[]): MenuItem | undefined {
  const q = normalize(query);
  return items.find(i => {
    const name = normalize(i.name);
    const tags = (i.tags ?? []).map(t => normalize(t));
    return name === q || name.includes(q) || q.includes(name) || tags.some(t => q.includes(t));
  });
}

function listByCategory(cat: string, items: MenuItem[]): MenuItem[] {
  const q = normalize(cat);
  return items.filter(i => normalize(i.category) === q || normalize(i.category).includes(q));
}

function popular(items: MenuItem[]): MenuItem[] {
  const tagMatches = items.filter(i => (i.tags ?? []).includes("popular"));
  return tagMatches.length ? tagMatches : items.slice(0, 6);
}

function actionsForItem(item: MenuItem) {
  return [
    { label: `Calories for ${item.name}`, value: `How many calories are in ${item.name}?` },
    { label: `Allergens in ${item.name}`, value: `What allergens are in ${item.name}?` },
    { label: "Any deals?", value: "What deals are available?" },
  ];
}

function baseActions() {
  return [
    { label: "Show popular items", value: "What are popular items?" },
    { label: "View burgers", value: "Show me burgers" },
    { label: "Find nearest store", value: "Find the nearest McDonald's" },
  ];
}

function formatItems(items: MenuItem[]): string {
  return items.map(i => `- ${i.name} ? $${i.priceUSD.toFixed(2)} ? ${i.calories} cal`).join("\n");
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const text: string = String(message ?? "");
  const lower = text.toLowerCase();

  if (!text.trim()) {
    const res: AgentResult = {
      text: "Ask me about menu items, calories, allergens, deals, or finding a nearby restaurant.",
      actions: baseActions(),
    };
    return Response.json(res);
  }

  // Greetings
  if (/^(hi|hello|hey)\b/.test(lower)) {
    return Response.json({
      text: "Hello! What can I help you find today? Menu, calories, allergens, deals, or locations?",
      actions: baseActions(),
    } as AgentResult);
  }

  // Nearest store / locations
  if (/(nearest|near me|location|store|restaurant|open)/.test(lower)) {
    return Response.json({
      text: `Use the official store locator to find hours and the closest restaurant: ${STORE_LOCATOR}`,
      actions: [
        { label: "Open Store Locator", value: STORE_LOCATOR },
        { label: "Show popular items", value: "What are popular items?" },
      ],
      notice: "For accurate hours and availability, check the store locator.",
    } as AgentResult);
  }

  // Deals / offers
  if (/(deal|offer|coupon|discount)/.test(lower)) {
    return Response.json({
      text: `You can view current deals on the official deals page: ${DEALS_URL}`,
      actions: [
        { label: "View Deals", value: DEALS_URL },
        { label: "Popular items", value: "What are popular items?" },
      ],
      notice: "Deals vary by location and time.",
    } as AgentResult);
  }

  // Category listing
  if (/(burger|burgers)/.test(lower)) {
    const items = listByCategory("Burgers", menu.items as MenuItem[]);
    return Response.json({ text: `Burgers:\n${formatItems(items)}`, actions: baseActions() } as AgentResult);
  }
  if (/(chicken|nuggets)/.test(lower)) {
    const items = listByCategory("Chicken", menu.items as MenuItem[]);
    return Response.json({ text: `Chicken:\n${formatItems(items)}`, actions: baseActions() } as AgentResult);
  }
  if (/(breakfast)/.test(lower)) {
    const items = listByCategory("Breakfast", menu.items as MenuItem[]);
    return Response.json({ text: `Breakfast:\n${formatItems(items)}`, actions: baseActions() } as AgentResult);
  }
  if (/(dessert|ice cream|mcflurry|pie)/.test(lower)) {
    const items = listByCategory("Desserts", menu.items as MenuItem[]);
    return Response.json({ text: `Desserts:\n${formatItems(items)}`, actions: baseActions() } as AgentResult);
  }
  if (/(drink|coffee|latte|cafe|iced)/.test(lower)) {
    const items = listByCategory("Drinks", menu.items as MenuItem[]);
    return Response.json({ text: `Drinks:\n${formatItems(items)}`, actions: baseActions() } as AgentResult);
  }
  if (/\bmenu\b/.test(lower)) {
    const cats = ["Burgers", "Chicken", "Breakfast", "Desserts", "Drinks"];
    const lines = cats.map(c => `? ${c}`).join("\n");
    return Response.json({ text: `I can show:\n${lines}\n\nAsk for a category or an item.`, actions: baseActions() } as AgentResult);
  }

  // Nutrition / calories / allergens for a specific item
  if (/(calorie|nutrition|allergen|ingredients?)/.test(lower)) {
    const found = findItem(text, menu.items as MenuItem[]);
    if (found) {
      const allergens = found.allergens.length ? found.allergens.join(", ") : "None listed";
      return Response.json({
        text: `${found.name}: ${found.calories} calories. Allergens: ${allergens}. Price ~ $${found.priceUSD.toFixed(2)} (varies).`,
        actions: actionsForItem(found),
        notice: "Nutrition and prices can vary by region and serving size.",
      } as AgentResult);
    }
  }

  // Info for a specific item by name
  const item = findItem(text, menu.items as MenuItem[]);
  if (item) {
    return Response.json({
      text: `${item.name}: about $${item.priceUSD.toFixed(2)} ? ${item.calories} cal. Category: ${item.category}.` ,
      actions: actionsForItem(item),
      notice: "Availability varies by location and time of day.",
    } as AgentResult);
  }

  // Popular items fallback
  if (/popular|recommend|best/.test(lower)) {
    const items = popular(menu.items as MenuItem[]);
    return Response.json({ text: `Popular picks:\n${formatItems(items)}`, actions: baseActions() } as AgentResult);
  }

  // Default fallback
  return Response.json({
    text: "I can help with menu items, calories, allergens, deals, and finding nearby restaurants. Try asking for 'burgers', 'Big Mac calories', or 'nearest store'.",
    actions: baseActions(),
  } as AgentResult);
}
