/**
 * Chart.js Visualizations Manager for Daily Habit Tracker
 * Handles responsive charts, dark/light theme switching, and smooth animations.
 */

const ChartsManager = {
  instances: {
    weeklyBar: null,
    trendsLine: null,
    categoryDonut: null
  },

  // Color theme helpers based on active theme
  getColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      textColor: isDark ? '#94A3B8' : '#64748B',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
      cardBg: isDark ? '#1E293B' : '#FFFFFF',
      primary: '#FF6E54',
      primaryLight: isDark ? 'rgba(255, 110, 84, 0.25)' : 'rgba(255, 110, 84, 0.15)',
      success: '#22C55E',
      successLight: isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.15)'
    };
  },

  /**
   * Render or update Weekly Daily Completion Chart
   */
  renderWeeklyChart(canvasId, weeklyData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.instances.weeklyBar) {
      this.instances.weeklyBar.destroy();
    }

    const colors = this.getColors();
    const labels = weeklyData.dailyBreakdown.map(d => {
      const date = parseKeyToDate(d.dateKey);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const rates = weeklyData.dailyBreakdown.map(d => d.isFuture ? null : d.rate);
    const backgroundColors = weeklyData.dailyBreakdown.map(d => {
      if (d.isFuture) return 'rgba(148, 163, 184, 0.1)';
      if (d.rate >= 100) return '#22C55E';
      if (d.rate >= 50) return '#FF6E54';
      return '#F59E0B';
    });

    this.instances.weeklyBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Completion %',
          data: rates,
          backgroundColor: backgroundColors,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 36
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.cardBg,
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            borderColor: colors.gridColor,
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const day = weeklyData.dailyBreakdown[context.dataIndex];
                if (day.isFuture) return 'Upcoming day';
                return `Completed: ${day.completed}/${day.total} habits (${context.parsed.y}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Plus Jakarta Sans, Inter, sans-serif', weight: 600 } }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              stepSize: 25,
              callback: (val) => `${val}%`,
              font: { family: 'Plus Jakarta Sans, Inter, sans-serif' }
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeOutQuart'
        }
      }
    });
  },

  /**
   * Render or update 14-Day Completion Trend Line Chart
   */
  renderTrendChart(canvasId, trendData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.instances.trendsLine) {
      this.instances.trendsLine.destroy();
    }

    const colors = this.getColors();
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(255, 110, 84, 0.45)');
    gradient.addColorStop(1, 'rgba(255, 110, 84, 0.0)');

    this.instances.trendsLine = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [{
          label: 'Daily Completion Rate',
          data: trendData.rates,
          borderColor: '#FF6E54',
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#FF6E54',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.cardBg,
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            borderColor: colors.gridColor,
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => `Daily Completion: ${context.parsed.y}%`
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor, font: { family: 'Plus Jakarta Sans, Inter, sans-serif' } }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              stepSize: 25,
              callback: (val) => `${val}%`,
              font: { family: 'Plus Jakarta Sans, Inter, sans-serif' }
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutCubic'
        }
      }
    });
  },

  /**
   * Render Category-wise completion doughnut chart
   */
  renderCategoryDonut(canvasId, categoryStats) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.instances.categoryDonut) {
      this.instances.categoryDonut.destroy();
    }

    const colors = this.getColors();
    const filteredCats = categoryStats.filter(c => c.totalHabits > 0 || c.completedInstances > 0);

    const labels = filteredCats.map(c => `${c.icon} ${c.name}`);
    const dataValues = filteredCats.map(c => c.completedInstances);
    const bgColors = filteredCats.map(c => c.color);

    this.instances.categoryDonut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues.length > 0 ? dataValues : [1],
          backgroundColor: dataValues.length > 0 ? bgColors : ['#CBD5E1'],
          borderWidth: 3,
          borderColor: colors.cardBg,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.textColor,
              padding: 14,
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              font: { family: 'Plus Jakarta Sans, Inter, sans-serif', weight: 500 }
            }
          },
          tooltip: {
            backgroundColor: colors.cardBg,
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            borderColor: colors.gridColor,
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const cat = filteredCats[context.dataIndex];
                if (!cat) return 'No data';
                return `${cat.name}: ${cat.completedInstances} completions (${cat.rate}%)`;
              }
            }
          }
        },
        animation: {
          duration: 900,
          easing: 'easeOutQuart'
        }
      }
    });
  },

  /**
   * Re-render all charts when theme changes
   */
  refreshOnThemeChange(currentWeeklyData, currentTrendData, currentCategoryStats) {
    if (currentWeeklyData && this.instances.weeklyBar) {
      this.renderWeeklyChart('weeklyProgressChart', currentWeeklyData);
    }
    if (currentTrendData && this.instances.trendsLine) {
      this.renderTrendChart('analyticsTrendChart', currentTrendData);
    }
    if (currentCategoryStats && this.instances.categoryDonut) {
      this.renderCategoryDonut('categoryDonutChart', currentCategoryStats);
    }
  }
};

window.ChartsManager = ChartsManager;
