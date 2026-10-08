/* =====================================================
   Smart Energy Monitoring System - script.js
   Handles: Navigation, Charts, Calculations, Data
   Vanilla JS only - No frameworks
===================================================== */

// -------- AUTH CHECK --------
// Check if user is logged in (skip on login page)
if (!window.location.href.includes('index.html')) {
  if (!localStorage.getItem('sem_logged_in')) {
    window.location.href = 'index.html';
  }
}

// -------- SETTINGS (configurable) --------
var settings = {
  tariff: 8,           // Rs per kWh
  monthlyBudget: 8000, // Rs
  location: 'Kolhapur',
  userName: 'Admin',
  apiKey: '',          // OpenWeather API key
  healthWarningDays: 3 // Days before flagging persistent issue
};

// Load saved settings from localStorage
if (localStorage.getItem('sem_settings')) {
  settings = JSON.parse(localStorage.getItem('sem_settings'));
}

// -------- SAMPLE DATA --------
// Appliances with realistic values
// AC is made slightly abnormal for demo purposes
var appliances = [
  { id: 1, name: 'AC',          type: 'Cooling',   room: 'Living Room', powerW: 1500, expectedHours: 6,   actualHours: 8.5,  healthScore: 72, status: 'Monitor' },
  { id: 2, name: 'Refrigerator',type: 'Cooling',   room: 'Kitchen',     powerW: 200,  expectedHours: 24,  actualHours: 24,   healthScore: 88, status: 'Good' },
  { id: 3, name: 'Fan',         type: 'Ventilation',room:'Bedroom',     powerW: 75,   expectedHours: 8,   actualHours: 7.5,  healthScore: 96, status: 'Good' },
  { id: 4, name: 'LED Light',   type: 'Lighting',  room: 'Study Room',  powerW: 12,   expectedHours: 6,   actualHours: 6.2,  healthScore: 92, status: 'Good' },
  { id: 5, name: 'TV',          type: 'Electronics',room:'Living Room', powerW: 100,  expectedHours: 4,   actualHours: 5,    healthScore: 90, status: 'Good' },
  { id: 6, name: 'Computer',    type: 'Electronics',room:'Study Room',  powerW: 250,  expectedHours: 6,   actualHours: 5.5,  healthScore: 85, status: 'Good' }
];

// -------- ENERGY CALCULATION --------
// Formula: Energy (kWh) = Power (W) / 1000 * Hours
function calcEnergy(powerW, hours) {
  if (powerW < 0 || hours < 0) return 0;
  return (powerW / 1000) * hours;
}

// Formula: Cost = Energy * Tariff
function calcCost(energyKwh) {
  return energyKwh * settings.tariff;
}

// Expected consumption for an appliance
function calcExpected(appliance) {
  return calcEnergy(appliance.powerW, appliance.expectedHours);
}

// Actual consumption for an appliance
function calcActual(appliance) {
  return calcEnergy(appliance.powerW, appliance.actualHours);
}

// Deviation in percent: how much actual differs from expected
function calcDeviation(appliance) {
  var expected = calcExpected(appliance);
  if (expected === 0) return 0;
  return ((calcActual(appliance) - expected) / expected) * 100;
}

// Total actual consumption of all appliances today
function getTotalConsumption() {
  var total = 0;
  for (var i = 0; i < appliances.length; i++) {
    total += calcActual(appliances[i]);
  }
  return total;
}

// Unaccounted consumption (meter reading vs appliances)
function getUnaccounted() {
  var meterReading = 27.4; // kWh - simulated meter
  var applianceTotal = getTotalConsumption();
  var unaccounted = meterReading - applianceTotal;
  return unaccounted > 0 ? unaccounted : 0;
}

// Current power usage in kW (sum of all running appliances)
function getCurrentUsage() {
  var total = 0;
  for (var i = 0; i < appliances.length; i++) {
    // Only count appliances currently "on" (simplified)
    total += appliances[i].powerW;
  }
  return total / 1000; // Convert W to kW
}

// Monthly estimated bill based on daily usage * 30
function getMonthlyBill() {
  var dailyKwh = getTotalConsumption();
  var monthlyKwh = dailyKwh * 30;
  return calcCost(monthlyKwh);
}

// Energy efficiency: expected vs actual (lower actual = better)
function getEfficiency() {
  var totalExpected = 0;
  var totalActual = 0;
  for (var i = 0; i < appliances.length; i++) {
    totalExpected += calcExpected(appliances[i]);
    totalActual += calcActual(appliances[i]);
  }
  if (totalActual === 0) return 100;
  var eff = (totalExpected / totalActual) * 100;
  return Math.min(100, Math.round(eff));
}

// -------- HEALTH STATUS --------
// Determine health status based on deviation percentage
function getHealthStatus(deviation) {
  deviation = Math.abs(deviation);
  if (deviation <= 10)  return { label: 'Good',          cls: 'good' };
  if (deviation <= 20)  return { label: 'Monitor',       cls: 'monitor' };
  if (deviation <= 30)  return { label: 'Warning',       cls: 'warning' };
  return                       { label: 'Possible Fault', cls: 'fault' };
}

// -------- PREDICTIONS (Moving Average + Trend) --------
// Historical monthly data (kWh)
var historicalData = [410, 390, 420, 380, 350, 370, 310];

function calculatePrediction() {
  // Step 1: Calculate moving average of last 3 months
  var n = historicalData.length;
  var last3 = historicalData.slice(n - 3);
  var avg = (last3[0] + last3[1] + last3[2]) / 3;

  // Step 2: Calculate trend (difference between last two months)
  var trend = historicalData[n - 1] - historicalData[n - 2];

  // Step 3: Predicted = average + trend adjustment
  var predicted = avg + (trend * 0.5); // 0.5 dampens trend slightly

  // Step 4: Confidence based on variation in last 3 months
  var max = Math.max.apply(null, last3);
  var min = Math.min.apply(null, last3);
  var variation = ((max - min) / avg) * 100;
  var confidence;
  if (variation < 10)      confidence = 'High (>90%)';
  else if (variation < 20) confidence = 'Moderate (75-90%)';
  else                     confidence = 'Low (<75%)';

  return {
    predictedKwh: Math.round(predicted),
    predictedBill: Math.round(calcCost(predicted)),
    confidence: confidence,
    change: Math.round(predicted - historicalData[n - 1])
  };
}

// -------- ANOMALY DETECTION --------
// Simple rule-based anomaly detection
var dailyNormal = { min: 12, max: 16 }; // kWh/day

function detectAnomalies() {
  var anomalies = [];

  // Check each appliance for deviation
  for (var i = 0; i < appliances.length; i++) {
    var dev = calcDeviation(appliances[i]);
    if (Math.abs(dev) > 20) {
      anomalies.push({
        type: 'danger',
        appliance: appliances[i].name,
        deviation: dev,
        message: appliances[i].name + ' consumption is ' + Math.round(Math.abs(dev)) + '% higher than expected.'
      });
    } else if (Math.abs(dev) > 10) {
      anomalies.push({
        type: 'warning',
        appliance: appliances[i].name,
        deviation: dev,
        message: appliances[i].name + ' consumption is slightly above normal (' + Math.round(Math.abs(dev)) + '% deviation).'
      });
    }
  }

  // Check total daily consumption
  var today = getTotalConsumption();
  if (today > dailyNormal.max * 1.5) {
    anomalies.push({
      type: 'danger',
      appliance: 'Overall',
      deviation: ((today - dailyNormal.max) / dailyNormal.max) * 100,
      message: 'Total daily consumption (' + today.toFixed(1) + ' kWh) is significantly above normal range.'
    });
  }

  return anomalies;
}

// -------- RECOMMENDATIONS --------
// Generate smart recommendations based on data
function generateRecommendations() {
  var recs = [];

  for (var i = 0; i < appliances.length; i++) {
    var a = appliances[i];
    var dev = calcDeviation(a);

    if (a.name === 'AC') {
      var acPct = Math.round((calcActual(a) / getTotalConsumption()) * 100);
      recs.push('Your AC accounts for ' + acPct + '% of today\'s energy consumption. Consider setting temperature between 24–26°C.');
      if (dev > 15) {
        recs.push('AC consumption is ' + Math.round(dev) + '% higher than expected. Check if filters are clean.');
      }
    }

    if (a.name === 'TV' && a.actualHours > a.expectedHours) {
      recs.push('Consider reducing TV usage during inactive hours. Current: ' + a.actualHours + 'h vs expected ' + a.expectedHours + 'h.');
    }

    if (a.name === 'Refrigerator' && dev > 10) {
      recs.push('Your Refrigerator has shown higher-than-normal consumption. Check door seals and temperature settings.');
    }
  }

  // Budget check
  var predicted = calculatePrediction();
  if (predicted.predictedBill > settings.monthlyBudget) {
    var over = predicted.predictedBill - settings.monthlyBudget;
    recs.push('You may exceed your monthly energy budget by approximately \u20B9' + over + '. Consider reducing usage.');
  }

  // High outdoor temp note (from weather)
  recs.push('High outdoor temperature may increase cooling demand. This can affect AC consumption.');

  // Unaccounted
  var unac = getUnaccounted();
  if (unac > 2) {
    recs.push('Unaccounted consumption of ' + unac.toFixed(1) + ' kWh detected. Check for unknown devices or standby loads.');
  }

  return recs;
}

// -------- WEATHER --------
// Demo weather data (shown when API key is not configured)
var demoWeather = {
  temp: 28,
  feelsLike: 31,
  humidity: 68,
  windSpeed: 12,
  condition: 'Partly Cloudy',
  icon: '⛅',
  location: settings.location || 'Kolhapur',
  lastUpdated: '10:30 AM'
};

// Fetch weather from OpenWeather API
function fetchWeather(callback) {
  // If no API key, use demo data
  if (!settings.apiKey) {
    callback(demoWeather);
    return;
  }

  var url = 'https://api.openweathermap.org/data/2.5/weather?q=' +
    encodeURIComponent(settings.location || 'Kolhapur') +
    '&appid=' + settings.apiKey +
    '&units=metric';

  // Use fetch API to get weather
  fetch(url)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.cod === 200) {
        var weatherIcons = {
          'Clear': '☀️', 'Clouds': '⛅', 'Rain': '🌧️',
          'Drizzle': '🌦️', 'Thunderstorm': '⛈️', 'Snow': '❄️', 'Mist': '🌫️'
        };
        var mainCond = data.weather[0].main;
        callback({
          temp: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
          condition: data.weather[0].description,
          icon: weatherIcons[mainCond] || '🌤️',
          location: data.name,
          lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        callback(demoWeather);
      }
    })
    .catch(function() {
      // If API fails, fall back to demo data
      callback(demoWeather);
    });
}

// -------- CHART HELPERS --------
// Default Chart.js global config for dark theme
function setChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = '#8892b0';
  Chart.defaults.borderColor = '#1e2d4a';
  Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
  Chart.defaults.font.size = 11;
}

// Create bar chart
function createBarChart(canvasId, labels, data, label, color) {
  var ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  color = color || '#2979ff';
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label || 'Energy (kWh)',
        data: data,
        backgroundColor: color + '66',
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#1e2d4a' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// Create line chart
function createLineChart(canvasId, labels, datasets) {
  var ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'line',
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: false, grid: { color: '#1e2d4a' } },
        x: { grid: { display: false } }
      },
      elements: { line: { tension: 0.3 }, point: { radius: 3 } }
    }
  });
}

// Create doughnut chart
function createDoughnutChart(canvasId, labels, data, colors) {
  var ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: '#131929',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ctx.label + ': ' + ctx.parsed + '%';
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

// -------- SIDEBAR NAVIGATION --------
function initSidebar() {
  // Highlight active nav item based on current page
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(function(item) {
    var href = item.getAttribute('data-href');
    if (href && currentPage === href) {
      item.classList.add('active');
    }
    // Navigate on click
    item.addEventListener('click', function() {
      if (href === 'logout') {
        localStorage.removeItem('sem_logged_in');
        window.location.href = 'index.html';
        return;
      }
      if (href) window.location.href = href;
    });
  });

  // Mobile sidebar toggle
  var toggle = document.getElementById('sidebarToggle');
  var sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });
  }
}

// -------- DATE/TIME --------
function updateDateTime() {
  var now = new Date();
  var dateEl = document.getElementById('currentDate');
  var dayEl = document.getElementById('currentDay');
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (dayEl) {
    dayEl.textContent = now.toLocaleDateString('en-IN', { weekday: 'long' });
  }
}

// -------- DASHBOARD INIT --------
function initDashboard() {
  setChartDefaults();
  updateDateTime();

  // Show summary metrics
  var total = getTotalConsumption();
  var bill = getMonthlyBill();
  var current = getCurrentUsage();
  var unac = getUnaccounted();
  var eff = getEfficiency();

  setInnerText('totalConsumption', total.toFixed(1) + ' kWh');
  setInnerText('estimatedBill', '\u20B9' + Math.round(bill).toLocaleString('en-IN'));
  setInnerText('currentUsage', current.toFixed(1) + ' kW');
  setInnerText('monthlyBudget', '\u20B9' + settings.monthlyBudget.toLocaleString('en-IN'));
  setInnerText('unaccounted', unac.toFixed(1) + ' kWh');
  setInnerText('efficiency', eff + '%');

  // Unaccounted percentage label
  var unacPct = (total + unac) > 0 ? ((unac / (total + unac)) * 100).toFixed(1) : '0';
  setInnerText('unaccountedPct', unacPct + '% of total');

  // Budget progress bar
  var budgetPct = Math.min(100, Math.round((bill / settings.monthlyBudget) * 100));
  var budgetBar = document.getElementById('budgetBar');
  var budgetPctEl = document.getElementById('budgetPct');
  if (budgetBar) {
    budgetBar.style.width = budgetPct + '%';
    if (budgetPct > 85) budgetBar.className = 'progress-bar red';
    else if (budgetPct > 60) budgetBar.className = 'progress-bar yellow';
    else budgetBar.className = 'progress-bar green';
  }
  if (budgetPctEl) budgetPctEl.textContent = budgetPct + '% used';

  // Fetch and show weather
  fetchWeather(function(w) {
    updateWeatherDisplay(w);
    setInnerText('weatherLoc2', w.location);
  });

  // Charts
  initDashboardCharts();

  // Populate panels
  populateDashboardAlerts();
  populateDashboardHealth();
  populateDashboardRecs();
  populateApplianceLegend();

  // Sidebar
  initSidebar();
}

// -------- DASHBOARD APPLIANCE LEGEND (for doughnut chart) --------
function populateApplianceLegend() {
  var container = document.getElementById('applianceLegend');
  if (!container) return;
  var items = [
    { name: 'AC',          pct: '38%', color: '#2979ff' },
    { name: 'Refrigerator',pct: '18%', color: '#00c853' },
    { name: 'Fan',         pct: '12%', color: '#7c4dff' },
    { name: 'LED Lights',  pct: '10%', color: '#ffd600' },
    { name: 'TV',          pct: '8%',  color: '#00bcd4' },
    { name: 'Computer',    pct: '7%',  color: '#ff9800' },
    { name: 'Others',      pct: '7%',  color: '#8892b0' }
  ];
  container.innerHTML = '';
  items.forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'donut-legend-item';
    div.innerHTML =
      '<span class="legend-dot" style="background:' + item.color + '"></span>'
      + '<span class="legend-name">' + item.name + '</span>'
      + '<span class="legend-pct">' + item.pct + '</span>';
    container.appendChild(div);
  });
}

// -------- DASHBOARD HEALTH PANEL --------
function populateDashboardHealth() {
  var container = document.getElementById('dashHealthList');
  if (!container) return;
  container.innerHTML = '';
  var icons = { 'AC': '❄️', 'Refrigerator': '🧊', 'Fan': '💨', 'LED Light': '💡', 'TV': '📺', 'Computer': '💻' };

  appliances.forEach(function(a) {
    var dev = calcDeviation(a);
    var status = getHealthStatus(dev);
    var icon = icons[a.name] || '🔌';
    var row = document.createElement('div');
    row.className = 'health-item';
    row.innerHTML =
      '<div class="health-appliance">'
        + '<span class="health-appliance-icon">' + icon + '</span>'
        + '<span class="health-appliance-name">' + a.name + '</span>'
      + '</div>'
      + '<div class="health-bar-wrap"><div class="health-bar ' + status.cls + '" style="width:' + a.healthScore + '%"></div></div>'
      + '<span class="health-score">' + a.healthScore + '/100</span>'
      + '<span class="health-badge ' + status.cls + '">' + status.label + '</span>';
    container.appendChild(row);
  });
}

// -------- DASHBOARD RECOMMENDATIONS PANEL --------
function populateDashboardRecs() {
  var container = document.getElementById('dashRecList');
  if (!container) return;
  container.innerHTML = '';
  var recs = generateRecommendations();
  // Show top 5 on dashboard
  var limit = Math.min(5, recs.length);
  for (var i = 0; i < limit; i++) {
    var div = document.createElement('div');
    div.className = 'rec-item';
    div.innerHTML =
      '<div class="rec-number">' + (i + 1) + '</div>'
      + '<div class="rec-text">' + recs[i] + '</div>';
    container.appendChild(div);
  }
}

// -------- DASHBOARD ALERTS --------
function populateDashboardAlerts() {
  var alertList = document.getElementById('alertList');
  if (!alertList) return;
  alertList.innerHTML = '';

  // Static demo alerts matching the reference design
  var alerts = [
    { type: 'danger', icon: '🚨', title: 'Unusual Energy Consumption', desc: "Today's usage is 56% higher than normal", time: '2 hours ago' },
    { type: 'warning', icon: '⚠️', title: 'AC showing abnormal consumption', desc: '23% higher than expected for 3 days', time: '4 hours ago' },
    { type: 'warning', icon: '⚠️', title: 'You may exceed monthly budget', desc: 'At current rate, predicted bill is ₹8,450', time: '6 hours ago' },
    { type: 'info',   icon: 'ℹ️', title: 'Unaccounted consumption detected', desc: getUnaccounted().toFixed(1) + ' kWh is not explained by appliances', time: '1 day ago' }
  ];

  for (var i = 0; i < alerts.length; i++) {
    var a = alerts[i];
    var div = document.createElement('div');
    div.className = 'alert-item ' + a.type;
    div.innerHTML =
      '<div class="alert-icon-wrap">' + a.icon + '</div>'
      + '<div class="alert-content">'
        + '<div class="alert-title">' + a.title + '</div>'
        + '<div class="alert-desc">' + a.desc + '</div>'
      + '</div>'
      + '<span class="alert-time">' + a.time + '</span>';
    alertList.appendChild(div);
  }
}

function setInnerText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateWeatherDisplay(w) {
  setInnerText('weatherTemp', w.icon + ' ' + w.temp + '°C');
  setInnerText('weatherLoc', w.location);
  setInnerText('wTemp', w.temp + '°C');
  setInnerText('wCondition', w.condition);
  setInnerText('wHumidity', w.humidity + '%');
  setInnerText('wFeelsLike', w.feelsLike + '°C');
  setInnerText('wWindSpeed', w.windSpeed + ' km/h');
  setInnerText('wLastUpdated', w.lastUpdated);
  setInnerText('wIcon', w.icon);
  setInnerText('wTempBig', w.temp + '°C');
  setInnerText('wCondBig', w.condition);
}

// -------- DASHBOARD CHARTS --------
function initDashboardCharts() {
  // Daily Energy Consumption (bar chart)
  var days = ['28 Sep', '29 Sep', '30 Sep', '1 Oct', '2 Oct', '3 Oct', '4 Oct'];
  var dailyData = [18.4, 21.2, 19.8, 23.5, 17.6, 25.1, getTotalConsumption()];
  createBarChart('dailyChart', days, dailyData, 'Energy (kWh)', '#2979ff');

  // Appliance-wise doughnut
  createDoughnutChart('applianceChart',
    ['AC', 'Refrigerator', 'Fan', 'LED Lights', 'TV', 'Computer', 'Others'],
    [38, 18, 12, 10, 8, 7, 7],
    ['#2979ff', '#00c853', '#7c4dff', '#ffd600', '#00bcd4', '#ff9800', '#8892b0']
  );

  // Actual vs Expected (line chart)
  createLineChart('actualExpectedChart',
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    [
      { label: 'Actual', data: [18.4, 21.2, 19.8, 23.5, 17.6, 25.1, getTotalConsumption()],
        borderColor: '#2979ff', backgroundColor: 'rgba(41,121,255,0.1)', fill: true },
      { label: 'Expected', data: [16, 16, 16, 16, 16, 18, 18],
        borderColor: '#00c853', backgroundColor: 'rgba(0,200,83,0.05)', fill: true }
    ]
  );

  // Predicted vs Actual chart on dashboard bottom row
  var weekDays = ['5 Oct', '6 Oct', '7 Oct', '8 Oct', '9 Oct', '10 Oct', '11 Oct'];
  if (document.getElementById('predVsActualDashChart')) {
    createLineChart('predVsActualDashChart', weekDays, [
      { label: 'Actual',    data: [18.4, 21.2, 19.8, 23.5, 17.6, 25.1, getTotalConsumption()],
        borderColor: '#2979ff', backgroundColor: 'rgba(41,121,255,0.1)', fill: false },
      { label: 'Predicted', data: [17, 18, 19, 20, 19, 21, 20],
        borderColor: '#00c853', backgroundColor: 'rgba(0,200,83,0.05)', fill: false,
        borderDash: [5, 3] }
    ]);
  }

  // Cost Trend on dashboard
  var months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  var costData = [2460, 2890, 2760, 3010, 2550, 3140, Math.round(getMonthlyBill())];
  if (document.getElementById('costTrendChart')) {
    createLineChart('costTrendChart', months,
      [{ label: 'Cost (\u20B9)', data: costData, borderColor: '#ffd600', backgroundColor: 'rgba(255,214,0,0.1)', fill: true }]
    );
  }
}

// -------- WHAT-IF SIMULATION --------
function runSimulation() {
  // Read inputs from the form
  var applianceName = document.getElementById('simAppliance').value;
  var powerW = parseFloat(document.getElementById('simPower').value) || 1500;
  var currentHours = parseFloat(document.getElementById('simCurrentHours').value) || 0;
  var newHours = parseFloat(document.getElementById('simNewHours').value) || 0;
  var days = parseInt(document.getElementById('simDays').value) || 30;
  var tariff = parseFloat(document.getElementById('simTariff').value) || settings.tariff;

  // Validate inputs
  if (currentHours < 0 || newHours < 0 || powerW <= 0) {
    alert('Please enter valid positive values.');
    return;
  }

  // Calculate savings
  var currentDaily = calcEnergy(powerW, currentHours);   // kWh/day (current)
  var newDaily = calcEnergy(powerW, newHours);            // kWh/day (new)
  var savedDaily = currentDaily - newDaily;               // kWh/day saved
  var savedMonthly = savedDaily * days;                   // kWh saved in given days
  var savedMonelyMonthly = savedMonthly * tariff;         // Rs saved
  var savedAnnual = savedMonelyMonthly * 12;              // Rs saved annually

  // Show results
  setInnerText('resDailyKwh', savedDaily.toFixed(2));
  setInnerText('resMonthlyKwh', savedMonthly.toFixed(1));
  setInnerText('resMoneySaved', '\u20B9' + Math.round(savedMonelyMonthly).toLocaleString('en-IN'));
  setInnerText('resAnnualSaved', '\u20B9' + Math.round(savedAnnual).toLocaleString('en-IN'));

  // Show/highlight result box
  var resBox = document.getElementById('simResultBox');
  if (resBox) resBox.style.display = 'block';

  // Show info message
  var info = document.getElementById('simInfo');
  if (info) {
    if (savedDaily > 0) {
      info.className = 'info-box success mt-12';
      info.textContent = 'By reducing ' + applianceName + ' usage from ' + currentHours + 'h to ' + newHours + 'h per day, you could save ' + savedMonthly.toFixed(1) + ' kWh over ' + days + ' days.';
    } else if (savedDaily < 0) {
      info.className = 'info-box warning mt-12';
      info.textContent = 'Increasing usage will add ' + Math.abs(savedMonthly).toFixed(1) + ' kWh and cost \u20B9' + Math.abs(Math.round(savedMonelyMonthly)) + ' more.';
    } else {
      info.className = 'info-box mt-12';
      info.textContent = 'No change in usage hours. No savings or additional cost.';
    }
    info.style.display = 'block';
  }
}

// -------- FORM VALIDATION --------
function validatePositive(value, fieldName) {
  if (isNaN(value) || value < 0) {
    alert(fieldName + ' must be a positive number.');
    return false;
  }
  return true;
}

// -------- SETTINGS SAVE --------
function saveSettings() {
  var tariff = parseFloat(document.getElementById('settingTariff').value);
  var budget = parseFloat(document.getElementById('settingBudget').value);
  var location = document.getElementById('settingLocation').value.trim();
  var userName = document.getElementById('settingUserName').value.trim();
  var apiKey = document.getElementById('settingApiKey').value.trim();

  if (!validatePositive(tariff, 'Tariff')) return;
  if (!validatePositive(budget, 'Budget')) return;

  settings.tariff = tariff;
  settings.monthlyBudget = budget;
  settings.location = location || 'Kolhapur';
  settings.userName = userName || 'Admin';
  settings.apiKey = apiKey;

  localStorage.setItem('sem_settings', JSON.stringify(settings));

  var msg = document.getElementById('settingsSaved');
  if (msg) {
    msg.style.display = 'block';
    setTimeout(function() { msg.style.display = 'none'; }, 3000);
  }
}

// -------- PAGE-SPECIFIC INIT --------
document.addEventListener('DOMContentLoaded', function() {
  setChartDefaults();
  initSidebar();
  updateDateTime();

  var page = window.location.pathname.split('/').pop();

  if (page === 'dashboard.html' || page === '') initDashboard();
  else if (page === 'simulation.html') initSimulationPage();
  else if (page === 'settings.html') initSettingsPage();
  else if (page === 'predictions.html') initPredictionsPage();
  else if (page === 'analytics.html') initAnalyticsPage();
  else if (page === 'health.html') initHealthPage();
  else if (page === 'anomalies.html') initAnomaliesPage();
  else if (page === 'recommendations.html') initRecommendationsPage();
  else if (page === 'budget.html') initBudgetPage();
  else if (page === 'appliances.html') initAppliancesPage();
  else if (page === 'monitoring.html') initMonitoringPage();
  else if (page === 'buildings.html') initBuildingsPage();
  else if (page === 'rooms.html') initRoomsPage();
  else if (page === 'reports.html') initReportsPage();
});

// -------- SIMULATION PAGE --------
function initSimulationPage() {
  // Populate appliance dropdown
  var select = document.getElementById('simAppliance');
  if (select) {
    appliances.forEach(function(a) {
      var opt = document.createElement('option');
      opt.value = a.name;
      opt.textContent = a.name + ' (' + a.powerW + 'W)';
      select.appendChild(opt);
    });
    // Auto-fill power when appliance changes
    select.addEventListener('change', function() {
      var found = appliances.find(function(a) { return a.name === select.value; });
      if (found) {
        document.getElementById('simPower').value = found.powerW;
        document.getElementById('simCurrentHours').value = found.expectedHours;
      }
    });
    // Trigger change to populate initial values
    select.dispatchEvent(new Event('change'));
  }
  // Set default tariff
  var tariffEl = document.getElementById('simTariff');
  if (tariffEl) tariffEl.value = settings.tariff;

  setChartDefaults();
}

// -------- SETTINGS PAGE --------
function initSettingsPage() {
  var fields = [
    { id: 'settingTariff', val: settings.tariff },
    { id: 'settingBudget', val: settings.monthlyBudget },
    { id: 'settingLocation', val: settings.location },
    { id: 'settingUserName', val: settings.userName },
    { id: 'settingApiKey', val: settings.apiKey }
  ];
  fields.forEach(function(f) {
    var el = document.getElementById(f.id);
    if (el) el.value = f.val;
  });
}

// -------- PREDICTIONS PAGE --------
function initPredictionsPage() {
  setChartDefaults();
  var pred = calculatePrediction();

  setInnerText('predKwh', pred.predictedKwh + ' kWh');
  setInnerText('predBill', '\u20B9' + pred.predictedBill.toLocaleString('en-IN'));
  setInnerText('predConfidence', pred.confidence);
  var changeEl = document.getElementById('predChange');
  if (changeEl) {
    var sign = pred.change >= 0 ? '+' : '';
    changeEl.textContent = sign + pred.change + ' kWh vs last month';
    changeEl.className = pred.change >= 0 ? 'pred-card-change up' : 'pred-card-change down';
  }

  // Chart: historical + predicted
  var months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb(Pred)'];
  var predData = historicalData.slice();
  predData.push(pred.predictedKwh);
  createBarChart('predHistChart', months, predData, 'kWh', '#7c4dff');

  // Line for predicted vs actual trend
  var weekDays = ['5 Oct', '6 Oct', '7 Oct', '8 Oct', '9 Oct', '10 Oct', '11 Oct'];
  createLineChart('predVsActualChart', weekDays, [
    { label: 'Actual',    data: [18.4, 21.2, 19.8, 23.5, 17.6, 25.1, getTotalConsumption()],
      borderColor: '#2979ff', backgroundColor: 'rgba(41,121,255,0.1)', fill: false },
    { label: 'Predicted', data: [17, 18, 19, 20, 19, 21, 20],
      borderColor: '#00c853', backgroundColor: 'rgba(0,200,83,0.05)', fill: false, borderDash: [5,3] }
  ]);
}

// -------- ANALYTICS PAGE --------
function initAnalyticsPage() {
  setChartDefaults();
  var months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

  // Monthly consumption bar
  createBarChart('monthlyConsumptionChart', months, historicalData, 'kWh', '#2979ff');

  // Cost trend line
  var costData = historicalData.map(function(k) { return Math.round(calcCost(k)); });
  createLineChart('monthlyCostChart', months,
    [{ label: 'Cost (\u20B9)', data: costData, borderColor: '#ffd600', backgroundColor: 'rgba(255,214,0,0.08)', fill: true }]
  );

  // Room-wise consumption doughnut
  createDoughnutChart('roomChart',
    ['Living Room', 'Bedroom', 'Kitchen', 'Study Room'],
    [45, 20, 18, 17],
    ['#2979ff', '#7c4dff', '#00c853', '#00bcd4']
  );

  // Day of week pattern
  createBarChart('weekPatternChart',
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    [15.2, 16.8, 14.9, 18.3, 16.1, 22.4, 20.7],
    'kWh', '#00bcd4'
  );
}

// -------- HEALTH PAGE --------
function initHealthPage() {
  var container = document.getElementById('healthList');
  if (!container) return;
  container.innerHTML = '';

  appliances.forEach(function(a) {
    var dev = calcDeviation(a);
    var status = getHealthStatus(dev);
    var icons = { 'AC': '❄️', 'Refrigerator': '🧊', 'Fan': '💨', 'LED Light': '💡', 'TV': '📺', 'Computer': '💻' };
    var icon = icons[a.name] || '🔌';

    var row = document.createElement('div');
    row.className = 'health-item';
    row.innerHTML =
      '<div class="health-appliance">'
        + '<span class="health-appliance-icon">' + icon + '</span>'
        + '<span class="health-appliance-name">' + a.name + '</span>'
      + '</div>'
      + '<div class="health-bar-wrap"><div class="health-bar ' + status.cls + '" style="width:' + a.healthScore + '%"></div></div>'
      + '<span class="health-score">' + a.healthScore + '/100</span>'
      + '<span class="health-badge ' + status.cls + '">' + status.label + '</span>';
    container.appendChild(row);
  });

  // AC context info
  fetchWeather(function(w) {
    var ctxEl = document.getElementById('acContext');
    if (!ctxEl) return;
    if (w.temp >= 35 || w.humidity >= 80) {
      ctxEl.className = 'info-box mt-12';
      ctxEl.textContent = 'Note: Higher AC consumption may be explained by today\'s high temperature (' + w.temp + '°C) and humidity (' + w.humidity + '%). This may not indicate a fault.';
    } else {
      ctxEl.className = 'info-box warning mt-12';
      ctxEl.textContent = 'AC is consuming more than expected even with moderate weather (' + w.temp + '°C, ' + w.humidity + '% humidity). Consider monitoring further.';
    }
    ctxEl.style.display = 'block';
  });
}

// -------- ANOMALIES PAGE --------
function initAnomaliesPage() {
  var container = document.getElementById('anomalyList');
  if (!container) return;
  container.innerHTML = '';

  var anomalies = detectAnomalies();
  if (anomalies.length === 0) {
    container.innerHTML = '<div class="info-box success">No anomalies detected today. All appliances are within normal range.</div>';
    return;
  }

  anomalies.forEach(function(an) {
    var icons = { danger: '🚨', warning: '⚠️', info: 'ℹ️' };
    var div = document.createElement('div');
    div.className = 'anomaly-item ' + (an.type === 'danger' ? '' : an.type);
    div.innerHTML =
      '<div class="anomaly-icon">' + (icons[an.type] || '⚠️') + '</div>'
      + '<div>'
        + '<div class="anomaly-title">' + an.appliance + ' - Unusual Consumption</div>'
        + '<div class="anomaly-desc">' + an.message + '</div>'
        + '<div class="anomaly-meta">Detected: Today | Deviation: ' + Math.round(Math.abs(an.deviation)) + '%</div>'
      + '</div>';
    container.appendChild(div);
  });
}

// -------- RECOMMENDATIONS PAGE --------
function initRecommendationsPage() {
  var container = document.getElementById('recList');
  if (!container) return;
  container.innerHTML = '';

  var recs = generateRecommendations();
  recs.forEach(function(rec, idx) {
    var div = document.createElement('div');
    div.className = 'rec-item';
    div.innerHTML =
      '<div class="rec-number">' + (idx + 1) + '</div>'
      + '<div class="rec-text">' + rec + '</div>';
    container.appendChild(div);
  });
}

// -------- BUDGET PAGE --------
function initBudgetPage() {
  setChartDefaults();
  var pred = calculatePrediction();
  var currentBill = Math.round(getMonthlyBill());
  var remaining = settings.monthlyBudget - currentBill;
  var pct = Math.min(100, Math.round((currentBill / settings.monthlyBudget) * 100));
  var predictedFinal = pred.predictedBill;

  setInnerText('bBudget', '\u20B9' + settings.monthlyBudget.toLocaleString('en-IN'));
  setInnerText('bCurrent', '\u20B9' + currentBill.toLocaleString('en-IN'));
  setInnerText('bRemaining', remaining > 0 ? '\u20B9' + remaining.toLocaleString('en-IN') : 'Exceeded');
  setInnerText('bPredicted', '\u20B9' + predictedFinal.toLocaleString('en-IN'));
  setInnerText('bPct', pct + '% used');

  var bar = document.getElementById('bProgressBar');
  if (bar) {
    bar.style.width = pct + '%';
    bar.className = 'budget-progress-fill ' + (pct > 85 ? 'red' : pct > 65 ? 'yellow' : 'green');
  }

  // Budget status message
  var msgEl = document.getElementById('bStatusMsg');
  if (msgEl) {
    if (predictedFinal > settings.monthlyBudget) {
      var over = predictedFinal - settings.monthlyBudget;
      msgEl.className = 'info-box warning mt-12';
      msgEl.textContent = 'You may exceed your monthly electricity budget by approximately \u20B9' + over + '. Consider reducing high-consumption appliances.';
    } else {
      msgEl.className = 'info-box success mt-12';
      msgEl.textContent = 'You are on track to stay within your monthly budget. Keep it up!';
    }
  }

  // Budget chart
  createBarChart('budgetChart',
    ['Budget', 'Current Bill', 'Predicted Final'],
    [settings.monthlyBudget, currentBill, predictedFinal],
    'Amount (\u20B9)', '#2979ff'
  );
}

// -------- APPLIANCES PAGE --------
function initAppliancesPage() {
  var tbody = document.getElementById('applianceTableBody');
  var cardGrid = document.getElementById('applianceCardGrid');
  var icons = { 'AC': '❄️', 'Refrigerator': '🧊', 'Fan': '💨', 'LED Light': '💡', 'TV': '📺', 'Computer': '💻' };

  // Appliance cards
  if (cardGrid) {
    cardGrid.innerHTML = '';
    appliances.forEach(function(a) {
      var actual = calcActual(a);
      var dev = calcDeviation(a);
      var status = getHealthStatus(dev);
      var icon = icons[a.name] || '🔌';
      var card = document.createElement('div');
      card.className = 'appliance-card';
      card.innerHTML =
        '<div class="appliance-card-header">'
          + '<div style="display:flex;align-items:center;gap:10px;">'
            + '<div class="appliance-icon-wrap">' + icon + '</div>'
            + '<div><div class="appliance-name">' + a.name + '</div><div class="appliance-room">' + a.room + '</div></div>'
          + '</div>'
          + '<span class="health-badge ' + status.cls + '">' + status.label + '</span>'
        + '</div>'
        + '<div class="appliance-stats">'
          + '<div class="appliance-stat"><div class="appliance-stat-label">Power</div><div class="appliance-stat-value">' + a.powerW + ' W</div></div>'
          + '<div class="appliance-stat"><div class="appliance-stat-label">Usage</div><div class="appliance-stat-value">' + a.actualHours + ' hrs</div></div>'
          + '<div class="appliance-stat"><div class="appliance-stat-label">Consumption</div><div class="appliance-stat-value">' + actual.toFixed(2) + ' kWh</div></div>'
          + '<div class="appliance-stat"><div class="appliance-stat-label">Cost</div><div class="appliance-stat-value">\u20B9' + calcCost(actual).toFixed(0) + '</div></div>'
        + '</div>';
      cardGrid.appendChild(card);
    });
  }

  // Appliance table
  if (tbody) {
    tbody.innerHTML = '';
    appliances.forEach(function(a) {
      var expected = calcExpected(a);
      var actual = calcActual(a);
      var dev = calcDeviation(a);
      var status = getHealthStatus(dev);
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + a.name + '</td>'
        + '<td>' + a.type + '</td>'
        + '<td>' + a.room + '</td>'
        + '<td>' + a.powerW + ' W</td>'
        + '<td>' + a.actualHours + 'h</td>'
        + '<td>' + actual.toFixed(2) + ' kWh</td>'
        + '<td>' + expected.toFixed(2) + ' kWh</td>'
        + '<td>\u20B9' + calcCost(actual).toFixed(2) + '</td>'
        + '<td><span class="status-badge ' + status.cls + '">' + status.label + '</span></td>';
      tbody.appendChild(tr);
    });
  }
}

// -------- MONITORING PAGE --------
function initMonitoringPage() {
  setChartDefaults();

  var total = getTotalConsumption();
  var bill = calcCost(total);
  var current = getCurrentUsage();

  // Fill summary metrics
  setInnerText('monTotalKwh', total.toFixed(1) + ' kWh');
  setInnerText('monTotalCost', '\u20B9' + Math.round(bill).toLocaleString('en-IN'));
  setInnerText('monCurrentLoad', current.toFixed(2) + ' kW');
  setInnerText('monAppTotal', total.toFixed(2) + ' kWh');

  var unac = getUnaccounted();
  setInnerText('monUnaccounted', unac.toFixed(2) + ' kWh');

  // Unaccounted note
  var noteEl = document.getElementById('unaccountedNote');
  if (noteEl) {
    if (unac > 0) {
      noteEl.className = 'info-box warning';
      noteEl.textContent = unac.toFixed(1) + ' kWh of consumption is not explained by the current appliance model. Check for unknown devices or standby loads.';
    } else {
      noteEl.className = 'info-box success';
      noteEl.textContent = 'All meter consumption is accounted for by registered appliances.';
    }
  }

  // Real-time chart (last 24 hours)
  var hours = [];
  for (var i = 0; i < 24; i += 2) {
    hours.push(i + ':00');
  }
  var hourlyData = [0.8, 0.5, 0.4, 0.3, 0.6, 1.2, 2.1, 2.8, 3.2, 2.9, 3.5, 3.1];
  createBarChart('hourlyChart', hours, hourlyData, 'kW', '#00bcd4');

  // Appliance current consumption table
  var tbody = document.getElementById('monitorTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    appliances.forEach(function(a) {
      var actual = calcActual(a);
      var cost = calcCost(actual);
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + a.name + '</td>'
        + '<td>' + a.room + '</td>'
        + '<td>' + (a.powerW / 1000).toFixed(2) + ' kW</td>'
        + '<td>' + actual.toFixed(2) + ' kWh</td>'
        + '<td>\u20B9' + cost.toFixed(2) + '</td>'
        + '<td><span class="status-badge success">Running</span></td>';
      tbody.appendChild(tr);
    });
  }
}

// -------- BUILDINGS PAGE --------
function initBuildingsPage() {
  var buildings = [
    { name: 'Main Building', floors: 3, rooms: 12, appliances: 6, consumption: '245.6 kWh', cost: '\u20B91,965', status: 'Normal' },
    { name: 'Annex Block',   floors: 2, rooms: 8,  appliances: 4, consumption: '98.4 kWh',  cost: '\u20B9787',   status: 'Normal' }
  ];
  var tbody = document.getElementById('buildingTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  buildings.forEach(function(b) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + b.name + '</td>'
      + '<td>' + b.floors + '</td>'
      + '<td>' + b.rooms + '</td>'
      + '<td>' + b.consumption + '</td>'
      + '<td>' + b.cost + '</td>'
      + '<td><span class="status-badge success">' + b.status + '</span></td>';
    tbody.appendChild(tr);
  });
}

// -------- ROOMS PAGE --------
function initRoomsPage() {
  var rooms = [
    { name: 'Living Room',  building: 'Main Building', appliances: 2, consumption: '14.6 kWh', status: 'Normal' },
    { name: 'Bedroom',      building: 'Main Building', appliances: 1, consumption: '0.56 kWh', status: 'Normal' },
    { name: 'Kitchen',      building: 'Main Building', appliances: 1, consumption: '4.8 kWh',  status: 'Normal' },
    { name: 'Study Room',   building: 'Main Building', appliances: 2, consumption: '1.45 kWh', status: 'Normal' }
  ];
  var tbody = document.getElementById('roomTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  rooms.forEach(function(r) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + r.name + '</td>'
      + '<td>' + r.building + '</td>'
      + '<td>' + r.appliances + '</td>'
      + '<td>' + r.consumption + '</td>'
      + '<td><span class="status-badge success">' + r.status + '</span></td>';
    tbody.appendChild(tr);
  });
}

// -------- REPORTS PAGE --------
function initReportsPage() {
  setChartDefaults();

  var total = getTotalConsumption();
  var bill = Math.round(getMonthlyBill());
  var monthly = total * 30;
  var monthlyBill = bill;

  setInnerText('rTotalKwh', total.toFixed(1) + ' kWh');
  setInnerText('rMonthlyKwh', monthly.toFixed(0) + ' kWh');
  setInnerText('rDailyBill', '\u20B9' + Math.round(calcCost(total)).toLocaleString('en-IN'));
  setInnerText('rMonthlyBill', '\u20B9' + monthlyBill.toLocaleString('en-IN'));

  // Consumption chart for reports
  createBarChart('reportMonthlyChart',
    ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    historicalData, 'kWh', '#7c4dff'
  );

  // Top consumers table
  var tbody = document.getElementById('topConsumerBody');
  if (tbody) {
    tbody.innerHTML = '';
    var sorted = appliances.slice().sort(function(a, b) {
      return calcActual(b) - calcActual(a);
    });
    sorted.forEach(function(a, idx) {
      var actual = calcActual(a);
      var pct = Math.round((actual / total) * 100);
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (idx + 1) + '</td>'
        + '<td>' + a.name + '</td>'
        + '<td>' + actual.toFixed(2) + ' kWh</td>'
        + '<td>' + pct + '%</td>'
        + '<td>\u20B9' + calcCost(actual).toFixed(2) + '</td>';
      tbody.appendChild(tr);
    });
  }
}
