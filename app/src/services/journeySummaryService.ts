import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getSupabase } from './supabase';
import lessonsData from '@/data/content/lessons.json';
import chaptersData from '@/data/content/chapters.json';

interface JournalEntry {
  lesson_id: string;
  reflection: string;
  deeper_reflection: string;
  gratitude: string;
  created_at: string;
}

interface UserProgress {
  completed_lessons: string[];
  current_streak: number;
  longest_streak: number;
  badges: string[];
  created_at: string;
}

/**
 * Generate a beautifully formatted PDF summary of the user's 2Equilibrium journey
 */
export async function generateJourneySummary(): Promise<string> {
  const { data: { user } } = await getSupabase().auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch user's journal entries
  const { data: journalEntries } = await getSupabase()
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  // Fetch user progress
  const { data: progress } = await getSupabase()
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch user profile
  const { data: profile } = await getSupabase()
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const userName = profile?.full_name || 'Wellness Warrior';
  const startDate = progress?.created_at ? new Date(progress.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const completionDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const longestStreak = progress?.longest_streak || 0;
  const totalBadges = progress?.badges?.length || 0;

  // Build journal entries map by lesson_id
  const journalMap = new Map<string, JournalEntry>();
  (journalEntries || []).forEach((entry: JournalEntry) => {
    journalMap.set(entry.lesson_id, entry);
  });

  // Generate phase sections
  const phaseSections = chaptersData.phases.map((phase) => {
    const chapterSections = phase.chapters.map((chapter) => {
      const chapterLessons = lessonsData.lessons.filter((l) => l.chapterId === chapter.id);

      const lessonEntries = chapterLessons.map((lesson) => {
        const journal = journalMap.get(lesson.id);
        return `
          <div class="lesson-entry">
            <div class="lesson-header">
              <span class="day-badge">Day ${lesson.dayNumber}</span>
              <span class="lesson-title">${lesson.title}</span>
            </div>
            ${journal ? `
              <div class="journal-section">
                ${journal.reflection ? `
                  <div class="journal-item">
                    <div class="journal-label">✨ Reflection</div>
                    <div class="journal-text">${escapeHtml(journal.reflection)}</div>
                  </div>
                ` : ''}
                ${journal.deeper_reflection ? `
                  <div class="journal-item">
                    <div class="journal-label">🔍 Deeper Reflection</div>
                    <div class="journal-text">${escapeHtml(journal.deeper_reflection)}</div>
                  </div>
                ` : ''}
                ${journal.gratitude ? `
                  <div class="journal-item">
                    <div class="journal-label">🙏 Gratitude</div>
                    <div class="journal-text">${escapeHtml(journal.gratitude)}</div>
                  </div>
                ` : ''}
              </div>
            ` : '<div class="no-journal">No journal entry recorded</div>'}
          </div>
        `;
      }).join('');

      return `
        <div class="chapter-section">
          <div class="chapter-header" style="border-left-color: ${chapter.color}">
            <h3>Chapter ${chapter.number}: ${chapter.title}</h3>
            <p class="chapter-subtitle">${chapter.subtitle}</p>
            <p class="chapter-days">Days ${chapter.daysRange.start}–${chapter.daysRange.end}</p>
          </div>
          ${lessonEntries}
        </div>
      `;
    }).join('');

    return `
      <div class="phase-section">
        <div class="phase-header">
          <h2>Phase ${phase.number}: ${phase.title}</h2>
          <p class="phase-subtitle">${phase.subtitle}</p>
        </div>
        ${chapterSections}
      </div>
    `;
  }).join('<div class="phase-divider"></div>');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          margin: 0.75in;
          size: letter;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          color: #2D3748;
          line-height: 1.6;
          font-size: 11pt;
        }

        /* Cover Page */
        .cover {
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          text-align: center;
          padding: 2in 1in;
        }
        .cover-logo {
          font-size: 48pt;
          margin-bottom: 0.3in;
        }
        .cover-title {
          font-size: 32pt;
          color: #D4860B;
          font-weight: bold;
          margin-bottom: 0.15in;
          letter-spacing: 1px;
        }
        .cover-subtitle {
          font-size: 16pt;
          color: #718096;
          margin-bottom: 0.8in;
          font-style: italic;
        }
        .cover-name {
          font-size: 22pt;
          color: #2D3748;
          margin-bottom: 0.4in;
        }
        .cover-dates {
          font-size: 12pt;
          color: #A0AEC0;
          line-height: 1.8;
        }
        .cover-ornament {
          font-size: 24pt;
          color: #D4860B;
          margin: 0.4in 0;
          letter-spacing: 8px;
        }

        /* Stats Page */
        .stats-page {
          page-break-after: always;
          padding: 1in 0;
        }
        .stats-title {
          font-size: 20pt;
          color: #D4860B;
          text-align: center;
          margin-bottom: 0.5in;
        }
        .stats-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3in;
          justify-content: center;
        }
        .stat-card {
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          padding: 0.3in;
          text-align: center;
          width: 2.5in;
        }
        .stat-value {
          font-size: 28pt;
          font-weight: bold;
          color: #D4860B;
        }
        .stat-label {
          font-size: 10pt;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 4px;
        }

        /* Phase sections */
        .phase-section {
          margin-bottom: 0.3in;
        }
        .phase-header {
          background: linear-gradient(135deg, #1A365D, #2A4365);
          color: white;
          padding: 0.3in 0.4in;
          border-radius: 8px;
          margin-bottom: 0.3in;
          page-break-after: avoid;
        }
        .phase-header h2 {
          font-size: 18pt;
          margin-bottom: 4px;
        }
        .phase-subtitle {
          font-size: 11pt;
          opacity: 0.85;
          font-style: italic;
        }
        .phase-divider {
          height: 0;
          page-break-before: always;
        }

        /* Chapter sections */
        .chapter-section {
          margin-bottom: 0.3in;
        }
        .chapter-header {
          border-left: 4px solid #0ABAB5;
          padding: 0.15in 0.25in;
          margin-bottom: 0.2in;
          background: #F7FAFC;
          border-radius: 0 6px 6px 0;
          page-break-after: avoid;
        }
        .chapter-header h3 {
          font-size: 14pt;
          color: #2D3748;
        }
        .chapter-subtitle {
          font-size: 10pt;
          color: #718096;
          font-style: italic;
        }
        .chapter-days {
          font-size: 9pt;
          color: #A0AEC0;
          margin-top: 2px;
        }

        /* Lesson entries */
        .lesson-entry {
          margin-bottom: 0.2in;
          padding-bottom: 0.15in;
          border-bottom: 1px solid #EDF2F7;
          page-break-inside: avoid;
        }
        .lesson-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .day-badge {
          background: #D4860B;
          color: white;
          font-size: 8pt;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 10px;
          font-family: 'Helvetica', sans-serif;
        }
        .lesson-title {
          font-size: 11pt;
          font-weight: bold;
          color: #2D3748;
        }

        /* Journal */
        .journal-section {
          margin-left: 0.3in;
          margin-top: 6px;
        }
        .journal-item {
          margin-bottom: 8px;
        }
        .journal-label {
          font-size: 9pt;
          font-weight: bold;
          color: #4A5568;
          margin-bottom: 2px;
        }
        .journal-text {
          font-size: 10pt;
          color: #4A5568;
          line-height: 1.5;
          font-style: italic;
        }
        .no-journal {
          margin-left: 0.3in;
          font-size: 9pt;
          color: #CBD5E0;
          font-style: italic;
        }

        /* Footer */
        .footer {
          text-align: center;
          padding: 0.5in 0;
          color: #A0AEC0;
          font-size: 9pt;
          page-break-before: always;
        }
        .footer-message {
          font-size: 14pt;
          color: #D4860B;
          margin-bottom: 0.2in;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="cover">
        <div class="cover-logo">🌿</div>
        <div class="cover-title">2Equilibrium</div>
        <div class="cover-subtitle">Your Wellness Journey</div>
        <div class="cover-ornament">✦ ✦ ✦</div>
        <div class="cover-name">${escapeHtml(userName)}</div>
        <div class="cover-dates">
          ${startDate ? `Started: ${startDate}<br>` : ''}
          Completed: ${completionDate}<br>
          180 Days of Transformation
        </div>
      </div>

      <!-- Stats Page -->
      <div class="stats-page">
        <div class="stats-title">Your Journey at a Glance</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">180</div>
            <div class="stat-label">Lessons Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">36</div>
            <div class="stat-label">Chapters Mastered</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">6</div>
            <div class="stat-label">Phases Conquered</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${longestStreak}</div>
            <div class="stat-label">Longest Streak (Days)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalBadges}</div>
            <div class="stat-label">Badges Earned</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${journalEntries?.length || 0}</div>
            <div class="stat-label">Journal Entries</div>
          </div>
        </div>
      </div>

      <!-- Journey Content -->
      ${phaseSections}

      <!-- Footer -->
      <div class="footer">
        <div class="footer-message">"The journey of a thousand miles begins with a single step."</div>
        <p>Generated by 2Equilibrium • ${completionDate}</p>
        <p>This document is a personal record of your wellness transformation.</p>
        <p>© 2Equilibrium by GramerTech</p>
      </div>
    </body>
    </html>
  `;

  // Generate PDF
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Move to a permanent location with a nice filename
  const fileName = `2Equilibrium_Journey_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  const permanentUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.moveAsync({
    from: uri,
    to: permanentUri,
  });

  return permanentUri;
}

/**
 * Generate and share the journey summary PDF
 */
export async function generateAndShareSummary(): Promise<void> {
  const pdfUri = await generateJourneySummary();

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Your 2Equilibrium Journey Summary',
      UTI: 'com.adobe.pdf',
    });
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}
