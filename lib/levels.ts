// The 8 conversational levels of Bol Chaal. This is the single source of truth
// reused by the landing teaser, the level map (Phase 2) and DB seeding.

export type Level = {
  id: number;
  slug: string;
  title: string; // Roman Urdu
  titleScript: string; // Nastaʿlīq
  emoji: string;
  blurb: string; // English, what you'll be able to do
  scenario: string; // default conversation scenario for the tutor
};

export const LEVELS: Level[] = [
  {
    id: 1,
    slug: "salaam",
    title: "Salaam",
    titleScript: "سلام",
    emoji: "👋",
    blurb: "Greetings, introducing yourself, and “how are you”.",
    scenario:
      "Two people meeting for the first time: greet each other, exchange names, and ask how the other is doing.",
  },
  {
    id: 2,
    slug: "ghar-waale",
    title: "Ghar Waale",
    titleScript: "گھر والے",
    emoji: "👪",
    blurb: "Family: who's who and talking about siblings.",
    scenario:
      "Chatting about family: ask whether the learner has siblings and talk about who is in their household.",
  },
  {
    id: 3,
    slug: "khaana",
    title: "Khaana",
    titleScript: "کھانا",
    emoji: "🍛",
    blurb: "Food: ordering at a dhaba, likes and dislikes.",
    scenario:
      "At a dhaba (roadside eatery): the tutor is the waiter taking the learner's order and chatting about food they like.",
  },
  {
    id: 4,
    slug: "bazaar",
    title: "Bazaar",
    titleScript: "بازار",
    emoji: "🛍️",
    blurb: "Shopping and bargaining, numbers and prices.",
    scenario:
      "At a bazaar stall: the tutor is a shopkeeper; the learner asks prices and bargains for an item.",
  },
  {
    id: 5,
    slug: "raasta",
    title: "Raasta",
    titleScript: "راستہ",
    emoji: "🧭",
    blurb: "Directions, asking where things are, transport.",
    scenario:
      "On the street: the learner asks the tutor for directions to a place and how to get there.",
  },
  {
    id: 6,
    slug: "roz-ki-baat",
    title: "Roz ki Baat",
    titleScript: "روز کی بات",
    emoji: "☀️",
    blurb: "Daily small talk: weather, plans, and time.",
    scenario:
      "Casual small talk: chat about the weather today, the time, and plans for later.",
  },
  {
    id: 7,
    slug: "pasand-napasand",
    title: "Pasand-Napasand",
    titleScript: "پسند ناپسند",
    emoji: "💬",
    blurb: "Opinions and hobbies, agreeing and disagreeing.",
    scenario:
      "Sharing opinions: talk about hobbies and things you like or dislike, agreeing and disagreeing politely.",
  },
  {
    id: 8,
    slug: "kahani",
    title: "Kahani",
    titleScript: "کہانی",
    emoji: "📖",
    blurb: "Tell a short story or describe something that happened.",
    scenario:
      "Storytelling: the learner describes something that happened to them recently in a few sentences.",
  },
];

export const TOTAL_LEVELS = LEVELS.length;

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
