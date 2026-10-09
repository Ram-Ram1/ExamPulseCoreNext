'use client';

import { useEffect, useMemo, useState } from 'react';

type Assessment = {
  id: string;
  title: string;
  subject: string;
  room: string;
  type: string;
  date: string;
  time: string;
};

type Task = { text: string; done: boolean };

type ReminderSettings = {
  sevenDays: boolean;
  twoDays: boolean;
  morning: boolean;
};

const defaultReminderSettings: ReminderSettings = {
  sevenDays: true,
  twoDays: true,
  morning: true,
};

const emptyForm = {
  title: '',
  subject: '',
  room: '',
  type: 'Midterm',
  date: '',
  time: '',
};

export default function HomePage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [tasksByAssessment, setTasksByAssessment] = useState<Record<string, Task[]>>({});
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'soon' | 'upcoming'>('all');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(defaultReminderSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(emptyForm);

  useEffect(() => {
    const loadDemoData = async () => {
      const assessmentsRes = await fetch('/api/assessments');
      const tasksRes = await fetch('/api/tasks');
      const assessmentsData = await assessmentsRes.json();
      const tasksData = await tasksRes.json();

      setAssessments(assessmentsData.assessments);
      setTasksByAssessment(tasksData.tasks);
      setSelectedAssessmentId(assessmentsData.assessments[0]?.id ?? null);
    };

    loadDemoData();
  }, []);

  const selectedAssessment = useMemo(
    () => assessments.find((assessment) => assessment.id === selectedAssessmentId) ?? null,
    [assessments, selectedAssessmentId],
  );

  const renderedAssessments = useMemo(() => {
    return assessments
      .filter((assessment) => {
        const countdown = getCountdown(assessment.date, assessment.time);
        const matchesSearch = `${assessment.subject} ${assessment.title}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesFilter =
          filter === 'all' || countdown.label.toLowerCase() === filter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [assessments, filter, search]);

  const selectedTasks = selectedAssessment ? tasksByAssessment[selectedAssessment.id] ?? [] : [];

  const reminderList = useMemo(() => {
    return assessments.flatMap((assessment) => buildReminderSummary(assessment, reminderSettings));
  }, [assessments, reminderSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.room || !formData.date || !formData.time) {
      return;
    }

    const newAssessment: Assessment = {
      id: `assessment-${Date.now()}`,
      ...formData,
    };

    setAssessments((current) => [...current, newAssessment]);
    setTasksByAssessment((current) => ({ ...current, [newAssessment.id]: [] }));
    setSelectedAssessmentId(newAssessment.id);
    setFormData(emptyForm);
  };

  const handleTaskAdd = () => {
    if (!selectedAssessment) return;
    const value = (document.getElementById('task-input') as HTMLInputElement)?.value?.trim();
    if (!value) return;

    setTasksByAssessment((current) => ({
      ...current,
      [selectedAssessment.id]: [...(current[selectedAssessment.id] ?? []), { text: value, done: false }],
    }));

    (document.getElementById('task-input') as HTMLInputElement).value = '';
  };

  const toggleTask = (index: number) => {
    if (!selectedAssessment) return;

    setTasksByAssessment((current) => ({
      ...current,
      [selectedAssessment.id]: (current[selectedAssessment.id] ?? []).map((task, idx) =>
        idx === index ? { ...task, done: !task.done } : task,
      ),
    }));
  };

  const deleteTask = (index: number) => {
    if (!selectedAssessment) return;

    setTasksByAssessment((current) => ({
      ...current,
      [selectedAssessment.id]: (current[selectedAssessment.id] ?? []).filter((_, idx) => idx !== index),
    }));
  };

  const duplicateAssessment = (assessmentId: string) => {
    const source = assessments.find((assessment) => assessment.id === assessmentId);
    if (!source) return;

    const duplicate: Assessment = {
      ...source,
      id: `assessment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: `Copy of ${source.title}`,
    };

    setAssessments((current) => [...current, duplicate]);
    setTasksByAssessment((current) => ({
      ...current,
      [duplicate.id]: [...(current[source.id] ?? [])],
    }));
    setSelectedAssessmentId(duplicate.id);
  };

  const removeAssessment = (assessmentId: string) => {
    const remaining = assessments.filter((assessment) => assessment.id !== assessmentId);
    setAssessments(remaining);
    setTasksByAssessment((current) => {
      const next = { ...current };
      delete next[assessmentId];
      return next;
    });
    if (selectedAssessmentId === assessmentId) {
      setSelectedAssessmentId(remaining[0]?.id ?? null);
    }
  };

  const handleOpenEditor = () => {
    if (!selectedAssessment) return;
    setEditValues({
      title: selectedAssessment.title,
      subject: selectedAssessment.subject,
      room: selectedAssessment.room,
      type: selectedAssessment.type,
      date: selectedAssessment.date,
      time: selectedAssessment.time,
    });
    setIsEditing(true);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment) return;

    setAssessments((current) =>
      current.map((assessment) =>
        assessment.id === selectedAssessment.id
          ? { ...assessment, ...editValues }
          : assessment,
      ),
    );
    setIsEditing(false);
  };

  const saveReminderSetting = (key: keyof ReminderSettings, checked: boolean) => {
    setReminderSettings((current) => ({ ...current, [key]: checked }));
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-500">ExamPulseCore</p>
          <h1 className="text-4xl font-extrabold text-slate-900">Stay ahead of every test date</h1>
        </div>
        <div className="rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700">
          Next.js MVP
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Add Assessment</h2>
              <p className="text-sm text-slate-500">Capture key exam details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-semibold text-slate-500">
                <span className="mb-2 block">Assessment title</span>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none ring-0 transition focus:border-primary-500"
                  placeholder="Biology Midterm"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-500">
                <span className="mb-2 block">Subject / course</span>
                <input
                  value={formData.subject}
                  onChange={(e) => setFormData((current) => ({ ...current, subject: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none transition focus:border-primary-500"
                  placeholder="Biology 101"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-500">
                <span className="mb-2 block">Room number</span>
                <input
                  value={formData.room}
                  onChange={(e) => setFormData((current) => ({ ...current, room: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none transition focus:border-primary-500"
                  placeholder="C-204"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-500">
                <span className="mb-2 block">Test type</span>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData((current) => ({ ...current, type: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none transition focus:border-primary-500"
                >
                  <option>Midterm</option>
                  <option>Final</option>
                  <option>Quiz</option>
                  <option>Practical</option>
                  <option>Presentation</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-500">
                <span className="mb-2 block">Date</span>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((current) => ({ ...current, date: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none transition focus:border-primary-500"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-500">
                <span className="mb-2 block">Time</span>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData((current) => ({ ...current, time: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none transition focus:border-primary-500"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 px-5 py-3 font-bold text-white shadow-lg shadow-primary-500/20 transition hover:translate-y-[-1px]"
            >
              Save assessment
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Countdown dashboard</h2>
              <p className="text-sm text-slate-500">Urgency at a glance</p>
            </div>
          </div>

          <div className="mb-4 space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject or title"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none transition focus:border-primary-500"
            />

            <div className="flex flex-wrap gap-2">
              {(['all', 'critical', 'soon', 'upcoming'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    filter === option
                      ? 'border-primary-200 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {renderedAssessments.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No assessments match the current search or filter.
              </div>
            )}

            {renderedAssessments.map((assessment) => {
              const countdown = getCountdown(assessment.date, assessment.time);
              const isSelected = assessment.id === selectedAssessmentId;

              return (
                <article
                  key={assessment.id}
                  onClick={() => setSelectedAssessmentId(assessment.id)}
                  className={`cursor-pointer rounded-2xl border bg-gradient-to-b from-white to-slate-50 p-4 transition ${
                    isSelected ? 'border-primary-400 ring-4 ring-primary-100' : 'border-slate-200 hover:border-primary-300'
                  }`}
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{assessment.subject}</p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">{assessment.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                          countdown.color === 'urgency-critical'
                            ? 'bg-red-100 text-red-600'
                            : countdown.color === 'urgency-soon'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {countdown.label}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          duplicateAssessment(assessment.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700"
                        aria-label="Duplicate assessment"
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeAssessment(assessment.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600"
                        aria-label="Delete assessment"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm text-slate-500">
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.12em]">Type</div>
                      <div className="font-semibold text-slate-800">{assessment.type}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.12em]">Room</div>
                      <div className="font-semibold text-slate-800">{assessment.room}</div>
                    </div>
                  </div>

                  <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">Assessment date</div>
                    <div className="font-semibold text-slate-800">{formatDate(assessment.date)} at {assessment.time}</div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Countdown</span>
                    <strong className="text-slate-900">{countdownText(countdown)}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Reminder engine</h2>
            <p className="text-sm text-slate-500">Scheduled alerts</p>
          </div>

          <div className="mb-5 space-y-2">
            {Object.entries(reminderSettings).map(([key, enabled]) => (
              <label key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => saveReminderSetting(key as keyof ReminderSettings, event.target.checked)}
                  className="h-4 w-4 accent-primary-600"
                />
                <span>
                  {key === 'sevenDays' && '7-day reminder'}
                  {key === 'twoDays' && '2-day reminder'}
                  {key === 'morning' && 'Morning reminder'}
                </span>
              </label>
            ))}
          </div>

          <div className="space-y-3">
            {reminderList.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No active reminder alerts are enabled.
              </div>
            )}

            {reminderList.map((reminder) => (
              <div key={`${reminder.assessmentId}-${reminder.label}`} className="rounded-2xl border border-slate-200 bg-primary-50/50 p-3">
                <div className="font-semibold text-slate-900">{reminder.assessment}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {reminder.label}: {reminder.scheduledFor.toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">{selectedAssessment ? `${selectedAssessment.title} tasks` : 'Study task breakdown'}</h2>
            {selectedAssessment && (
              <button
                type="button"
                onClick={handleOpenEditor}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-primary-700"
              >
                Edit details
              </button>
            )}
          </div>

          {isEditing && selectedAssessment && (
            <form onSubmit={saveEdit} className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold text-slate-500">
                  <span className="mb-2 block">Title</span>
                  <input
                    value={editValues.title}
                    onChange={(e) => setEditValues((current) => ({ ...current, title: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-500">
                  <span className="mb-2 block">Subject</span>
                  <input
                    value={editValues.subject}
                    onChange={(e) => setEditValues((current) => ({ ...current, subject: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-500">
                  <span className="mb-2 block">Room</span>
                  <input
                    value={editValues.room}
                    onChange={(e) => setEditValues((current) => ({ ...current, room: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-500">
                  <span className="mb-2 block">Type</span>
                  <select
                    value={editValues.type}
                    onChange={(e) => setEditValues((current) => ({ ...current, type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800"
                  >
                    <option>Midterm</option>
                    <option>Final</option>
                    <option>Quiz</option>
                    <option>Practical</option>
                    <option>Presentation</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-500">
                  <span className="mb-2 block">Date</span>
                  <input
                    type="date"
                    value={editValues.date}
                    onChange={(e) => setEditValues((current) => ({ ...current, date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-500">
                  <span className="mb-2 block">Time</span>
                  <input
                    type="time"
                    value={editValues.time}
                    onChange={(e) => setEditValues((current) => ({ ...current, time: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800"
                  />
                </label>
              </div>

              <div className="mt-4 flex gap-3">
                <button type="submit" className="rounded-xl bg-primary-600 px-4 py-2.5 font-semibold text-white">
                  Save changes
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="mb-4 flex gap-2">
            <input
              id="task-input"
              type="text"
              placeholder="Add task for selected assessment..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none transition focus:border-primary-500"
            />
            <button type="button" onClick={handleTaskAdd} className="rounded-xl bg-primary-50 px-4 py-2.5 font-semibold text-primary-700">
              Add
            </button>
          </div>

          <div className="space-y-3">
            {!selectedAssessment && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Select an assessment to add study tasks.
              </div>
            )}

            {selectedAssessment && selectedTasks.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No study tasks yet for this assessment.
              </div>
            )}

            {selectedAssessment && selectedTasks.map((task, index) => (
              <div
                key={`${selectedAssessment.id}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <label className="flex flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(index)}
                    className="h-4 w-4 accent-primary-600"
                  />
                  <span className={task.done ? 'text-slate-400 line-through' : 'text-slate-800'}>{task.text}</span>
                </label>
                <button
                  type="button"
                  onClick={() => deleteTask(index)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600"
                  aria-label="Delete task"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function getCountdown(date: string, time: string) {
  const eventDate = new Date(`${date}T${time || '09:00'}:00`);
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { label: 'Critical', color: 'urgency-critical' };
  }

  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (totalHours <= 48) {
    return { label: 'Critical', color: 'urgency-critical' };
  }

  if (totalHours <= 7 * 24) {
    return { label: 'Soon', color: 'urgency-soon' };
  }

  return { label: 'Upcoming', color: 'urgency-upcoming' };
}

function countdownText(info: ReturnType<typeof getCountdown>) {
  const date = new Date();
  // This is only a rough UI helper; full countdown logic can live in a util or server calculation.
  if (info.label === 'Critical') return 'High priority';
  if (info.label === 'Soon') return 'This week';
  return 'On track';
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateString}T00:00:00`));
}

function buildReminderSummary(assessment: Assessment, settings: ReminderSettings) {
  const baseDate = new Date(`${assessment.date}T${assessment.time || '09:00'}:00`);
  const configs = [
    { key: 'sevenDays', label: '7 days before', offset: 7 },
    { key: 'twoDays', label: '2 days before', offset: 2 },
    { key: 'morning', label: 'Morning of exam', offset: 0 },
  ];

  return configs
    .filter((config) => settings[config.key as keyof ReminderSettings])
    .map((config) => {
      const reminderDate = new Date(baseDate);
      if (config.offset === 0) {
        reminderDate.setHours(8, 0, 0, 0);
      } else {
        reminderDate.setDate(reminderDate.getDate() - config.offset);
        reminderDate.setHours(9, 0, 0, 0);
      }

      return {
        assessment: assessment.title,
        assessmentId: assessment.id,
        label: config.label,
        scheduledFor: reminderDate,
      };
    });
}
