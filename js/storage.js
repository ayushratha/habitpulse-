/**
 * Storage & Data Model Management for Daily Habit Tracker
 * Handles localStorage persistence, date utilities (timezone-safe YYYY-MM-DD),
 * and default habit seeding.
 */

const STORAGE_KEYS = {
  HABITS: 'habitTracker_habits_v1',
  LOGS: 'habitTracker_logs_v1',
  SETTINGS: 'habitTracker_settings_v1',
  THEME: 'habitTracker_theme_v1'
};

// Default initial habits
const DEFAULT_HABITS = [
  {
    id: 'habit-1',
    name: 'Reading',
    category: 'Education',
    emoji: '📚',
    type: 'binary', // 'binary' | 'counter' | 'duration'
    targetFrequency: 'daily', // 'daily' | 'weekly'
    weeklyTargetDays: 7,
    unit: '',
    targetValue: 1,
    createdAt: '2026-01-01'
  },
  {
    id: 'habit-2',
    name: 'Exercise',
    category: 'Fitness',
    emoji: '🏋️',
    type: 'duration',
    targetFrequency: 'daily',
    weeklyTargetDays: 5,
    unit: 'mins',
    targetValue: 30, // 30 minutes
    createdAt: '2026-01-01'
  },
  {
    id: 'habit-3',
    name: 'Study',
    category: 'Productivity',
    emoji: '💻',
    type: 'duration',
    targetFrequency: 'daily',
    weeklyTargetDays: 6,
    unit: 'mins',
    targetValue: 45, // 45 minutes
    createdAt: '2026-01-01'
  },
  {
    id: 'habit-4',
    name: 'Water Intake',
    category: 'Health',
    emoji: '💧',
    type: 'counter',
    targetFrequency: 'daily',
    weeklyTargetDays: 7,
    unit: 'glasses',
    targetValue: 8, // 8 glasses
    createdAt: '2026-01-01'
  },
  {
    id: 'habit-5',
    name: 'Meditation',
    category: 'Personal Development',
    emoji: '🧘',
    type: 'binary',
    targetFrequency: 'daily',
    weeklyTargetDays: 7,
    unit: '',
    targetValue: 1,
    createdAt: '2026-01-01'
  },
  {
    id: 'habit-6',
    name: 'Sleep on Time',
    category: 'Health',
    emoji: '😴',
    type: 'binary',
    targetFrequency: 'daily',
    weeklyTargetDays: 7,
    unit: '',
    targetValue: 1,
    createdAt: '2026-01-01'
  }
];

const DEFAULT_SETTINGS = {
  userName: 'Achiever',
  weeklyTargetRate: 80, // Target completion %
  soundEffects: true,
  confettiEnabled: true,
  firstDayOfWeek: 1 // 1 = Monday, 0 = Sunday
};

// Available categories with color theme tokens
const CATEGORIES = [
  { name: 'Health', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', icon: '❤️' },
  { name: 'Fitness', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', icon: '⚡' },
  { name: 'Education', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', icon: '🎓' },
  { name: 'Productivity', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', icon: '🚀' },
  { name: 'Personal Development', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', icon: '🌱' }
];

// Curated list of popular habit emojis
const POPULAR_EMOJIS = [
  '📚', '🏋️', '💻', '💧', '🧘', '😴', 
  '🏃', '🍎', '✍️', '🎯', '🚶', '🚴',
  '🎨', '💡', '🎵', '🌱', '☀️', '🍵',
  '🍳', '🧹', '🔋', '📖', '🏊', '🧠'
];

/**
 * Timezone-safe date helper
 * Formats a Date object to YYYY-MM-DD in local time
 */
function formatDateToKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string into a safe local Date object (at midnight)
 */
function parseKeyToDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Get friendly display string for a date (e.g., "Today", "Yesterday", "Sunday, Oct 25")
 */
function formatDisplayDate(dateKey) {
  const todayKey = formatDateToKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateToKey(yesterday);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = formatDateToKey(tomorrow);

  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';
  if (dateKey === tomorrowKey) return 'Tomorrow';

  const date = parseKeyToDate(dateKey);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Storage Repository Object
 */
const StorageService = {
  // Get all habits
  getHabits() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (!data) {
        this.saveHabits(DEFAULT_HABITS);
        this.seedInitialHistory();
        return DEFAULT_HABITS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading habits:', e);
      return DEFAULT_HABITS;
    }
  },

  // Save habits array
  saveHabits(habits) {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch (e) {
      console.error('Error saving habits:', e);
    }
  },

  // Add new habit
  addHabit(habitData) {
    const habits = this.getHabits();
    // Validate uniqueness of name
    const exists = habits.some(h => h.name.trim().toLowerCase() === habitData.name.trim().toLowerCase());
    if (exists) {
      throw new Error(`A habit named "${habitData.name}" already exists.`);
    }

    const newHabit = {
      id: 'habit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      name: habitData.name.trim(),
      category: habitData.category || 'Health',
      emoji: habitData.emoji || '⭐',
      type: habitData.type || 'binary', // binary | counter | duration
      targetFrequency: habitData.targetFrequency || 'daily',
      weeklyTargetDays: Number(habitData.weeklyTargetDays) || 7,
      unit: habitData.unit || '',
      targetValue: Number(habitData.targetValue) || 1,
      createdAt: formatDateToKey(new Date())
    };

    habits.push(newHabit);
    this.saveHabits(habits);
    return newHabit;
  },

  // Update existing habit
  updateHabit(habitId, updatedData) {
    const habits = this.getHabits();
    const index = habits.findIndex(h => h.id === habitId);
    if (index === -1) {
      throw new Error('Habit not found');
    }

    // Check duplicate name on other habits
    const duplicate = habits.some(h => h.id !== habitId && h.name.trim().toLowerCase() === updatedData.name.trim().toLowerCase());
    if (duplicate) {
      throw new Error(`Another habit named "${updatedData.name}" already exists.`);
    }

    habits[index] = {
      ...habits[index],
      name: updatedData.name.trim(),
      category: updatedData.category,
      emoji: updatedData.emoji,
      type: updatedData.type,
      targetFrequency: updatedData.targetFrequency,
      weeklyTargetDays: Number(updatedData.weeklyTargetDays) || 7,
      unit: updatedData.unit || '',
      targetValue: Number(updatedData.targetValue) || 1
    };

    this.saveHabits(habits);
    return habits[index];
  },

  // Delete habit and optionally its logs
  deleteHabit(habitId) {
    let habits = this.getHabits();
    habits = habits.filter(h => h.id !== habitId);
    this.saveHabits(habits);

    // Clean up logs for this habit
    const logs = this.getLogs();
    Object.keys(logs).forEach(dateKey => {
      if (logs[dateKey] && logs[dateKey][habitId]) {
        delete logs[dateKey][habitId];
      }
    });
    this.saveLogs(logs);
  },

  // Get logs object: { [dateKey]: { [habitId]: { completed: boolean, count?: number, duration?: number } } }
  getLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error loading logs:', e);
      return {};
    }
  },

  // Save logs
  saveLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving logs:', e);
    }
  },

  // Get log record for a habit on a date
  getHabitLog(habitId, dateKey) {
    const logs = this.getLogs();
    return logs[dateKey]?.[habitId] || null;
  },

  // Toggle completion or set completion status
  setHabitCompletion(habitId, dateKey, completed) {
    const logs = this.getLogs();
    if (!logs[dateKey]) logs[dateKey] = {};

    const habit = this.getHabits().find(h => h.id === habitId);
    const targetValue = habit ? habit.targetValue : 1;

    if (!logs[dateKey][habitId]) {
      logs[dateKey][habitId] = {
        completed: false,
        count: 0,
        duration: 0,
        completedAt: null
      };
    }

    logs[dateKey][habitId].completed = Boolean(completed);
    logs[dateKey][habitId].completedAt = completed ? new Date().toISOString() : null;

    if (habit) {
      if (habit.type === 'counter') {
        logs[dateKey][habitId].count = completed ? targetValue : 0;
      } else if (habit.type === 'duration') {
        logs[dateKey][habitId].duration = completed ? targetValue : 0;
      }
    }

    this.saveLogs(logs);
    return logs[dateKey][habitId];
  },

  // Update numerical counter (e.g. Water glasses + / -)
  updateHabitCounter(habitId, dateKey, delta) {
    const logs = this.getLogs();
    if (!logs[dateKey]) logs[dateKey] = {};

    const habit = this.getHabits().find(h => h.id === habitId);
    const target = habit ? habit.targetValue : 8;

    const current = logs[dateKey][habitId] || { completed: false, count: 0, duration: 0, completedAt: null };
    const newCount = Math.max(0, (current.count || 0) + delta);

    const completed = newCount >= target;

    logs[dateKey][habitId] = {
      ...current,
      count: newCount,
      completed: completed,
      completedAt: completed ? (current.completedAt || new Date().toISOString()) : null
    };

    this.saveLogs(logs);
    return logs[dateKey][habitId];
  },

  // Update duration in minutes (e.g. Study or Exercise)
  updateHabitDuration(habitId, dateKey, minutes) {
    const logs = this.getLogs();
    if (!logs[dateKey]) logs[dateKey] = {};

    const habit = this.getHabits().find(h => h.id === habitId);
    const target = habit ? habit.targetValue : 30;

    const current = logs[dateKey][habitId] || { completed: false, count: 0, duration: 0, completedAt: null };
    const newDuration = Math.max(0, Number(minutes) || 0);
    const completed = newDuration >= target;

    logs[dateKey][habitId] = {
      ...current,
      duration: newDuration,
      completed: completed,
      completedAt: completed ? (current.completedAt || new Date().toISOString()) : null
    };

    this.saveLogs(logs);
    return logs[dateKey][habitId];
  },

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  // Theme (light / dark / system)
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  },

  saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  // Export all application data as JSON
  exportData() {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      habits: this.getHabits(),
      logs: this.getLogs(),
      settings: this.getSettings(),
      theme: this.getTheme()
    };
  },

  // Import application data
  importData(jsonData) {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (!parsed.habits || !Array.isArray(parsed.habits)) {
        throw new Error('Invalid backup file: missing habits array');
      }

      this.saveHabits(parsed.habits);
      if (parsed.logs) this.saveLogs(parsed.logs);
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.theme) this.saveTheme(parsed.theme);

      return true;
    } catch (e) {
      console.error('Import failed:', e);
      throw e;
    }
  },

  // Clear all logged activity history
  clearAllLogs() {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  },

  // Reset to default seed
  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.saveHabits(DEFAULT_HABITS);
    this.seedInitialHistory();
  },

  // Seeds realistic sample history for the past 14 days so new users immediately see charts, streaks and analytics
  seedInitialHistory() {
    const logs = {};
    const today = new Date();

    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = formatDateToKey(d);
      logs[dateKey] = {};

      DEFAULT_HABITS.forEach((habit, hIdx) => {
        // Create an organic completion pattern with high consistency on Reading, Water, Sleep
        let completed = false;
        let count = 0;
        let duration = 0;

        if (habit.id === 'habit-1') { // Reading: very consistent
          completed = i !== 4 && i !== 10;
        } else if (habit.id === 'habit-4') { // Water: 8 glasses mostly
          completed = i !== 3 && i !== 8;
          count = completed ? 8 : (i % 2 === 0 ? 6 : 5);
        } else if (habit.id === 'habit-2') { // Exercise: 4-5 times a week
          completed = [0, 1, 2, 5, 7, 8, 9, 12, 14].includes(i);
          duration = completed ? 35 : 0;
        } else if (habit.id === 'habit-3') { // Study: weekdays
          const dayOfWeek = d.getDay();
          completed = (dayOfWeek >= 1 && dayOfWeek <= 5) && i !== 5;
          duration = completed ? 50 : (i === 5 ? 20 : 0);
        } else if (habit.id === 'habit-5') { // Meditation
          completed = [0, 1, 3, 4, 6, 7, 8, 10, 11, 13].includes(i);
        } else if (habit.id === 'habit-6') { // Sleep
          completed = i !== 2 && i !== 9;
        }

        logs[dateKey][habit.id] = {
          completed,
          count: habit.type === 'counter' ? (count || (completed ? habit.targetValue : 0)) : undefined,
          duration: habit.type === 'duration' ? (duration || (completed ? habit.targetValue : 0)) : undefined,
          completedAt: completed ? d.toISOString() : null
        };
      });
    }

    this.saveLogs(logs);
  }
};

// Make available globally
window.StorageService = StorageService;
window.formatDateToKey = formatDateToKey;
window.parseKeyToDate = parseKeyToDate;
window.formatDisplayDate = formatDisplayDate;
window.CATEGORIES = CATEGORIES;
window.POPULAR_EMOJIS = POPULAR_EMOJIS;
