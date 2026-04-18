import type { SpeakingPart } from "@/types/speaking";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Part2Cue = {
  title: string;
  bullets: string[];
  explain: string[];
};

export type SpeakingTopicPack = {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  part1: string[];
  part2: Part2Cue;
  part3: string[];
  extra: string[];
};

export const SPEAKING_TOPICS: SpeakingTopicPack[] = [
  {
    id: "hobbies",
    title: "Hobbies & free time",
    description: "Everyday interests, balance, and how you unwind.",
    difficulty: "beginner",
    part1: [
      "What hobbies are most popular where you live?",
      "Do you prefer indoor or outdoor activities in your free time?",
      "Is there a hobby you would like to try in the future?",
      "How much time per week do you usually spend on hobbies?",
    ],
    part2: {
      title: "Describe a hobby you enjoy",
      bullets: ["what it is", "how you started it", "why you like it", "how it affects your life"],
      explain: ["whether you would recommend it to others"],
    },
    part3: [
      "Why do you think some people struggle to make time for hobbies?",
      "How might hobbies change as people get older?",
      "Do you think technology has helped or harmed leisure activities?",
    ],
    extra: [
      "Tell me about a skill you learned outside of school or work.",
      "Describe a club or group activity you have joined.",
    ],
  },
  {
    id: "food",
    title: "Food & eating habits",
    description: "Meals, cooking, and food culture.",
    difficulty: "beginner",
    part1: [
      "What is a typical breakfast for you?",
      "Do you prefer eating at home or in restaurants?",
      "Is there a dish from your country that visitors should try?",
      "How has your diet changed compared to five years ago?",
    ],
    part2: {
      title: "Describe a memorable meal you had",
      bullets: ["where you were", "who you were with", "what you ate", "why it was special"],
      explain: ["whether you would like to repeat that experience"],
    },
    part3: [
      "What are some advantages and disadvantages of fast food?",
      "How might globalisation influence what people eat?",
      "Should governments do more to encourage healthy eating?",
    ],
    extra: [
      "Describe a time you tried food from another culture.",
      "Talk about a recipe you would like to master.",
    ],
  },
  {
    id: "childhood",
    title: "Childhood & early memories",
    description: "Growing up, family, and formative experiences.",
    difficulty: "intermediate",
    part1: [
      "What kind of games did you enjoy as a child?",
      "Who did you spend the most time with when you were younger?",
      "Was your childhood neighbourhood a good place for children?",
      "What is one rule your parents had that you remember clearly?",
    ],
    part2: {
      title: "Describe a happy childhood memory",
      bullets: ["how old you were", "what happened", "who was involved", "why it makes you smile now"],
      explain: ["how this memory influences you today"],
    },
    part3: [
      "In what ways is childhood different today compared with the past?",
      "How important is unstructured play for children?",
      "Should schools focus more on creativity or discipline?",
    ],
    extra: [
      "Describe a toy or object that was important to you as a child.",
      "Talk about a teacher who influenced you early on.",
    ],
  },
  {
    id: "travel",
    title: "Travel & places",
    description: "Trips, tourism, and exploring new environments.",
    difficulty: "intermediate",
    part1: [
      "How often do you travel for leisure?",
      "Do you prefer planning trips in detail or being spontaneous?",
      "What type of accommodation do you usually choose?",
      "Is there a place you would never want to visit again?",
    ],
    part2: {
      title: "Describe a city or town you enjoyed visiting",
      bullets: ["where it is", "when you went", "what you did there", "what impressed you most"],
      explain: ["whether you would recommend it to a friend"],
    },
    part3: [
      "What are the environmental impacts of mass tourism?",
      "How might remote work change the way people travel?",
      "Should historical sites limit visitor numbers?",
    ],
    extra: [
      "Describe a travel problem you once faced and how you solved it.",
      "Talk about public transport in a place you know well.",
    ],
  },
  {
    id: "work-study",
    title: "Work & study",
    description: "Career, learning habits, and motivation.",
    difficulty: "intermediate",
    part1: [
      "What are you studying or working on at the moment?",
      "Do you prefer working alone or in a team?",
      "How do you usually organise your time when you are busy?",
      "What skill would you most like to improve professionally?",
    ],
    part2: {
      title: "Describe a project or assignment you worked hard on",
      bullets: ["what it was", "what you had to do", "what was difficult", "how it turned out"],
      explain: ["what you learned from the experience"],
    },
    part3: [
      "Should companies prioritise employee wellbeing over profit?",
      "How might artificial intelligence change education?",
      "Is lifelong learning realistic for everyone?",
    ],
    extra: [
      "Describe a deadline you had to meet and how you managed it.",
      "Talk about a job you would not want to do.",
    ],
  },
  {
    id: "technology",
    title: "Technology & media",
    description: "Devices, online life, and information habits.",
    difficulty: "intermediate",
    part1: [
      "Which apps do you use most often every day?",
      "Do you think you spend too much time on screens?",
      "How do you usually get your news?",
      "What piece of technology could you not live without?",
    ],
    part2: {
      title: "Describe something useful you learned online",
      bullets: ["what you learned", "where you found the information", "how you applied it", "how long it took"],
      explain: ["whether you would use the same approach again"],
    },
    part3: [
      "Should social media companies be responsible for harmful content?",
      "How can societies reduce the digital divide?",
      "Will printed books disappear completely?",
    ],
    extra: [
      "Describe a time technology saved you time or effort.",
      "Talk about online privacy and what worries you.",
    ],
  },
  {
    id: "views-environment",
    title: "Views & environment",
    description: "Opinions, nature, and sustainability.",
    difficulty: "advanced",
    part1: [
      "How important is recycling in your daily routine?",
      "What natural scenery do you find most beautiful?",
      "Do you think individuals can make a real difference on climate issues?",
      "Would you pay more for eco-friendly products?",
    ],
    part2: {
      title: "Describe a natural place you appreciate",
      bullets: ["where it is", "how you discovered it", "what you do there", "why it matters to you"],
      explain: ["whether you are worried about its future"],
    },
    part3: [
      "Should governments ban single-use plastics entirely?",
      "How might cities become greener without slowing economic growth?",
      "Is economic development always harmful to the environment?",
    ],
    extra: [
      "Describe a news story about the environment that stayed with you.",
      "Talk about a habit you changed for environmental reasons.",
    ],
  },
  {
    id: "society",
    title: "Society & community",
    description: "Neighbourhoods, values, and living together.",
    difficulty: "advanced",
    part1: [
      "Do you know your neighbours well?",
      "What makes a community feel strong and supportive?",
      "Have you ever volunteered or helped at a local event?",
      "What public service in your area works well?",
    ],
    part2: {
      title: "Describe a person in your community you admire",
      bullets: ["who they are", "what they do", "how you know them", "why you respect them"],
      explain: ["what others could learn from them"],
    },
    part3: [
      "Why do some people feel lonely despite living in large cities?",
      "Should governments fund more public spaces?",
      "How can societies balance tradition and rapid change?",
    ],
    extra: [
      "Describe a local problem you think deserves more attention.",
      "Talk about a festival or tradition in your region.",
    ],
  },
];

export const PART_LABELS: Record<SpeakingPart, string> = {
  part1: "Part 1",
  part2: "Part 2",
  part3: "Part 3",
  extra: "Extra",
};

export function questionCountForPart(topic: SpeakingTopicPack, part: SpeakingPart): number {
  if (part === "part1") return topic.part1.length;
  if (part === "part2") return 1;
  if (part === "part3") return topic.part3.length;
  return topic.extra.length;
}

export function buildPart2Prompt(topic: SpeakingTopicPack): string {
  const c = topic.part2;
  const lines = [
    `Cue card: ${c.title}`,
    "You should say:",
    ...c.bullets.map((b) => `– ${b}`),
    "And explain:",
    ...c.explain.map((b) => `– ${b}`),
    "You have up to 2 minutes to speak after preparation.",
  ];
  return lines.join("\n");
}

export function stableQuestionId(topicId: string, part: SpeakingPart, index: number): string {
  return `${topicId}:${part}:${index}`;
}
