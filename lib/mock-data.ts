export const mockAssessments = [
  {
    id: 'bio-midterm',
    title: 'Biology Midterm',
    subject: 'Biology 101',
    room: 'C-204',
    type: 'Midterm',
    date: '2026-10-16',
    time: '09:00',
  },
  {
    id: 'history-essay',
    title: 'History Essay',
    subject: 'Modern History',
    room: 'H-112',
    type: 'Final',
    date: '2026-10-21',
    time: '13:30',
  },
  {
    id: 'chem-practical',
    title: 'Chemistry Practical',
    subject: 'Chemistry Lab',
    room: 'Lab 3',
    type: 'Practical',
    date: '2026-10-26',
    time: '11:00',
  },
];

export const mockTasks: Record<string, { text: string; done: boolean }[]> = {
  'bio-midterm': [
    { text: 'Review chapter 3 summary notes', done: false },
    { text: 'Complete 10 flashcards', done: true },
    { text: 'Practice a timed mock quiz', done: false },
  ],
  'history-essay': [
    { text: 'Outline thesis structure', done: false },
    { text: 'Draft evidence paragraphs', done: false },
  ],
  'chem-practical': [
    { text: 'Review lab safety notes', done: true },
    { text: 'Rehearse reaction steps', done: false },
  ],
};
