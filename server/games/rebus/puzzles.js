import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Load extracted puzzles from JSON
let extractedPuzzles = [];
try {
  const data = JSON.parse(readFileSync(join(__dirname, "extracted-puzzles.json"), "utf-8"));
  extractedPuzzles = data.puzzles.map((p) => ({
    display: p.image,
    answer: p.answer,
    alternates: p.alternates || [],
    isImage: true,
  }));
  console.log(`Loaded ${extractedPuzzles.length} rebus puzzles from extracted-puzzles.json`);
} catch (e) {
  console.warn("Could not load extracted-puzzles.json, falling back to emoji puzzles");
}

// Emoji fallback puzzles
const emojiFallback = [
  { display: "👁️ ❤️ 🗽", answer: "i love new york", alternates: ["i love ny"], isImage: false },
  { display: "🌧️ 🐱 🐶", answer: "raining cats and dogs", alternates: [], isImage: false },
  { display: "⭐ ⚔️", answer: "star wars", alternates: [], isImage: false },
  { display: "🧊 🧊 👶", answer: "ice ice baby", alternates: [], isImage: false },
  { display: "🧠 ⛈️", answer: "brainstorm", alternates: ["brain storm"], isImage: false },
  { display: "📖 🐛", answer: "bookworm", alternates: ["book worm"], isImage: false },
  { display: "🌙 💡", answer: "moonlight", alternates: ["moon light"], isImage: false },
  { display: "🔑 🪨", answer: "keystone", alternates: ["key stone"], isImage: false },
  { display: "👑 💎", answer: "crown jewels", alternates: ["crown jewel"], isImage: false },
  { display: "🦅 👁️", answer: "eagle eye", alternates: ["eagle eyes"], isImage: false },
];

export const defaultPuzzles = extractedPuzzles.length > 0 ? extractedPuzzles : emojiFallback;
