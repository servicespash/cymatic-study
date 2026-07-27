export type NewsItem = {
  id: string;
  title: string;
  body: string;
  media_url: string | null;
  media_type: string | null;
  category: string | null;
  published_at: string;
  is_ad?: boolean;
  priority?: string;
  is_active?: boolean;
};

export const MOCK_CONTENT_DATA: NewsItem[] = [
  {
    id: "mock-podcast-1",
    title: "The Magic of Matrices in Real Life",
    body: JSON.stringify({
      description: "Discover how S5/S6 matrix algebra powers modern computer graphics, video game mechanics, and complex transformations.",
      subject: "Mathematics",
      speaker: "Sir Latif Isabirye",
      duration: "12:45",
    }),
    media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    media_type: "podcast",
    category: "podcast",
    published_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    is_active: true,
  },
  {
    id: "mock-podcast-2",
    title: "Quantum Mechanics & Semiconductor Electronics",
    body: JSON.stringify({
      description: "Dive into wave-particle duality, Planck's constant, and how modern diodes and transistors are designed to power our devices.",
      subject: "Physics",
      speaker: "Dr. Florence Nakayiza",
      duration: "15:20",
    }),
    media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    media_type: "podcast",
    category: "podcast",
    published_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    is_active: true,
  },
  {
    id: "mock-podcast-3",
    title: "The Energy Landscapes of Thermodynamics",
    body: JSON.stringify({
      description: "A deep-dive into physical chemistry principles, explaining how Enthalpy, Entropy, and Gibbs Free Energy govern natural reactions.",
      subject: "Chemistry",
      speaker: "Prof. Herbert Mukasa",
      duration: "10:15",
    }),
    media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    media_type: "podcast",
    category: "podcast",
    published_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    is_active: true,
  },
  {
    id: "mock-podcast-4",
    title: "DNA Replication & The Molecular Clock",
    body: JSON.stringify({
      description: "Syllabus review of the molecular processes of transcription and translation, and how cell division maintains biological lifespans.",
      subject: "Biology",
      speaker: "Teacher Brenda Namubiru",
      duration: "14:10",
    }),
    media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    media_type: "podcast",
    category: "podcast",
    published_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    is_active: true,
  },
  {
    id: "mock-live-1",
    title: "Cymatic Masterclass: Oscillating Systems & Resonance",
    body: JSON.stringify({
      description: "An intensive visual lecture on mechanical resonance, sound wave amplification, and the mathematical equations of simple harmonic motion.",
      subject: "Physics",
      instructor: "Sir Latif Isabirye",
      scheduled_at: new Date(Date.now() + 3600000 * 24).toISOString(),
      duration: "1h 30m",
    }),
    media_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    media_type: "live_session",
    category: "live",
    published_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: "mock-live-2",
    title: "S5/S6 Organic Chemistry Synthesis Pathway Review",
    body: JSON.stringify({
      description: "Step-by-step breakdown of aliphatic and aromatic reaction mechanisms, functional groups, and esterification practical questions.",
      subject: "Chemistry",
      instructor: "Prof. Herbert Mukasa",
      scheduled_at: new Date(Date.now() + 3600000 * 48).toISOString(),
      duration: "1h",
    }),
    media_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    media_type: "live_session",
    category: "live",
    published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_active: true,
  },
  {
    id: "mock-news-1",
    title: "NCDC Rollout of New S5 & S6 Syllabi for Scientific Subjects",
    body: "The National Curriculum Development Centre (NCDC) has officially released the updated Advanced Level (UACE) syllabus guidelines for Mathematics, Physics, Chemistry, and Biology. Focus is now on research-driven investigations, continuous project assessments, and practical application modules.",
    media_type: "curriculum_update",
    category: "news",
    published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_active: true,
  },
  {
    id: "mock-news-2",
    title: "UNEB S4 (UCE) Chemistry and Biology Mock Exams Schedule",
    body: "The Uganda National Examinations Board (UNEB) has announced the nationwide dates for lower secondary mock practicals. Students are encouraged to practice their laboratory drawings, titration analysis, and biology specimen classifications.",
    media_type: "curriculum_update",
    category: "news",
    published_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    is_active: true,
  },
  {
    id: "mock-shoutout-1",
    title: "Student Spotlight: Joy Mary Alupo Tops National STEM Challenge",
    body: "Joy Mary Alupo, a Senior 5 student from Tororo, has won the National Youth STEM Cup using Cymatic Study's interactive physics calculators to design a miniature eco-friendly irrigation sensor. We are incredibly proud of Joy! Keep shining!",
    media_type: "student_shoutout",
    category: "shoutout",
    published_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    is_active: true,
  },
  {
    id: "mock-shoutout-2",
    title: "Student Spotlight: Ronald Okello Designs Matrix Calculator",
    body: "Ronald Okello, an S6 student from Gulu, built an offline matrix solver tool using Cymatic Study's documentation. His tool helps classmates verify linear transformation determinants. Truly excellent innovation, Ronald!",
    media_type: "student_shoutout",
    category: "shoutout",
    published_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    is_active: true,
  },
];
