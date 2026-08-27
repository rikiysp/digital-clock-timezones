// Global Variables
let selectedTimezones = [];
let alarmTime = null;
let alarmActive = false;
let isAlarmRinging = false;
let is24HourFormat = false;

// Time Zone Data
const timezoneData = {
  'UTC': { name: 'UTC (Koordinat Waktu Universal)', offset: 0 },
  'Asia/Jakarta': { name: 'Jakarta (WIB)', offset: 7 },
  'Asia/Bangkok': { name: 'Bangkok (ICT)', offset: 7 },
  'Asia/Hong_Kong': { name: 'Hong Kong (HKT)', offset: 8 },
  'Asia/Tokyo': { name: 'Tokyo (JST)', offset: 9 },
  'Asia/Singapore': { name: 'Singapore (SGT)', offset: 8 },
  'Australia/Sydney': { name: 'Sydney (AEDT)', offset: 11 },
  'Europe/London': { name: 'London (GMT)', offset: 0 },
  'Europe/Paris': { name: 'Paris (CET)', offset: 1 },
  'Europe/Moscow': { name: 'Moscow (MSK)', offset: 3 },
  'America/New_York': { name: 'New York (EST)', offset: -5 },
  'America/Chicago': { name: 'Chicago (CST)', offset: -6 },
  'America/Los_Angeles': { name: 'Los Angeles (PST)', offset: -8 },
  'America/Sao_Paulo': { name: 'São Paulo (BRT)', offset: -3 },
  'Africa/Cairo': { name: 'Cairo (EET)', offset: 2 },
  'Africa/Johannesburg': { name: 'Johannesburg (SAST)', offset: 2 },
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  updateMainClock();
  updateTimezoneClocks();
  setupEventListeners();
  
  // Update clocks every second
  setInterval(() => {
    updateMainClock();
    updateTimezoneClocks();
    checkAlarm();
  }, 1000);
});

// Setup Event Listeners
function setupEventListeners() {
  // Theme Toggle
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);
  
  // Format Toggle
  document.getElementById('formatBtn').addEventListener('click', toggleFormat);
  
  // Main Timezone Change
  document.getElementById('timezoneSelect').addEventListener('change', (e) => {
    localStorage.setItem('mainTimezone', e.target.value);
    updateMainClock();
  });
  
  // Add Timezone
  document.getElementById('addBtn').addEventListener('click', addTimezone);
  document.getElementById('addTimezone').addEventListener('change', function() {
    if (this.value) {
      this.form?.dispatchEvent(new Event('submit'));
    }
  });
  
  // Alarm Controls
  document.getElementById('alarmBtn').addEventListener('click', setAlarm);
  document.getElementById('clearAlarmBtn').addEventListener('click', clearAlarm);
  document.getElementById('alarmTime').addEventListener('change', (e) => {
    if (e.target.value) {
      alarmTime = e.target.value;
      localStorage.setItem('alarmTime', alarmTime);
    }
  });
}

// Update Main Clock
function updateMainClock() {
  const mainTimezone = localStorage.getItem('mainTimezone') || 'UTC';
  const time = getTimeInTimezone(mainTimezone);
  
  const timeString = formatTime(time);
  const dateString = formatDate(time);
  
  document.getElementById('mainTime').textContent = timeString;
  document.getElementById('mainDate').textContent = dateString;
  document.getElementById('mainTimezone').textContent = mainTimezone;
  document.getElementById('timezoneSelect').value = mainTimezone;
}

// Update Timezone Clocks
function updateTimezoneClocks() {
  const container = document.getElementById('timezonesContainer');
  const emptyState = document.getElementById('emptyState');
  
  if (selectedTimezones.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }
  
  emptyState.style.display = 'none';
  
  selectedTimezones.forEach((timezone, index) => {
    let card = document.getElementById(`clock-${index}`);
    
    if (!card) {
      card = createClockCard(timezone, index);
      container.appendChild(card);
    }
    
    updateClockCard(card, timezone);
  });
}

// Create Clock Card
function createClockCard(timezone, index) {
  const card = document.createElement('div');
  card.id = `clock-${index}`;
  card.className = 'clock-card';
  
  card.innerHTML = `
    <button class="remove-btn" onclick="removeTimezone(${index})">
      <i class="fas fa-times"></i>
    </button>
    <div class="timezone-name">${timezoneData[timezone]?.name || timezone}</div>
    <div class="time" id="time-${index}">00:00:00</div>
    <div class="date" id="date-${index}">Loading...</div>
    <div class="offset" id="offset-${index}">UTC +0</div>
  `;
  
  return card;
}

// Update Clock Card
function updateClockCard(card, timezone) {
  const time = getTimeInTimezone(timezone);
  const timeString = formatTime(time);
  const dateString = formatDate(time);
  
  const offset = timezoneData[timezone]?.offset || 0;
  const offsetString = offset >= 0 ? `UTC +${offset}` : `UTC ${offset}`;
  
  const index = selectedTimezones.indexOf(timezone);
  document.getElementById(`time-${index}`).textContent = timeString;
  document.getElementById(`date-${index}`).textContent = dateString;
  document.getElementById(`offset-${index}`).textContent = offsetString;
}

// Get Time in Timezone
function getTimeInTimezone(timezone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const dateObj = {};
  
  parts.forEach(({ type, value }) => {
    dateObj[type] = value;
  });
  
  return new Date(
    `${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`
  );
}

// Format Time
function formatTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  if (!is24HourFormat) {
    hours = hours % 12 || 12;
  }
  
  hours = String(hours).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Format Date
function formatDate(date) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  
  return `${dayName}, ${date.getDate()} ${monthName} ${date.getFullYear()}`;
}

// Add Timezone
function addTimezone() {
  const select = document.getElementById('addTimezone');
  const timezone = select.value;
  
  if (!timezone) return;
  
  if (!selectedTimezones.includes(timezone)) {
    selectedTimezones.push(timezone);
    saveToLocalStorage();
    updateTimezoneClocks();
  }
  
  select.value = '';
}

// Remove Timezone
function removeTimezone(index) {
  selectedTimezones.splice(index, 1);
  saveToLocalStorage();
  updateTimezoneClocks();
}

// Toggle Theme
function toggleTheme() {
  const body = document.body;
  const isDark = !body.classList.contains('light-theme');
  
  if (isDark) {
    body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
    document.getElementById('themeBtn').innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    body.classList.remove('light-theme');
    localStorage.setItem('theme', 'dark');
    document.getElementById('themeBtn').innerHTML = '<i class="fas fa-moon"></i>';
  }
}

// Toggle 12/24 Hour Format
function toggleFormat() {
  is24HourFormat = !is24HourFormat;
  localStorage.setItem('format24h', is24HourFormat);
  updateMainClock();
  updateTimezoneClocks();
}

// Set Alarm
function setAlarm() {
  const alarmTimeInput = document.getElementById('alarmTime');
  const time = alarmTimeInput.value;
  
  if (!time) {
    alert('Silakan pilih waktu alarm');
    return;
  }
  
  alarmTime = time;
  alarmActive = true;
  localStorage.setItem('alarmTime', time);
  localStorage.setItem('alarmActive', true);
  
  updateAlarmStatus();
  document.getElementById('alarmBtn').style.display = 'none';
  document.getElementById('clearAlarmBtn').style.display = 'flex';
}

// Clear Alarm
function clearAlarm() {
  alarmTime = null;
  alarmActive = false;
  isAlarmRinging = false;
  localStorage.removeItem('alarmTime');
  localStorage.setItem('alarmActive', false);
  
  document.getElementById('alarmTime').value = '';
  document.getElementById('alarmStatus').textContent = '';
  document.getElementById('alarmStatus').classList.remove('alarm-active');
  document.getElementById('alarmBtn').style.display = 'flex';
  document.getElementById('clearAlarmBtn').style.display = 'none';
  
  const sound = document.getElementById('alarmSound');
  sound.pause();
}

// Check Alarm
function checkAlarm() {
  if (!alarmActive || !alarmTime) return;
  
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  if (currentTime === alarmTime && !isAlarmRinging) {
    triggerAlarm();
  }
}

// Trigger Alarm
function triggerAlarm() {
  isAlarmRinging = true;
  
  // Create alarm sound
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  playAlarmSound(audioContext);
  
  // Show notification
  showNotification('⏰ Alarm!', `Waktu ${alarmTime} telah tiba!`);
  
  // Blink title
  let isVisible = true;
  const originalTitle = document.title;
  const blinkInterval = setInterval(() => {
    isVisible = !isVisible;
    document.title = isVisible ? originalTitle : '⏰ ALARM!';
  }, 500);
  
  // Stop after 30 seconds
  setTimeout(() => {
    clearInterval(blinkInterval);
    document.title = originalTitle;
    isAlarmRinging = false;
  }, 30000);
}

// Play Alarm Sound using Web Audio API
function playAlarmSound(audioContext) {
  const frequency = 800;
  const duration = 0.5;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
  
  // Repeat alarm sound
  if (isAlarmRinging) {
    setTimeout(() => playAlarmSound(audioContext), (duration + 0.1) * 1000);
  }
}

// Show Notification
function showNotification(title, message) {
  const alarmStatus = document.getElementById('alarmStatus');
  alarmStatus.innerHTML = `<strong>${title}</strong><br>${message}`;
  alarmStatus.classList.add('alarm-active');
  
  // Browser notification
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body: message, icon: '⏰' });
      }
    });
  }
}

// Update Alarm Status
function updateAlarmStatus() {
  const alarmStatus = document.getElementById('alarmStatus');
  const mainTimezone = localStorage.getItem('mainTimezone') || 'UTC';
  
  alarmStatus.innerHTML = `✓ Alarm diatur pada ${alarmTime} (${mainTimezone})`;
  alarmStatus.classList.add('alarm-active');
}

// Local Storage
function saveToLocalStorage() {
  localStorage.setItem('selectedTimezones', JSON.stringify(selectedTimezones));
}

function loadFromLocalStorage() {
  // Load theme
  const theme = localStorage.getItem('theme');
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    document.getElementById('themeBtn').innerHTML = '<i class="fas fa-sun"></i>';
  }
  
  // Load format
  const format = localStorage.getItem('format24h');
  if (format === 'true') {
    is24HourFormat = true;
  }
  
  // Load timezones
  const saved = localStorage.getItem('selectedTimezones');
  if (saved) {
    selectedTimezones = JSON.parse(saved);
  }
  
  // Load alarm
  const alarm = localStorage.getItem('alarmTime');
  if (alarm) {
    alarmTime = alarm;
    const alarmStatus = localStorage.getItem('alarmActive');
    if (alarmStatus === 'true') {
      alarmActive = true;
      document.getElementById('alarmTime').value = alarm;
      updateAlarmStatus();
      document.getElementById('alarmBtn').style.display = 'none';
      document.getElementById('clearAlarmBtn').style.display = 'flex';
    }
  }
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 't' || e.key === 'T') {
    toggleTheme();
  }
  if (e.key === 'f' || e.key === 'F') {
    toggleFormat();
  }
});

console.log('Digital Clock App Loaded Successfully! ⏰');
