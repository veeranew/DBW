/**
 * VitalTrack Pro - Core Interactive Application Engine
 * Handles State, LocalStorage Sync, Health Metrics Calculations, SVG Charts, and PDF Reports.
 */

class VitalTrackApp {
    constructor() {
        this.currentScreen = 'dashboard';
        this.isDarkMode = true;
        this.isLargeFont = false;
        
        // Initializing user profile state
        this.userProfile = {
            name: "John Doe",
            age: 52,
            gender: "MALE",
            heightCm: 177,
            weightGoalKg: 72.0,
            startWeightKg: 79.0
        };

        // Pre-loaded realistic health data records
        this.bloodSugarLogs = [
            { id: "bs_1", timestamp: Date.now() - 3600000 * 2, value: 105, context: "FASTING", notes: "Felt great upon waking" },
            { id: "bs_2", timestamp: Date.now() - 3600000 * 18, value: 142, context: "AFTER_MEAL", notes: "Post-dinner reading" },
            { id: "bs_3", timestamp: Date.now() - 3600000 * 26, value: 98, context: "FASTING", notes: "Morning measurement" },
            { id: "bs_4", timestamp: Date.now() - 3600000 * 48, value: 118, context: "BEFORE_MEAL", notes: "Before lunch" },
            { id: "bs_5", timestamp: Date.now() - 3600000 * 72, value: 155, context: "AFTER_MEAL", notes: "After pasta meal" },
            { id: "bs_6", timestamp: Date.now() - 3600000 * 96, value: 102, context: "FASTING", notes: "Normal morning" },
            { id: "bs_7", timestamp: Date.now() - 3600000 * 120, value: 110, context: "BEDTIME", notes: "Night routine" }
        ];

        this.bloodPressureLogs = [
            { id: "bp_1", timestamp: Date.now() - 3600000 * 3, systolic: 120, diastolic: 80, pulse: 72, notes: "Morning check" },
            { id: "bp_2", timestamp: Date.now() - 3600000 * 27, systolic: 124, diastolic: 82, pulse: 75, notes: "After afternoon walk" },
            { id: "bp_3", timestamp: Date.now() - 3600000 * 51, systolic: 118, diastolic: 78, pulse: 68, notes: "Rested state" },
            { id: "bp_4", timestamp: Date.now() - 3600000 * 75, systolic: 128, diastolic: 84, pulse: 76, notes: "Slight stress" },
            { id: "bp_5", timestamp: Date.now() - 3600000 * 99, systolic: 122, diastolic: 80, pulse: 70, notes: "Normal" }
        ];

        this.weightLogs = [
            { id: "wt_1", timestamp: Date.now() - 3600000 * 12, weightKg: 74.5, notes: "Post morning workout" },
            { id: "wt_2", timestamp: Date.now() - 3600000 * 84, weightKg: 75.2, notes: "Weekly check" },
            { id: "wt_3", timestamp: Date.now() - 3600000 * 156, weightKg: 76.0, notes: "Progress check" },
            { id: "wt_4", timestamp: Date.now() - 3600000 * 228, weightKg: 77.1, notes: "Starting regime" }
        ];

        this.reminders = [
            { id: "rem_1", title: "Morning Fasting Sugar Check", time: "08:00", category: "LOG", active: true },
            { id: "rem_2", title: "Take Metformin 500mg", time: "08:30", category: "MEDICATION", active: true },
            { id: "rem_3", title: "Evening Blood Pressure Check", time: "19:30", category: "LOG", active: true }
        ];

        this.init();
    }

    init() {
        this.loadLocalStorage();
        this.applyThemeAndFont();
        this.setupEventListeners();
        this.renderAll();
    }

    loadLocalStorage() {
        try {
            const savedProfile = localStorage.getItem('vt_profile');
            if (savedProfile) this.userProfile = JSON.parse(savedProfile);

            const savedSugar = localStorage.getItem('vt_sugar');
            if (savedSugar) this.bloodSugarLogs = JSON.parse(savedSugar);

            const savedBP = localStorage.getItem('vt_bp');
            if (savedBP) this.bloodPressureLogs = JSON.parse(savedBP);

            const savedWeight = localStorage.getItem('vt_weight');
            if (savedWeight) this.weightLogs = JSON.parse(savedWeight);

            const savedRem = localStorage.getItem('vt_reminders');
            if (savedRem) this.reminders = JSON.parse(savedRem);

            const savedTheme = localStorage.getItem('vt_theme');
            if (savedTheme !== null) this.isDarkMode = savedTheme === 'dark';

            const savedFont = localStorage.getItem('vt_font');
            if (savedFont !== null) this.isLargeFont = savedFont === 'large';
        } catch (e) {
            console.warn("LocalStorage parse error, falling back to initial data.", e);
        }
    }

    applyThemeAndFont() {
        document.body.classList.toggle('theme-light', !this.isDarkMode);
        document.body.classList.toggle('theme-dark', this.isDarkMode);
        const icon = document.querySelector('#btn-theme-toggle i');
        if (icon) icon.className = this.isDarkMode ? 'fa-solid fa-moon' : 'fa-solid fa-sun';

        document.body.classList.toggle('font-large', this.isLargeFont);
        document.body.classList.toggle('font-normal', !this.isLargeFont);
    }

    saveState() {
        try {
            localStorage.setItem('vt_profile', JSON.stringify(this.userProfile));
            localStorage.setItem('vt_sugar', JSON.stringify(this.bloodSugarLogs));
            localStorage.setItem('vt_bp', JSON.stringify(this.bloodPressureLogs));
            localStorage.setItem('vt_weight', JSON.stringify(this.weightLogs));
            localStorage.setItem('vt_reminders', JSON.stringify(this.reminders));
            localStorage.setItem('vt_theme', this.isDarkMode ? 'dark' : 'light');
            localStorage.setItem('vt_font', this.isLargeFont ? 'large' : 'normal');
        } catch (e) {
            console.error("Failed to save state to LocalStorage", e);
        }
    }

    setupEventListeners() {
        // ── Event delegation on the stable #app root ──────────────────────
        // This ensures navigation works even after innerHTML re-renders
        // destroy and re-create child elements.
        document.getElementById('app').addEventListener('click', (e) => {
            // Nav tab / bottom-nav item
            const navBtn = e.target.closest('[data-screen]');
            if (navBtn) {
                const screen = navBtn.getAttribute('data-screen');
                if (screen) { this.switchScreen(screen); return; }
            }

            // Avatar → profile
            if (e.target.closest('#btn-open-profile')) {
                this.switchScreen('profile'); return;
            }

            // Quick report button
            if (e.target.closest('#btn-quick-report')) {
                this.switchScreen('reports'); return;
            }

            // Theme toggle
            if (e.target.closest('#btn-theme-toggle')) {
                this.toggleTheme(); return;
            }

            // Font toggle
            if (e.target.closest('#btn-font-scale')) {
                this.toggleFontScale(); return;
            }

            // CSV export
            if (e.target.closest('#btn-export-csv')) {
                this.exportCSV(); return;
            }
        });

        // FAB main toggle
        const fabMain    = document.getElementById('fab-main');
        const fabWrapper = document.querySelector('.fab-wrapper');
        if (fabMain && fabWrapper) {
            fabMain.addEventListener('click', (e) => {
                e.stopPropagation();          // don't let delegation see this
                fabWrapper.classList.toggle('active');
            });

            // Close FAB when clicking OUTSIDE the wrapper
            document.addEventListener('click', (e) => {
                if (fabWrapper.classList.contains('active') && !fabWrapper.contains(e.target)) {
                    fabWrapper.classList.remove('active');
                }
                // NOTE: do NOT preventDefault/stopPropagation here so
                // delegation on #app still processes nav clicks normally.
            });
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyThemeAndFont();
        this.saveState();
    }

    toggleFontScale() {
        this.isLargeFont = !this.isLargeFont;
        this.applyThemeAndFont();
        this.saveState();
    }

    switchScreen(screenName) {
        this.currentScreen = screenName;

        // Hide all screen views
        document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));

        // Remove active state from ALL nav elements (both top tabs and bottom nav)
        document.querySelectorAll('[data-screen]').forEach(b => b.classList.remove('active'));

        // Show the target screen
        const targetView = document.getElementById(`screen-${screenName}`);
        if (targetView) targetView.classList.add('active');

        // Set active class on every element that targets this screen
        document.querySelectorAll(`[data-screen="${screenName}"]`).forEach(b => b.classList.add('active'));

        // Close FAB if open
        document.querySelector('.fab-wrapper')?.classList.remove('active');

        // Refresh content for target screen
        if      (screenName === 'dashboard')     this.renderDashboard();
        else if (screenName === 'bloodsugar')    this.renderSugarScreen();
        else if (screenName === 'bloodpressure') this.renderBPScreen();
        else if (screenName === 'weightbmi')     this.renderWeightScreen();
        else if (screenName === 'reports')       this.updateReportPreview();
        else if (screenName === 'reminders')     this.renderReminders();
        else if (screenName === 'profile')       this.populateProfileForm();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ================= HEALTH METRIC COMPUTATION ENGINES =================

    calculateBMI(weightKg, heightCm) {
        if (!weightKg || !heightCm) return { bmi: 0, category: 'NORMAL' };
        const heightM = heightCm / 100;
        const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

        let category = 'NORMAL';
        if (bmi < 18.5) category = 'UNDERWEIGHT';
        else if (bmi < 25.0) category = 'NORMAL';
        else if (bmi < 30.0) category = 'OVERWEIGHT';
        else category = 'OBESE';

        return { bmi, category };
    }

    getAHABloodPressureCategory(systolic, diastolic) {
        if (systolic > 180 || diastolic > 120) {
            return { stage: "Hypertensive Crisis", color: "var(--color-danger)", class: "pill-danger" };
        } else if (systolic >= 140 || diastolic >= 90) {
            return { stage: "Hypertension Stage 2", color: "var(--color-danger)", class: "pill-danger" };
        } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
            return { stage: "Hypertension Stage 1", color: "var(--color-warning)", class: "pill-warning" };
        } else if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
            return { stage: "Elevated BP", color: "var(--color-warning)", class: "pill-warning" };
        } else {
            return { stage: "Normal BP", color: "var(--color-success)", class: "pill-normal" };
        }
    }

    getSugarStatus(value, context) {
        if (context === 'FASTING') {
            if (value < 70) return { text: "Hypo (Low)", class: "pill-danger" };
            if (value <= 100) return { text: "Normal", class: "pill-normal" };
            if (value <= 125) return { text: "Pre-diabetic", class: "pill-warning" };
            return { text: "High", class: "pill-danger" };
        } else if (context === 'AFTER_MEAL') {
            if (value < 70) return { text: "Low", class: "pill-danger" };
            if (value <= 140) return { text: "Normal", class: "pill-normal" };
            if (value <= 199) return { text: "Elevated", class: "pill-warning" };
            return { text: "High", class: "pill-danger" };
        }
        return (value >= 70 && value <= 130) ? { text: "Normal", class: "pill-normal" } : { text: "Check Reading", class: "pill-warning" };
    }

    // ================= RENDER FUNCTIONS =================

    renderAll() {
        this.renderDashboard();
        this.renderSugarScreen();
        this.renderBPScreen();
        this.renderWeightScreen();
        this.renderReminders();
        this.updateProfileSummaryUI();
    }

    renderDashboard() {
        // Latest Sugar
        const latestSugar = this.bloodSugarLogs[0];
        if (latestSugar) {
            document.getElementById('dash-sugar-val').innerText = latestSugar.value;
            document.getElementById('dash-sugar-context').innerHTML = `<i class="fa-solid fa-tag"></i> ${latestSugar.context.replace('_', ' ')}`;
            document.getElementById('dash-sugar-time').innerText = this.formatTimeAgo(latestSugar.timestamp);

            const status = this.getSugarStatus(latestSugar.value, latestSugar.context);
            const pill = document.getElementById('dash-sugar-pill');
            pill.innerText = status.text;
            pill.className = `status-pill ${status.class}`;
        }

        // Latest BP
        const latestBP = this.bloodPressureLogs[0];
        if (latestBP) {
            document.getElementById('dash-bp-val').innerText = `${latestBP.systolic} / ${latestBP.diastolic}`;
            document.getElementById('dash-bp-pulse').innerText = latestBP.pulse;
            document.getElementById('dash-bp-time').innerText = this.formatTimeAgo(latestBP.timestamp);

            const aha = this.getAHABloodPressureCategory(latestBP.systolic, latestBP.diastolic);
            const pill = document.getElementById('dash-bp-pill');
            pill.innerText = aha.stage;
            pill.className = `status-pill ${aha.class}`;
        }

        // Latest Weight & BMI
        const latestWeight = this.weightLogs[0];
        if (latestWeight) {
            document.getElementById('dash-weight-val').innerText = latestWeight.weightKg;
            document.getElementById('dash-weight-time').innerText = this.formatTimeAgo(latestWeight.timestamp);

            const { bmi, category } = this.calculateBMI(latestWeight.weightKg, this.userProfile.heightCm);
            document.getElementById('dash-bmi-pill').innerText = `BMI ${bmi}`;
            document.getElementById('dash-bmi-cat').innerText = category.replace('_', ' ');

            // Position pointer on mini bar (range 15 to 35)
            const clampedBmi = Math.max(15, Math.min(35, bmi));
            const pct = ((clampedBmi - 15) / (35 - 15)) * 100;
            document.getElementById('dash-bmi-pointer').style.left = `${pct}%`;
        }

        // Sparkline mini charts
        this.renderSparkline('sparkline-sugar', this.bloodSugarLogs.map(l => l.value), 'var(--color-sugar)');
        this.renderSparkline('sparkline-bp', this.bloodPressureLogs.map(l => l.systolic), 'var(--color-bp)');

        // Summary Stats
        if (this.bloodSugarLogs.length > 0) {
            const avgSugar = Math.round(this.bloodSugarLogs.reduce((acc, l) => acc + l.value, 0) / this.bloodSugarLogs.length);
            document.getElementById('summary-avg-sugar').innerText = `${avgSugar} mg/dL`;
        }

        if (this.bloodPressureLogs.length > 0) {
            const avgSys = Math.round(this.bloodPressureLogs.reduce((acc, l) => acc + l.systolic, 0) / this.bloodPressureLogs.length);
            const avgDia = Math.round(this.bloodPressureLogs.reduce((acc, l) => acc + l.diastolic, 0) / this.bloodPressureLogs.length);
            document.getElementById('summary-avg-bp').innerText = `${avgSys}/${avgDia} mmHg`;
        }

        // Recent activity feed
        this.renderRecentActivityFeed();
    }

    renderRecentActivityFeed() {
        const container = document.getElementById('dashboard-recent-logs');
        if (!container) return;

        const allLogs = [
            ...this.bloodSugarLogs.map(l => ({ ...l, type: 'SUGAR' })),
            ...this.bloodPressureLogs.map(l => ({ ...l, type: 'BP' })),
            ...this.weightLogs.map(l => ({ ...l, type: 'WEIGHT' }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

        container.innerHTML = allLogs.map(log => {
            let iconClass = "type-sugar";
            let icon = "fa-droplet";
            let title = "";
            let val = "";

            if (log.type === 'SUGAR') {
                iconClass = "type-sugar";
                icon = "fa-droplet";
                title = `Blood Sugar (${log.context.replace('_', ' ')})`;
                val = `${log.value} mg/dL`;
            } else if (log.type === 'BP') {
                iconClass = "type-bp";
                icon = "fa-heart";
                title = "Blood Pressure & Pulse";
                val = `${log.systolic}/${log.diastolic} mmHg (${log.pulse} bpm)`;
            } else if (log.type === 'WEIGHT') {
                iconClass = "type-weight";
                icon = "fa-weight-scale";
                title = "Weight Log";
                val = `${log.weightKg} kg`;
            }

            return `
                <div class="history-item">
                    <div class="history-icon-type ${iconClass}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="history-item-details">
                        <div class="history-item-val">${val}</div>
                        <div class="history-item-sub">${title} • ${log.notes || 'No notes'}</div>
                    </div>
                    <div class="history-item-sub">${this.formatTimeAgo(log.timestamp)}</div>
                </div>
            `;
        }).join('');
    }

    renderSugarScreen() {
        this.renderSugarChart(7);
        this.renderSugarTable(this.bloodSugarLogs);
    }

    renderSugarTable(logs) {
        const tbody = document.getElementById('sugar-table-body');
        if (!tbody) return;

        tbody.innerHTML = logs.map(log => {
            const status = this.getSugarStatus(log.value, log.context);
            return `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td><strong>${log.value}</strong> mg/dL</td>
                    <td><span class="context-tag">${log.context.replace('_', ' ')}</span></td>
                    <td><span class="status-pill ${status.class}">${status.text}</span></td>
                    <td>${log.notes || '-'}</td>
                    <td>
                        <button class="btn-text" onclick="app.deleteSugarLog('${log.id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    filterSugarLogs() {
        const search = document.getElementById('sugar-search')?.value.toLowerCase() || '';
        const context = document.getElementById('sugar-filter-context')?.value || 'ALL';

        const filtered = this.bloodSugarLogs.filter(log => {
            const matchesSearch = (log.notes && log.notes.toLowerCase().includes(search)) || new Date(log.timestamp).toLocaleDateString().includes(search);
            const matchesContext = (context === 'ALL') || (log.context === context);
            return matchesSearch && matchesContext;
        });

        this.renderSugarTable(filtered);
    }

    renderBPScreen() {
        this.renderBPChart(7);
        const tbody = document.getElementById('bp-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.bloodPressureLogs.map(log => {
            const aha = this.getAHABloodPressureCategory(log.systolic, log.diastolic);
            return `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td><strong>${log.systolic} / ${log.diastolic}</strong> mmHg</td>
                    <td>${log.pulse} bpm</td>
                    <td><span class="status-pill ${aha.class}">${aha.stage}</span></td>
                    <td>${log.notes || '-'}</td>
                    <td>
                        <button class="btn-text" onclick="app.deleteBPLog('${log.id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');

        if (this.bloodPressureLogs.length > 0) {
            const latest = this.bloodPressureLogs[0];
            const aha = this.getAHABloodPressureCategory(latest.systolic, latest.diastolic);
            document.getElementById('current-aha-badge').innerHTML = `<i class="fa-solid fa-heart-circle-check"></i> ${aha.stage} (${latest.systolic}/${latest.diastolic} mmHg)`;
        }
    }

    renderWeightScreen() {
        const latestWeight = this.weightLogs[0] ? this.weightLogs[0].weightKg : 74.5;
        const { bmi, category } = this.calculateBMI(latestWeight, this.userProfile.heightCm);

        document.getElementById('bmi-score-big').innerText = bmi;
        document.getElementById('bmi-cat-big').innerText = category.replace('_', ' ') + " Weight";
        document.getElementById('user-target-weight').innerText = `${this.userProfile.weightGoalKg} kg`;

        // Scale marker position (BMI range 15 to 35)
        const clampedBmi = Math.max(15, Math.min(35, bmi));
        const pct = ((clampedBmi - 15) / (35 - 15)) * 100;
        document.getElementById('bmi-scale-marker').style.left = `${pct}%`;

        // Weight Goal Progress calculation
        const start = this.userProfile.startWeightKg || 79.0;
        const target = this.userProfile.weightGoalKg || 72.0;
        const current = latestWeight;

        const totalToLose = start - target;
        const lostSoFar = start - current;
        const progressPct = Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));

        document.getElementById('weight-goal-progress-fill').style.width = `${progressPct}%`;
        document.getElementById('weight-progress-pct').innerText = `${progressPct}% Achieved`;

        this.renderWeightChart();
    }

    // ================= SVG CHART RENDERING ENGINES =================

    renderSparkline(elementId, dataArray, color) {
        const svg = document.getElementById(elementId);
        if (!svg || dataArray.length < 2) return;

        const min = Math.min(...dataArray) - 5;
        const max = Math.max(...dataArray) + 5;
        const points = dataArray.reverse().map((val, idx) => {
            const x = (idx / (dataArray.length - 1)) * 200;
            const y = 40 - ((val - min) / (max - min)) * 40;
            return `${x},${y}`;
        }).join(' ');

        svg.innerHTML = `<polyline points="${points}" stroke="${color}" />`;
    }

    renderSugarChart(days) {
        const svg = document.getElementById('sugar-main-chart');
        if (!svg) return;

        const logs = [...this.bloodSugarLogs].slice(0, days).reverse();
        if (logs.length === 0) return;

        const minVal = 50;
        const maxVal = 200;
        const width = 800;
        const height = 240;
        const padding = 40;

        // Target band area (70 to 130 mg/dL)
        const y70 = height - padding - ((70 - minVal) / (maxVal - minVal)) * (height - 2 * padding);
        const y130 = height - padding - ((130 - minVal) / (maxVal - minVal)) * (height - 2 * padding);

        let polylinePoints = "";
        let dotsHtml = "";

        logs.forEach((log, idx) => {
            const x = padding + (idx / Math.max(1, logs.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((log.value - minVal) / (maxVal - minVal)) * (height - 2 * padding);
            polylinePoints += `${x},${y} `;
            const dotColor = log.context === 'FASTING' ? 'var(--color-sugar)' : 'var(--color-warning)';
            dotsHtml += `<circle cx="${x}" cy="${y}" r="6" fill="${dotColor}" stroke="#FFF" stroke-width="2"><title>${log.value} mg/dL (${log.context})</title></circle>`;
        });

        svg.innerHTML = `
            <!-- Shaded Target Band (70 - 130) -->
            <rect x="${padding}" y="${y130}" width="${width - 2 * padding}" height="${y70 - y130}" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(16, 185, 129, 0.4)" stroke-dasharray="4" />
            <text x="${width - padding - 10}" y="${y130 - 6}" fill="var(--color-success)" font-size="12" text-anchor="end">Upper Target (130)</text>
            
            <!-- Trend Line -->
            <polyline points="${polylinePoints}" stroke="var(--color-sugar)" stroke-width="3" fill="none" />
            ${dotsHtml}
        `;
    }

    renderBPChart(days) {
        const svg = document.getElementById('bp-main-chart');
        if (!svg) return;

        const logs = [...this.bloodPressureLogs].slice(0, days).reverse();
        if (logs.length === 0) return;

        const width = 800;
        const height = 240;
        const padding = 40;
        const minVal = 40;
        const maxVal = 180;

        let sysPoints = "";
        let diaPoints = "";
        let dots = "";

        logs.forEach((log, idx) => {
            const x = padding + (idx / Math.max(1, logs.length - 1)) * (width - 2 * padding);
            const sysY = height - padding - ((log.systolic - minVal) / (maxVal - minVal)) * (height - 2 * padding);
            const diaY = height - padding - ((log.diastolic - minVal) / (maxVal - minVal)) * (height - 2 * padding);

            sysPoints += `${x},${sysY} `;
            diaPoints += `${x},${diaY} `;

            dots += `<circle cx="${x}" cy="${sysY}" r="5" fill="var(--color-bp)"><title>Systolic: ${log.systolic}</title></circle>`;
            dots += `<circle cx="${x}" cy="${diaY}" r="5" fill="#38BDF8"><title>Diastolic: ${log.diastolic}</title></circle>`;
        });

        svg.innerHTML = `
            <polyline points="${sysPoints}" stroke="var(--color-bp)" stroke-width="3" fill="none" />
            <polyline points="${diaPoints}" stroke="#38BDF8" stroke-width="3" fill="none" />
            ${dots}
        `;
    }

    renderWeightChart() {
        const svg = document.getElementById('weight-main-chart');
        if (!svg) return;

        const logs = [...this.weightLogs].reverse();
        if (logs.length === 0) return;

        const width = 800;
        const height = 220;
        const padding = 40;

        const minW = Math.min(...logs.map(l => l.weightKg)) - 2;
        const maxW = Math.max(...logs.map(l => l.weightKg)) + 2;

        let points = "";
        let dots = "";

        logs.forEach((log, idx) => {
            const x = padding + (idx / Math.max(1, logs.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((log.weightKg - minW) / (maxW - minW)) * (height - 2 * padding);

            points += `${x},${y} `;
            dots += `<circle cx="${x}" cy="${y}" r="6" fill="var(--color-weight)" stroke="#FFF" stroke-width="2"><title>${log.weightKg} kg</title></circle>`;
        });

        svg.innerHTML = `
            <polyline points="${points}" stroke="var(--color-weight)" stroke-width="3" fill="none" />
            ${dots}
        `;
    }

    // ================= MODAL LOGGERS & ACTIONS =================

    openLoggerModal(type) {
        const modal = document.getElementById('logger-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body-content');

        if (type === 'sugar') {
            title.innerHTML = `<i class="fa-solid fa-droplet text-sugar"></i> Log Blood Sugar`;
            body.innerHTML = `
                <form onsubmit="app.saveSugarLog(event)">
                    <div class="form-group">
                        <label>Reading (mg/dL)</label>
                        <input type="number" id="log-sugar-val" class="text-input" value="110" min="20" max="600" required>
                    </div>
                    <div class="form-group">
                        <label>Context</label>
                        <select id="log-sugar-context" class="select-input">
                            <option value="FASTING">Fasting (Morning)</option>
                            <option value="BEFORE_MEAL">Before Meal</option>
                            <option value="AFTER_MEAL">After Meal (2 hrs)</option>
                            <option value="BEDTIME">Bedtime</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Notes / Meal Info</label>
                        <input type="text" id="log-sugar-notes" class="text-input" placeholder="Optional notes...">
                    </div>
                    <button type="submit" class="btn-primary" style="width:100%; margin-top:1rem;">Save Blood Sugar Log</button>
                </form>
            `;
        } else if (type === 'bp') {
            title.innerHTML = `<i class="fa-solid fa-heart text-bp"></i> Log Blood Pressure`;
            body.innerHTML = `
                <form onsubmit="app.saveBPLog(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Systolic (mmHg)</label>
                            <input type="number" id="log-bp-sys" class="text-input" value="120" min="60" max="250" required>
                        </div>
                        <div class="form-group">
                            <label>Diastolic (mmHg)</label>
                            <input type="number" id="log-bp-dia" class="text-input" value="80" min="40" max="150" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Pulse Rate (bpm)</label>
                        <input type="number" id="log-bp-pulse" class="text-input" value="72" min="30" max="220" required>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <input type="text" id="log-bp-notes" class="text-input" placeholder="e.g. Rested for 5 mins">
                    </div>
                    <button type="submit" class="btn-primary" style="width:100%; margin-top:1rem;">Save Pressure Log</button>
                </form>
            `;
        } else if (type === 'weight') {
            title.innerHTML = `<i class="fa-solid fa-weight-scale text-weight"></i> Log Weight`;
            body.innerHTML = `
                <form onsubmit="app.saveWeightLog(event)">
                    <div class="form-group">
                        <label>Weight (kg)</label>
                        <input type="number" id="log-weight-val" class="text-input" value="74.5" step="0.1" min="20" max="350" required>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <input type="text" id="log-weight-notes" class="text-input" placeholder="e.g. Morning weigh-in">
                    </div>
                    <button type="submit" class="btn-primary" style="width:100%; margin-top:1rem;">Save Weight Log</button>
                </form>
            `;
        }

        modal.classList.add('active');
    }

    closeLoggerModal() {
        document.getElementById('logger-modal').classList.remove('active');
    }

    saveSugarLog(e) {
        e.preventDefault();
        const val = parseFloat(document.getElementById('log-sugar-val').value);
        const context = document.getElementById('log-sugar-context').value;
        const notes = document.getElementById('log-sugar-notes').value;

        const newLog = { id: `bs_${Date.now()}`, timestamp: Date.now(), value: val, context, notes };
        this.bloodSugarLogs.unshift(newLog);
        this.saveState();
        this.closeLoggerModal();
        this.renderAll();
    }

    saveBPLog(e) {
        e.preventDefault();
        const sys = parseInt(document.getElementById('log-bp-sys').value);
        const dia = parseInt(document.getElementById('log-bp-dia').value);
        const pulse = parseInt(document.getElementById('log-bp-pulse').value);
        const notes = document.getElementById('log-bp-notes').value;

        if (dia >= sys) {
            alert("Validation Error: Systolic pressure must be strictly greater than Diastolic pressure.");
            return;
        }

        const newLog = { id: `bp_${Date.now()}`, timestamp: Date.now(), systolic: sys, diastolic: dia, pulse, notes };
        this.bloodPressureLogs.unshift(newLog);
        this.saveState();
        this.closeLoggerModal();
        this.renderAll();
    }

    saveWeightLog(e) {
        e.preventDefault();
        const wt = parseFloat(document.getElementById('log-weight-val').value);
        const notes = document.getElementById('log-weight-notes').value;

        const newLog = { id: `wt_${Date.now()}`, timestamp: Date.now(), weightKg: wt, notes };
        this.weightLogs.unshift(newLog);
        this.saveState();
        this.closeLoggerModal();
        this.renderAll();
    }

    deleteSugarLog(id) {
        this.bloodSugarLogs = this.bloodSugarLogs.filter(l => l.id !== id);
        this.saveState();
        this.renderAll();
    }

    deleteBPLog(id) {
        this.bloodPressureLogs = this.bloodPressureLogs.filter(l => l.id !== id);
        this.saveState();
        this.renderAll();
    }

    // ================= DOCTOR PDF REPORT GENERATION =================

    updateReportPreview() {
        const periodDays = parseInt(document.getElementById('report-period-select')?.value || '30');
        const cutoffTime = Date.now() - (periodDays * 86400000);

        const sugarFiltered = this.bloodSugarLogs.filter(l => l.timestamp >= cutoffTime);
        const bpFiltered = this.bloodPressureLogs.filter(l => l.timestamp >= cutoffTime);

        // Averages
        if (sugarFiltered.length > 0) {
            const avg = Math.round(sugarFiltered.reduce((a, b) => a + b.value, 0) / sugarFiltered.length);
            document.getElementById('pdf-sugar-avg').innerText = `${avg} mg/dL`;
        }

        if (bpFiltered.length > 0) {
            const avgSys = Math.round(bpFiltered.reduce((a, b) => a + b.systolic, 0) / bpFiltered.length);
            const avgDia = Math.round(bpFiltered.reduce((a, b) => a + b.diastolic, 0) / bpFiltered.length);
            document.getElementById('pdf-bp-avg').innerText = `${avgSys} / ${avgDia} mmHg`;
        }

        document.getElementById('pdf-gen-date').innerText = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        // Table
        const tbody = document.getElementById('pdf-history-table');
        if (!tbody) return;

        const combined = [
            ...sugarFiltered.map(l => ({ dt: l.timestamp, type: 'Blood Sugar', val: `${l.value} mg/dL`, ctx: l.context, notes: l.notes })),
            ...bpFiltered.map(l => ({ dt: l.timestamp, type: 'Blood Pressure', val: `${l.systolic}/${l.diastolic} mmHg`, ctx: `Pulse ${l.pulse} bpm`, notes: l.notes }))
        ].sort((a, b) => b.dt - a.dt);

        tbody.innerHTML = combined.map(row => `
            <tr>
                <td>${new Date(row.dt).toLocaleString()}</td>
                <td>${row.type}</td>
                <td><strong>${row.val}</strong></td>
                <td>${row.ctx}</td>
                <td>${row.notes || '-'}</td>
            </tr>
        `).join('');
    }

    generatePDFReport() {
        window.print();
    }

    // ================= REMINDERS =================

    renderReminders() {
        const container = document.getElementById('reminders-container');
        if (!container) return;

        container.innerHTML = this.reminders.map(rem => `
            <div class="history-item">
                <div class="history-icon-type type-sugar">
                    <i class="fa-solid ${rem.category === 'MEDICATION' ? 'fa-pills' : 'fa-clock'}"></i>
                </div>
                <div class="history-item-details">
                    <div class="history-item-val">${rem.title}</div>
                    <div class="history-item-sub">Scheduled Time: <strong>${rem.time}</strong> (${rem.category})</div>
                </div>
                <div>
                    <input type="checkbox" ${rem.active ? 'checked' : ''} onchange="app.toggleReminder('${rem.id}')">
                </div>
            </div>
        `).join('');
    }

    openReminderModal() {
        document.getElementById('reminder-modal').classList.add('active');
    }

    closeReminderModal() {
        document.getElementById('reminder-modal').classList.remove('active');
    }

    saveReminder(e) {
        e.preventDefault();
        const title = document.getElementById('rem-title').value;
        const time = document.getElementById('rem-time').value;
        const category = document.getElementById('rem-category').value;

        this.reminders.push({ id: `rem_${Date.now()}`, title, time, category, active: true });
        this.saveState();
        this.closeReminderModal();
        this.renderReminders();
    }

    toggleReminder(id) {
        const r = this.reminders.find(item => item.id === id);
        if (r) {
            r.active = !r.active;
            this.saveState();
        }
    }

    // ================= PROFILE & UTILS =================

    populateProfileForm() {
        const nameEl = document.getElementById('prof-name');
        if (nameEl) nameEl.value = this.userProfile.name;
        const ageEl = document.getElementById('prof-age');
        if (ageEl) ageEl.value = this.userProfile.age;
        const genderEl = document.getElementById('prof-gender');
        if (genderEl) genderEl.value = this.userProfile.gender;
        const heightEl = document.getElementById('prof-height');
        if (heightEl) heightEl.value = this.userProfile.heightCm;
        const goalEl = document.getElementById('prof-weight-goal');
        if (goalEl) goalEl.value = this.userProfile.weightGoalKg;
        this.updateProfileSummaryUI();
    }

    calculateProfileBMI() {
        const heightCm = parseFloat(document.getElementById('prof-height')?.value) || this.userProfile.heightCm;
        const latestWeight = this.weightLogs[0] ? this.weightLogs[0].weightKg : 74.5;
        return this.calculateBMI(latestWeight, heightCm);
    }

    saveProfile(e) {
        e.preventDefault();
        this.userProfile.name = document.getElementById('prof-name').value;
        this.userProfile.age = parseInt(document.getElementById('prof-age').value) || 30;
        this.userProfile.gender = document.getElementById('prof-gender').value;
        this.userProfile.heightCm = parseFloat(document.getElementById('prof-height').value) || 170;
        this.userProfile.weightGoalKg = parseFloat(document.getElementById('prof-weight-goal').value) || 70;

        this.saveState();
        this.renderAll();
        alert("Profile settings saved successfully!");
    }

    updateProfileSummaryUI() {
        // Update top bar avatar initials
        const avatarSpan = document.querySelector('#btn-open-profile span');
        if (avatarSpan && this.userProfile.name) {
            const parts = this.userProfile.name.trim().split(/\s+/);
            const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]) : parts[0].substring(0, 2);
            avatarSpan.innerText = initials.toUpperCase();
        }

        // Update Doctor PDF patient info header
        const pdfPatient = document.querySelector('.pdf-patient-info');
        if (pdfPatient) {
            const latestWeight = this.weightLogs[0] ? this.weightLogs[0].weightKg : 74.5;
            pdfPatient.innerHTML = `
                <p><strong>Patient:</strong> ${this.userProfile.name} (Age ${this.userProfile.age}, ${this.userProfile.gender})</p>
                <p><strong>Height:</strong> ${this.userProfile.heightCm} cm | <strong>Current Weight:</strong> ${latestWeight} kg</p>
                <p><strong>Report Date:</strong> <span id="pdf-gen-date">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></p>
            `;
        }
    }

    exportCSV() {
        let csv = "Timestamp,Metric,Value,Context_or_Pulse,Notes\n";
        this.bloodSugarLogs.forEach(l => {
            csv += `"${new Date(l.timestamp).toISOString()}","Blood Sugar",${l.value},"${l.context}","${l.notes || ''}"\n`;
        });
        this.bloodPressureLogs.forEach(l => {
            csv += `"${new Date(l.timestamp).toISOString()}","Blood Pressure","${l.systolic}/${l.diastolic}",${l.pulse},"${l.notes || ''}"\n`;
        });
        this.weightLogs.forEach(l => {
            csv += `"${new Date(l.timestamp).toISOString()}","Weight",${l.weightKg},"N/A","${l.notes || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `vitaltrack_health_export_${Date.now()}.csv`);
        a.click();
    }

    // ================= VOICE ASSISTED LOGGING =================

    openVoiceModal() {
        document.getElementById('voice-modal').classList.add('active');
        this.spokenText = '';
        document.getElementById('voice-transcript').innerHTML = '<span class="placeholder-text">Tap mic and speak...</span>';
    }

    closeVoiceModal() {
        document.getElementById('voice-modal').classList.remove('active');
        if (this.recognition) {
            try { this.recognition.stop(); } catch(e) {}
        }
    }

    startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const micRing = document.getElementById('mic-ring');
        const status = document.getElementById('voice-status');
        const transcriptBox = document.getElementById('voice-transcript');

        if (!SpeechRecognition) {
            status.innerText = "Speech recognition API not supported in this browser. Type entry manually.";
            return;
        }

        try {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            micRing.classList.add('listening');
            status.innerText = "Listening... Speak your reading now.";

            this.recognition.onresult = (event) => {
                const text = Array.from(event.results).map(r => r[0].transcript).join('');
                this.spokenText = text;
                transcriptBox.innerText = `"${text}"`;
            };

            this.recognition.onend = () => {
                micRing.classList.remove('listening');
                status.innerText = "Speech captured! Review text and confirm.";
            };

            this.recognition.onerror = (e) => {
                micRing.classList.remove('listening');
                status.innerText = `Speech error: ${e.error}. Try tapping mic again.`;
            };

            this.recognition.start();
        } catch (e) {
            micRing.classList.remove('listening');
            status.innerText = "Mic access required. Please allow microphone permission.";
        }
    }

    processSpokenText() {
        const text = (this.spokenText || document.getElementById('voice-transcript').innerText).toLowerCase().trim();
        if (!text || text.includes('listening')) {
            alert("Please tap mic and speak a reading first.");
            return;
        }

        // Parse logic
        const numMatch = text.match(/\b(\d{2,3})\b/);
        const number = numMatch ? parseInt(numMatch[1]) : null;

        if (text.includes('sugar') || text.includes('glucose') || text.includes('fasting')) {
            const val = number || 110;
            const context = text.includes('after') ? 'AFTER_MEAL' : (text.includes('fasting') ? 'FASTING' : 'OTHER');
            this.bloodSugarLogs.unshift({ id: `bs_${Date.now()}`, timestamp: Date.now(), value: val, context, notes: 'Voice Entry' });
            alert(`✅ Added Blood Sugar: ${val} mg/dL (${context})`);
        } else if (text.includes('pressure') || text.includes('bp') || text.includes('over')) {
            const bpMatch = text.match(/(\d{2,3})\s*(?:over|\/|by)\s*(\d{2,3})/);
            const sys = bpMatch ? parseInt(bpMatch[1]) : 120;
            const dia = bpMatch ? parseInt(bpMatch[2]) : 80;
            this.bloodPressureLogs.unshift({ id: `bp_${Date.now()}`, timestamp: Date.now(), systolic: sys, diastolic: dia, pulse: 72, notes: 'Voice Entry' });
            alert(`✅ Added Blood Pressure: ${sys}/${dia} mmHg`);
        } else if (number && number >= 60 && number <= 300) {
            this.bloodSugarLogs.unshift({ id: `bs_${Date.now()}`, timestamp: Date.now(), value: number, context: 'FASTING', notes: 'Voice Entry' });
            alert(`✅ Added Blood Sugar: ${number} mg/dL (Fasting)`);
        } else {
            alert("Could not recognize reading from speech. Try e.g., 'Sugar 110 fasting' or 'BP 120 over 80'.");
            return;
        }

        this.saveState();
        this.closeVoiceModal();
        this.renderAll();
    }

    formatTimeAgo(timestamp) {
        const diffHours = Math.round((Date.now() - timestamp) / 3600000);
        if (diffHours < 1) return "Just now";
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return "Yesterday";
        return `${diffDays} days ago`;
    }
}

// Global initialization
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VitalTrackApp();
});
