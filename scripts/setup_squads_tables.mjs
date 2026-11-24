import { queryDb } from "../src/lib/db-server.ts";

async function run() {
  await queryDb(`
    CREATE TABLE IF NOT EXISTS public.study_squads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      goal TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'DSA & Algorithms',
      current_members INT DEFAULT 1,
      max_members INT DEFAULT 6,
      meeting_cadence TEXT DEFAULT 'Daily 8:00 PM IST',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const countRes = await queryDb('SELECT COUNT(*) FROM public.study_squads;');
  if (parseInt(countRes.rows[0].count, 10) === 0) {
    await queryDb(`
      INSERT INTO public.study_squads (name, goal, description, category, current_members, max_members, meeting_cadence)
      VALUES 
        ('LeetCode 75 Sprinters', 'DSA & Technical Interviews', 'Solving 2 medium problems daily with evening peer code reviews.', 'DSA & Problem Solving', 4, 6, 'Daily 8:00 PM IST'),
        ('System Design & Backend Core', 'High-Level & Low-Level Design', 'Designing scalable distributed systems and practicing microservices architectural patterns.', 'System Design', 3, 5, 'Tue/Thu/Sat 9:00 PM IST'),
        ('Full-Stack Next.js Builders', 'Production Project Portfolio', 'Collaborating on production-ready modern web apps and reviewing open pull requests.', 'Web Development', 5, 6, 'Daily 7:30 PM IST'),
        ('Quantitative Aptitude Masters', 'Campus Placement Assessments', 'Daily practice sprints covering numerical ability, logical deduction, and time management.', 'Aptitude & Placement', 3, 6, 'Mon/Wed/Fri 6:00 PM IST'),
        ('FAANG Mock Interview Circle', 'Behavioral & Live Coding Interviews', 'Peer mock interviews with real FAANG rubrics, STAR method feedback, and timing audits.', 'Interview Prep', 4, 5, 'Sat/Sun 11:00 AM IST');
    `);
  }

  const finalCount = await queryDb('SELECT COUNT(*) FROM public.study_squads;');
  console.log("study_squads table initialized. Count:", finalCount.rows[0].count);
}

run();
