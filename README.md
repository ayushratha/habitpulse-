# HabitPulse — Modern Daily Habit Tracker

An elegant, responsive Daily Habit Tracker and Analytics web application built with HTML5, CSS3, JavaScript (ES6+), and Chart.js.

![HabitPulse Preview](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Features

### 1. 📊 Interactive Dashboard
- **Motivational Hero Banner**: Dynamic greeting and quote tailored to your current completion percentage (0%, 1–49%, 50–79%, 80–99%, 100%).
- **Animated SVG Progress Ring**: Circular indicator displaying today's completion percentage with smooth CSS transitions.
- **Real-Time Key Metrics**:
  - Total active habits
  - Habits completed today
  - Daily completion percentage
  - Current streak & best streak
  - Weekly progress percentage & scheduled completion count
- **Quick Habit Checklist**: Mark habits as done, adjust water counter, or log duration directly from the dashboard.
- **Weekly Consistency Chart**: Overview bar chart of daily adherence across the week.

### 2. ⚡ Habit Management
- **Add / Edit / Delete Habits**:
  - Custom habit names with duplicate prevention.
  - Emoji picker with curated presets and support for custom emojis.
  - Category assignment (Health, Fitness, Education, Productivity, Personal Development).
  - Tracking types:
    - **Simple Checkbox** (Binary Done / Undone)
    - **Numerical Counter** (e.g., 8 glasses of water with `+` and `-` buttons)
    - **Duration Tracker** (e.g., 30 mins study or workout with `+15m` and `+30m` quick chips)
  - Target frequency (Daily or custom weekly target days).
- **Default Seed Habits**:
  - 📚 Reading (Education)
  - 🏋️ Exercise (Fitness, 30 min target)
  - 💻 Study (Productivity, 45 min target)
  - 💧 Water Intake (Health, 8 glasses target)
  - 🧘 Meditation (Personal Development)
  - 😴 Sleep on Time (Health)

### 3. 🗓️ Daily Checklist
- Complete or undo completion for any day.
- Date navigation (Previous Day, Next Day, Today, or Jump to Date with date picker).
- Filter habits by category pills (All, Health, Fitness, Education, Productivity, Personal Development).
- The app starts with sample activity for the previous 14 days so you can explore the charts. You can clear it from Settings.

### 4. 📅 Weekly Matrix & Progress
- **Monday–Sunday Matrix Grid**: Matrix of habits vs days with date numbers.
- **Visual Status Badges**:
  - `✓` Green checkmark for completed instances
  - `✕` Soft red badge for missed scheduled past days
  - `—` Neutral dashed indicator for future days (future dates are never counted as missed!)
- **Calculation Formula**:
  Weekly completion (%) = completed scheduled instances ÷ expected scheduled instances × 100
- **Weekly Insights**:
  - Best-performing habit
  - Least-consistent habit
  - Week-over-week adherence change (±X%)
  - Day-by-day comparison bar chart

### 5. 📆 Monthly Heatmap Calendar
- Full month calendar grid (Monday-first layout).
- Day cells with color-coded badges:
  - 🟢 **100% Done**: All scheduled habits completed
  - 🟡 **Partial**: Some habits completed
  - ⚪ **0%**: Past day with no completions
  - 🔘 **Future**: Upcoming days
- **Click to Inspect/Edit**: Click any date cell to open a Day Detail modal and inspect or toggle completions for that date.

### 6. 📈 Performance Analytics
- **14-Day Completion Trajectory**: Smooth gradient area line chart powered by Chart.js.
- **Category Distribution**: Doughnut chart showing habit completion counts per category.
- **Consistency Leaderboard**: Habits ranked by 14-day adherence rate, current streak, and records.

### 7. 🎨 Design & Accessibility
- Clean glassmorphism with curated color palette:
  - Background: `#F8FAFC` (Dark: `#0B0F19`)
  - Primary: `#FF6E54` (Salmon Orange)
  - Success: `#22C55E` (Emerald)
  - Cards: `#FFFFFF` (Dark: `#131B2E`)
  - Text: `#0F172A` (Dark: `#F8FAFC`)
- Responsive across Mobile, Tablet, and Desktop:
  - Desktop: Fixed sidebar with active indicator pills.
  - Mobile: Fixed bottom navigation bar with compact layout.
- Modal dialogs use the native HTML `<dialog>` element with keyboard dismissal (Escape key), backdrop click dismissal, and focus handling.
- Sound effects via Web Audio API and confetti celebration via `canvas-confetti` when reaching 100% daily completion.

### 8. 💾 Data Persistence & Backup
- **localStorage persistence**:
  - `habitTracker_habits_v1`
  - `habitTracker_logs_v1`
  - `habitTracker_settings_v1`
  - `habitTracker_theme_v1`
- **Timezone-safe**: Formats all date keys as local `YYYY-MM-DD` strings to prevent UTC timezone offset drift.
- **Export & Import**: Download your data as JSON or restore backups across devices. Importing a backup replaces the data currently stored in this browser. Export a backup first if you want to keep it.
- **Clear & Reset Options**: Clear past activity history or reset back to default habits with confirmation.

---

## 🔒 Data and Privacy

Habits and logs are stored in this browser’s local storage. They are not synced between browsers or devices. Export a backup before clearing browser data or switching devices.

---

## 🚀 How to Run Locally

The app requires an internet connection to load its charting and celebration libraries.

### Option 1: Any Web Browser (No installation needed)
Since this is a client-side application built with HTML, CSS, and JavaScript:
Open [index.html](index.html) in your browser.

### Option 2: Using Python's Built-in Server
Open PowerShell in the project directory:
```powershell
python -m http.server 8080
```
Then navigate to:
```
http://localhost:8080
```

### Option 3: Using Node / npx
```powershell
npx serve .
```

---

## 📁 File Structure

```
ppht/
├── index.html            # Main HTML5 application shell & dialogs
├── README.md             # Documentation & running instructions
├── LICENSE               # MIT License
├── css/
│   └── styles.css        # CSS variables, glassmorphic styling, responsive layouts
└── js/
    ├── storage.js        # LocalStorage repository, date helpers, seed history
    ├── analytics.js      # Streak engine, weekly formulas, category stats
    ├── charts.js         # Chart.js visualization management & theme synchronization
    └── app.js            # Controller, UI rendering, event routing, modals, audio
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
