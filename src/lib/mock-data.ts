import type { TrainingArticle, TrainingGroup } from '@/types/training';

export const mockArticles: TrainingArticle[] = [
  {
    article_id: 'art_001',
    title: 'The Rise of Artificial Intelligence in Everyday Life',
    content: `Artificial intelligence has moved beyond the realm of science fiction and is now a fundamental part of modern life. From the moment we unlock our smartphones with facial recognition to the personalized recommendations we receive on streaming platforms, AI quietly shapes our daily decisions. This shift has happened remarkably fast — technologies that seemed futuristic just a decade ago are now embedded in consumer products used by billions of people worldwide.

The business world has been quick to embrace AI-driven automation. Customer service chatbots handle millions of inquiries each day, reducing waiting times and operational costs for companies. In healthcare, machine-learning algorithms analyze medical images with accuracy that rivals — and sometimes exceeds — that of experienced radiologists. Meanwhile, self-driving vehicle technology, though not yet mainstream, is being tested on public roads in dozens of cities globally.

Despite these advances, concerns about the societal impact of AI remain significant. Critics warn that automation threatens millions of jobs, particularly in manufacturing, transportation, and data entry. Others raise questions about algorithmic bias, noting that AI systems trained on historical data may perpetuate existing inequalities. Privacy advocates point out that the vast amounts of data required to train these systems create unprecedented surveillance risks.

Supporters of AI development argue that previous technological revolutions — from the industrial age to the internet era — also displaced workers while ultimately creating new categories of employment. They emphasize that thoughtful regulation, retraining programs, and inclusive design practices can help society adapt without leaving vulnerable populations behind. The debate, like the technology itself, continues to evolve rapidly.`,
    word_count: 248,
    difficulty: 'L2',
    genre: 'technology',
    questions: [
      {
        question_id: 'q_001_1',
        question_text: 'What is the main purpose of the first paragraph?',
        options: {
          A: 'To argue that AI is dangerous to society',
          B: 'To illustrate how quickly AI has become part of daily life',
          C: 'To explain the technical details of facial recognition',
          D: 'To predict future developments in streaming technology',
        },
        correct_answer: 'B',
        question_type: 'main_idea',
        explanation: 'The first paragraph describes everyday AI examples and emphasizes how rapidly the technology has integrated into daily life.',
      },
      {
        question_id: 'q_001_2',
        question_text: 'According to the passage, which concern do privacy advocates specifically raise?',
        options: {
          A: 'AI chatbots give inaccurate medical advice',
          B: 'Self-driving cars are not safe enough for public roads',
          C: 'The data needed for AI creates unprecedented surveillance risks',
          D: 'AI systems are too expensive for ordinary consumers',
        },
        correct_answer: 'C',
        question_type: 'detail',
        explanation: 'The third paragraph explicitly states that privacy advocates warn about surveillance risks from the vast data required to train AI systems.',
      },
      {
        question_id: 'q_001_3',
        question_text: 'How do AI supporters respond to concerns about job displacement?',
        options: {
          A: 'They deny that any jobs will be lost to automation',
          B: 'They claim AI is too inaccurate to replace human workers',
          C: 'They argue past technological changes also created new employment categories',
          D: 'They propose that governments should ban AI in manufacturing',
        },
        correct_answer: 'C',
        question_type: 'inference',
        explanation: 'The final paragraph explains that AI supporters draw parallels with past technological revolutions that displaced and then created new types of work.',
      },
      {
        question_id: 'q_001_4',
        question_text: 'The word "perpetuate" in paragraph 3 most likely means:',
        options: {
          A: 'eliminate permanently',
          B: 'cause to continue indefinitely',
          C: 'reduce gradually',
          D: 'discover unexpectedly',
        },
        correct_answer: 'B',
        question_type: 'vocabulary',
        explanation: '"Perpetuate" means to make something continue, which fits the context of AI systems keeping existing inequalities going.',
      },
    ],
  },
  {
    article_id: 'art_002',
    title: 'Ocean Plastic Pollution: A Growing Environmental Crisis',
    content: `Every year, an estimated eight million metric tons of plastic waste enters the world's oceans. This staggering volume — equivalent to dumping one garbage truck of plastic into the sea every minute — has transformed marine environments into repositories of human-made debris. Plastic does not biodegrade; instead, it breaks into progressively smaller fragments called microplastics, which persist in ocean ecosystems for hundreds of years.

The consequences for marine wildlife are severe. Sea turtles mistake plastic bags for jellyfish and consume them, blocking their digestive systems. Seabirds feed plastic fragments to their chicks, leading to malnutrition and death. Even deep-sea creatures, long thought to be isolated from human activity, have been found with microplastics in their bodies. Scientists have identified a phenomenon called the "Great Pacific Garbage Patch," a swirling concentration of debris spanning an area roughly twice the size of Texas.

Plastic pollution also poses indirect threats to human health. Microplastics have been detected in drinking water, table salt, and even human blood. While researchers are still studying the long-term health effects, early evidence suggests these particles can carry toxic chemicals into the human body. Fishing communities face an additional economic burden, as plastic-contaminated waters reduce fish populations and damage equipment.

International efforts to address the crisis have gained momentum in recent years. More than sixty countries have enacted bans or restrictions on single-use plastic items such as bags and straws. The United Nations has negotiated a global plastics treaty, and major corporations have announced targets to reduce plastic packaging. Environmental groups argue that these measures, while meaningful, must be accompanied by investment in waste-management infrastructure in developing nations where the majority of ocean plastic originates.`,
    word_count: 252,
    difficulty: 'L2',
    genre: 'environment',
    questions: [
      {
        question_id: 'q_002_1',
        question_text: 'Which best describes the main argument of the passage?',
        options: {
          A: 'Plastic recycling programs have successfully reduced ocean pollution',
          B: 'Ocean plastic pollution is a serious crisis requiring comprehensive action',
          C: 'Developing nations are solely responsible for plastic waste in oceans',
          D: 'Microplastics are harmless to both marine life and humans',
        },
        correct_answer: 'B',
        question_type: 'main_idea',
        explanation: 'The passage covers the scale of plastic pollution, its effects on wildlife and human health, and current international responses, arguing for comprehensive action.',
      },
      {
        question_id: 'q_002_2',
        question_text: 'What is the "Great Pacific Garbage Patch" as described in the passage?',
        options: {
          A: 'A recycling facility in the Pacific Ocean',
          B: 'A concentrated area of ocean debris about twice the size of Texas',
          C: 'A region where fish populations have fully recovered',
          D: 'A patch of ocean unaffected by plastic pollution',
        },
        correct_answer: 'B',
        question_type: 'detail',
        explanation: 'The passage defines the Great Pacific Garbage Patch as a swirling concentration of debris spanning an area roughly twice the size of Texas.',
      },
      {
        question_id: 'q_002_3',
        question_text: 'According to environmental groups, what must accompany existing plastic bans?',
        options: {
          A: 'Stricter penalties for individual littering',
          B: 'Investment in waste-management infrastructure in developing nations',
          C: 'A complete global ban on all plastic production',
          D: 'More scientific research before taking action',
        },
        correct_answer: 'B',
        question_type: 'detail',
        explanation: 'The final paragraph states environmental groups argue that plastic bans must be accompanied by investment in waste-management infrastructure in developing nations.',
      },
    ],
  },
  {
    article_id: 'art_003',
    title: 'Rethinking Education: Should Schools Teach Emotional Intelligence?',
    content: `For most of history, schools have focused almost exclusively on academic knowledge — reading, mathematics, science, and history. Success was measured by test scores, and students who excelled intellectually were considered well-prepared for adult life. But psychologists and educators increasingly argue that this model is incomplete. Research suggests that emotional intelligence, defined as the ability to recognize, understand, and manage emotions in oneself and others, may be as important as cognitive ability in determining life outcomes.

Emotional intelligence encompasses a range of skills: identifying one's own emotional state, empathizing with others, resolving conflicts constructively, and maintaining motivation in the face of setbacks. Studies have found that individuals with higher emotional intelligence tend to have stronger relationships, better mental health, and greater career success. Notably, employers consistently report that skills such as communication, teamwork, and emotional resilience are among the most sought-after qualities in job candidates — qualities that go largely untaught in traditional classrooms.

Several countries and school districts have begun incorporating Social and Emotional Learning (SEL) programs into their curricula. These programs teach students to name emotions, practice mindful breathing, and engage in structured group discussions about conflict and empathy. Early results are promising: schools that implement SEL report lower rates of bullying, reduced anxiety among students, and modest improvements in academic performance.

Critics, however, question whether emotional development is properly the school's responsibility. Some parents argue that values and emotional skills should be taught at home, and that adding SEL to an already crowded curriculum takes time away from core academic subjects. Others raise concerns about cultural sensitivity, noting that emotional expression norms vary widely across cultures. Proponents counter that for many children, school is the most consistent and safe environment in which such skills can be learned.`,
    word_count: 257,
    difficulty: 'L2',
    genre: 'education',
    questions: [
      {
        question_id: 'q_003_1',
        question_text: 'What shift in educational thinking does the passage describe?',
        options: {
          A: 'A move from emotional learning back to academic focus',
          B: 'Growing recognition that emotional intelligence should be taught alongside academics',
          C: 'Proof that test scores fully predict career success',
          D: 'Evidence that home schooling produces more emotionally intelligent students',
        },
        correct_answer: 'B',
        question_type: 'main_idea',
        explanation: 'The passage argues that emotional intelligence is increasingly recognized as important, and describes efforts to include it in school curricula.',
      },
      {
        question_id: 'q_003_2',
        question_text: 'What do employers most value according to the passage?',
        options: {
          A: 'High scores on standardized academic tests',
          B: 'Deep knowledge of mathematics and science',
          C: 'Communication, teamwork, and emotional resilience',
          D: 'Ability to memorize large amounts of information',
        },
        correct_answer: 'C',
        question_type: 'detail',
        explanation: 'The second paragraph explicitly states that employers consistently seek communication, teamwork, and emotional resilience in candidates.',
      },
      {
        question_id: 'q_003_3',
        question_text: 'Which of the following is NOT mentioned as a criticism of SEL programs?',
        options: {
          A: 'They take time away from core academic subjects',
          B: 'Emotional skills should be taught at home',
          C: 'They are too expensive to implement in public schools',
          D: 'Emotional expression norms vary across cultures',
        },
        correct_answer: 'C',
        question_type: 'detail',
        explanation: 'Cost is never mentioned as a criticism in the passage. The stated criticisms are parental responsibility, time constraints, and cultural sensitivity.',
      },
      {
        question_id: 'q_003_4',
        question_text: 'The phrase "go largely untaught" in paragraph 2 suggests that emotional skills are:',
        options: {
          A: 'widely covered in most school systems',
          B: 'considered unimportant by all educators',
          C: 'rarely included in traditional school curricula',
          D: 'impossible to teach in a classroom setting',
        },
        correct_answer: 'C',
        question_type: 'vocabulary',
        explanation: '"Go largely untaught" means these skills are mostly not taught, i.e., rarely included in traditional school curricula.',
      },
    ],
  },
  {
    article_id: 'art_004',
    title: 'Street Food Culture: A Window into Urban Identity',
    content: `Walk through any major city in the world and you will encounter one of humanity's oldest culinary traditions: street food. From the steaming bowls of pho sold at dawn in Hanoi's alleyways to the sizzling shawarma stands of Istanbul's Grand Bazaar and the taco carts that line Los Angeles boulevards at midnight, street food is simultaneously a meal, an economic lifeline, and a cultural statement. Anthropologists argue that what a city eats on its streets tells us more about that city than any museum exhibit.

The economic significance of street food should not be underestimated. In many developing nations, street vending provides income for millions of vendors who lack the capital to open traditional restaurants. The informal food economy supports entire supply chains — farmers, wholesalers, packaging manufacturers — that depend on the demand generated by sidewalk kitchens. For low-income urban residents, street food also represents affordable nutrition in cities where restaurant prices can be prohibitively high.

Street food has increasingly attracted attention from the culinary establishment that once dismissed it as inferior. Michelin, the prestigious French restaurant guide, introduced a Bib Gourmand category specifically to recognize affordable street food stalls, and several hawker stalls in Singapore and Hong Kong have received this recognition. Food tourism has emerged as a booming industry, with travelers specifically seeking out authentic local street food experiences rather than dining in hotel restaurants.

At the same time, rapid urbanization and rising real-estate prices are threatening traditional street food cultures. Municipal authorities in many cities have cleared vendors from historic locations in the name of modernization, displacing communities that have operated in the same spots for generations. Advocates argue that preserving street food culture requires deliberate policy choices, including designated vending zones, legal protections for vendors, and inclusion of street food traditions in cultural heritage programs.`,
    word_count: 264,
    difficulty: 'L2',
    genre: 'culture',
    questions: [
      {
        question_id: 'q_004_1',
        question_text: 'According to the passage, what can street food reveal about a city?',
        options: {
          A: 'The city\'s level of economic development only',
          B: 'More about urban identity than museum exhibits can',
          C: 'The exact income levels of its residents',
          D: 'Which restaurants are the most expensive',
        },
        correct_answer: 'B',
        question_type: 'detail',
        explanation: 'The first paragraph includes the claim by anthropologists that street food tells us more about a city than any museum exhibit.',
      },
      {
        question_id: 'q_004_2',
        question_text: 'What does the Michelin Bib Gourmand category represent?',
        options: {
          A: 'A penalty for restaurants that serve poor quality food',
          B: 'Recognition specifically for affordable street food stalls',
          C: 'A new type of restaurant guide only available in Asia',
          D: 'An award exclusively for French cuisine',
        },
        correct_answer: 'B',
        question_type: 'detail',
        explanation: 'The third paragraph states that Michelin introduced the Bib Gourmand category specifically to recognize affordable street food stalls.',
      },
      {
        question_id: 'q_004_3',
        question_text: 'What threat do rising real-estate prices pose to street food culture?',
        options: {
          A: 'They make ingredients more expensive for vendors',
          B: 'They cause municipal authorities to clear vendors from historic locations',
          C: 'They attract too many tourists to street food areas',
          D: 'They force vendors to raise prices beyond what locals can afford',
        },
        correct_answer: 'B',
        question_type: 'inference',
        explanation: 'The final paragraph links urbanization and rising real estate to municipal authorities clearing vendors from historic locations in the name of modernization.',
      },
    ],
  },
];

export function createMockTrainingGroup(difficulty = 'L2'): TrainingGroup {
  const now = Date.now();
  return {
    group_id: `tg_mock_${now}`,
    user_id: 'user_local',
    difficulty,
    start_time: now,
    end_time: 0,
    total_duration: 0,
    articles: mockArticles,
    sessions: [],
    status: 'in_progress',
  };
}

