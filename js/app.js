/**
 * Main Application Controller for Daily Habit Tracker (HabitPulse)
 * Manages view routing, UI rendering, event handling, modals, and toasts.
 */

const App = {
  currentView: 'dashboard',
  activeTrackingDate: formatDateToKey(new Date()),
  weeklyRefDate: new Date(),
  calendarDate: new Date(), // current viewed month
  selectedCategoryFilter: 'All',
  editingHabitId: null,
  confirmCallback: null,

  // Audio chime using Web Audio API
  audioCtx: null,

  init() {
    this.initTheme();
    this.bindNavigation();
    this.bindHeaderActions();
    this.bindHabitModal();
    this.bindDayDetailModal();
    this.bindConfirmModal();
    this.bindSettingsAndBackups();
    this.bindDateNavigation();

    // Render initial view
    this.renderActiveView();

    // Set today's date in header
    this.updateHeaderDate();

    console.log('HabitPulse initialized successfully.');
  },

  /* ==========================================================================
     Theme Management (Light / Dark)
     ========================================================================== */
  initTheme() {
    const savedTheme = StorageService.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButtonUI(savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        StorageService.saveTheme(next);
        this.updateThemeButtonUI(next);
        this.refreshCharts();
      });
    }
  },

  updateThemeButtonUI(theme) {
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    if (icon && label) {
      if (theme === 'dark') {
        icon.textContent = '☀️';
        label.textContent = 'Light Mode';
      } else {
        icon.textContent = '🌙';
        label.textContent = 'Dark Mode';
      }
    }
  },

  /* ==========================================================================
     View Navigation
     ========================================================================== */
  bindNavigation() {
    // Desktop sidebar nav links
    document.querySelectorAll('.sidebar .nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = btn.getAttribute('data-view');
        this.navigateTo(targetView);
      });
    });

    // Mobile bottom nav links
    document.querySelectorAll('.mobile-nav .mobile-nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = btn.getAttribute('data-view');
        this.navigateTo(targetView);
      });
    });
  },

  navigateTo(viewName) {
    this.currentView = viewName;

    // Update active nav links
    document.querySelectorAll('.sidebar .nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    document.querySelectorAll('.mobile-nav .mobile-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    // Toggle panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.style.display = 'none';
    });

    const activePanel = document.getElementById(`view-${viewName}`);
    if (activePanel) {
      activePanel.style.display = 'block';
    }

    // Update header titles
    const titles = {
      dashboard: { title: 'Dashboard', sub: "Track today's routines, streaks, and progress." },
      habits: { title: 'Daily Habit Checklist', sub: 'Review, check off, and log daily habits.' },
      weekly: { title: 'Weekly Matrix & Progress', sub: 'Habit consistency grid across Monday to Sunday.' },
      calendar: { title: 'Monthly Calendar', sub: 'Visual heatmap of your monthly consistency.' },
      analytics: { title: 'Performance Analytics', sub: 'Trends, distribution charts, and habit leaderboard.' },
      settings: { title: 'Settings & Data Backup', sub: 'Customize targets, export, or restore your data.' }
    };

    const info = titles[viewName] || titles.dashboard;
    document.getElementById('currentViewTitle').textContent = info.title;
    document.getElementById('currentViewSubtitle').textContent = info.sub;

    this.renderActiveView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderActiveView() {
    switch (this.currentView) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'habits':
        this.renderDailyHabitsView();
        break;
      case 'weekly':
        this.renderWeeklyView();
        break;
      case 'calendar':
        this.renderCalendarView();
        break;
      case 'analytics':
        this.renderAnalyticsView();
        break;
      case 'settings':
        this.renderSettingsView();
        break;
    }
  },

  /* ==========================================================================
     Header & Global Actions
     ========================================================================== */
  updateHeaderDate() {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const headerTodayDate = document.getElementById('headerTodayDate');
    if (headerTodayDate) {
      headerTodayDate.textContent = formatted;
    }
  },

  bindHeaderActions() {
    const openAddBtn = document.getElementById('openAddHabitModalBtn');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => {
        this.openHabitModal();
      });
    }

    const headerDateDisplayBtn = document.getElementById('headerDateDisplayBtn');
    if (headerDateDisplayBtn) {
      headerDateDisplayBtn.addEventListener('click', () => {
        this.activeTrackingDate = formatDateToKey(new Date());
        this.navigateTo('habits');
      });
    }
  },

  /* ==========================================================================
     View 1: Dashboard Rendering
     ========================================================================== */
  renderDashboard() {
    const todayKey = formatDateToKey(new Date());
    const habits = StorageService.getHabits();
    const stats = AnalyticsService.getDailyStats(todayKey);
    const overallStreaks = AnalyticsService.getOverallStreaks();
    const weeklyProgress = AnalyticsService.getWeeklyProgress(new Date());

    // 1. Hero Quote & Badge
    const quoteData = AnalyticsService.getMotivationalMessage(stats.completionRate);
    document.getElementById('motivationalQuote').textContent = `"${quoteData.quote}"`;
    document.getElementById('motivationalSub').textContent = `— ${quoteData.author} • ${quoteData.tag}`;

    const dateTitle = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    document.getElementById('heroDateText').textContent = dateTitle;

    // 2. Animated Circular Progress Ring
    const circle = document.getElementById('dashboardProgressCircle');
    const percentText = document.getElementById('dashboardRingPercent');
    const ringLabel = document.getElementById('dashboardRingLabel');

    const circumference = 2 * Math.PI * 54; // ~339.29
    const offset = circumference - (stats.completionRate / 100) * circumference;
    if (circle) {
      circle.style.strokeDashoffset = offset;
      if (stats.completionRate === 100 && stats.totalHabits > 0) {
        circle.style.stroke = 'var(--color-success)';
      } else {
        circle.style.stroke = 'var(--color-primary)';
      }
    }
    if (percentText) percentText.textContent = `${stats.completionRate}%`;
    if (ringLabel) ringLabel.textContent = `${stats.completedCount}/${stats.totalHabits} Done`;

    // 3. Metric Cards
    document.getElementById('metricTotalHabits').textContent = habits.length;
    document.getElementById('metricDoneToday').textContent = `${stats.completedCount} / ${habits.length}`;
    document.getElementById('metricDailyPct').textContent = `${stats.completionRate}% daily completion`;

    document.getElementById('metricCurrentStreak').textContent = `${overallStreaks.currentStreak} Days`;
    document.getElementById('metricBestStreak').textContent = `Best: ${overallStreaks.longestStreak} Days`;

    document.getElementById('metricWeeklyProgress').textContent = `${weeklyProgress.completionRate}%`;
    document.getElementById('metricWeeklyCompletions').textContent = `${weeklyProgress.completedInstances} / ${weeklyProgress.expectedInstances} scheduled`;

    // 4. Render Category Filters & Habits Checklist
    this.renderCategoryFilterBar('dashboardCategoryFilters', () => {
      this.renderHabitsChecklist('dashboardHabitsList', todayKey);
    });
    this.renderHabitsChecklist('dashboardHabitsList', todayKey);

    // 5. Render Weekly Overview Chart
    ChartsManager.renderWeeklyChart('weeklyProgressChart', weeklyProgress);
  },

  /* ==========================================================================
     View 2: Daily Habits View Rendering
     ========================================================================== */
  renderDailyHabitsView() {
    this.updateActiveDateUI();

    this.renderCategoryFilterBar('habitsCategoryFilters', () => {
      this.renderHabitsChecklist('dailyChecklistContainer', this.activeTrackingDate);
    });

    this.renderHabitsChecklist('dailyChecklistContainer', this.activeTrackingDate);
  },

  bindDateNavigation() {
    const prevDayBtn = document.getElementById('prevDayBtn');
    const nextDayBtn = document.getElementById('nextDayBtn');
    const activeDateDisplay = document.getElementById('activeDateDisplay');
    const datePickerInput = document.getElementById('datePickerInput');
    const jumpToTodayBtn = document.getElementById('jumpToTodayBtn');

    if (prevDayBtn) {
      prevDayBtn.addEventListener('click', () => {
        const cur = parseKeyToDate(this.activeTrackingDate);
        cur.setDate(cur.getDate() - 1);
        this.activeTrackingDate = formatDateToKey(cur);
        this.renderDailyHabitsView();
      });
    }

    if (nextDayBtn) {
      nextDayBtn.addEventListener('click', () => {
        const cur = parseKeyToDate(this.activeTrackingDate);
        cur.setDate(cur.getDate() + 1);
        this.activeTrackingDate = formatDateToKey(cur);
        this.renderDailyHabitsView();
      });
    }

    if (jumpToTodayBtn) {
      jumpToTodayBtn.addEventListener('click', () => {
        this.activeTrackingDate = formatDateToKey(new Date());
        this.renderDailyHabitsView();
      });
    }

    if (activeDateDisplay && datePickerInput) {
      activeDateDisplay.addEventListener('click', () => {
        datePickerInput.value = this.activeTrackingDate;
        datePickerInput.showPicker ? datePickerInput.showPicker() : datePickerInput.click();
      });

      datePickerInput.addEventListener('change', (e) => {
        if (e.target.value) {
          this.activeTrackingDate = e.target.value;
          this.renderDailyHabitsView();
        }
      });
    }
  },

  updateActiveDateUI() {
    const display = document.getElementById('activeDateDisplay');
    if (!display) return;

    const friendly = formatDisplayDate(this.activeTrackingDate);
    const dateObj = parseKeyToDate(this.activeTrackingDate);
    const fullDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    display.textContent = friendly === 'Today' || friendly === 'Yesterday' || friendly === 'Tomorrow' 
      ? `${friendly} (${fullDate})` 
      : fullDate;
  },

  /* ==========================================================================
     Shared Habit Checklist Component (Cards, Counters, Durations, Checkbox)
     ========================================================================== */
  renderCategoryFilterBar(containerId, onFilterChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const habits = StorageService.getHabits();
    const categories = ['All', ...CATEGORIES.map(c => c.name)];

    container.innerHTML = categories.map(cat => {
      const count = cat === 'All' 
        ? habits.length 
        : habits.filter(h => h.category === cat).length;

      const isActive = this.selectedCategoryFilter === cat;
      return `
        <button class="filter-chip ${isActive ? 'active' : ''}" data-cat="${cat}">
          ${cat} (${count})
        </button>
      `;
    }).join('');

    container.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.selectedCategoryFilter = chip.getAttribute('data-cat');
        container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (onFilterChange) onFilterChange();
      });
    });
  },

  renderHabitsChecklist(containerId, dateKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let habits = StorageService.getHabits();
    const logs = StorageService.getLogs();
    const dayLogs = logs[dateKey] || {};

    // Filter by selected category
    if (this.selectedCategoryFilter !== 'All') {
      habits = habits.filter(h => h.category === this.selectedCategoryFilter);
    }

    if (habits.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎯</div>
          <h4 class="empty-title">No Habits Found</h4>
          <p class="empty-desc">There are no habits matching the "${this.selectedCategoryFilter}" filter. Create one to get started!</p>
          <button class="btn btn-primary" onclick="App.openHabitModal()">+ Create Habit</button>
        </div>
      `;
      return;
    }

    container.innerHTML = habits.map(habit => {
      const log = dayLogs[habit.id] || { completed: false, count: 0, duration: 0 };
      const streaks = AnalyticsService.getHabitStreaks(habit.id);
      const categoryMeta = CATEGORIES.find(c => c.name === habit.category) || { color: '#FF6E54', bg: 'rgba(255, 110, 84, 0.12)', icon: '⭐' };

      // Type-specific action controls
      let actionControlHtml = '';

      if (habit.type === 'counter') {
        // Water / numerical counter
        const currentCount = log.count || 0;
        const target = habit.targetValue || 8;
        actionControlHtml = `
          <div class="counter-control">
            <button class="counter-btn" data-action="counter-dec" data-id="${habit.id}" ${currentCount <= 0 ? 'disabled' : ''}>-</button>
            <span class="counter-value">${currentCount} / ${target}</span>
            <button class="counter-btn" data-action="counter-inc" data-id="${habit.id}">+</button>
          </div>
        `;
      } else if (habit.type === 'duration') {
        // Study / Exercise duration in minutes
        const currentMins = log.duration || 0;
        const target = habit.targetValue || 30;
        actionControlHtml = `
          <div class="duration-control">
            <button class="chip-btn" data-action="duration-add" data-id="${habit.id}" data-mins="15">+15m</button>
            <button class="chip-btn" data-action="duration-add" data-id="${habit.id}" data-mins="30">+30m</button>
            <span class="counter-value" style="font-size: 0.85rem;">${currentMins} / ${target}m</span>
          </div>
        `;
      }

      return `
        <div class="habit-card ${log.completed ? 'completed' : ''}" data-habit-id="${habit.id}">
          <div class="habit-main">
            <div class="habit-emoji-box">${habit.emoji}</div>
            <div class="habit-details">
              <div class="habit-title-row">
                <span class="habit-name">${this.escapeHtml(habit.name)}</span>
                <span class="category-tag" style="background: ${categoryMeta.bg}; color: ${categoryMeta.color};">
                  ${categoryMeta.icon} ${habit.category}
                </span>
              </div>
              <div class="habit-meta">
                <span class="streak-pill" title="Current streak">
                  🔥 ${streaks.currentStreak}d streak
                </span>
                <span>• Best: ${streaks.longestStreak}d</span>
                <span>• ${habit.targetFrequency === 'daily' ? 'Daily' : `${habit.weeklyTargetDays}d / wk`}</span>
              </div>
            </div>
          </div>

          <div class="habit-actions">
            ${actionControlHtml}

            <!-- Completion Checkbox / Toggle Button -->
            <button class="complete-toggle-btn ${log.completed ? 'checked' : ''}" 
                    data-action="toggle-complete" 
                    data-id="${habit.id}" 
                    title="${log.completed ? 'Undo Completion' : 'Mark as Completed'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>

            <!-- Edit / Delete actions -->
            <button class="habit-more-btn" data-action="edit-habit" data-id="${habit.id}" title="Edit Habit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="habit-more-btn" data-action="delete-habit" data-id="${habit.id}" title="Delete Habit" style="color: var(--color-danger);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event handlers
    this.bindHabitCardEvents(container, dateKey);
  },

  bindHabitCardEvents(container, dateKey) {
    container.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', (e) => {
        const action = el.getAttribute('data-action');
        const habitId = el.getAttribute('data-id');

        if (action === 'toggle-complete') {
          const log = StorageService.getHabitLog(habitId, dateKey);
          const newStatus = !log?.completed;
          StorageService.setHabitCompletion(habitId, dateKey, newStatus);

          if (newStatus) {
            this.playChime();
            this.showToast('Habit completed! Keep going! 🚀', 'success');
            this.checkAllCompletedCelebration(dateKey);
          } else {
            this.showToast('Completion undone.', 'info');
          }

          this.refreshAllStatsAndUI();
        } else if (action === 'counter-inc') {
          const updated = StorageService.updateHabitCounter(habitId, dateKey, 1);
          if (updated.completed) {
            this.playChime();
            this.showToast('Target reached! 🎉', 'success');
            this.checkAllCompletedCelebration(dateKey);
          }
          this.refreshAllStatsAndUI();
        } else if (action === 'counter-dec') {
          StorageService.updateHabitCounter(habitId, dateKey, -1);
          this.refreshAllStatsAndUI();
        } else if (action === 'duration-add') {
          const minsToAdd = Number(el.getAttribute('data-mins')) || 15;
          const currentLog = StorageService.getHabitLog(habitId, dateKey);
          const currentMins = currentLog?.duration || 0;
          const updated = StorageService.updateHabitDuration(habitId, dateKey, currentMins + minsToAdd);

          if (updated.completed && !currentLog?.completed) {
            this.playChime();
            this.showToast(`Logged +${minsToAdd}m! Goal reached! 🎯`, 'success');
            this.checkAllCompletedCelebration(dateKey);
          } else {
            this.showToast(`Logged +${minsToAdd} minutes.`, 'info');
          }
          this.refreshAllStatsAndUI();
        } else if (action === 'edit-habit') {
          this.openHabitModal(habitId);
        } else if (action === 'delete-habit') {
          const habit = StorageService.getHabits().find(h => h.id === habitId);
          this.openConfirmModal(
            `Delete "${habit?.name}"?`,
            'This will permanently remove this habit and all its logged history.',
            () => {
              StorageService.deleteHabit(habitId);
              this.showToast('Habit deleted successfully.', 'info');
              this.refreshAllStatsAndUI();
            }
          );
        }
      });
    });
  },

  /* ==========================================================================
     View 3: Weekly Progress View Rendering
     ========================================================================== */
  renderWeeklyView() {
    const weeklyData = AnalyticsService.getWeeklyProgress(this.weeklyRefDate);
    const comparison = AnalyticsService.getWeekOverWeekComparison(this.weeklyRefDate);
    const habits = StorageService.getHabits();

    // Week selector label
    const startObj = parseKeyToDate(weeklyData.weekRange.startDate);
    const endObj = parseKeyToDate(weeklyData.weekRange.endDate);
    const labelStr = `${startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    document.getElementById('currentWeekRangeLabel').textContent = labelStr;

    // Week-over-week badge
    const badge = document.getElementById('weekOverWeekBadge');
    if (badge) {
      if (comparison.diff >= 0) {
        badge.style.background = 'var(--color-success-light)';
        badge.style.color = 'var(--color-success)';
        badge.textContent = `+${comparison.diff}% vs previous week ↑`;
      } else {
        badge.style.background = 'var(--color-danger-light)';
        badge.style.color = 'var(--color-danger)';
        badge.textContent = `${comparison.diff}% vs previous week ↓`;
      }
    }

    // Weekly summary stat cards
    document.getElementById('weeklyCompletionPct').textContent = `${weeklyData.completionRate}%`;
    document.getElementById('weeklyTotalCompletedCount').textContent = `${weeklyData.completedInstances} / ${weeklyData.expectedInstances}`;

    if (weeklyData.bestHabit) {
      document.getElementById('weeklyBestHabit').textContent = `${weeklyData.bestHabit.emoji} ${weeklyData.bestHabit.name}`;
      document.getElementById('weeklyBestHabitRate').textContent = `${weeklyData.bestHabit.rate}% adherence`;
    } else {
      document.getElementById('weeklyBestHabit').textContent = '—';
      document.getElementById('weeklyBestHabitRate').textContent = 'No habits yet';
    }

    if (weeklyData.leastHabit) {
      document.getElementById('weeklyLeastHabit').textContent = `${weeklyData.leastHabit.emoji} ${weeklyData.leastHabit.name}`;
      document.getElementById('weeklyLeastHabitRate').textContent = `${weeklyData.leastHabit.rate}% adherence`;
    } else {
      document.getElementById('weeklyLeastHabit').textContent = '—';
      document.getElementById('weeklyLeastHabitRate').textContent = 'No habits yet';
    }

    // Render Weekly Matrix Table Headers (Mon - Sun with date numbers)
    const headerRow = document.getElementById('weeklyMatrixHeaderRow');
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    headerRow.innerHTML = `
      <th class="habit-col">Habit Routine</th>
      ${weeklyData.weekRange.days.map((dKey, idx) => {
        const dObj = parseKeyToDate(dKey);
        const dayNum = dObj.getDate();
        const isToday = dKey === formatDateToKey(new Date());
        return `
          <th style="${isToday ? 'color: var(--color-primary);' : ''}">
            <div class="weekly-day-cell">
              <span class="weekly-day-name">${dayNames[idx]}</span>
              <span class="weekly-day-num">${dayNum}</span>
            </div>
          </th>
        `;
      }).join('')}
      <th>Weekly Rate</th>
    `;

    // Render Table Body Rows
    const tbody = document.getElementById('weeklyMatrixTableBody');
    if (habits.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="padding: 2rem; color: var(--text-muted);">No habits recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = habits.map(habit => {
      const perf = weeklyData.habitPerformances[habit.id];
      const rate = perf?.expectedDays > 0 ? Math.round((perf.completedDays / perf.expectedDays) * 100) : 0;

      const cells = weeklyData.weekRange.days.map(dKey => {
        const status = perf?.dayStatus[dKey] || 'future';
        let badgeContent = '';

        if (status === 'completed') {
          badgeContent = `<span class="matrix-status-badge status-completed" title="Completed on ${dKey}">✓</span>`;
        } else if (status === 'missed') {
          badgeContent = `<span class="matrix-status-badge status-missed" title="Missed on ${dKey}">✕</span>`;
        } else {
          badgeContent = `<span class="matrix-status-badge status-future" title="Upcoming day">—</span>`;
        }

        return `<td>${badgeContent}</td>`;
      }).join('');

      return `
        <tr>
          <td class="habit-col">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span style="font-size: 1.3rem;">${habit.emoji}</span>
              <div>
                <strong style="color: var(--text-main); font-size: 0.95rem;">${this.escapeHtml(habit.name)}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${habit.category}</div>
              </div>
            </div>
          </td>
          ${cells}
          <td>
            <strong style="font-size: 0.95rem; color: ${rate >= 80 ? 'var(--color-success)' : (rate >= 50 ? 'var(--color-primary)' : 'var(--color-warning)')};">
              ${rate}%
            </strong>
          </td>
        </tr>
      `;
    }).join('');

    // Render Weekly Detail Bar Chart
    ChartsManager.renderWeeklyChart('weeklyBarDetailChart', weeklyData);

    // Bind Week Navigation Buttons
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const currentWeekBtn = document.getElementById('currentWeekBtn');

    if (prevWeekBtn) {
      prevWeekBtn.onclick = () => {
        this.weeklyRefDate.setDate(this.weeklyRefDate.getDate() - 7);
        this.renderWeeklyView();
      };
    }
    if (nextWeekBtn) {
      nextWeekBtn.onclick = () => {
        this.weeklyRefDate.setDate(this.weeklyRefDate.getDate() + 7);
        this.renderWeeklyView();
      };
    }
    if (currentWeekBtn) {
      currentWeekBtn.onclick = () => {
        this.weeklyRefDate = new Date();
        this.renderWeeklyView();
      };
    }
  },

  /* ==========================================================================
     View 4: Calendar View Rendering
     ========================================================================== */
  renderCalendarView() {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const calData = AnalyticsService.getMonthlyCalendarData(year, month);

    // Title
    document.getElementById('calendarMonthYearTitle').textContent = `${calData.monthName} ${calData.year}`;

    // Grid cells
    const grid = document.getElementById('calendarDaysGrid');
    grid.innerHTML = calData.days.map(d => {
      let statusClass = 'cal-future';
      let statusText = '';

      if (!d.isFuture && d.isCurrentMonth) {
        if (d.stats.completionRate === 100 && d.stats.totalHabits > 0) {
          statusClass = 'cal-full';
          statusText = '100%';
        } else if (d.stats.completionRate > 0) {
          statusClass = 'cal-partial';
          statusText = `${d.stats.completionRate}%`;
        } else {
          statusClass = 'cal-empty';
          statusText = '0%';
        }
      }

      return `
        <div class="calendar-day-cell ${!d.isCurrentMonth ? 'other-month' : ''} ${d.isToday ? 'is-today' : ''}" 
             data-date="${d.dateKey}" 
             title="${d.dateKey}: ${d.stats.completedCount}/${d.stats.totalHabits} done">
          <span class="cal-day-num">${d.dayNumber}</span>
          ${statusText ? `<span class="cal-day-status-pill ${statusClass}">${statusText}</span>` : ''}
        </div>
      `;
    }).join('');

    // Attach click listener on day cells to open Day Detail Modal
    grid.querySelectorAll('.calendar-day-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const dateKey = cell.getAttribute('data-date');
        this.openDayDetailModal(dateKey);
      });
    });

    // Month Navigation
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const todayMonthBtn = document.getElementById('todayMonthBtn');

    if (prevMonthBtn) {
      prevMonthBtn.onclick = () => {
        this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
        this.renderCalendarView();
      };
    }
    if (nextMonthBtn) {
      nextMonthBtn.onclick = () => {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
        this.renderCalendarView();
      };
    }
    if (todayMonthBtn) {
      todayMonthBtn.onclick = () => {
        this.calendarDate = new Date();
        this.renderCalendarView();
      };
    }
  },

  /* ==========================================================================
     View 5: Analytics View Rendering
     ========================================================================== */
  renderAnalyticsView() {
    const trendData = AnalyticsService.getTrendData(14);
    const categoryStats = AnalyticsService.getCategoryStats(14);
    const habits = StorageService.getHabits();

    // Render Trend line chart & Category donut
    ChartsManager.renderTrendChart('analyticsTrendChart', trendData);
    ChartsManager.renderCategoryDonut('categoryDonutChart', categoryStats);

    // Consistency Leaderboard
    const leaderboard = document.getElementById('analyticsLeaderboardList');
    if (habits.length === 0) {
      leaderboard.innerHTML = `<div style="color: var(--text-muted); padding: 1rem;">No habits to display.</div>`;
      return;
    }

    // Rank habits by consistency rate over last 14 days
    const rankedHabits = habits.map(habit => {
      const streaks = AnalyticsService.getHabitStreaks(habit.id);
      let completedIn14 = 0;
      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (StorageService.getHabitLog(habit.id, formatDateToKey(d))?.completed) {
          completedIn14++;
        }
      }
      const adherenceRate = Math.round((completedIn14 / 14) * 100);
      return {
        habit,
        streaks,
        completedIn14,
        adherenceRate
      };
    }).sort((a, b) => b.adherenceRate - a.adherenceRate);

    leaderboard.innerHTML = rankedHabits.map((item, idx) => `
      <div class="leaderboard-item">
        <div style="display: flex; align-items: center;">
          <span class="rank-badge">${idx + 1}</span>
          <span style="font-size: 1.4rem; margin-right: 0.75rem;">${item.habit.emoji}</span>
          <div>
            <strong style="font-size: 0.95rem; color: var(--text-main);">${this.escapeHtml(item.habit.name)}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${item.habit.category} • Completed ${item.completedIn14}/14 past days</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <div style="text-align: right;">
            <div style="font-weight: 800; font-size: 0.95rem; color: #F59E0B;">🔥 ${item.streaks.currentStreak}d Streak</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Best: ${item.streaks.longestStreak}d</div>
          </div>
          <div style="min-width: 65px; text-align: right;">
            <span style="font-size: 1.15rem; font-weight: 800; color: ${item.adherenceRate >= 80 ? 'var(--color-success)' : 'var(--color-primary)'};">
              ${item.adherenceRate}%
            </span>
          </div>
        </div>
      </div>
    `).join('');
  },

  /* ==========================================================================
     View 6: Settings View & Backup Operations
     ========================================================================== */
  renderSettingsView() {
    const settings = StorageService.getSettings();
    document.getElementById('settingUserName').value = settings.userName || '';
    document.getElementById('settingTargetRate').value = settings.weeklyTargetRate || 80;
    document.getElementById('settingConfetti').checked = settings.confettiEnabled !== false;
  },

  bindSettingsAndBackups() {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          userName: document.getElementById('settingUserName').value.trim() || 'Achiever',
          weeklyTargetRate: Number(document.getElementById('settingTargetRate').value) || 80,
          confettiEnabled: document.getElementById('settingConfetti').checked
        };
        StorageService.saveSettings(updated);
        this.showToast('Settings saved successfully!', 'success');
      });
    }

    // Export Data JSON
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = StorageService.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habitpulse_backup_${formatDateToKey(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('Backup file exported successfully!', 'success');
      });
    }

    // Import Data JSON
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            StorageService.importData(event.target.result);
            this.showToast('Backup successfully restored!', 'success');
            this.refreshAllStatsAndUI();
          } catch (err) {
            this.showToast(`Import error: ${err.message}`, 'error');
          }
          importFileInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    // Clear Activity Logs Only
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        this.openConfirmModal(
          'Clear Activity History?',
          'This will remove all logged completions and counter records while keeping your habit routines intact.',
          () => {
            StorageService.clearAllLogs();
            this.showToast('Activity history cleared successfully.', 'info');
            this.refreshAllStatsAndUI();
          }
        );
      });
    }

    // Reset Data
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.openConfirmModal(
          'Reset All Data?',
          'Are you sure you want to reset all habits and tracking records? Default sample data will be restored.',
          () => {
            StorageService.resetAllData();
            this.showToast('Reset completed! Sample data restored.', 'info');
            this.refreshAllStatsAndUI();
          }
        );
      });
    }
  },

  /* ==========================================================================
     Habit Add / Edit Modal Dialog
     ========================================================================== */
  bindHabitModal() {
    const modal = document.getElementById('habitModal');
    const closeBtn = document.getElementById('closeHabitModalBtn');
    const cancelBtn = document.getElementById('cancelHabitBtn');
    const habitForm = document.getElementById('habitForm');
    const habitTypeSelect = document.getElementById('habitTypeSelect');
    const habitFrequencySelect = document.getElementById('habitFrequencySelect');
    const targetValueGroup = document.getElementById('targetValueGroup');
    const targetValueLabel = document.getElementById('targetValueLabel');
    const habitWeeklyDaysInput = document.getElementById('habitWeeklyDaysInput');
    const emojiGrid = document.getElementById('emojiSelectorGrid');
    const habitEmojiInput = document.getElementById('habitEmojiInput');

    // Populate preset emojis in modal
    if (emojiGrid) {
      emojiGrid.innerHTML = POPULAR_EMOJIS.map(emoji => `
        <button type="button" class="emoji-opt" data-emoji="${emoji}">${emoji}</button>
      `).join('');

      emojiGrid.querySelectorAll('.emoji-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          const emoji = opt.getAttribute('data-emoji');
          habitEmojiInput.value = emoji;
          emojiGrid.querySelectorAll('.emoji-opt').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        });
      });
    }

    // Toggle target inputs based on type
    if (habitTypeSelect) {
      habitTypeSelect.addEventListener('change', () => {
        const val = habitTypeSelect.value;
        if (val === 'counter') {
          targetValueGroup.style.display = 'block';
          targetValueLabel.textContent = 'Daily Counter Target & Unit';
          document.getElementById('habitTargetValueInput').value = '8';
          document.getElementById('habitUnitInput').value = 'glasses';
        } else if (val === 'duration') {
          targetValueGroup.style.display = 'block';
          targetValueLabel.textContent = 'Daily Duration Target (minutes)';
          document.getElementById('habitTargetValueInput').value = '30';
          document.getElementById('habitUnitInput').value = 'mins';
        } else {
          targetValueGroup.style.display = 'none';
        }
      });
    }

    // Toggle weekly days input
    if (habitFrequencySelect) {
      habitFrequencySelect.addEventListener('change', () => {
        habitWeeklyDaysInput.style.display = habitFrequencySelect.value === 'weekly' ? 'block' : 'none';
      });
    }

    // Close buttons
    [closeBtn, cancelBtn].forEach(b => {
      if (b) b.addEventListener('click', () => modal.close());
    });

    // Save habit form submission
    if (habitForm) {
      habitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          const habitData = {
            name: document.getElementById('habitNameInput').value,
            emoji: document.getElementById('habitEmojiInput').value || '⭐',
            category: document.getElementById('habitCategorySelect').value,
            type: document.getElementById('habitTypeSelect').value,
            targetValue: document.getElementById('habitTargetValueInput').value,
            unit: document.getElementById('habitUnitInput').value,
            targetFrequency: document.getElementById('habitFrequencySelect').value,
            weeklyTargetDays: document.getElementById('habitWeeklyDaysInput').value
          };

          if (this.editingHabitId) {
            StorageService.updateHabit(this.editingHabitId, habitData);
            this.showToast('Habit updated successfully!', 'success');
          } else {
            StorageService.addHabit(habitData);
            this.showToast('New habit created!', 'success');
          }

          modal.close();
          this.refreshAllStatsAndUI();
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }
  },

  openHabitModal(habitId = null) {
    const modal = document.getElementById('habitModal');
    const title = document.getElementById('habitModalTitle');
    const habitForm = document.getElementById('habitForm');
    const targetValueGroup = document.getElementById('targetValueGroup');
    const habitWeeklyDaysInput = document.getElementById('habitWeeklyDaysInput');

    habitForm.reset();
    this.editingHabitId = habitId;

    if (habitId) {
      title.textContent = 'Edit Habit';
      const habit = StorageService.getHabits().find(h => h.id === habitId);
      if (!habit) return;

      document.getElementById('habitNameInput').value = habit.name;
      document.getElementById('habitEmojiInput').value = habit.emoji || '⭐';
      document.getElementById('habitCategorySelect').value = habit.category;
      document.getElementById('habitTypeSelect').value = habit.type;
      document.getElementById('habitFrequencySelect').value = habit.targetFrequency;
      document.getElementById('habitWeeklyDaysInput').value = habit.weeklyTargetDays || 7;
      document.getElementById('habitTargetValueInput').value = habit.targetValue || 1;
      document.getElementById('habitUnitInput').value = habit.unit || '';

      targetValueGroup.style.display = habit.type === 'binary' ? 'none' : 'block';
      habitWeeklyDaysInput.style.display = habit.targetFrequency === 'weekly' ? 'block' : 'none';
    } else {
      title.textContent = 'Create New Habit';
      document.getElementById('habitEmojiInput').value = '⭐';
      document.getElementById('habitTypeSelect').value = 'binary';
      targetValueGroup.style.display = 'none';
      habitWeeklyDaysInput.style.display = 'none';
    }

    modal.showModal();
  },

  /* ==========================================================================
     Calendar Day Details Modal Dialog
     ========================================================================== */
  bindDayDetailModal() {
    const modal = document.getElementById('dayDetailModal');
    const closeBtn = document.getElementById('closeDayDetailModalBtn');
    const doneBtn = document.getElementById('doneDayDetailBtn');

    [closeBtn, doneBtn].forEach(b => {
      if (b) b.addEventListener('click', () => modal.close());
    });
  },

  openDayDetailModal(dateKey) {
    const modal = document.getElementById('dayDetailModal');
    const dateObj = parseKeyToDate(dateKey);
    const title = document.getElementById('dayDetailDateTitle');
    const sub = document.getElementById('dayDetailSub');

    title.textContent = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const stats = AnalyticsService.getDailyStats(dateKey);
    sub.textContent = `${stats.completedCount} of ${stats.totalHabits} habits completed (${stats.completionRate}%)`;

    // Render list for that date
    this.renderHabitsChecklist('dayDetailHabitsList', dateKey);

    modal.showModal();
  },

  /* ==========================================================================
     Confirmation Modal Dialog
     ========================================================================== */
  bindConfirmModal() {
    const modal = document.getElementById('confirmModal');
    const closeBtn = document.getElementById('closeConfirmModalBtn');
    const cancelBtn = document.getElementById('cancelConfirmBtn');
    const proceedBtn = document.getElementById('proceedConfirmBtn');

    [closeBtn, cancelBtn].forEach(b => {
      if (b) b.addEventListener('click', () => modal.close());
    });

    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        if (typeof this.confirmCallback === 'function') {
          this.confirmCallback();
        }
        modal.close();
      });
    }
  },

  openConfirmModal(titleText, messageText, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmModalTitle').textContent = titleText;
    document.getElementById('confirmModalMessage').textContent = messageText;
    this.confirmCallback = onConfirm;
    modal.showModal();
  },

  /* ==========================================================================
     Toast Notifications
     ========================================================================== */
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${this.escapeHtml(message)}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 3200);
  },

  /* ==========================================================================
     Celebration & Audio Effects
     ========================================================================== */
  playChime() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.12); // A5

        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio autoplay restrictions safe ignore
    }
  },

  checkAllCompletedCelebration(dateKey) {
    const stats = AnalyticsService.getDailyStats(dateKey);
    const settings = StorageService.getSettings();

    if (stats.completionRate === 100 && stats.totalHabits > 0 && settings.confettiEnabled !== false) {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      this.showToast('🎉 Incredible! All habits completed for the day!', 'success');
    }
  },

  /* ==========================================================================
     Re-render & Refresh Helpers
     ========================================================================== */
  refreshAllStatsAndUI() {
    this.renderActiveView();
  },

  refreshCharts() {
    const weeklyData = AnalyticsService.getWeeklyProgress(this.weeklyRefDate);
    const trendData = AnalyticsService.getTrendData(14);
    const categoryStats = AnalyticsService.getCategoryStats(14);
    ChartsManager.refreshOnThemeChange(weeklyData, trendData, categoryStats);
  },

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

// Initialize App on DOM load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
