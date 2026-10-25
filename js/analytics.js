/**
 * Analytics & Calculation Engine for Daily Habit Tracker
 * Handles streak calculations, weekly matrix, completion rates,
 * category distributions, and motivational messaging.
 */

const AnalyticsService = {
  /**
   * Get week start date (Monday) and end date (Sunday) for a given reference date
   * @param {Date|string} refDate - reference date
   * @param {number} startDay - 1 for Monday, 0 for Sunday
   */
  getWeekRange(refDate = new Date(), startDay = 1) {
    const d = typeof refDate === 'string' ? parseKeyToDate(refDate) : new Date(refDate);
    const day = d.getDay();
    // Calculate difference to Monday
    // If startDay = 1 (Monday): Sun is 0, so diff is (day === 0 ? -6 : 1 - day)
    const diff = startDay === 1 
      ? (day === 0 ? -6 : 1 - day)
      : -day;

    const startDate = new Date(d);
    startDate.setDate(d.getDate() + diff);
    startDate.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + i);
      weekDays.push(formatDateToKey(cur));
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return {
      startDate: formatDateToKey(startDate),
      endDate: formatDateToKey(endDate),
      days: weekDays
    };
  },

  /**
   * Calculate daily statistics for a given date
   */
  getDailyStats(dateKey = formatDateToKey(new Date())) {
    const habits = StorageService.getHabits();
    const logs = StorageService.getLogs();
    const dayLogs = logs[dateKey] || {};

    const totalHabits = habits.length;
    let completedCount = 0;
    let totalWaterGlasses = 0;
    let totalExerciseMins = 0;
    let totalStudyMins = 0;

    habits.forEach(habit => {
      const log = dayLogs[habit.id];
      if (log && log.completed) {
        completedCount++;
      }
      if (habit.type === 'counter' && log?.count) {
        totalWaterGlasses += log.count;
      }
      if (habit.type === 'duration' && log?.duration) {
        if (habit.category === 'Fitness' || habit.name.toLowerCase().includes('exercise')) {
          totalExerciseMins += log.duration;
        } else if (habit.category === 'Productivity' || habit.name.toLowerCase().includes('study')) {
          totalStudyMins += log.duration;
        }
      }
    });

    const completionRate = totalHabits > 0 
      ? Math.round((completedCount / totalHabits) * 100) 
      : 0;

    return {
      dateKey,
      totalHabits,
      completedCount,
      completionRate,
      totalWaterGlasses,
      totalExerciseMins,
      totalStudyMins
    };
  },

  /**
   * Calculate streaks for a single habit
   * Returns { currentStreak, longestStreak }
   */
  getHabitStreaks(habitId) {
    const logs = StorageService.getLogs();
    const habit = StorageService.getHabits().find(h => h.id === habitId);
    if (!habit) return { currentStreak: 0, longestStreak: 0 };

    const todayKey = formatDateToKey(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateToKey(yesterday);

    // Get sorted list of dates with recorded logs
    const allLogKeys = Object.keys(logs).sort();
    if (allLogKeys.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Find earliest recorded date or 365 days ago
    const earliestDate = parseKeyToDate(allLogKeys[0]);
    const today = new Date();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check backwards from today for current streak
    let checkDate = new Date(today);
    let isTodayCompleted = logs[todayKey]?.[habitId]?.completed;
    
    // If today is not completed yet, the streak could still be alive if yesterday was completed
    if (!isTodayCompleted) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = formatDateToKey(checkDate);
      if (logs[key]?.[habitId]?.completed) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak chronologically
    let runner = new Date(earliestDate);
    while (runner <= today) {
      const key = formatDateToKey(runner);
      if (logs[key]?.[habitId]?.completed) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
      runner.setDate(runner.getDate() + 1);
    }

    return { currentStreak, longestStreak };
  },

  /**
   * Overall consistency streak: consecutive days where at least 1 habit (or 50%+) was completed
   */
  getOverallStreaks() {
    const habits = StorageService.getHabits();
    const logs = StorageService.getLogs();
    if (habits.length === 0) return { currentStreak: 0, longestStreak: 0, totalSuccessfulDays: 0 };

    const today = new Date();
    const todayKey = formatDateToKey(today);

    // Helper to test if a day is "successful" (at least 1 habit completed)
    const isDaySuccessful = (dateKey) => {
      const dayLogs = logs[dateKey];
      if (!dayLogs) return false;
      return Object.values(dayLogs).some(item => item?.completed);
    };

    // Calculate total successful days
    let totalSuccessfulDays = 0;
    Object.keys(logs).forEach(dateKey => {
      if (isDaySuccessful(dateKey)) totalSuccessfulDays++;
    });

    // Current consistency streak
    let currentStreak = 0;
    let checkDate = new Date(today);

    if (!isDaySuccessful(todayKey)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = formatDateToKey(checkDate);
      if (isDaySuccessful(key)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak
    const allDates = Object.keys(logs).sort();
    let longestStreak = 0;
    if (allDates.length > 0) {
      const firstDate = parseKeyToDate(allDates[0]);
      let tempStreak = 0;
      let runner = new Date(firstDate);
      while (runner <= today) {
        const k = formatDateToKey(runner);
        if (isDaySuccessful(k)) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
        runner.setDate(runner.getDate() + 1);
      }
    }

    return { currentStreak, longestStreak, totalSuccessfulDays };
  },

  /**
   * Weekly Progress calculation
   * Weekly Completion % = (Completed Habit Instances / Expected Habit Instances) * 100
   * Only counts habits scheduled for the selected period.
   * Future dates are NOT counted as missed habits!
   */
  getWeeklyProgress(refDate = new Date()) {
    const habits = StorageService.getHabits();
    const logs = StorageService.getLogs();
    const week = this.getWeekRange(refDate);
    const todayKey = formatDateToKey(new Date());

    let completedInstances = 0;
    let expectedInstances = 0;

    const habitPerformances = {};
    habits.forEach(h => {
      habitPerformances[h.id] = {
        habit: h,
        completedDays: 0,
        expectedDays: 0,
        dayStatus: {} // { [dateKey]: 'completed' | 'missed' | 'future' }
      };
    });

    const dailyBreakdown = week.days.map(dateKey => {
      const isFuture = dateKey > todayKey;
      let dayCompleted = 0;
      let dayTotal = habits.length;

      habits.forEach(habit => {
        const log = logs[dateKey]?.[habit.id];
        const isDone = Boolean(log?.completed);

        if (isFuture) {
          habitPerformances[habit.id].dayStatus[dateKey] = 'future';
        } else {
          // Expected day
          expectedInstances++;
          habitPerformances[habit.id].expectedDays++;

          if (isDone) {
            completedInstances++;
            dayCompleted++;
            habitPerformances[habit.id].completedDays++;
            habitPerformances[habit.id].dayStatus[dateKey] = 'completed';
          } else {
            habitPerformances[habit.id].dayStatus[dateKey] = 'missed';
          }
        }
      });

      return {
        dateKey,
        isFuture,
        completed: dayCompleted,
        total: dayTotal,
        rate: (!isFuture && dayTotal > 0) ? Math.round((dayCompleted / dayTotal) * 100) : 0
      };
    });

    const completionRate = expectedInstances > 0 
      ? Math.round((completedInstances / expectedInstances) * 100) 
      : 0;

    // Determine Best and Least consistent habits
    let bestHabit = null;
    let leastHabit = null;
    let maxRate = -1;
    let minRate = 999;

    Object.values(habitPerformances).forEach(perf => {
      const rate = perf.expectedDays > 0 ? (perf.completedDays / perf.expectedDays) : 0;
      if (rate > maxRate) {
        maxRate = rate;
        bestHabit = { ...perf.habit, rate: Math.round(rate * 100), completedDays: perf.completedDays };
      }
      if (rate < minRate) {
        minRate = rate;
        leastHabit = { ...perf.habit, rate: Math.round(rate * 100), completedDays: perf.completedDays };
      }
    });

    return {
      weekRange: week,
      completedInstances,
      expectedInstances,
      completionRate,
      dailyBreakdown,
      habitPerformances,
      bestHabit,
      leastHabit
    };
  },

  /**
   * Improvement comparison compared to the previous week
   */
  getWeekOverWeekComparison(refDate = new Date()) {
    const currentWeekProgress = this.getWeeklyProgress(refDate);

    // Calculate previous week reference date
    const d = typeof refDate === 'string' ? parseKeyToDate(refDate) : new Date(refDate);
    const prevDate = new Date(d);
    prevDate.setDate(prevDate.getDate() - 7);
    const previousWeekProgress = this.getWeeklyProgress(prevDate);

    const diff = currentWeekProgress.completionRate - previousWeekProgress.completionRate;

    return {
      currentRate: currentWeekProgress.completionRate,
      previousRate: previousWeekProgress.completionRate,
      diff: diff,
      isImproved: diff >= 0
    };
  },

  /**
   * Category-wise breakdown and statistics
   */
  getCategoryStats(daysCount = 14) {
    const habits = StorageService.getHabits();
    const logs = StorageService.getLogs();
    const today = new Date();

    const categoryMap = {};
    CATEGORIES.forEach(c => {
      categoryMap[c.name] = {
        name: c.name,
        color: c.color,
        bg: c.bg,
        icon: c.icon,
        totalHabits: 0,
        completedInstances: 0,
        expectedInstances: 0
      };
    });

    habits.forEach(h => {
      if (categoryMap[h.category]) {
        categoryMap[h.category].totalHabits++;
      }
    });

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = formatDateToKey(d);

      habits.forEach(habit => {
        if (!categoryMap[habit.category]) return;

        categoryMap[habit.category].expectedInstances++;
        if (logs[dateKey]?.[habit.id]?.completed) {
          categoryMap[habit.category].completedInstances++;
        }
      });
    }

    return Object.values(categoryMap).map(cat => ({
      ...cat,
      rate: cat.expectedInstances > 0 
        ? Math.round((cat.completedInstances / cat.expectedInstances) * 100) 
        : 0
    }));
  },

  /**
   * Monthly calendar data for a given Year and Month (0-indexed month)
   */
  getMonthlyCalendarData(year, month) {
    const habits = StorageService.getHabits();
    const logs = StorageService.getLogs();
    const todayKey = formatDateToKey(new Date());

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const numDays = lastDayOfMonth.getDate();

    // Determine day of week for the 1st (0 = Sunday, 1 = Monday ...)
    // For Monday-first grid: Mon=0, Tue=1 ... Sun=6
    let startingDay = firstDayOfMonth.getDay() - 1;
    if (startingDay === -1) startingDay = 6;

    const days = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const padDate = new Date(year, month - 1, dayNum);
      const key = formatDateToKey(padDate);
      days.push({
        dayNumber: dayNum,
        dateKey: key,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isFuture: key > todayKey,
        stats: this.getDailyStats(key)
      });
    }

    // Current month days
    for (let d = 1; d <= numDays; d++) {
      const curDate = new Date(year, month, d);
      const key = formatDateToKey(curDate);
      const isFuture = key > todayKey;
      const stats = this.getDailyStats(key);

      let status = 'none';
      if (isFuture) {
        status = 'future';
      } else if (stats.completionRate === 100 && stats.totalHabits > 0) {
        status = 'full';
      } else if (stats.completionRate > 0) {
        status = 'partial';
      } else {
        status = 'empty';
      }

      days.push({
        dayNumber: d,
        dateKey: key,
        isCurrentMonth: true,
        isToday: key === todayKey,
        isFuture,
        status,
        stats
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const padDate = new Date(year, month + 1, i);
      const key = formatDateToKey(padDate);
      days.push({
        dayNumber: i,
        dateKey: key,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isFuture: key > todayKey,
        stats: this.getDailyStats(key)
      });
    }

    return {
      year,
      month,
      monthName: firstDayOfMonth.toLocaleDateString('en-US', { month: 'long' }),
      days
    };
  },

  /**
   * Trend chart data for the past N days (e.g. 14 days or 30 days)
   */
  getTrendData(daysCount = 14) {
    const today = new Date();
    const labels = [];
    const rates = [];
    const completedCounts = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = formatDateToKey(d);
      const stats = this.getDailyStats(dateKey);

      labels.push(d.toLocaleDateString('en-US', { weekday: 'narrow', month: 'numeric', day: 'numeric' }));
      rates.push(stats.completionRate);
      completedCounts.push(stats.completedCount);
    }

    return { labels, rates, completedCounts };
  },

  /**
   * Motivational message based on completion percentage
   */
  getMotivationalMessage(rate) {
    if (rate === 100) {
      return {
        quote: "Phenomenal! You've crushed all your habits today! 🌟👑",
        author: "Unstoppable Momentum",
        tag: "Perfect Day"
      };
    } else if (rate >= 80) {
      return {
        quote: "Almost there! One final push to make today legendary 🎯",
        author: "Champion Mindset",
        tag: "High Performance"
      };
    } else if (rate >= 50) {
      return {
        quote: "More than halfway! Consistency is the bridge to success 💪",
        author: "James Clear",
        tag: "Building Power"
      };
    } else if (rate > 0) {
      return {
        quote: "Great start! Small daily wins compound into huge achievements 🚀",
        author: "Atomic Habits",
        tag: "In Motion"
      };
    } else {
      return {
        quote: "A fresh canvas awaits. Complete your first habit of the day! 🌱",
        author: "Daily Focus",
        tag: "Ready Set Go"
      };
    }
  }
};

window.AnalyticsService = AnalyticsService;
