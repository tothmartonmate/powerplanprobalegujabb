import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ALL_GYMS } from '../utils/gymsByCounty';
import { FOOD_DB, FLAT_FOOD_OPTIONS } from '../utils/foodDatabase';
import './dashboard.css';

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const MIN_REALISTIC_WEIGHT_KG = 30;
const MAX_REALISTIC_WEIGHT_KG = 200;
const WEIGHT_CHART_PADDING_KG = 20;
const WEIGHT_CHART_STEP_KG = 5;

const formatLocalDate = (dateInput) => {
  const date = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfWeek = (dateInput) => {
  const date = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const start = new Date(safeDate);
  const dayOfWeek = start.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start;
};

const isSameDay = (firstDate, secondDate) => formatLocalDate(firstDate) === formatLocalDate(secondDate);

const formatHungarianLongDate = (dateInput) => {
  const date = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '-';

  const formatted = date.toLocaleDateString('hu-HU', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return formatted
    .split(', ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(', ');
};

const HUNGARY_CENTER = [47.1625, 19.5033];
const HUNGARY_BOUNDS = [
  [45.7, 15.9],
  [48.7, 22.95]
];
const HUNGARY_LAT_BOUNDS = {
  min: HUNGARY_BOUNDS[0][0],
  max: HUNGARY_BOUNDS[1][0]
};
const HUNGARY_LNG_BOUNDS = {
  min: HUNGARY_BOUNDS[0][1],
  max: HUNGARY_BOUNDS[1][1]
};
const NEARBY_RADIUS_KM = 45;

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distanceKm) => {
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
  return `${Math.round(distanceKm)} km`;
};

const normalizeSearchText = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('hu-HU');

const MEAL_TYPE_CATEGORY_MAP = {
  breakfast: ['breads', 'dairy', 'fruits', 'sweets'],
  lunch: ['meats', 'vegetables', 'dairy', 'breads'],
  dinner: ['meats', 'vegetables', 'dairy', 'breads'],
  snack: ['fruits', 'dairy', 'sweets', 'breads']
};

const isBreadFood = (food) => (
  food.category === 'Reggeli ételek' && /kenyer|kifli|zsemle|kalacs|csiga|taska|pogacsa|croissant|palacsinta|piritos|bagel|lángos|melegszendvics|keksz/i.test(normalizeSearchText(food.name))
);

const isSweetFood = (food) => (
  food.category === 'Snackek és Édességek' ||
  (food.category === 'Reggeli ételek' && /mez|lekvar|nutella|csiga|taska|granola|palacsinta/i.test(normalizeSearchText(food.name)))
);

const FOOD_CATEGORY_OPTIONS = [
  { key: 'dairy', label: 'Tejtermékek', matches: (food) => food.category === 'Tejtermékek és Tojás' },
  { key: 'vegetables', label: 'Zöldségek', matches: (food) => food.category === 'Zöldségek' },
  { key: 'fruits', label: 'Gyümölcsök', matches: (food) => food.category === 'Gyümölcsök' },
  { key: 'meats', label: 'Húsok - Halak', matches: (food) => food.category === 'Húsok és Halak' || food.category === 'Ebéd és Vacsora (Készételek)' },
  { key: 'sweets', label: 'Édességek', matches: (food) => isSweetFood(food) },
  { key: 'breads', label: 'Kenyérfélék', matches: (food) => isBreadFood(food) }
];

const isWithinHungary = (lat, lng) => (
  lat >= HUNGARY_LAT_BOUNDS.min &&
  lat <= HUNGARY_LAT_BOUNDS.max &&
  lng >= HUNGARY_LNG_BOUNDS.min &&
  lng <= HUNGARY_LNG_BOUNDS.max
);

const hasValidCoordinate = (value) => Number.isFinite(value) && !Number.isNaN(value);

const isValidLatLng = (lat, lng) => hasValidCoordinate(lat) && hasValidCoordinate(lng);

const hasRenderableMapSize = (map) => {
  const container = map?.getContainer?.();
  return Boolean(container && container.clientWidth > 0 && container.clientHeight > 0);
};

const isLeafletMapReady = (map) => {
  if (!map || typeof map.getContainer !== 'function') return false;

  const container = map.getContainer();
  return Boolean(container && container.isConnected && map._loaded && map._mapPane);
};

const safeSetHungaryView = (map) => {
  if (!isLeafletMapReady(map)) return;

  try {
    map.setView(HUNGARY_CENTER, 7, { animate: false });
  } catch (error) {
    console.warn('Térkép nézet visszaállítási hiba:', error);
  }
};

const safeFitBounds = (map, bounds, fallbackToHungary = true) => {
  if (!isLeafletMapReady(map)) return;

  const normalizedBounds = Array.isArray(bounds)
    ? bounds.filter((entry) => Array.isArray(entry) && isValidLatLng(entry[0], entry[1]))
    : [];

  if (!hasRenderableMapSize(map) || normalizedBounds.length === 0) {
    if (fallbackToHungary) {
      safeSetHungaryView(map);
    }
    return;
  }

  try {
    map.fitBounds(normalizedBounds, { padding: [24, 24], animate: false });
  } catch (error) {
    console.warn('Térkép bounds hiba, fallback magyar nézetre:', error);
    if (fallbackToHungary) {
      safeSetHungaryView(map);
    }
  }
};

const getAuthHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

const getProfileImageStorageKey = (userId) => `powerplan_profile_image_${userId}`;

const preventNumberInputWheel = (event) => {
  event.currentTarget.blur();
};

const getWeightAxisBounds = (weightValues, startingWeight) => {
  const numericWeights = weightValues.filter((value) => Number.isFinite(value));
  const fallbackWeight = Number.isFinite(startingWeight) ? Math.round(startingWeight) : 80;
  const minWeight = Math.min(...numericWeights, fallbackWeight - WEIGHT_CHART_PADDING_KG);
  const maxWeight = Math.max(...numericWeights, fallbackWeight + WEIGHT_CHART_PADDING_KG);

  return {
    min: Math.max(0, Math.floor(minWeight / WEIGHT_CHART_STEP_KG) * WEIGHT_CHART_STEP_KG),
    max: Math.ceil(maxWeight / WEIGHT_CHART_STEP_KG) * WEIGHT_CHART_STEP_KG
  };
};

const getMarkerPosition = (gym, duplicateIndex) => {
  const angle = (duplicateIndex % 6) * (Math.PI / 3);
  const ring = Math.floor(duplicateIndex / 6) + 1;
  const offset = 0.008 * ring;

  return [
    gym.lat + Math.sin(angle) * offset,
    gym.lng + Math.cos(angle) * offset
  ];
};

const gymMarkerIcon = L.divIcon({
  className: 'gym-leaflet-marker',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -8]
});

// GYAKORLAT ADATBÁZIS (TELJES)
const EXERCISE_DB_WITH_VIDEOS = {
  'Mell': [
    { name: 'Fekvenyomás (Rúd)', video: 'https://www.youtube.com/embed/rT7DgCr-3pg', difficulty: 'intermediate' },
    { name: 'Fekvenyomás (Kézisúlyzó)', video: 'https://www.youtube.com/embed/VmB1G1K7v94', difficulty: 'beginner' },
    { name: 'Ferde pados nyomás', video: 'https://www.youtube.com/embed/JChVKM4ga4Y', difficulty: 'intermediate' },
    { name: 'Tárogatás', video: 'https://www.youtube.com/embed/kIpagzRxFPo', difficulty: 'beginner' },
    { name: 'Kábelkereszt', video: 'https://www.youtube.com/embed/taI4XduLpTk', difficulty: 'advanced' },
    { name: 'Ferde pados kézisúlyzós nyomás', video: 'https://www.youtube.com/embed/8iPEnn-ltC8', difficulty: 'intermediate' },
    { name: 'Tolódzkodás mellre döntve', video: 'https://www.youtube.com/embed/2z8JmcrW-As', difficulty: 'advanced' },
    { name: 'Hammer Strength mellnyomás', video: 'https://www.youtube.com/embed/sqNwDkUU_Ps', difficulty: 'beginner' },
    { name: 'Pec deck', video: 'https://www.youtube.com/embed/eozdVDA78K0', difficulty: 'beginner' },
    { name: 'Fekvőtámasz', video: 'https://www.youtube.com/embed/IODxDxX7oi4', difficulty: 'beginner' }
  ],
  'Hát': [
    { name: 'Húzódzkodás', video: 'https://www.youtube.com/embed/eGo4IYlbE5g', difficulty: 'intermediate' },
    { name: 'Lehúzás csigán', video: 'https://www.youtube.com/embed/CAwf7n6Luuc', difficulty: 'beginner' },
    { name: 'Felhúzás (Deadlift)', video: 'https://www.youtube.com/embed/op9kVnSso6Q', difficulty: 'advanced' },
    { name: 'Döntött törzsű evezés rúddal', video: 'https://www.youtube.com/embed/vT2GjY_Umpw', difficulty: 'intermediate' },
    { name: 'Evezés csigán', video: 'https://www.youtube.com/embed/GZbfZ033f74', difficulty: 'beginner' },
    { name: 'Egykezes evezés kézisúlyzóval', video: 'https://www.youtube.com/embed/pYcpY20QaE8', difficulty: 'beginner' },
    { name: 'T-rudas evezés', video: 'https://www.youtube.com/embed/j3Igk5nyZE4', difficulty: 'advanced' },
    { name: 'Straight-arm lehúzás', video: 'https://www.youtube.com/embed/hAMcfubonDc', difficulty: 'beginner' },
    { name: 'Fordított pec deck', video: 'https://www.youtube.com/embed/EA7u4Q_8HQ0', difficulty: 'beginner' },
    { name: 'Rack pull', video: 'https://www.youtube.com/embed/ZlRrIsoDpKg', difficulty: 'advanced' },
    { name: 'Gumiszalagos lehúzás', video: 'https://www.youtube.com/embed/K59OGC4aeQ4', difficulty: 'beginner' }
  ],
  'Láb': [
    { name: 'Guggolás', video: 'https://www.youtube.com/embed/lRYBbchqxtI', difficulty: 'intermediate' },
    { name: 'Lábnyomás', video: 'https://www.youtube.com/embed/nDh_BlnLCGc', difficulty: 'beginner' },
    { name: 'Bolgár guggolás', video: 'https://www.youtube.com/embed/2C-uNgKwPLE', difficulty: 'intermediate' },
    { name: 'Combfeszítő', video: 'https://www.youtube.com/embed/YyvSfVjQeL0', difficulty: 'beginner' },
    { name: 'Combhajlító gép', video: 'https://www.youtube.com/embed/1Tq3QdYUuHs', difficulty: 'beginner' },
    { name: 'Román felhúzás', video: 'https://www.youtube.com/embed/2SHsk9AzdjA', difficulty: 'intermediate' },
    { name: 'Kitörés', video: 'https://www.youtube.com/embed/QOVaHwm-Q6U', difficulty: 'beginner' },
    { name: 'Hack guggolás', video: 'https://www.youtube.com/embed/0tn5K9NlCfo', difficulty: 'intermediate' },
    { name: 'Csípőemelés rúddal', video: 'https://www.youtube.com/embed/LM8XHLYJoYs', difficulty: 'intermediate' },
    { name: 'Álló vádliemelés', video: 'https://www.youtube.com/embed/-M4-G8p8fmc', difficulty: 'beginner' },
    { name: 'Sissy guggolás', video: 'https://www.youtube.com/embed/6L-nXAUD7zQ', difficulty: 'advanced' }
  ],
  'Váll': [
    { name: 'Vállból nyomás', video: 'https://www.youtube.com/embed/2yjwXTZQDDI', difficulty: 'intermediate' },
    { name: 'Oldalemelés', video: 'https://www.youtube.com/embed/3VcKaXpzqRo', difficulty: 'beginner' },
    { name: 'Arnold nyomás', video: 'https://www.youtube.com/embed/6Z15_WdXmVw', difficulty: 'intermediate' },
    { name: 'Előreemelés tárcsával', video: 'https://www.youtube.com/embed/-t7fuZ0KhDA', difficulty: 'beginner' },
    { name: 'Hátsóváll döntött oldalemelés', video: 'https://www.youtube.com/embed/ttvfGg9d76c', difficulty: 'beginner' },
    { name: 'Face pull', video: 'https://www.youtube.com/embed/rep-qVOkqgk', difficulty: 'beginner' },
    { name: 'Katonai nyomás', video: 'https://www.youtube.com/embed/B-aVuyhvLHU', difficulty: 'advanced' },
    { name: 'Upright row', video: 'https://www.youtube.com/embed/jaAV-rD45I0', difficulty: 'intermediate' },
    { name: 'Kábel oldalemelés', video: 'https://www.youtube.com/embed/XPPfnSEATJA', difficulty: 'beginner' },
    { name: 'Gépi vállnyomás', video: 'https://www.youtube.com/embed/WvLMauqrnK8', difficulty: 'beginner' },
    { name: 'Fordított tárogatás', video: 'https://www.youtube.com/embed/xvEkgGUrGPM', difficulty: 'beginner' }
  ],
  'Bicepsz': [
    { name: 'Bicepsz karhajlítás rúddal', video: 'https://www.youtube.com/embed/ykJmrZ5v0Oo', difficulty: 'beginner' },
    { name: 'Kalapács bicepsz', video: 'https://www.youtube.com/embed/zC3nLlEvin4', difficulty: 'beginner' },
    { name: 'Koncentrált bicepsz', video: 'https://www.youtube.com/embed/0AUGkch3tzc', difficulty: 'intermediate' },
    { name: 'Scott pad bicepsz', video: 'https://www.youtube.com/embed/fIWP-FRFNU0', difficulty: 'intermediate' },
    { name: 'Kábeles bicepsz hajlítás', video: 'https://www.youtube.com/embed/NFzTWp2qpiE', difficulty: 'beginner' },
    { name: 'Váltott karos bicepsz kézisúlyzóval', video: 'https://www.youtube.com/embed/sAq_ocpRh_I', difficulty: 'beginner' },
    { name: 'Fordított fogású bicepsz', video: 'https://www.youtube.com/embed/nRgxYX2Ve9w', difficulty: 'intermediate' },
    { name: 'Ferde padon bicepsz', video: 'https://www.youtube.com/embed/soxrZlIl35U', difficulty: 'intermediate' },
    { name: 'Spider curl', video: 'https://www.youtube.com/embed/ivS3G35bapw', difficulty: 'advanced' },
    { name: 'Preacher machine bicepsz', video: 'https://www.youtube.com/embed/Htw-s61mOw0', difficulty: 'beginner' }
  ],
  'Tricepsz': [
    { name: 'Tricepsz letolás csigán', video: 'https://www.youtube.com/embed/1FjkhpZsaxc', difficulty: 'beginner' },
    { name: 'Letolás francia rúddal', video: 'https://www.youtube.com/embed/d_KZxkY_0cM', difficulty: 'intermediate' },
    { name: 'Koponyazúzó', video: 'https://www.youtube.com/embed/d_KZxkY_0cM', difficulty: 'intermediate' },
    { name: 'Tricepsz nyújtás fej fölött kötéllel', video: 'https://www.youtube.com/embed/_gsUck-7M74', difficulty: 'beginner' },
    { name: 'Szűk fekvenyomás', video: 'https://www.youtube.com/embed/nEF0bv2FW94', difficulty: 'advanced' },
    { name: 'Tolódzkodás tricepszre', video: 'https://www.youtube.com/embed/0326dy_-CzM', difficulty: 'intermediate' },
    { name: 'Lórúgás', video: 'https://www.youtube.com/embed/6SS6K3lAwZ8', difficulty: 'beginner' },
    { name: 'Egykezes fej fölötti tricepsz nyújtás', video: 'https://www.youtube.com/embed/-Vyt2QdsR7E', difficulty: 'beginner' },
    { name: 'Fordított fogású letolás', video: 'https://www.youtube.com/embed/kiuVA0gs3EI', difficulty: 'beginner' },
    { name: 'Padon tolódzkodás', video: 'https://www.youtube.com/embed/6kALZikXxLc', difficulty: 'beginner' }
  ],
  'Has': [
    { name: 'Hasprés', video: 'https://www.youtube.com/embed/eeJ_CYqSoT4', difficulty: 'beginner' },
    { name: 'Plank', video: 'https://www.youtube.com/embed/pSHjTRCQxIw', difficulty: 'beginner' },
    { name: 'Lábemelés fekve', video: 'https://www.youtube.com/embed/JB2oyawG9KI', difficulty: 'beginner' },
    { name: 'Függeszkedéses lábemelés', video: 'https://www.youtube.com/embed/Pr1ieGZ5atk', difficulty: 'intermediate' },
    { name: 'Orosz twist', video: 'https://www.youtube.com/embed/wkD8rjkodUI', difficulty: 'beginner' },
    { name: 'Biciklis hasprés', video: 'https://www.youtube.com/embed/9FGilxCbdz8', difficulty: 'beginner' },
    { name: 'Haskerék', video: 'https://www.youtube.com/embed/A3uK5TPzHq8', difficulty: 'advanced' },
    { name: 'Dead bug', video: 'https://www.youtube.com/embed/g_BYB0R-4Ws', difficulty: 'beginner' },
    { name: 'Mountain climber', video: 'https://www.youtube.com/embed/nmwgirgXLYM', difficulty: 'beginner' },
    { name: 'Fordított hasprés', video: 'https://www.youtube.com/embed/hyv14e2QDq0', difficulty: 'beginner' },
    { name: 'Oldalsó plank', video: 'https://www.youtube.com/embed/K2VljzCC16g', difficulty: 'beginner' }
  ]
};

const MUSCLE_FILTER = {
  'push': ['Mell', 'Váll', 'Tricepsz'],
  'pull': ['Hát', 'Bicepsz'],
  'leg': ['Láb', 'Has'],
  'upper': ['Mell', 'Hát', 'Váll', 'Bicepsz', 'Tricepsz'],
  'lower': ['Láb', 'Has'],
  'full body': Object.keys(EXERCISE_DB_WITH_VIDEOS),
  'arms': ['Bicepsz', 'Tricepsz'],
  'legs': ['Láb', 'Has'],
  'full_body': Object.keys(EXERCISE_DB_WITH_VIDEOS)
};

const WORKOUT_TYPE_LABELS = {
  'push': 'push',
  'pull': 'pull',
  'leg': 'leg',
  'upper': 'upper',
  'lower': 'lower',
  'full body': 'full body',
  'arms': 'arms',
  'legs': 'leg',
  'full_body': 'full body'
};

const normalizeWorkoutTypeValue = (type) => WORKOUT_TYPE_LABELS[type] || type || '';

const serializeWorkoutTypeValue = (type) => {
  const normalized = String(type || '').trim().toLowerCase();
  if (normalized === 'full body') return 'full_body';
  if (normalized === 'leg') return 'legs';
  return normalized;
};

const formatWorkoutTypeLabel = (type) => WORKOUT_TYPE_LABELS[type] || type || '-';

// NAPTÁR KOMPONENS
const WeekCalendar = ({ selectedDate, onDateChange, onWeekChange }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    const start = new Date(date);
    const dayOfWeek = date.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    start.setDate(date.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  useEffect(() => {
    if (!selectedDate) return;
    setCurrentWeekStart(getStartOfWeek(selectedDate));
  }, [selectedDate]);

  const weekDays = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];

  const getSelectedOffset = () => {
    if (!selectedDate) return 0;
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  };
  
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const prevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
    if (onWeekChange) onWeekChange(newStart);
    if (onDateChange) {
      const newSelectedDate = new Date(newStart);
      newSelectedDate.setDate(newStart.getDate() + getSelectedOffset());
      onDateChange(newSelectedDate);
    }
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    if (onWeekChange) onWeekChange(newStart);
    if (onDateChange) {
      const newSelectedDate = new Date(newStart);
      newSelectedDate.setDate(newStart.getDate() + getSelectedOffset());
      onDateChange(newSelectedDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    const start = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    start.setDate(today.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
    if (onWeekChange) onWeekChange(start);
    if (onDateChange) onDateChange(today);
  };

  const weekDates = getWeekDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="week-calendar">
      <div className="week-nav">
        <button className="nav-btn" onClick={prevWeek}><i className="fas fa-chevron-left"></i> Előző hét</button>
        <button className="nav-btn today-btn" onClick={goToToday}><i className="fas fa-calendar-day"></i> Ma</button>
        <button className="nav-btn" onClick={nextWeek}>Következő hét <i className="fas fa-chevron-right"></i></button>
      </div>
      <div className="week-days-header">
        {weekDays.map((day, index) => {
          const date = weekDates[index];
          const isSelected = selectedDate && date.toDateString() === new Date(selectedDate).toDateString();
          const isToday = date.toDateString() === today.toDateString();
          return (
            <div key={index} className={`day-header ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`} onClick={() => onDateChange && onDateChange(date)}>
              <div className="day-name">{day}</div>
              <div className="day-date">{date.getDate()}</div>
              <div className="day-month">{date.toLocaleString('hu', { month: 'short' })}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// TÉRKÉP KOMPONENS
const GymMap = ({ isActive }) => {
  const [mapMode, setMapMode] = useState('country');
  const [nearbyCenter, setNearbyCenter] = useState(null);
  const [visibleGyms, setVisibleGyms] = useState(ALL_GYMS);
  const [mapMessage, setMapMessage] = useState(`Az országos nézet mind a ${ALL_GYMS.length} várost és az azokon belüli edzőtermeket egyszerre mutatja Magyarország térképén.`);
  const mapElementRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerLayerRef = useRef(null);

  const openGoogleMaps = () => {
    const primaryGym = visibleGyms[0];
    if (primaryGym) {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(primaryGym.mapQuery || `${primaryGym.name} ${primaryGym.cityLabel}`)}`, '_blank');
      return;
    }

    window.open(`https://www.google.com/maps/search/${encodeURIComponent('edzőterem Magyarország')}/@${HUNGARY_CENTER[0]},${HUNGARY_CENTER[1]},7z`, '_blank');
  };

  useEffect(() => {
    if (!mapElementRef.current || leafletMapRef.current) return;

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      maxBounds: HUNGARY_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: 7
    }).setView(HUNGARY_CENTER, 7);

    map.scrollWheelZoom.disable();

    const enableScrollZoom = () => {
      if (!map.scrollWheelZoom.enabled()) {
        map.scrollWheelZoom.enable();
      }
    };

    const disableScrollZoom = () => {
      if (map.scrollWheelZoom.enabled()) {
        map.scrollWheelZoom.disable();
      }
    };

    const handleDocumentPointerDown = (event) => {
      if (!mapElementRef.current?.contains(event.target)) {
        disableScrollZoom();
      }
    };

    mapElementRef.current.addEventListener('click', enableScrollZoom);
    mapElementRef.current.addEventListener('mouseleave', disableScrollZoom);
    document.addEventListener('pointerdown', handleDocumentPointerDown);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap közreműködők',
      noWrap: true,
      bounds: HUNGARY_BOUNDS
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    leafletMapRef.current = map;

    window.requestAnimationFrame(() => {
      map.invalidateSize();
      safeSetHungaryView(map);
    });

    return () => {
      mapElementRef.current?.removeEventListener('click', enableScrollZoom);
      mapElementRef.current?.removeEventListener('mouseleave', disableScrollZoom);
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
      markerLayerRef.current?.clearLayers();
      map.remove();
      markerLayerRef.current = null;
      leafletMapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isActive || !leafletMapRef.current) return;

    const map = leafletMapRef.current;
    const refreshMapSize = () => {
      if (!isLeafletMapReady(map)) return;
      map.invalidateSize();
      try {
        map.panInsideBounds(HUNGARY_BOUNDS, { animate: false });
      } catch (error) {
        console.warn('Térkép pozicionálási hiba:', error);
      }
    };

    const timeoutId = window.setTimeout(refreshMapSize, 120);
    window.requestAnimationFrame(refreshMapSize);

    return () => window.clearTimeout(timeoutId);
  }, [isActive, mapMode]);

  useEffect(() => {
    if (!leafletMapRef.current || !markerLayerRef.current) return;

    const map = leafletMapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!isLeafletMapReady(map)) return;
    markerLayer.clearLayers();

    const gymsWithDistance = ALL_GYMS.map((gym) => {
      if (!isValidLatLng(gym.lat, gym.lng)) {
        return null;
      }

      if (!nearbyCenter) {
        return { ...gym, distanceKm: null };
      }

      return {
        ...gym,
        distanceKm: calculateDistanceKm(nearbyCenter.lat, nearbyCenter.lng, gym.lat, gym.lng)
      };
    }).filter(Boolean);

    const gymsToRender = mapMode === 'nearby' && nearbyCenter
      ? gymsWithDistance
          .filter((gym) => gym.distanceKm <= NEARBY_RADIUS_KM)
          .sort((firstGym, secondGym) => firstGym.distanceKm - secondGym.distanceKm)
          .slice(0, 25)
      : gymsWithDistance;

    const fallbackNearbyGyms = mapMode === 'nearby' && nearbyCenter && gymsToRender.length === 0
      ? gymsWithDistance
          .sort((firstGym, secondGym) => firstGym.distanceKm - secondGym.distanceKm)
          .slice(0, 12)
      : gymsToRender;

    const finalGyms = fallbackNearbyGyms;
    setVisibleGyms(finalGyms);
    const duplicateCounts = {};
    const markerBounds = [];

    finalGyms.forEach((gym) => {
      const duplicateIndex = duplicateCounts[gym.cityLabel] || 0;
      duplicateCounts[gym.cityLabel] = duplicateIndex + 1;
      const [markerLat, markerLng] = getMarkerPosition(gym, duplicateIndex);
      if (!isValidLatLng(markerLat, markerLng)) return;
      const distanceLine = gym.distanceKm !== null ? `<p><strong>Távolság:</strong> ${formatDistance(gym.distanceKm)}</p>` : '';
      const marker = L.marker([markerLat, markerLng], { icon: gymMarkerIcon })
        .bindTooltip(gym.name, {
          permanent: false,
          sticky: true,
          direction: 'top',
          offset: [0, -10],
          className: 'gym-marker-label'
        })
        .bindPopup(`
        <div class="gym-popup">
          <h4>${gym.name}</h4>
          <p><strong>Vármegye:</strong> ${gym.countyLabel}</p>
          <p><strong>Város:</strong> ${gym.cityLabel}</p>
          ${distanceLine}
          <a href="https://www.google.com/maps/search/${encodeURIComponent(gym.mapQuery || `${gym.name} ${gym.cityLabel}`)}" target="_blank" rel="noreferrer">Megnyitás Google Mapsben</a>
        </div>
      `);

      marker.addTo(markerLayer);
      markerBounds.push([markerLat, markerLng]);
    });

    if (mapMode === 'nearby' && nearbyCenter) {
      if (isValidLatLng(nearbyCenter.lat, nearbyCenter.lng)) {
        L.circleMarker([nearbyCenter.lat, nearbyCenter.lng], {
        radius: 8,
        weight: 3,
        color: '#0f4c5c',
        fillColor: '#2a9d8f',
        fillOpacity: 0.95
      })
        .bindTooltip('Itt vagy most', {
          permanent: false,
          sticky: true,
          direction: 'top',
          offset: [0, -10],
          className: 'gym-marker-label current-location-label'
        })
        .bindPopup('A jelenlegi helyzeted')
        .addTo(markerLayer);

        markerBounds.push([nearbyCenter.lat, nearbyCenter.lng]);
      }
    }

    if (mapMode === 'nearby' && nearbyCenter) {
      const withinRadiusCount = gymsWithDistance.filter((gym) => gym.distanceKm <= NEARBY_RADIUS_KM).length;
      if (withinRadiusCount > 0) {
        setMapMessage(`A közelben nézet ${withinRadiusCount} edzőtermet talált ${NEARBY_RADIUS_KM} km-en belül. A térképen a legközelebbi ${finalGyms.length} terem látszik.`);
      } else {
        setMapMessage('A közelben nézetben nem volt 45 km-en belül találat, ezért a térkép a legközelebbi edzőtermeket mutatja.' );
      }
    } else {
      setMapMessage(`Az országos nézet mind a ${ALL_GYMS.length} várost és az azokon belüli edzőtermeket egyszerre mutatja Magyarország térképén.`);
    }

    if (mapMode === 'country') {
      safeSetHungaryView(map);
    } else if (markerBounds.length > 0) {
      safeFitBounds(map, markerBounds);
    } else {
      safeSetHungaryView(map);
    }

    try {
      map.panInsideBounds(HUNGARY_BOUNDS, { animate: false });
    } catch (error) {
      console.warn('Térkép bounds igazítási hiba:', error);
    }
  }, [mapMode, nearbyCenter]);

  const showCountrywideGyms = () => {
    setMapMode('country');
  };

  const showNearbyGyms = () => {
    if (!navigator.geolocation) {
      setMapMessage('A böngésző nem támogatja a helymeghatározást, ezért csak az országos nézet érhető el.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (!isValidLatLng(center.lat, center.lng)) {
          setMapMode('country');
          setMapMessage('A helymeghatározás hibás koordinátát adott vissza, ezért az országos nézet maradt aktív.');
          return;
        }

        if (!isWithinHungary(center.lat, center.lng)) {
          setMapMode('country');
          setMapMessage('A közelben nézet csak magyarországi helyzettel működik, ezért az országos nézet maradt aktív.');
          return;
        }

        setNearbyCenter(center);
        setMapMode('nearby');
      },
      () => {
        setMapMode('country');
        setMapMessage('A helymeghatározás nem sikerült vagy nincs engedélyezve. Az országos nézet marad aktív.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="gyms-container">
      <div className="gyms-header-banner">
        <i className="fas fa-map-marked-alt"></i>
        <h3>Magyarország edzőtermei térképen</h3>
        <p>{mapMessage}</p>
      </div>
      <div className="gym-map-mode-switch">
        <button
          type="button"
          className={`gym-mode-btn ${mapMode === 'country' ? 'active' : ''}`}
          onClick={showCountrywideGyms}
        >
          <i className="fas fa-globe-europe"></i> Országos
        </button>
        <button
          type="button"
          className={`gym-mode-btn ${mapMode === 'nearby' ? 'active' : ''}`}
          onClick={showNearbyGyms}
        >
          <i className="fas fa-location-crosshairs"></i> Közelben
        </button>
      </div>
      <div className="gym-map-meta-row">
        <div className="gym-map-count-card">
          <span className="gym-map-count-label">Látható helyek</span>
          <strong>{mapMode === 'nearby' && nearbyCenter ? 'Közeli termek' : 'Országos lista'}</strong>
          <span>{mapMode === 'nearby' && nearbyCenter ? 'Geolokáció alapján szűrve' : `${ALL_GYMS.length} város edzőtermekkel az adatbázisban`}</span>
        </div>
      </div>
      <div className="gym-map-frame-wrap">
        <div ref={mapElementRef} className="gym-map-frame" aria-label="Magyarországi edzőtermek térképe"></div>
      </div>
      <div className="gym-map-actions">
        <button className="btn btn-secondary gym-expand-btn" onClick={openGoogleMaps}>
          <i className="fas fa-expand"></i> Megnyitás nagy térképen
        </button>
        <button className="btn-gym-direction" onClick={openGoogleMaps}>
          <i className="fas fa-directions"></i> Megnyitás Google Mapsben
        </button>
      </div>
    </div>
  );
};

// TOAST KOMPONENS
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch(type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-info-circle';
    }
  };

  const getColor = () => {
    switch(type) {
      case 'success': return '#2a9d8f';
      case 'error': return '#e63946';
      case 'warning': return '#f4a261';
      default: return '#457b9d';
    }
  };

  return (
    <div className="toast-notification" style={{ borderLeftColor: getColor() }}>
      <i className={getIcon()} style={{ color: getColor() }}></i>
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}><i className="fas fa-times"></i></button>
    </div>
  );
};

const Dashboard = ({ navigateTo, handleLogout, requestLogout, darkMode, setDarkMode }) => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [sidebarActive, setSidebarActive] = useState(false);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [modalOpen, setModalOpen] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [mealSearchQuery, setMealSearchQuery] = useState('');
  const [mealGrams, setMealGrams] = useState('100');
  const [selectedMealType, setSelectedMealType] = useState('');
  const [selectedFoodCategory, setSelectedFoodCategory] = useState('');
  const [mealToDelete, setMealToDelete] = useState(null);
  const [showDeleteMealModal, setShowDeleteMealModal] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);
  const [showDeleteWorkoutModal, setShowDeleteWorkoutModal] = useState(false);
  const [progressPhotoToDelete, setProgressPhotoToDelete] = useState(null);
  const [showDeleteProgressPhotoModal, setShowDeleteProgressPhotoModal] = useState(false);
  const [adminUserToDelete, setAdminUserToDelete] = useState(null);
  const [showDeleteAdminUserModal, setShowDeleteAdminUserModal] = useState(false);
  
  // Edzés részletek modalhoz
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
  
  // Szerkesztéshez
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  
  // Fejlődés fotók
  const [progressPhotos, setProgressPhotos] = useState([]);
  
  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2100);
  };
  
  // Profil adatok
  const [profileImage, setProfileImage] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    height: '',
    weight: '',
    birthDate: ''
  });
  const [startingWeight, setStartingWeight] = useState('');
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [savingPasswordChange, setSavingPasswordChange] = useState(false);
  
  // Jelvények és rekordok
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [personalRecords, setPersonalRecords] = useState({
    benchPress: 0,
    squat: 0,
    deadlift: 0
  });
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminMessages, setAdminMessages] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminActivePanel, setAdminActivePanel] = useState('messages');
  const [adminMessageTab, setAdminMessageTab] = useState('incoming');
  const [savedAdminUserIds, setSavedAdminUserIds] = useState({});
  const [deletingAdminUserId, setDeletingAdminUserId] = useState(null);
  const [deletingAdminMessageId, setDeletingAdminMessageId] = useState(null);
  const [userMessages, setUserMessages] = useState([]);
  const [userMessagesLoading, setUserMessagesLoading] = useState(false);
  const [sendingUserMessage, setSendingUserMessage] = useState(false);
  const [deletingUserMessageId, setDeletingUserMessageId] = useState(null);
  const [userMessageTab, setUserMessageTab] = useState('incoming');
  const [userMessageForm, setUserMessageForm] = useState({ subject: '', message: '' });

  const getUserRole = (user) => (String(user?.role || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user');
  const hasAdminAccess = (user) => getUserRole(user) === 'admin' || Boolean(user?.is_admin);
  const incomingAdminMessages = adminMessages.filter((message) => message.origin !== 'admin');
  const sentAdminMessages = adminMessages.filter((message) => message.origin === 'admin');
  const incomingUserMessages = userMessages.filter((message) => message.origin === 'admin' || Boolean(message.adminReply));
  const sentUserMessages = userMessages.filter((message) => message.origin !== 'admin');
  
  const [userData, setUserData] = useState({});
  const [workoutData, setWorkoutData] = useState({ weeklyPlan: [], stats: {}, aiRecommendation: '', recommendedPlan: [], recommendationNote: '' });
  const [nutritionData, setNutritionData] = useState({ todayMeals: [], dailyCalories: 0, recommendations: [], calorieTarget: 2500, recommendationDate: '', recommendationNote: '' });
  const [nutritionWeekData, setNutritionWeekData] = useState({ dailyTotals: [], meals: [] });
  const [weightHistory, setWeightHistory] = useState([]);
  const [nutritionSelectedDate, setNutritionSelectedDate] = useState(new Date());
  const [currentDayKey, setCurrentDayKey] = useState(formatLocalDate(new Date()));
  const [savingRecommendedMealKey, setSavingRecommendedMealKey] = useState('');

  const normalizedMealSearch = normalizeSearchText(mealSearchQuery.trim());
  const availableCategoryOptions = FOOD_CATEGORY_OPTIONS;
  const activeCategoryOption = FOOD_CATEGORY_OPTIONS.find((option) => option.key === selectedFoodCategory) || null;
  const parsedMealGrams = mealGrams === '' ? null : Number(mealGrams);
  const filteredFoodOptions = FLAT_FOOD_OPTIONS.filter((food) => {
    if (activeCategoryOption && !activeCategoryOption.matches(food)) {
      return false;
    }

    if (!normalizedMealSearch) {
      return true;
    }

    return normalizeSearchText(food.name).includes(normalizedMealSearch);
  }).slice(0, 40);
  const calculatedMealCalories = selectedFood && parsedMealGrams !== null && parsedMealGrams > 0
    ? Math.round((selectedFood.calories * parsedMealGrams) / 100)
    : '';
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekWorkouts, setWeekWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  const [workoutFormDetails, setWorkoutFormDetails] = useState({ name: '', type: '', day: '' });
  const [exercisesList, setExercisesList] = useState([
    { id: 1, muscleGroup: '', name: '', sets: [{ weight: '', reps: '', rpe: '' }] }
  ]);

  const hydrateProfileFromQuestionnaire = (questionnaire) => {
    if (!questionnaire) return;

    const resolvedStartingWeight = questionnaire.personalInfo?.startingWeight ?? '';

    if (resolvedStartingWeight !== '') {
      setStartingWeight(resolvedStartingWeight);
    }

    setUserData((prev) => ({
      ...prev,
      ...questionnaire,
      email: questionnaire.email || prev.email || '',
      personalInfo: {
        ...prev.personalInfo,
        ...questionnaire.personalInfo,
        startingWeight: prev.personalInfo?.startingWeight || resolvedStartingWeight
      },
      goals: {
        ...prev.goals,
        ...questionnaire.goals
      },
      preferences: {
        ...prev.preferences,
        ...questionnaire.preferences
      },
      nutrition: {
        ...prev.nutrition,
        ...questionnaire.nutrition
      }
    }));

    setEditFormData((prev) => ({
      ...prev,
      fullName: `${questionnaire.personalInfo?.lastName || prev.fullName.split(' ')[0] || ''} ${questionnaire.personalInfo?.firstName || prev.fullName.split(' ').slice(1).join(' ') || ''}`.trim() || prev.fullName,
      email: questionnaire.email || prev.email,
      height: questionnaire.personalInfo?.height || '',
      weight: questionnaire.personalInfo?.weight || '',
      birthDate: formatDateForInput(questionnaire.personalInfo?.birthDate || '')
    }));
  };

  // Adatok betöltése
  useEffect(() => {
    const token = localStorage.getItem('powerplan_token');
    const savedUser = localStorage.getItem('powerplan_current_user');
    const currentUser = savedUser ? JSON.parse(savedUser) : null;

    if (currentUser) {
      setIsAdmin(hasAdminAccess(currentUser));
      const nameParts = (currentUser.full_name || '').split(' ');
      setUserData({
        email: currentUser.email || '',
        personalInfo: { firstName: nameParts[1] || '', lastName: nameParts[0] || '' }
      });
      
      setEditFormData(prev => ({
        ...prev,
        fullName: currentUser.full_name || '',
        email: currentUser.email || ''
      }));

      const savedQuestionnaire = localStorage.getItem('powerplan_questionnaire');
      if (savedQuestionnaire) {
        try {
          hydrateProfileFromQuestionnaire(JSON.parse(savedQuestionnaire));
        } catch (error) {
          console.warn('Nem sikerült beolvasni a helyi kérdőívet:', error);
        }
      }

      const cachedProfileImage = localStorage.getItem(getProfileImageStorageKey(currentUser.id));
      setProfileImage(cachedProfileImage || null);

      if (currentUser.id && currentUser.id !== 'demo-999') {
        loadUserData(currentUser.id, token);
        loadDashboardData(currentUser.id, token);
        loadNutritionWeek(new Date());
        loadProfileImage(currentUser.id, token);
        loadProgressPhotos(currentUser.id, token);
        loadUserMessages(currentUser.id, token);
        if (hasAdminAccess(currentUser)) {
          loadAdminData(currentUser.id, token);
        }
      }
    } else {
      if (navigateTo) navigateTo('home');
    }
  }, []);

  const formatDateForInput = (date) => {
    if (!date) return '';
    const parsed = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const day = `${parsed.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeNumberInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
    const number = parseFloat(normalized);
    return Number.isNaN(number) ? '' : number;
  };

  const loadUserData = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5001/api/questionnaire/${userId}`, { 
        headers: getAuthHeaders(token)
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.questionnaire) {
          hydrateProfileFromQuestionnaire(data.questionnaire);
          localStorage.setItem('powerplan_questionnaire', JSON.stringify(data.questionnaire));
        }
      }
    } catch (error) { console.error(error); }
  };

  const loadDashboardData = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5001/api/dashboard/${userId}`, { 
        headers: getAuthHeaders(token)
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNutritionData(data.nutrition);
          setWorkoutData(data.workout);
          setWeightHistory(data.weightHistory || []);
          if ((data.weightHistory || []).length > 0) {
            setStartingWeight(String(data.weightHistory[0].weight));
          }
        }
      }
    } catch (error) { console.error(error); }
  };

  const loadProfileImage = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5001/api/user-profile/${userId}`, {
        headers: getAuthHeaders(token)
      });
      if (response.ok) {
        const data = await response.json();
        const imageValue = data.profileImage || null;
        setProfileImage(imageValue);
        setIsAdmin(data.role === 'admin' || Boolean(data.isAdmin));

        const savedUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
        if (savedUser.id === userId) {
          localStorage.setItem('powerplan_current_user', JSON.stringify({
            ...savedUser,
            profile_image: imageValue,
            role: data.role || savedUser.role || 'user',
            is_admin: data.role === 'admin' || Boolean(data.isAdmin)
          }));
        }

        if (imageValue) {
          localStorage.setItem(getProfileImageStorageKey(userId), imageValue);
        } else {
          localStorage.removeItem(getProfileImageStorageKey(userId));
        }
      }
    } catch (error) { console.error(error); }
  };

  const loadNutritionWeek = async (date) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    if (!currentUser.id || currentUser.id === 'demo-999') return;

    try {
      const response = await fetch(
        `http://localhost:5001/api/nutrition/${currentUser.id}/week?date=${formatLocalDate(date)}`,
        { headers: getAuthHeaders(token) }
      );

      if (response.ok) {
        const data = await response.json();
        setNutritionWeekData({
          dailyTotals: data.dailyTotals || [],
          meals: data.meals || []
        });
      }
    } catch (error) {
      console.error('Hiba heti táplálkozás betöltésekor:', error);
    }
  };

  const loadProgressPhotos = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5001/api/progress/${userId}`, {
        headers: getAuthHeaders(token)
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.progress) {
          const formattedPhotos = data.progress.map(photo => ({
            id: photo.id,
            image: photo.imageBase64,
            date: new Date(photo.recordDate).toLocaleDateString('hu-HU'),
            note: photo.note || '',
            isPhotoSaved: true,
            isNoteSaved: true
          }));
          setProgressPhotos(formattedPhotos);
        }
      }
    } catch (error) { console.error('Hiba progress fotók betöltésekor:', error); }
  };

  const loadWeekWorkouts = async (date) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    if (!currentUser.id || currentUser.id === 'demo-999') return;
    
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    startOfWeek.setDate(date.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];
    
    setLoadingWorkouts(true);
    try {
      const response = await fetch(
        `http://localhost:5001/api/workouts/${currentUser.id}/week?startDate=${startStr}&endDate=${endStr}`, 
        { headers: getAuthHeaders(token) }
      );
      if (response.ok) {
        const data = await response.json();
        setWeekWorkouts(data.workouts || []);
      }
    } catch (error) { console.error(error); } 
    finally { setLoadingWorkouts(false); }
  };

  const loadAdminData = async (userId, token) => {
    setAdminLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/admin/overview/${userId}`, {
        headers: getAuthHeaders(token)
      });

      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
        setAdminMessages(data.messages || []);
      } else {
        showToast('Nem sikerült betölteni az admin adatokat.', 'error');
      }
    } catch (error) {
      console.error('Admin adatok betöltési hiba:', error);
      showToast('Hálózati hiba az admin adatok betöltésekor.', 'error');
    } finally {
      setAdminLoading(false);
    }
  };

  const loadUserMessages = async (userId, token) => {
    setUserMessagesLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/messages/${userId}`, {
        headers: getAuthHeaders(token)
      });

      if (response.ok) {
        const data = await response.json();
        setUserMessages(data.messages || []);
      } else {
        showToast('Nem sikerült betölteni az üzeneteidet.', 'error');
      }
    } catch (error) {
      console.error('Felhasználói üzenetek betöltési hiba:', error);
      showToast('Hálózati hiba az üzenetek betöltésekor.', 'error');
    } finally {
      setUserMessagesLoading(false);
    }
  };

  const handleAdminUserFieldChange = (userId, field, value) => {
    setSavedAdminUserIds((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    setAdminUsers((prev) => prev.map((user) => (
      user.id === userId ? { ...user, [field]: value } : user
    )));
  };

  const handleAdminMessageReplyChange = (messageId, value) => {
    setAdminMessages((prev) => prev.map((message) => (
      message.id === messageId ? { ...message, adminReply: value } : message
    )));
  };

  const saveAdminUser = async (targetUserId) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    const selectedUser = adminUsers.find((user) => user.id === targetUserId);

    if (!currentUser.id || !selectedUser) return;

    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${targetUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          fullName: selectedUser.fullName,
          email: selectedUser.email,
          fitnessGoal: selectedUser.fitnessGoal,
          role: selectedUser.role
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.error || 'Nem sikerült menteni a felhasználót.', 'error');
        return;
      }

      if (currentUser.id === targetUserId) {
        const updatedCurrentUser = {
          ...currentUser,
          full_name: selectedUser.fullName,
          email: selectedUser.email,
          role: selectedUser.role,
          is_admin: selectedUser.role === 'admin'
        };
        localStorage.setItem('powerplan_current_user', JSON.stringify(updatedCurrentUser));
        setIsAdmin(selectedUser.role === 'admin');
      }

      setSavedAdminUserIds((prev) => ({ ...prev, [targetUserId]: true }));
      showToast('Felhasználó adatai elmentve.', 'success');
    } catch (error) {
      console.error('Admin user mentési hiba:', error);
      showToast('Hálózati hiba a felhasználó mentésekor.', 'error');
    }
  };

  const deleteAdminUser = async (targetUserId) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    const selectedUser = adminUsers.find((user) => user.id === targetUserId);

    if (!currentUser.id || !selectedUser) return;
    if ((selectedUser.role || 'user') === 'admin') {
      showToast('Admin felhasználó nem törölhető.', 'warning');
      return;
    }

    setDeletingAdminUserId(targetUserId);

    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${targetUserId}?adminUserId=${currentUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.error || 'Nem sikerült törölni a felhasználót.', 'error');
        return;
      }

      setAdminUsers((prev) => prev.filter((user) => user.id !== targetUserId));
      closeDeleteAdminUserModal();
      showToast('Felhasználó törölve.', 'success');
    } catch (error) {
      console.error('Admin user törlési hiba:', error);
      showToast('Hálózati hiba a felhasználó törlésekor.', 'error');
    } finally {
      setDeletingAdminUserId(null);
    }
  };

  const saveAdminReply = async (messageId) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    const selectedMessage = adminMessages.find((message) => message.id === messageId);

    if (!currentUser.id || !selectedMessage?.adminReply?.trim()) {
      showToast('Adj meg egy választ az üzenethez.', 'warning');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/admin/messages/${messageId}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          replyMessage: selectedMessage.adminReply
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.error || 'Nem sikerült elmenteni a választ.', 'error');
        return;
      }

      setAdminMessages((prev) => prev.map((message) => (
        message.id === messageId
          ? { ...message, status: 'replied', repliedAt: new Date().toISOString() }
          : message
      )));
      showToast('Válasz elmentve.', 'success');
    } catch (error) {
      console.error('Admin reply mentési hiba:', error);
      showToast('Hálózati hiba a válasz mentésekor.', 'error');
    }
  };

  const sendAdminDirectMessage = async (targetUserId) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    const selectedUser = adminUsers.find((user) => user.id === targetUserId);
    const subject = String(selectedUser?.adminMessageSubject || '').trim();
    const message = String(selectedUser?.adminMessageDraft || '').trim();

    if (!currentUser.id || !selectedUser) return;

    if (!subject || !message) {
      showToast('Az admin üzenethez tárgy és szöveg is szükséges.', 'warning');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${targetUserId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          subject,
          message
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.error || 'Nem sikerült elküldeni az admin üzenetet.', 'error');
        return;
      }

      setAdminUsers((prev) => prev.map((user) => (
        user.id === targetUserId
          ? { ...user, adminMessageSubject: '', adminMessageDraft: '' }
          : user
      )));
      setAdminActivePanel('messages');
      setAdminMessageTab('sent');
      showToast('Admin üzenet elküldve.', 'success');
      loadAdminData(currentUser.id, token);
    } catch (error) {
      console.error('Admin direct message hiba:', error);
      showToast('Hálózati hiba az admin üzenet küldésekor.', 'error');
    }
  };

  const sendUserMessage = async () => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    const subject = String(userMessageForm.subject || '').trim();
    const message = String(userMessageForm.message || '').trim();

    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban az üzenetküldés nem elérhető.', 'error');
      return;
    }

    if (!subject || !message) {
      showToast('A tárgy és az üzenet megadása kötelező.', 'warning');
      return;
    }

    setSendingUserMessage(true);

    try {
      const response = await fetch('http://localhost:5001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify({
          userId: currentUser.id,
          subject,
          message
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.error || 'Nem sikerült elküldeni az üzenetet.', 'error');
        return;
      }

      setUserMessageForm({ subject: '', message: '' });
      showToast('Üzenet elküldve az adminnak.', 'success');
      loadUserMessages(currentUser.id, token);
      if (hasAdminAccess(currentUser)) {
        loadAdminData(currentUser.id, token);
      }
    } catch (error) {
      console.error('Felhasználói üzenetküldési hiba:', error);
      showToast('Hálózati hiba az üzenetküldéskor.', 'error');
    } finally {
      setSendingUserMessage(false);
    }
  };

  const deleteAdminMessage = async (messageId) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');

    if (!currentUser.id) return;

    setDeletingAdminMessageId(messageId);

    try {
      const response = await fetch(`http://localhost:5001/api/admin/messages/${messageId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify({ adminUserId: currentUser.id })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.error || 'Nem sikerült törölni az üzenetet.', 'error');
        return;
      }

      setAdminMessages((prev) => prev.filter((message) => message.id !== messageId));
      setUserMessages((prev) => prev.filter((message) => message.id !== messageId));
      showToast('Üzenet törölve.', 'success');
    } catch (error) {
      console.error('Admin üzenet törlési hiba:', error);
      showToast('Hálózati hiba az üzenet törlésekor.', 'error');
    } finally {
      setDeletingAdminMessageId(null);
    }
  };

  const deleteUserMessage = async (messageId) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');

    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban az üzenettörlés nem elérhető.', 'error');
      return;
    }

    setDeletingUserMessageId(messageId);

    try {
      const response = await fetch(`http://localhost:5001/api/messages/${messageId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.error || 'Nem sikerült törölni az üzenetet.', 'error');
        return;
      }

      setUserMessages((prev) => prev.filter((message) => message.id !== messageId));
      if (hasAdminAccess(currentUser)) {
        setAdminMessages((prev) => prev.filter((message) => message.id !== messageId));
      }
      showToast('Üzenet törölve.', 'success');
    } catch (error) {
      console.error('Felhasználói üzenet törlési hiba:', error);
      showToast('Hálózati hiba az üzenet törlésekor.', 'error');
    } finally {
      setDeletingUserMessageId(null);
    }
  };

  const calculateBadgesAndRecords = (workouts) => {
    const newBadges = [];
    const newAchievements = [];
    
    const weeklyWorkoutCount = workouts.length;
    if (weeklyWorkoutCount >= 5) {
      newBadges.push({ name: 'Edzésőrült', icon: 'fa-fire', color: '#e63946', description: 'Heti 5+ edzés teljesítve!' });
      newAchievements.push('🏆 Jelvény megszerezve: Edzésőrült (Heti 5+ edzés)');
    } else if (weeklyWorkoutCount >= 3) {
      newBadges.push({ name: 'Kitartó', emoji: '💪', color: '#2a9d8f', description: 'Heti 3+ edzés teljesítve!' });
      newAchievements.push('⭐ Jelvény megszerezve: Kitartó (Heti 3+ edzés)');
    }
    
    let maxBench = 0;
    let maxSquat = 0;
    let maxDeadlift = 0;
    
    workouts.forEach(workout => {
      workout.exercises?.forEach(ex => {
        const maxWeight = Math.max(...(ex.sets?.map(s => parseFloat(s.weight) || 0) || [0]));
        
        if (ex.name?.includes('Fekvenyomás') && maxWeight > maxBench) {
          maxBench = maxWeight;
        }
        if (ex.name?.includes('Guggolás') && maxWeight > maxSquat) {
          maxSquat = maxWeight;
        }
        if (ex.name?.includes('Felhúzás') && maxWeight > maxDeadlift) {
          maxDeadlift = maxWeight;
        }
      });
    });

    if (maxBench > 0 || maxSquat > 0 || maxDeadlift > 0) {
      newBadges.push({ name: 'Rekorddöntő', icon: 'fa-chart-line', color: '#f4a261', description: 'Új rekord beállítva!' });
    }

    if (maxBench > 0) newAchievements.push(`🎉 Fekvenyomás rekord: ${maxBench} kg`);
    if (maxSquat > 0) newAchievements.push(`🎉 Guggolás rekord: ${maxSquat} kg`);
    if (maxDeadlift > 0) newAchievements.push(`🎉 Felhúzás rekord: ${maxDeadlift} kg`);
    
    setPersonalRecords({ benchPress: maxBench, squat: maxSquat, deadlift: maxDeadlift });
    setBadges(newBadges);
    setAchievements(newAchievements);
    
    const dayToIndex = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6
    };

    const scheduledWorkoutDays = new Set(
      workouts
        .map((workout) => dayToIndex[workout.day || workout.scheduled_day])
        .filter((dayIndex) => dayIndex !== undefined)
    );

    const now = new Date();
    const todayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;

    let streak = 0;
    for (let dayIndex = todayIndex; dayIndex >= 0; dayIndex--) {
      if (!scheduledWorkoutDays.has(dayIndex)) {
        break;
      }
      streak++;
    }

    setWorkoutStreak(streak);
  };

  useEffect(() => {
    calculateBadgesAndRecords(workoutData.weeklyPlan || []);
  }, [workoutData.weeklyPlan]);

  useEffect(() => {
    if (currentSection === 'workout-plan') {
      loadWeekWorkouts(selectedDate);
    }
  }, [selectedDate, currentSection]);

  useEffect(() => {
    if (currentSection === 'nutrition' && nutritionWeekData.dailyTotals.length === 0) {
      loadNutritionWeek(nutritionSelectedDate);
    }
  }, [currentSection, nutritionSelectedDate, nutritionWeekData.dailyTotals.length]);

  // Profilkép feltöltés (adatbázisba)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban nem módosíthatod a profilképet!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setProfileImage(base64);
      setIsProfileSaved(false);
      localStorage.setItem(getProfileImageStorageKey(currentUser.id), base64);
      
      try {
        const response = await fetch('http://localhost:5001/api/upload-profile-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ userId: currentUser.id, imageBase64: base64 })
        });
        if (response.ok) {
          showToast('Profilkép sikeresen frissítve!', 'success');
        } else {
          showToast('Hiba a kép mentésekor!', 'error');
        }
      } catch (error) {
        showToast('Hálózati hiba!', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Fejlődés fotó feltöltés
  const handleProgressPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newPhoto = {
        id: Date.now(),
        image: reader.result,
        date: new Date().toLocaleDateString('hu-HU'),
        note: '',
        isPhotoSaved: false,
        isNoteSaved: false
      };
      setProgressPhotos(prev => [newPhoto, ...prev]);
      showToast('Fotó feltöltve, mentsd külön a mentés gombbal!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Fotó mentése külön gombbal
  const saveProgressPhoto = async (photoId) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban nem menthető!', 'error');
      return;
    }

    const photo = progressPhotos.find(p => p.id === photoId);
    if (!photo) return;

    try {
      const response = await fetch('http://localhost:5001/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUser.id,
          imageBase64: photo.image,
          note: photo.note || null,
          recordDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Frissítjük a fotót, hogy mentett legyen és új ID-t kapjon
        const updatedPhotos = progressPhotos.map(p =>
          p.id === photoId ? { ...p, id: data.id, isPhotoSaved: true, isNoteSaved: true } : p
        );
        setProgressPhotos(updatedPhotos);
        showToast('Fotó sikeresen mentve az adatbázisba!', 'success');
      } else {
        showToast('Hiba a fotó mentésekor!', 'error');
      }
    } catch (error) {
      console.error('API hiba:', error);
      showToast('Hálózati hiba!', 'error');
    }
  };

  // Megjegyzés módosítása (késői mentéshez)
  const updateProgressNote = (photoId, note) => {
    const updatedPhotos = progressPhotos.map(photo =>
      photo.id === photoId ? { ...photo, note, isNoteSaved: false } : photo
    );
    setProgressPhotos(updatedPhotos);
  };

  // Megjegyzés mentése külön gombbal
  const saveProgressNote = async (photoId) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban nem menthető!', 'error');
      return;
    }

    const photo = progressPhotos.find(p => p.id === photoId);
    if (!photo) return;

    try {
      const response = await fetch(`http://localhost:5001/api/progress/${photoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          note: photo.note || null
        })
      });

      if (response.ok) {
        const updatedPhotos = progressPhotos.map(p =>
          p.id === photoId ? { ...p, isNoteSaved: true } : p
        );
        setProgressPhotos(updatedPhotos);
        showToast('Megjegyzés elmentve!', 'success');
      } else {
        showToast('Hiba a megjegyzés mentésekor!', 'error');
      }
    } catch (error) {
      console.error('API hiba:', error);
      showToast('Hálózati hiba!', 'error');
    }
  };

  // Fejlődés fotó törlése
  const openDeleteProgressPhotoModal = (photo) => {
    setProgressPhotoToDelete(photo);
    setShowDeleteProgressPhotoModal(true);
  };

  const closeDeleteProgressPhotoModal = () => {
    setProgressPhotoToDelete(null);
    setShowDeleteProgressPhotoModal(false);
  };

  const deleteProgressPhoto = async (photoId) => {
    const token = localStorage.getItem('powerplan_token');

    if (progressPhotos.find(p => p.id === photoId)?.isPhotoSaved) {
      try {
        const response = await fetch(`http://localhost:5001/api/progress/${photoId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          showToast('Hiba a fotó törlésekor!', 'error');
          return;
        }
      } catch (error) {
        console.error('API hiba:', error);
        showToast('Hálózati hiba!', 'error');
        return;
      }
    }

    const updatedPhotos = progressPhotos.filter(photo => photo.id !== photoId);
    setProgressPhotos(updatedPhotos);
    closeDeleteProgressPhotoModal();
    showToast('Fotó sikeresen törölve!', 'success');
  };

  // Profil mentés (backend)
  const handleProfileSave = async () => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban nem menthető!', 'error');
      return;
    }
    try {
      const formattedHeight = normalizeNumberInput(editFormData.height);
      const formattedWeight = normalizeNumberInput(editFormData.weight);
      const formattedBirthDate = formatDateForInput(editFormData.birthDate);

      if (!Number.isFinite(formattedWeight) || formattedWeight < MIN_REALISTIC_WEIGHT_KG || formattedWeight > MAX_REALISTIC_WEIGHT_KG) {
        showToast(`A testsúlynak ${MIN_REALISTIC_WEIGHT_KG} és ${MAX_REALISTIC_WEIGHT_KG} kg között kell lennie.`, 'warning');
        return;
      }

      const response = await fetch('http://localhost:5001/api/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          userId: currentUser.id,
          fullName: editFormData.fullName,
          email: editFormData.email,
          height: formattedHeight,
          weight: formattedWeight,
          birthDate: formattedBirthDate
        })
      });
      if (response.ok) {
        showToast('Profil frissítve!', 'success');
        setIsProfileSaved(true);
        setEditingProfile(false);
        const savedUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
        savedUser.full_name = editFormData.fullName;
        savedUser.email = editFormData.email;
        localStorage.setItem('powerplan_current_user', JSON.stringify(savedUser));
        setUserData(prev => ({
          ...prev,
          email: editFormData.email,
          personalInfo: {
            ...prev.personalInfo,
            firstName: editFormData.fullName.split(' ').slice(1).join(' '),
            lastName: editFormData.fullName.split(' ')[0] || '',
            height: editFormData.height,
            weight: editFormData.weight,
            birthDate: editFormData.birthDate
          }
        }));
        const savedQuestionnaire = JSON.parse(localStorage.getItem('powerplan_questionnaire') || '{}');
        const updatedQuestionnaire = {
          ...savedQuestionnaire,
          email: editFormData.email,
          personalInfo: {
            ...(savedQuestionnaire.personalInfo || {}),
            firstName: editFormData.fullName.split(' ').slice(1).join(' '),
            lastName: editFormData.fullName.split(' ')[0] || '',
            height: editFormData.height,
            weight: editFormData.weight,
            startingWeight: savedQuestionnaire.personalInfo?.startingWeight ?? savedQuestionnaire.personalInfo?.weight ?? '',
            birthDate: editFormData.birthDate
          }
        };
        localStorage.setItem('powerplan_questionnaire', JSON.stringify(updatedQuestionnaire));
        // Frissítjük a dashboard adatokat, hogy az új súlynapló megjelenjen a grafikonon
        loadDashboardData(currentUser.id, token);
      } else {
        showToast('Hiba a mentéskor!', 'error');
      }
    } catch (error) {
      showToast('Hálózati hiba!', 'error');
    }
  };

  const handlePasswordChange = async () => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');

    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban nem módosítható a jelszó!', 'error');
      return;
    }

    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      showToast('Minden jelszó mező kitöltése kötelező!', 'warning');
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      showToast('Az új jelszónak legalább 6 karakter hosszúnak kell lennie!', 'warning');
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      showToast('Az új jelszó és a megerősítés nem egyezik!', 'warning');
      return;
    }

    setSavingPasswordChange(true);
    try {
      const response = await fetch('http://localhost:5001/api/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(data.error || 'Nem sikerült módosítani a jelszót.', 'error');
        return;
      }

      showToast(data.message || 'Jelszó sikeresen frissítve!', 'success');
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showToast('Hálózati hiba a jelszó módosításakor!', 'error');
    } finally {
      setSavingPasswordChange(false);
    }
  };

  const handleProfileFieldChange = (field, value) => {
    setIsProfileSaved(false);
    setEditFormData((previousValue) => ({
      ...previousValue,
      [field]: value
    }));
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordFormData((previousValue) => ({
      ...previousValue,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((previousValue) => ({
      ...previousValue,
      [field]: !previousValue[field]
    }));
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return '-';
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleFoodSelection = (value) => {
    if (!value) {
      setSelectedFood(null);
      return;
    }

    const selectedOption = FLAT_FOOD_OPTIONS.find((food) => food.value === value);
    if (!selectedOption) {
      setSelectedFood(null);
      return;
    }

    setSelectedFood(selectedOption);
  };

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban az adat mentése nem elérhető.', 'error');
      return;
    }

    if (!selectedFood) {
      showToast('Válassz ki egy ételt a listából.', 'warning');
      return;
    }

    if (parsedMealGrams === null || Number.isNaN(parsedMealGrams) || parsedMealGrams <= 0) {
      showToast('Adj meg egy ervenyes gramm mennyiseget.', 'warning');
      return;
    }

    const mealData = {
      userId: currentUser.id, 
      mealType: selectedMealType,
      foodName: selectedFood.name,
      description: '',
      calories: calculatedMealCalories,
      consumedDate: formatLocalDate(nutritionSelectedDate)
    };

    try {
      const response = await fetch('http://localhost:5001/api/meals', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify(mealData) 
      });
      if (response.ok) {
        showToast('Étkezés naplózva!', 'success');
        closeModal(); 
        loadDashboardData(currentUser.id, token);
        loadNutritionWeek(nutritionSelectedDate);
        setSelectedFood(null);
        setMealSearchQuery('');
        setMealGrams('100');
        setSelectedMealType('');
        setSelectedFoodCategory('');
        document.getElementById('mealLogForm')?.reset();
      }
    } catch (error) { 
      showToast('Hiba a mentéskor!', 'error');
    }
  };

  const handleAddRecommendedMeal = async (meal) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');

    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban az adat mentése nem elérhető.', 'error');
      return;
    }

    const mealType = String(meal?.meal_type || '').trim();
    const foodName = String(meal?.name || '').trim();
    const calories = Number(meal?.calories || 0);

    if (!mealType || !foodName || calories <= 0) {
      showToast('Az ajánlott étel adatai hiányosak, nem menthető.', 'error');
      return;
    }

    const targetDate = nutritionData.recommendationDate
      ? new Date(`${nutritionData.recommendationDate}T12:00:00`)
      : new Date(nutritionSelectedDate);
    const requestKey = `${mealType}-${foodName}`;

    setSavingRecommendedMealKey(requestKey);

    try {
      const response = await fetch('http://localhost:5001/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          userId: currentUser.id,
          mealType,
          foodName,
          description: meal.description || 'Ajánlott napi étrendből hozzáadva.',
          calories,
          consumedDate: formatLocalDate(targetDate)
        })
      });

      if (!response.ok) {
        let errorMessage = 'Nem sikerült az ajánlott ételt hozzáadni.';
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
        }
        showToast(errorMessage, 'error');
        return;
      }

      setNutritionSelectedDate(targetDate);
      showToast(`${foodName} hozzáadva az étkezéseidhez.`, 'success');
      loadDashboardData(currentUser.id, token);
      loadNutritionWeek(targetDate);
    } catch (error) {
      console.error('Recommended meal save error:', error);
      showToast('Hálózati hiba az ajánlott étel mentésekor.', 'error');
    } finally {
      setSavingRecommendedMealKey('');
    }
  };

  const openDeleteMealModal = (meal) => {
    setMealToDelete(meal);
    setShowDeleteMealModal(true);
  };

  const openDeleteAdminUserModal = (user) => {
    setAdminUserToDelete(user);
    setShowDeleteAdminUserModal(true);
  };

  const closeDeleteAdminUserModal = () => {
    setAdminUserToDelete(null);
    setShowDeleteAdminUserModal(false);
  };

  const closeDeleteMealModal = () => {
    setMealToDelete(null);
    setShowDeleteMealModal(false);
  };

  const openDeleteWorkoutModal = (workout) => {
    setWorkoutToDelete(workout);
    setShowDeleteWorkoutModal(true);
  };

  const closeDeleteWorkoutModal = () => {
    setWorkoutToDelete(null);
    setShowDeleteWorkoutModal(false);
  };

  const deleteMeal = async (mealId) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban nem törölhetsz!', 'error');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5001/api/meals/${mealId}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('Étkezés törölve!', 'success');
        closeDeleteMealModal();
        loadDashboardData(currentUser.id, token);
        loadNutritionWeek(nutritionSelectedDate);
      } else {
        showToast('Hiba a törléskor!', 'error');
      }
    } catch (error) {
      showToast('Hálózati hiba!', 'error');
    }
  };

  const deleteWorkout = async (workoutId) => {
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');

    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban nem törölhetsz!', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/workouts/${workoutId}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('Edzés törölve!', 'success');
        closeDeleteWorkoutModal();
        closeModal();
        closeWorkoutDetailsModal();
        loadDashboardData(currentUser.id, token);
        loadWeekWorkouts(selectedDate);
      } else {
        showToast('Hiba a törlés során.', 'error');
      }
    } catch (error) {
      showToast('Hálózati hiba!', 'error');
    }
  };

  // GYAKORLATKEZELŐ FÜGGVÉNYEK (ezek hiányoztak korábban!)
  const handleAddExerciseBlock = () => {
    setExercisesList([...exercisesList, { id: Date.now(), muscleGroup: '', name: '', sets: [{ weight: '', reps: '', rpe: '' }] }]);
  };

  const handleRemoveExerciseBlock = (id) => {
    setExercisesList(exercisesList.filter(ex => ex.id !== id));
  };

  const handleExerciseChange = (id, field, value) => {
    setExercisesList(exercisesList.map(ex => {
      if (ex.id === id) {
        if (field === 'muscleGroup') return { ...ex, muscleGroup: value, name: '' };
        return { ...ex, [field]: value };
      }
      return ex;
    }));
  };

  const handleAddSet = (exerciseId) => {
    setExercisesList(exercisesList.map(ex => {
      if (ex.id === exerciseId) { 
        return { ...ex, sets: [...ex.sets, { weight: '', reps: '', rpe: '' }] }; 
      }
      return ex;
    }));
  };

  const handleRemoveSet = (exerciseId, setIndex) => {
    setExercisesList(exercisesList.map(ex => {
      if (ex.id === exerciseId) { 
        return { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) }; 
      }
      return ex;
    }));
  };

  const handleSetChange = (exerciseId, setIndex, field, value) => {
    setExercisesList(exercisesList.map(ex => {
      if (ex.id === exerciseId) {
        const newSets = [...ex.sets];
        newSets[setIndex][field] = value;
        return { ...ex, sets: newSets };
      }
      return ex;
    }));
  };

  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    
    if (!currentUser.id || currentUser.id === 'demo-999') {
      showToast('Demó módban a mentés nem elérhető!', 'error');
      return;
    }
    if (!workoutFormDetails.type) {
      showToast('Kérlek válassz edzés típust!', 'warning');
      return;
    }
    
    const isValid = exercisesList.every(ex => ex.muscleGroup && ex.name && ex.sets.length > 0);
    if (!isValid) {
      showToast('Kérlek válassz izomcsoportot és gyakorlatot minden blokkban!', 'warning');
      return;
    }

    const payload = {
      userId: currentUser.id,
      name: workoutFormDetails.name,
      workoutType: serializeWorkoutTypeValue(workoutFormDetails.type),
      scheduledDay: workoutFormDetails.day,
      exercises: exercisesList
    };

    try {
      let url = 'http://localhost:5001/api/workouts';
      let method = 'POST';
      if (editingWorkoutId) {
        url = `http://localhost:5001/api/workouts/${editingWorkoutId}`;
        method = 'PUT';
      }
      const response = await fetch(url, {
        method: method, 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        showToast(editingWorkoutId ? 'Edzés frissítve!' : 'Edzésterv elmentve!', 'success');
        closeModal();
        setEditingWorkoutId(null);
        loadDashboardData(currentUser.id, token);
        loadWeekWorkouts(selectedDate);
        setWorkoutFormDetails({ name: '', type: '', day: '' });
        setExercisesList([{ id: 1, muscleGroup: '', name: '', sets: [{ weight: '', reps: '', rpe: '' }] }]);
      } else {
        let errorMessage = 'Hiba a mentés során.';
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
        }
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Workout save network error:', error);
      showToast('Hálózati hiba a mentéskor. Ellenőrizd, hogy fut-e a backend a 5001-es porton.', 'error');
    }
  };

  const getWorkoutsForDay = (dayOfWeek) => {
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const targetDay = dayNames[dayOfWeek];
    return weekWorkouts.filter(w => w.scheduled_day === targetDay);
  };

  const handleWorkoutClick = (workout) => {
    setSelectedWorkout(workout);
    setShowWorkoutDetailsModal(true);
  };

  const closeWorkoutDetailsModal = () => {
    setShowWorkoutDetailsModal(false);
    setSelectedWorkout(null);
  };

  const startEditWorkout = () => {
    if (!selectedWorkout) return;
    setWorkoutFormDetails({
      name: selectedWorkout.name,
      type: normalizeWorkoutTypeValue(selectedWorkout.workout_type),
      day: selectedWorkout.scheduled_day
    });
    const exercises = selectedWorkout.exercises.map((ex, idx) => ({
      id: idx + 1,
      muscleGroup: ex.muscleGroup || ex.muscle || '',
      name: ex.name,
      sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps, rpe: s.rpe || '' }))
    }));
    setExercisesList(exercises);
    setEditingWorkoutId(selectedWorkout.id);
    setShowWorkoutDetailsModal(false);
    setModalOpen('workoutLog');
  };

  const navigateToSection = (section) => { 
    setCurrentSection(section); 
    if (window.innerWidth <= 992) setSidebarActive(false);
    if (section === 'profile') {
      const token = localStorage.getItem('powerplan_token');
      const savedUser = localStorage.getItem('powerplan_current_user');
      const currentUser = savedUser ? JSON.parse(savedUser) : null;
      if (currentUser && currentUser.id && token && currentUser.id !== 'demo-999') {
        loadUserData(currentUser.id, token);
        loadProfileImage(currentUser.id, token);
      }
    }
    if (section === 'messages') {
      const token = localStorage.getItem('powerplan_token');
      const savedUser = localStorage.getItem('powerplan_current_user');
      const currentUser = savedUser ? JSON.parse(savedUser) : null;
      if (currentUser && currentUser.id && token && currentUser.id !== 'demo-999') {
        loadUserMessages(currentUser.id, token);
      }
    }
  };
  
  const updateDateTime = () => {
    const now = new Date();
    const el = document.getElementById('currentDateTime');
    if (el) el.textContent = now.toLocaleDateString('hu-HU', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(() => {
      updateDateTime();

      const nextDayKey = formatLocalDate(new Date());
      if (nextDayKey !== currentDayKey) {
        const previousDayKey = currentDayKey;
        setCurrentDayKey(nextDayKey);

        const token = localStorage.getItem('powerplan_token');
        const savedUser = localStorage.getItem('powerplan_current_user');
        const currentUser = savedUser ? JSON.parse(savedUser) : null;

        if (currentUser && currentUser.id && token && currentUser.id !== 'demo-999') {
          loadDashboardData(currentUser.id, token);
          loadNutritionWeek(new Date());
        }

        setNutritionSelectedDate((previousDate) => (
          formatLocalDate(previousDate) === previousDayKey ? new Date() : previousDate
        ));
      }
    }, 1000);
    let timer;
    if (workoutActive) timer = setInterval(() => setWorkoutTime(prev => prev + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [workoutActive, currentDayKey]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60); 
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleWorkout = () => setWorkoutActive(!workoutActive);
  const stopWorkout = () => { 
    setWorkoutActive(false); 
    setWorkoutTime(0); 
    showToast('Edzés befejezve!', 'success');
  };
  const toggleSidebar = () => setSidebarActive(!sidebarActive);
  const closeModal = () => { 
    setModalOpen(null); 
    setSelectedFood(null);
    setMealSearchQuery('');
    setMealGrams('100');
    setSelectedMealType('');
    setSelectedFoodCategory('');
    setEditingWorkoutId(null);
    setWorkoutFormDetails({ name: '', type: '', day: '' });
    setExercisesList([{ id: 1, muscleGroup: '', name: '', sets: [{ weight: '', reps: '', rpe: '' }] }]);
  };
  const showMealLogModal = () => {
    setSelectedFood(null);
    setMealSearchQuery('');
    setMealGrams('100');
    setSelectedMealType('');
    setSelectedFoodCategory('');
    setModalOpen('mealLog');
  };
  const showWorkoutModal = () => {
    setEditingWorkoutId(null);
    setWorkoutFormDetails({ name: '', type: '', day: '' });
    setExercisesList([{ id: 1, muscleGroup: '', name: '', sets: [{ weight: '', reps: '', rpe: '' }] }]);
    setModalOpen('workoutLog');
  };
  const logout = () => { 
    if (requestLogout) requestLogout();
    else if (handleLogout) handleLogout();
    else if (navigateTo) navigateTo('home');
  };

  const initialQuestionnaireWeight = startingWeight ? parseFloat(startingWeight) : 0;
  const weightHistoryData = weightHistory.length > 0 ? weightHistory : [];
  const sanitizedWeightHistory = weightHistoryData
    .map((item) => ({
      dateKey: formatLocalDate(item.date),
      timestamp: new Date(item.date).getTime(),
      label: new Date(item.date).toLocaleDateString('hu-HU'),
      value: parseFloat(item.weight)
    }))
    .filter((item) => Number.isFinite(item.value) && Number.isFinite(item.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);

  const historicalWeightEntries = [...sanitizedWeightHistory];
  if (
    historicalWeightEntries.length > 0 &&
    Number.isFinite(initialQuestionnaireWeight) &&
    historicalWeightEntries[0].value === initialQuestionnaireWeight
  ) {
    historicalWeightEntries.shift();
  }

  const weightChartEntries = [
    ...(Number.isFinite(initialQuestionnaireWeight) && initialQuestionnaireWeight > 0
      ? [{ label: 'Indulás', value: initialQuestionnaireWeight }]
      : []),
    ...historicalWeightEntries.map((item) => ({ label: item.label, value: item.value }))
  ];
  const chartStartingWeight = Number.isFinite(initialQuestionnaireWeight) && initialQuestionnaireWeight > 0
    ? initialQuestionnaireWeight
    : historicalWeightEntries[0]?.value;
  const weightChartLabels = weightChartEntries.map((item) => item.label);
  const weightChartValues = weightChartEntries.map((item) => item.value);
  const weightAxisBounds = getWeightAxisBounds(weightChartValues, chartStartingWeight || initialQuestionnaireWeight);

  const weightChartData = {
    labels: weightChartLabels,
    datasets: [{ 
      label: 'Testsúly (kg)', 
      data: weightChartValues,
      borderColor: '#e63946', 
      backgroundColor: 'rgba(230, 57, 70, 0.1)', 
      fill: true, 
      tension: 0.4 
    }]
  };

  const workoutDayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const workoutsByDay = workoutDayOrder.map((day) =>
    (workoutData.weeklyPlan || []).filter((workout) => (workout.day || workout.scheduled_day) === day)
  );
  const workoutFrequency = workoutDayOrder.map((day) =>
    (workoutData.weeklyPlan || []).filter((workout) => (workout.day || workout.scheduled_day) === day).length
  );

  const workoutChartData = {
    labels: ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'],
    datasets: [{ 
      label: 'Edzések száma',
      data: workoutFrequency,
      backgroundColor: '#e63946',
      borderRadius: 10,
      maxBarThickness: 38
    }]
  };
  
  const chartOptions = { 
    responsive: true, 
    plugins: { legend: { display: false } }, 
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1
        }
      }
    }
  };

  const weightChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: false,
        min: weightAxisBounds.min,
        max: weightAxisBounds.max,
        ticks: {
          stepSize: WEIGHT_CHART_STEP_KG
        }
      }
    }
  };

  const workoutChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context) => {
            const dayWorkouts = workoutsByDay[context.dataIndex] || [];
            if (dayWorkouts.length === 0) {
              return 'Nincs edzés';
            }
            return dayWorkouts.map((workout) => workout.name || 'Névtelen edzés');
          }
        }
      }
    }
  };

  const localTodayKey = formatLocalDate(new Date());
  const localTodayMeals = (nutritionWeekData.meals || []).filter((meal) => meal.consumedDate === localTodayKey);
  const totalCaloriesToday = localTodayMeals.length > 0
    ? localTodayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
    : (nutritionData.todayMeals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0);
  const calorieGoal = nutritionData.calorieTarget || 2500;
  const calorieProgress = (totalCaloriesToday / calorieGoal) * 100;
  const isViewingTodayNutrition = isSameDay(nutritionSelectedDate, new Date());
  const selectedNutritionDateKey = formatLocalDate(nutritionSelectedDate);
  const selectedNutritionMeals = (nutritionWeekData.meals || []).filter((meal) => meal.consumedDate === selectedNutritionDateKey);
  const selectedNutritionCalories = selectedNutritionMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const displayedCalories = isViewingTodayNutrition ? totalCaloriesToday : selectedNutritionCalories;
  const displayedCalorieProgress = (displayedCalories / calorieGoal) * 100;
  const nutritionWeekStart = getStartOfWeek(nutritionSelectedDate);
  const nutritionDailyTotals = Array.from({ length: 7 }, (_, index) => {
    const currentDate = new Date(nutritionWeekStart);
    currentDate.setDate(nutritionWeekStart.getDate() + index);
    const currentDateKey = formatLocalDate(currentDate);
    const existingEntry = (nutritionWeekData.dailyTotals || []).find((day) => day.date === currentDateKey);
    const mealsForDay = (nutritionWeekData.meals || []).filter((meal) => meal.consumedDate === currentDateKey);
    const totalForDay = currentDateKey === localTodayKey
      ? totalCaloriesToday
      : (existingEntry?.totalCalories || mealsForDay.reduce((sum, meal) => sum + (meal.calories || 0), 0));

    return {
      date: currentDateKey,
      totalCalories: totalForDay,
      label: currentDate.toLocaleDateString('hu-HU', { weekday: 'short', day: 'numeric' }),
      fullDateLabel: formatHungarianLongDate(currentDate),
      meals: mealsForDay
    };
  });

  const weeklyCalories = nutritionDailyTotals.reduce((sum, day) => sum + day.totalCalories, 0);
  const averageDailyCalories = Math.round(weeklyCalories / nutritionDailyTotals.length);
  const highestCalorieDay = nutritionDailyTotals.reduce(
    (bestDay, currentDay) => currentDay.totalCalories > bestDay.totalCalories ? currentDay : bestDay,
    nutritionDailyTotals[0] || { label: '-', totalCalories: 0 }
  );
  const remainingCalories = Math.max(calorieGoal - displayedCalories, 0);
  const radarMaxCalories = Math.max(calorieGoal, ...nutritionDailyTotals.map((day) => day.totalCalories), 500);

  const nutritionChartData = {
    labels: nutritionDailyTotals.map((day) => day.label),
    datasets: [{
      label: 'Heti kalóriabevitel (kcal)',
      data: nutritionDailyTotals.map((day) => day.totalCalories),
      borderColor: '#e63946',
      backgroundColor: 'rgba(230, 57, 70, 0.22)',
      fill: true,
      pointBackgroundColor: '#e63946',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2
    }]
  };

  const nutritionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const dayData = nutritionDailyTotals[tooltipItems[0]?.dataIndex] || null;
            return dayData?.fullDateLabel || tooltipItems[0]?.label || '';
          },
          label: (context) => `Összesen: ${context.raw || 0} kcal`,
          afterLabel: (context) => {
            const dayData = nutritionDailyTotals[context.dataIndex] || null;
            if (!dayData || !dayData.meals || dayData.meals.length === 0) {
              return 'Nincs naplózott étkezés';
            }

            return dayData.meals.map((meal) => `${meal.name}: ${meal.calories} kcal`);
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        suggestedMax: radarMaxCalories,
        ticks: {
          display: false,
          stepSize: Math.max(100, Math.ceil(radarMaxCalories / 5 / 50) * 50)
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.08)'
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.08)'
        },
        pointLabels: {
          color: '#b8b8c9',
          font: {
            size: 12,
            weight: '600'
          }
        }
      }
    }
  };

  const sectionTitles = {
    'dashboard': { icon: 'fa-home', text: 'Dashboard', subtitle: 'Üdvözöljük!' },
    'workout-plan': { icon: 'fa-dumbbell', text: 'Edzésterv', subtitle: 'Heti edzésterv' },
    'workout-mode': { icon: 'fa-play-circle', text: 'Stopper', subtitle: 'Aktív edzés' },
    'fejlodes': { icon: 'fa-camera', text: 'Fejlődés', subtitle: 'Testfotók és megjegyzések' },
    'nutrition': { icon: 'fa-utensils', text: 'Táplálkozás', subtitle: 'Kalóriakövetés' },
    'gyms': { icon: 'fa-map-marker-alt', text: 'Edzőtermek', subtitle: 'Közeli termek' },
    'exercises': { icon: 'fa-video', text: 'Gyakorlatok', subtitle: 'Oktatóvideók' },
    'badges': { icon: 'fa-trophy', text: 'Jelvények' },
    'messages': { icon: 'fa-envelope', text: 'Üzeneteim', subtitle: 'Admin válaszok és üzenetküldés' },
    'profile': { icon: 'fa-user-circle', text: 'Profil', subtitle: 'Személyes adatok' }
  };
  const greetingName = userData.personalInfo?.firstName?.trim()
    || editFormData.fullName.split(' ').slice(1).join(' ').trim()
    || editFormData.fullName.split(' ')[0]
    || 'Felhasználó';

  if (isAdmin) {
    sectionTitles.admin = { icon: 'fa-user-shield', text: 'Admin', subtitle: 'Üzenetek és felhasználók' };
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarActive ? 'active' : ''}`}>
        <button className="menu-toggle" onClick={toggleSidebar}><i className="fas fa-bars"></i></button>
        <div className="logo"><i className="fas fa-dumbbell" style={{marginRight: '8px'}}></i>Power<span>Plan</span></div>
        <div className="user-profile">
          <div className="profile-pic" onClick={() => navigateToSection('profile')}>
            {profileImage ? (
              <img src={profileImage} alt="Profil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <i className="fas fa-user"></i>
            )}
          </div>
          <div className="user-name">{editFormData.fullName || 'Felhasználó'}</div>
          <div className="user-goal">{userData.goals?.mainGoal || 'Cél nincs megadva'}</div>
        </div>
        <div className="nav-menu">
          {Object.keys(sectionTitles).map(section => (
            <div key={section} className={`nav-item ${currentSection === section ? 'active' : ''}`} onClick={() => navigateToSection(section)}>
              <i className={`fas ${sectionTitles[section].icon}`}></i>
              <span>{sectionTitles[section].text}</span>
            </div>
          ))}
        </div>
        <button className="logout-btn" onClick={logout}><i className="fas fa-sign-out-alt"></i><span>Kijelentkezés</span></button>
      </div>

      <div className={`main-content ${sidebarActive ? 'full-width' : ''}`}>
        <div className="top-bar">
          <div className="page-title">
            <h1><i className={`fas ${sectionTitles[currentSection]?.icon}`}></i><span>{sectionTitles[currentSection]?.text}</span></h1>
            {sectionTitles[currentSection]?.subtitle && (
              <p>
                {sectionTitles[currentSection]?.subtitleIcon && <i className={`fas ${sectionTitles[currentSection].subtitleIcon}`}></i>}
                <span>{sectionTitles[currentSection]?.subtitle}</span>
              </p>
            )}
          </div>
          <div className="top-actions">
            <div className="date-time" id="currentDateTime"></div>
            <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Világos mód' : 'Sötét mód'}>
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
          </div>
        </div>

        {/* DASHBOARD SECTION */}
        <div className={`content-section ${currentSection === 'dashboard' ? 'active' : ''}`}>
          <div className="card">
            <h2>Üdvözöljük, <span>{greetingName}</span>!</h2>
            <div className="ai-box">
              <h3><i className="fas fa-robot"></i> Ajánlás:</h3>
              <p>{workoutData.aiRecommendation || 'Töltsd ki a kérdőívet a személyre szabott tippekért!'}</p>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><i className="fas fa-dumbbell"></i></div>
              <div className="stat-info">
                <h3>EDZÉSEK</h3>
                <div className="stat-number">{workoutData.stats?.totalWorkouts || 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><i className="fas fa-fire"></i></div>
              <div className="stat-info">
                <h3>KALÓRIA</h3>
                <div className="stat-number">{totalCaloriesToday}/{calorieGoal} kcal</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(calorieProgress, 100)}%` }}></div>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><i className="fas fa-weight"></i></div>
              <div className="stat-info">
                <h3>TESTSULY</h3>
                <div className="stat-number">{userData.personalInfo?.weight || '-'} kg</div>
              </div>
            </div>
          </div>
          <div className="charts-grid">
            <div className="chart-container"><h3>Súlyfejlődés</h3><Line data={weightChartData} options={weightChartOptions} /></div>
            <div className="chart-container"><h3>Edzési gyakoriság</h3><Bar data={workoutChartData} options={workoutChartOptions} /></div>
          </div>
        </div>

        {/* WORKOUT PLAN SECTION */}
        <div className={`content-section ${currentSection === 'workout-plan' ? 'active' : ''}`}>
          <div className="card">
            <div className="workout-recommendations-panel">
              <div className="nutrition-top-row workout-recommendation-row">
                <h3>Ajánlott mintaedzésterv</h3>
              </div>
              {workoutData.recommendationNote && (
                <p className="workout-recommendation-note">{workoutData.recommendationNote}</p>
              )}
              <div className="week-workouts workout-recommendation-grid">
                {(workoutData.recommendedPlan || []).map((workout, index) => (
                  <div key={`${workout.day}-${index}`} className="day-workout-card">
                    <div className="day-workout-header">
                      <h3>{workout.dayLabel}</h3>
                      <span className="workout-count">Minta</span>
                    </div>
                    <div className="workout-item">
                      <div className="workout-name">{workout.title}</div>
                      <div className="workout-type">{formatWorkoutTypeLabel(workout.workoutType)}</div>
                      <div className="workout-preview">
                        {(workout.exercises || []).map((exercise, exerciseIndex) => (
                          <span key={exerciseIndex} className="exercise-preview-tag">
                            {typeof exercise === 'string' ? exercise : exercise.name}
                            {typeof exercise !== 'string' && exercise.prescription && (
                              <strong>{exercise.prescription}</strong>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {(workoutData.recommendedPlan || []).length === 0 && (
                  <p className="no-data">Nincs elérhető edzésterv minta ehhez a profilhoz.</p>
                )}
              </div>
            </div>
            <WeekCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} onWeekChange={loadWeekWorkouts} />
            {loadingWorkouts ? (
              <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i> Betöltés...</div>
            ) : (
              <div className="week-workouts">
                {['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'].map((dayName, idx) => {
                  const dayWorkouts = getWorkoutsForDay(idx);
                  return (
                    <div key={idx} className="day-workout-card">
                      <div className="day-workout-header">
                        <h3>{dayName}</h3>
                        <span className="workout-count">{dayWorkouts.length}</span>
                      </div>
                      {dayWorkouts.map((workout, wIdx) => (
                        <div 
                          key={wIdx} 
                          className="workout-item clickable" 
                          onClick={() => handleWorkoutClick(workout)}
                        >
                          <div className="workout-name">{workout.name}</div>
                          <div className="workout-type">{formatWorkoutTypeLabel(workout.workout_type)}</div>
                          <div className="workout-preview">
                            {workout.exercises?.slice(0, 2).map((ex, i) => (
                              <span key={i} className="exercise-preview-tag">{ex.name}</span>
                            ))}
                            {workout.exercises?.length > 2 && (
                              <span className="exercise-preview-tag more">+{workout.exercises.length - 2}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {dayWorkouts.length === 0 && <div className="no-workout">Nincs edzés</div>}
                    </div>
                  );
                })}
              </div>
            )}
            <button className="btn btn-primary" onClick={showWorkoutModal}><i className="fas fa-plus"></i> Új Edzés</button>
          </div>
        </div>

        {/* WORKOUT MODE SECTION */}
        <div className={`content-section ${currentSection === 'workout-mode' ? 'active' : ''}`}>
          <div className="workout-mode">
            <div className="section-header section-header-actions-only">
              <button className="btn btn-secondary" onClick={stopWorkout}><i className="fas fa-stop"></i> Befejezés</button>
            </div>
            <div className="workout-timer">{formatTime(workoutTime)}</div>
            <div className="workout-controls">
              <button className="control-btn" onClick={toggleWorkout}>
                <i className={`fas ${workoutActive ? 'fa-pause' : 'fa-play'}`}></i>
              </button>
              <button className="control-btn" onClick={() => setWorkoutTime(0)}>
                <i className="fas fa-redo-alt"></i>
              </button>
            </div>
          </div>
        </div>

        {/* PROGRESS SECTION */}
        <div className={`content-section ${currentSection === 'progress' ? 'active' : ''}`}>
          <div className="card">
            <h2><i className="fas fa-chart-line"></i> Haladás</h2>
            <div className="charts-grid">
              <div className="chart-container">
                <h3>Testsúly alakulása</h3>
                <Line data={weightChartData} options={weightChartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* FEJLŐDÉS SECTION */}
        <div className={`content-section ${currentSection === 'fejlodes' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header section-header-actions-only">
              <input type="file" accept="image/*" onChange={handleProgressPhotoUpload} id="progress-photo-input" style={{ display: 'none' }} />
              <button className="btn btn-primary" onClick={() => document.getElementById('progress-photo-input').click()}>
                <i className="fas fa-plus"></i> Fotó feltöltés
              </button>
            </div>
            
            {progressPhotos.length === 0 ? (
              <div className="no-data-message">
                <i className="fas fa-image"></i>
                <p>Még nincsenek feltöltött fotók</p>
                <p className="subtitle">Kattints a "Fotó feltöltés" gombra, hogy hozzáadj egy képet!</p>
              </div>
            ) : (
              <div className="progress-photos-grid">
                {progressPhotos.map((photo) => (
                  <div key={photo.id} className="progress-photo-card">
                    <div className="photo-image-container">
                      <img src={photo.image} alt="Fejlődés fotó" className="progress-photo-img" />
                      <button className="delete-meal-btn" onClick={() => openDeleteProgressPhotoModal(photo)} title="Kép törlése">🗑️</button>
                    </div>
                    <div className="photo-date">
                      {photo.date}
                      <button
                        className={`btn btn-secondary btn-sm ${photo.isPhotoSaved ? 'saved' : ''}`}
                        onClick={() => saveProgressPhoto(photo.id)}
                        disabled={photo.isPhotoSaved}
                        style={{ marginLeft: '12px' }}
                      >
                        {photo.isPhotoSaved ? 'Mentve' : 'Kép mentése'}
                      </button>
                    </div>
                    <div className="photo-note-section">
                      <label>Megjegyzés:</label>
                      <textarea 
                        className="photo-note-input"
                        placeholder="pl. itt 78kg voltam..."
                        value={photo.note}
                        onChange={(e) => updateProgressNote(photo.id, e.target.value)}
                        maxLength="200"
                      />
                      <div className="note-cta-row">
                        <span className="note-char-count">{photo.note.length}/200</span>
                        <button
                          className={`btn btn-secondary btn-sm ${photo.isNoteSaved ? 'saved' : ''}`}
                          onClick={() => saveProgressNote(photo.id)}
                          disabled={photo.isNoteSaved}
                        >
                          {photo.isNoteSaved ? 'Mentve' : 'Megjegyzés mentése'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NUTRITION SECTION */}
        <div className={`content-section ${currentSection === 'nutrition' ? 'active' : ''}`}>
          <div className="card">
            <div className="nutrition-recommendations-panel">
              <div className="nutrition-top-row nutrition-recommendation-row">
                <h3>Ajánlott napi étrend</h3>
                <span className="nutrition-recommendation-date">{nutritionData.recommendationDateLabel || formatHungarianLongDate(new Date())}</span>
              </div>
              {nutritionData.recommendationNote && (
                <p className="nutrition-recommendation-note">{nutritionData.recommendationNote}</p>
              )}
              <div className="nutrition-summary-grid nutrition-recommendation-summary">
                <div className="nutrition-summary-card">
                  <span className="nutrition-summary-label">Ajánlott napi keret</span>
                  <strong>{nutritionData.calorieTarget || 0} kcal</strong>
                </div>
                <div className="nutrition-summary-card">
                  <span className="nutrition-summary-label">Ajánlott étkezések</span>
                  <strong>{nutritionData.recommendations?.length || 0} db</strong>
                </div>
              </div>
              <div className="meal-plan nutrition-meal-plan nutrition-recommendation-plan">
                {(nutritionData.recommendations || []).map((meal, i) => (
                  <div key={`${meal.meal_type}-${i}`} className="meal-card">
                    <div className="meal-card-header">
                      <span className="meal-time">{meal.mealTypeLabel || meal.meal_type}</span>
                    </div>
                    <div className="meal-card-title">
                      <h4>{meal.name}</h4>
                    </div>
                    <p className="meal-description">{meal.description}</p>
                    <div className="macros">
                      <div className="macro">
                        <div className="macro-value">{meal.calories}</div>
                        <div className="macro-label">Kcal</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm recommended-meal-action"
                      onClick={() => handleAddRecommendedMeal(meal)}
                      disabled={savingRecommendedMealKey === `${meal.meal_type}-${meal.name}`}
                    >
                      {savingRecommendedMealKey === `${meal.meal_type}-${meal.name}` ? 'Mentés...' : 'Beírás étkezésként'}
                    </button>
                  </div>
                ))}
                {(nutritionData.recommendations || []).length === 0 && (
                  <p className="no-data">Nincs elérhető étrendi ajánlás ehhez a profilhoz.</p>
                )}
              </div>
            </div>
            <div className="nutrition-top-row">
              <h3>Napi étkezések</h3>
              <button className="btn btn-primary" onClick={showMealLogModal}><i className="fas fa-plus"></i> Étkezés</button>
            </div>
            <div className="nutrition-date-row">
              <span>{formatHungarianLongDate(nutritionSelectedDate)}</span>
            </div>
            <div className="meal-plan nutrition-meal-plan">
              {selectedNutritionMeals.map((meal, i) => (
                <div key={i} className="meal-card">
                  <div className="meal-card-header">
                    <span className="meal-time">{meal.meal_type === 'breakfast' ? 'Reggeli' : meal.meal_type === 'lunch' ? 'Ebéd' : meal.meal_type === 'dinner' ? 'Vacsora' : 'Snack'}</span>
                  </div>
                  <div className="meal-card-title">
                    <h4>{meal.name}</h4>
                    <button className="delete-meal-btn" onClick={() => openDeleteMealModal(meal)} title="Törlés">🗑️</button>
                  </div>
                  <div className="macros">
                    <div className="macro">
                      <div className="macro-value">{meal.calories}</div>
                      <div className="macro-label">Kcal</div>
                    </div>
                  </div>
                </div>
              ))}
              {selectedNutritionMeals.length === 0 && (
                <p className="no-data">Még nincs naplózott étkezés.</p>
              )}
            </div>
            <WeekCalendar
              selectedDate={nutritionSelectedDate}
              onDateChange={setNutritionSelectedDate}
              onWeekChange={loadNutritionWeek}
            />
            <div className="nutrition-layout">
              <div className="nutrition-chart-card nutrition-radar-panel">
                <div className="nutrition-chart-header">
                  <div>
                    <h3>Heti kalóriatérkép</h3>
                    <p>A hét minden napja egyetlen nézetben.</p>
                  </div>
                  <span>{new Date(nutritionSelectedDate).toLocaleDateString('hu-HU')}</span>
                </div>
                <div className="nutrition-radar-wrap">
                  <Radar data={nutritionChartData} options={nutritionChartOptions} />
                </div>
              </div>
              <div className="nutrition-side-panel">
                <div className="nutrition-summary-card nutrition-summary-card-main">
                  <span className="nutrition-summary-label">Kiválasztott nap</span>
                  <div className="calorie-summary">
                    <div className="calorie-circle">
                      <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" strokeWidth="12"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#e63946" strokeWidth="12" 
                          strokeDasharray={`${2 * Math.PI * 54 * displayedCalorieProgress / 100} ${2 * Math.PI * 54}`} 
                          transform="rotate(-90 60 60)"/>
                      </svg>
                      <div className="calorie-text">
                        <span className="calorie-value">{displayedCalories}</span>
                        <span className="calorie-label">/ {calorieGoal}</span>
                      </div>
                    </div>
                  </div>
                  <span className="nutrition-summary-date">{formatHungarianLongDate(nutritionSelectedDate)}</span>
                </div>
                <div className="nutrition-summary-grid">
                  <div className="nutrition-summary-card">
                    <span className="nutrition-summary-label">Heti összesen</span>
                    <strong>{weeklyCalories} kcal</strong>
                  </div>
                  <div className="nutrition-summary-card">
                    <span className="nutrition-summary-label">Napi átlag</span>
                    <strong>{averageDailyCalories} kcal</strong>
                  </div>
                  <div className="nutrition-summary-card">
                    <span className="nutrition-summary-label">Legtöbb bevitel</span>
                    <strong>{highestCalorieDay.fullDateLabel || '-'}</strong>
                    <small>{highestCalorieDay.totalCalories} kcal</small>
                  </div>
                  <div className="nutrition-summary-card">
                    <span className="nutrition-summary-label">Hátralévő keret</span>
                    <strong>{remainingCalories} kcal</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GYMS SECTION */}
        <div className={`content-section ${currentSection === 'gyms' ? 'active' : ''}`}>
          <div className="card">
            <GymMap isActive={currentSection === 'gyms'} />
          </div>
        </div>

        {/* EXERCISES SECTION */}
        <div className={`content-section ${currentSection === 'exercises' ? 'active' : ''}`}>
          <div className="card">
            <div className="exercise-categories">
              {Object.keys(EXERCISE_DB_WITH_VIDEOS).map(cat => (
                <div key={cat} className="exercise-category">
                  <h3 onClick={() => {
                    const content = document.getElementById(`category-${cat}`);
                    if (content) content.style.display = content.style.display === 'none' ? 'grid' : 'none';
                  }}>
                    <i className="fas fa-chevron-down"></i> {cat} ({EXERCISE_DB_WITH_VIDEOS[cat].length})
                  </h3>
                  <div id={`category-${cat}`} className="exercise-category-content" style={{ display: 'grid' }}>
                    {EXERCISE_DB_WITH_VIDEOS[cat].map((ex, i) => (
                      <div key={i} className="exercise-video-card">
                        <div className="exercise-video-info">
                          <h4>{ex.name}</h4>
                          <span className={`difficulty ${ex.difficulty}`}>
                            {ex.difficulty === 'beginner' ? 'Kezdő' : ex.difficulty === 'intermediate' ? 'Haladó' : 'Profi'}
                          </span>
                        </div>
                        <div className="video-container">
                          <iframe src={ex.video} title={ex.name} frameBorder="0" allowFullScreen></iframe>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BADGES SECTION */}
        <div className={`content-section ${currentSection === 'badges' ? 'active' : ''}`}>
          <div className="card">
            <div className="records-section">
              <h3>🏆 Személyes Rekordok</h3>
              <div className="records-grid">
                <div className="record-card"><i className="fas fa-dumbbell"></i><span>Fekvenyomás</span><strong>{personalRecords.benchPress || '-'} kg</strong></div>
                <div className="record-card"><i className="fas fa-dumbbell"></i><span>Guggolás</span><strong>{personalRecords.squat || '-'} kg</strong></div>
                <div className="record-card"><i className="fas fa-dumbbell"></i><span>Felhúzás</span><strong>{personalRecords.deadlift || '-'} kg</strong></div>
                <div className="record-card"><i className="fas fa-calendar-week"></i><span>Edzésstreak</span><strong>{workoutStreak} nap</strong></div>
              </div>
            </div>
            
            {achievements.length > 0 && (
              <div className="achievements-section">
                <h3>✨ Teljesítmények</h3>
                {achievements.map((ach, i) => (
                  <div key={i} className="achievement-item"><i className="fas fa-star"></i> {ach}</div>
                ))}
              </div>
            )}
            
            <div className="badges-section">
              <h3>🎖️ Kiváltott Jelvények</h3>
              {badges.length > 0 ? (
                <div className="badges-grid">
                  {badges.map((badge, i) => (
                    <div key={i} className="badge-card" style={{ borderColor: badge.color }}>
                      {badge.emoji ? (
                        <span style={{ color: badge.color }}>{badge.emoji}</span>
                      ) : (
                        <i className={`fas ${badge.icon}`} style={{ color: badge.color }}></i>
                      )}
                      <h4>{badge.name}</h4>
                      <p>{badge.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-badges">Még nincs jelvényed. Eddz többet!</p>
              )}
            </div>
            
            <div className="available-badges">
              <h3>🔓 Elérhető jelvények</h3>
              <div className="badges-grid">
                <div className="badge-card locked"><i className="fas fa-fire"></i><h4>Edzésőrült</h4><p>Heti 5+ edzés</p></div>
                <div className="badge-card locked"><span>💪</span><h4>Kitartó</h4><p>Heti 3+ edzés</p></div>
                <div className="badge-card locked"><i className="fas fa-chart-line"></i><h4>Rekorddöntő</h4><p>Új rekord</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE SECTION */}
        <div className={`content-section ${currentSection === 'admin' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-user-shield"></i> Admin felület</h2>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
                  const token = localStorage.getItem('powerplan_token');
                  if (currentUser.id) {
                    loadAdminData(currentUser.id, token);
                  }
                }}
              >
                <i className="fas fa-rotate-right"></i> Frissítés
              </button>
            </div>

            {adminLoading ? (
              <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i> Admin adatok betöltése...</div>
            ) : (
              <div className="admin-layout">
                <div className={`admin-panel ${adminActivePanel === 'messages' ? 'active' : 'hidden'}`}>
                  <button
                    type="button"
                    className={`admin-panel-header admin-panel-tab ${adminActivePanel === 'messages' ? 'active' : ''}`}
                    onClick={() => setAdminActivePanel('messages')}
                  >
                    <h3>Kapcsolati üzenetek</h3>
                    <span>{adminMessages.length} db</span>
                  </button>
                  <div className={`admin-grid ${adminActivePanel === 'messages' ? 'active' : ''}`}>
                    <div className="admin-message-tabs">
                      <button
                        type="button"
                        className={`admin-message-tab ${adminMessageTab === 'incoming' ? 'active' : ''}`}
                        onClick={() => setAdminMessageTab('incoming')}
                      >
                        Beérkezett üzenetek
                        <span>{incomingAdminMessages.length}</span>
                      </button>
                      <button
                        type="button"
                        className={`admin-message-tab ${adminMessageTab === 'sent' ? 'active' : ''}`}
                        onClick={() => setAdminMessageTab('sent')}
                      >
                        Elküldött üzenetek
                        <span>{sentAdminMessages.length}</span>
                      </button>
                    </div>
                    {(adminMessageTab === 'incoming' ? incomingAdminMessages : sentAdminMessages).map((message) => (
                      <div key={message.id} className="admin-message-card">
                        <div className="admin-card-top">
                          <div>
                            <h4>{message.subject}</h4>
                            <p className="admin-meta">{message.name} • {message.email}</p>
                          </div>
                          <span className={`admin-status-pill ${message.status}`}>{message.status === 'replied' ? 'Megválaszolva' : 'Új'}</span>
                        </div>
                        {message.origin === 'admin' ? (
                          <div className="message-bubble admin-message-bubble admin-sent-bubble">
                            <strong>Elküldött admin üzenet:</strong>
                            <p className="admin-message-body">{message.adminReply || 'Nincs üzenetszöveg.'}</p>
                          </div>
                        ) : (
                          <>
                            <p className="admin-message-body">{message.message}</p>
                            <textarea
                              className="form-control admin-reply-box"
                              placeholder="Admin válasz..."
                              value={message.adminReply || ''}
                              onChange={(e) => handleAdminMessageReplyChange(message.id, e.target.value)}
                            />
                          </>
                        )}
                        <div className="admin-card-actions">
                          <small>{new Date(message.createdAt).toLocaleString('hu-HU')}</small>
                          <div className="admin-user-actions">
                            {message.origin !== 'admin' && (
                              <button className="btn btn-primary" onClick={() => saveAdminReply(message.id)}>
                                <i className="fas fa-paper-plane"></i> Válasz mentése
                              </button>
                            )}
                            <button className="btn btn-secondary admin-delete-btn" onClick={() => deleteAdminMessage(message.id)} disabled={deletingAdminMessageId === message.id}>
                              <i className="fas fa-trash"></i> {deletingAdminMessageId === message.id ? 'Törlés...' : 'Üzenet törlése'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setAdminActivePanel(null)}>
                              <i className="fas fa-xmark"></i> Bezárás
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(adminMessageTab === 'incoming' ? incomingAdminMessages.length === 0 : sentAdminMessages.length === 0) && (
                      <p className="no-data">{adminMessageTab === 'incoming' ? 'Még nincs beérkezett üzenet.' : 'Még nincs elküldött admin üzenet.'}</p>
                    )}
                  </div>
                </div>

                <div className={`admin-panel ${adminActivePanel === 'users' ? 'active' : 'hidden'}`}>
                  <button
                    type="button"
                    className={`admin-panel-header admin-panel-tab ${adminActivePanel === 'users' ? 'active' : ''}`}
                    onClick={() => setAdminActivePanel('users')}
                  >
                    <h3>Felhasználók kezelése</h3>
                    <span>{adminUsers.length} db</span>
                  </button>
                  <div className={`admin-grid ${adminActivePanel === 'users' ? 'active' : ''}`}>
                    {adminUsers.map((user) => (
                      <div key={user.id} className="admin-user-card">
                        <div className="admin-card-top">
                          <div>
                            <h4>{user.fullName}</h4>
                            <p className="admin-meta">#{user.id} • {user.email}</p>
                          </div>
                          <label className="admin-role-toggle">
                            <span>Jogosultság</span>
                            <select
                              className="form-control"
                              value={user.role || 'user'}
                              onChange={(e) => handleAdminUserFieldChange(user.id, 'role', e.target.value)}
                            >
                              <option value="user">Felhasználó</option>
                              <option value="admin">Admin</option>
                            </select>
                          </label>
                        </div>
                        <div className="profile-info-grid admin-form-grid">
                          <div className="form-group">
                            <label>Név</label>
                            <input className="form-control" type="text" value={user.fullName || ''} onChange={(e) => handleAdminUserFieldChange(user.id, 'fullName', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Email</label>
                            <input className="form-control" type="email" value={user.email || ''} onChange={(e) => handleAdminUserFieldChange(user.id, 'email', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Cél</label>
                            <input className="form-control" type="text" value={user.fitnessGoal || ''} onChange={(e) => handleAdminUserFieldChange(user.id, 'fitnessGoal', e.target.value)} />
                          </div>
                          <div className="form-group admin-message-compose">
                            <label>Admin üzenet tárgya</label>
                            <input className="form-control" type="text" value={user.adminMessageSubject || ''} onChange={(e) => handleAdminUserFieldChange(user.id, 'adminMessageSubject', e.target.value)} placeholder="Pl. Fiókoddal kapcsolatban" />
                          </div>
                          <div className="form-group admin-message-compose">
                            <label>Admin üzenet</label>
                            <textarea className="form-control admin-reply-box" value={user.adminMessageDraft || ''} onChange={(e) => handleAdminUserFieldChange(user.id, 'adminMessageDraft', e.target.value)} placeholder="Írj közvetlen üzenetet a felhasználónak..." />
                          </div>
                        </div>
                        <div className="admin-card-actions">
                          <small>{new Date(user.createdAt).toLocaleDateString('hu-HU')}</small>
                          <div className="admin-user-actions">
                            <button className="btn btn-secondary" onClick={() => sendAdminDirectMessage(user.id)}>
                              <i className="fas fa-paper-plane"></i> Üzenet küldése
                            </button>
                            {user.role !== 'admin' && (
                              <button className="btn btn-secondary admin-delete-btn" onClick={() => openDeleteAdminUserModal(user)} disabled={deletingAdminUserId === user.id}>
                                <i className="fas fa-trash"></i> {deletingAdminUserId === user.id ? 'Törlés...' : 'Törlés'}
                              </button>
                            )}
                            <button className={`btn ${savedAdminUserIds[user.id] ? 'btn-secondary saved' : 'btn-primary'}`} onClick={() => saveAdminUser(user.id)}>
                              <i className="fas fa-save"></i> {savedAdminUserIds[user.id] ? 'Mentve' : 'Mentés'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`content-section ${currentSection === 'messages' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-envelope"></i> Üzeneteim</h2>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
                  const token = localStorage.getItem('powerplan_token');
                  if (currentUser.id) {
                    loadUserMessages(currentUser.id, token);
                  }
                }}
              >
                <i className="fas fa-rotate-right"></i> Frissítés
              </button>
            </div>
            <div className="messages-layout">
              <div className="messages-compose-card">
                <h3>Új üzenet az adminnak</h3>
                <div className="form-group">
                  <label>Tárgy</label>
                  <input
                    className="form-control"
                    type="text"
                    value={userMessageForm.subject}
                    onChange={(e) => setUserMessageForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="Miről szeretnél írni?"
                  />
                </div>
                <div className="form-group">
                  <label>Üzenet</label>
                  <textarea
                    className="form-control admin-reply-box"
                    value={userMessageForm.message}
                    onChange={(e) => setUserMessageForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Írd meg az üzenetedet az adminnak..."
                  />
                </div>
                <button className="btn btn-primary" onClick={sendUserMessage} disabled={sendingUserMessage}>
                  <i className="fas fa-paper-plane"></i> {sendingUserMessage ? 'Küldés...' : 'Üzenet küldése'}
                </button>
              </div>

              <div className="messages-list-card">
                <div className="section-header compact">
                  <h3>Üzenetek</h3>
                </div>
                {userMessagesLoading ? (
                  <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i> Üzenetek betöltése...</div>
                ) : (
                  <div className="admin-grid">
                    <div className="admin-message-tabs user-message-tabs">
                      <button
                        type="button"
                        className={`admin-message-tab ${userMessageTab === 'incoming' ? 'active' : ''}`}
                        onClick={() => setUserMessageTab('incoming')}
                      >
                        Beérkezett üzenetek
                        <span>{incomingUserMessages.length}</span>
                      </button>
                      <button
                        type="button"
                        className={`admin-message-tab ${userMessageTab === 'sent' ? 'active' : ''}`}
                        onClick={() => setUserMessageTab('sent')}
                      >
                        Elküldött üzenetek
                        <span>{sentUserMessages.length}</span>
                      </button>
                    </div>
                    {(userMessageTab === 'incoming' ? incomingUserMessages : sentUserMessages).map((message) => (
                      <div key={message.id} className="admin-message-card user-message-thread">
                        <div className="admin-card-top">
                          <div>
                            <h4>{message.subject}</h4>
                            <p className="admin-meta">Elküldve: {new Date(message.createdAt).toLocaleString('hu-HU')}</p>
                          </div>
                          <span className={`admin-status-pill ${message.status}`}>{message.status === 'replied' ? 'Megválaszolva' : 'Függőben'}</span>
                        </div>
                        {userMessageTab === 'sent' && message.origin !== 'admin' && (
                          <div className="message-bubble user-message-bubble">
                            <strong>Te:</strong>
                            <p className="admin-message-body">{message.message}</p>
                          </div>
                        )}
                        {message.adminReply && (
                          <div className="message-bubble admin-message-bubble">
                            <strong>Admin:</strong>
                            <p className="admin-message-body">{message.adminReply}</p>
                            {message.repliedAt && <small>{new Date(message.repliedAt).toLocaleString('hu-HU')}</small>}
                          </div>
                        )}
                        {userMessageTab === 'sent' && message.origin !== 'admin' && (
                          <div className="user-message-actions">
                            <button className="btn btn-secondary admin-delete-btn" onClick={() => deleteUserMessage(message.id)} disabled={deletingUserMessageId === message.id}>
                              <i className="fas fa-trash"></i> {deletingUserMessageId === message.id ? 'Törlés...' : 'Saját üzenet törlése'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {(userMessageTab === 'incoming' ? incomingUserMessages.length === 0 : sentUserMessages.length === 0) && (
                      <p className="no-data">{userMessageTab === 'incoming' ? 'Még nincs beérkezett admin üzeneted.' : 'Még nincs elküldött üzeneted az admin felé.'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE SECTION */}
        <div className={`content-section ${currentSection === 'profile' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-user-circle"></i> Profilom</h2>
              <button className="btn btn-secondary" onClick={() => {
                setEditingProfile(!editingProfile);
                setIsProfileSaved(false);
              }}>
                <i className="fas fa-edit"></i> {editingProfile ? 'Mégse' : 'Szerkesztés'}
              </button>
            </div>
            
            {editingProfile ? (
              <div className="profile-form">
                <div className="profile-image-upload">
                  <div className="profile-pic-large">
                    {profileImage ? <img src={profileImage} alt="Profil" /> : <i className="fas fa-user"></i>}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} id="profile-image-input" style={{ display: 'none' }} />
                  <button className="btn btn-secondary" onClick={() => document.getElementById('profile-image-input').click()}>
                    <i className="fas fa-upload"></i> Profilkép
                  </button>
                </div>
                <div className="form-group">
                  <label>Teljes név</label>
                  <input type="text" className="form-control" value={editFormData.fullName} 
                    onChange={(e) => handleProfileFieldChange('fullName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" value={editFormData.email} 
                    onChange={(e) => handleProfileFieldChange('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Magasság (cm)</label>
                  <input type="number" className="form-control" min="100" max="250" onWheel={preventNumberInputWheel} value={editFormData.height} 
                    onChange={(e) => handleProfileFieldChange('height', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Súly (kg)</label>
                  <input type="number" className="form-control" min={MIN_REALISTIC_WEIGHT_KG} max={MAX_REALISTIC_WEIGHT_KG} step="0.1" onWheel={preventNumberInputWheel} value={editFormData.weight} 
                    onChange={(e) => handleProfileFieldChange('weight', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Születési dátum</label>
                  <input type="date" className="form-control" value={editFormData.birthDate} 
                    onChange={(e) => handleProfileFieldChange('birthDate', e.target.value)} />
                </div>
                <div className="profile-password-section">
                  <h3 className="profile-password-title">Jelszó módosítása</h3>
                  <p className="profile-password-help">Ha ideiglenes jelszóval léptél be, itt azonnal lecserélheted.</p>
                  <div className="form-group">
                    <label>Jelenlegi vagy ideiglenes jelszó</label>
                    <div className="password-field-wrapper">
                      <input
                        type={passwordVisibility.currentPassword ? 'text' : 'password'}
                        className="form-control password-field-input"
                        value={passwordFormData.currentPassword}
                        onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-visibility-toggle"
                        onClick={() => togglePasswordVisibility('currentPassword')}
                        aria-label={passwordVisibility.currentPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                      >
                        <i className={`fas ${passwordVisibility.currentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Új jelszó</label>
                      <div className="password-field-wrapper">
                        <input
                          type={passwordVisibility.newPassword ? 'text' : 'password'}
                          className="form-control password-field-input"
                          value={passwordFormData.newPassword}
                          onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                        />
                        <button
                          type="button"
                          className="password-visibility-toggle"
                          onClick={() => togglePasswordVisibility('newPassword')}
                          aria-label={passwordVisibility.newPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                        >
                          <i className={`fas ${passwordVisibility.newPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Új jelszó megerősítése</label>
                      <div className="password-field-wrapper">
                        <input
                          type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                          className="form-control password-field-input"
                          value={passwordFormData.confirmPassword}
                          onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
                        />
                        <button
                          type="button"
                          className="password-visibility-toggle"
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                          aria-label={passwordVisibility.confirmPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                        >
                          <i className={`fas ${passwordVisibility.confirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-secondary" type="button" onClick={handlePasswordChange} disabled={savingPasswordChange}>
                    <i className="fas fa-key"></i> {savingPasswordChange ? 'Jelszó mentése...' : 'Jelszó módosítása'}
                  </button>
                </div>
                <button className={`btn btn-primary profile-save-button ${isProfileSaved ? 'saved' : ''}`} onClick={handleProfileSave}>
                  <i className={`fas ${isProfileSaved ? 'fa-check-circle' : 'fa-save'}`}></i> {isProfileSaved ? 'Mentve' : 'Mentés'}
                </button>
              </div>
            ) : (
              <div className="profile-view">
                <div className="profile-image-large">
                  {profileImage ? <img src={profileImage} alt="Profil" /> : <i className="fas fa-user-circle"></i>}
                </div>
                <div className="profile-info-grid">
                  <div className="info-item"><label>Név</label><p>{editFormData.fullName || '-'}</p></div>
                  <div className="info-item"><label>Email</label><p>{editFormData.email || '-'}</p></div>
                  <div className="info-item"><label>Magasság</label><p>{editFormData.height || '-'} cm</p></div>
                  <div className="info-item"><label>Súly</label><p>{editFormData.weight || '-'} kg</p></div>
                  <div className="info-item"><label>Születési dátum</label><p>{editFormData.birthDate ? new Date(editFormData.birthDate).toLocaleDateString('hu-HU') : '-'}</p></div>
                  <div className="info-item"><label>Kor</label><p>{calculateAge(editFormData.birthDate)} év</p></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Étkezés */}
      <div className={`modal ${modalOpen === 'mealLog' ? 'active' : ''}`} onClick={(e) => {
        if (e.target.className === 'modal active') closeModal();
      }}>
        <div className="modal-content">
          <div className="modal-header">
            <h2><i className="fas fa-plus"></i> Étkezés naplózása</h2>
            <button className="modal-close" onClick={closeModal}><i className="fas fa-times"></i></button>
          </div>
          <form id="mealLogForm" onSubmit={handleMealSubmit}>
            <div className="form-group">
              <label>Étkezés típusa</label>
              <select
                className="form-control"
                id="mealType"
                required
                value={selectedMealType}
                onChange={(e) => {
                  setSelectedMealType(e.target.value);
                }}
              >
                <option value="">Válasszon...</option>
                <option value="breakfast">Reggeli</option>
                <option value="lunch">Ebéd</option>
                <option value="dinner">Vacsora</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Kategória</label>
              <select
                className="form-control"
                value={selectedFoodCategory}
                onChange={(e) => {
                  setSelectedFoodCategory(e.target.value);
                  setSelectedFood(null);
                }}
              >
                <option value="">Összes kategória</option>
                {availableCategoryOptions.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Étel neve</label>
              <div className="food-search-wrap">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  className="form-control food-search-input"
                  placeholder="Keresés étel neve alapján..."
                  value={mealSearchQuery}
                  onChange={(e) => setMealSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Találatok</label>
              <div className="food-search-results">
                {filteredFoodOptions.length === 0 && <div className="food-search-empty">Nincs találat a keresésre.</div>}
                {filteredFoodOptions.map((food) => (
                  <button
                    key={food.value}
                    type="button"
                    className={`food-search-result-item ${selectedFood?.value === food.value ? 'active' : ''}`}
                    onClick={() => handleFoodSelection(food.value)}
                  >
                    <span className="food-search-result-name">{food.name}</span>
                    <span className="food-search-result-meta">{food.category} • {food.calories} kcal / 100 g</span>
                  </button>
                ))}
              </div>
              <small className="food-picker-help">Az értékek 100 g-ra vonatkoznak, kivéve ahol az adag külön jelölve van.</small>
            </div>

            <div className="form-group">
              <label>Elfogyasztott mennyiség (gramm)</label>
              <input
                type="number"
                className="form-control"
                id="mealGrams"
                min="1"
                step="1"
                required
                value={mealGrams}
                inputMode="numeric"
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => setMealGrams(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Számolt kalória</label>
              <div className="food-calorie-preview">
                {selectedFood ? `${calculatedMealCalories} kcal` : 'Válassz ételt a kalóriaszámításhoz.'}
              </div>
            </div>

            <div className="modal-buttons">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Mégse</button>
              <button type="submit" className="btn btn-primary">Naplózás</button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL: Étkezés törlés megerősítés */}
      <div className={`modal ${showDeleteMealModal ? 'active' : ''}`} onClick={(e) => {
        if (e.target.className === 'modal active') closeDeleteMealModal();
      }}>
        <div className="modal-content">
          <div className="modal-header">
            <h2><i className="fas fa-trash-alt"></i> Étkezés törlése</h2>
            <button className="modal-close" onClick={closeDeleteMealModal}><i className="fas fa-times"></i></button>
          </div>
          <p>Biztosan törölni szeretnéd ezt az étkezést?</p>
          <p><strong>{mealToDelete?.name || 'Ismeretlen étel'}</strong> - {mealToDelete?.calories || ''} kcal</p>
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={closeDeleteMealModal}>Mégse</button>
            <button type="button" className="btn btn-primary" onClick={() => deleteMeal(mealToDelete?.id)}>Törlés</button>
          </div>
        </div>
      </div>

      <div className={`modal modal-front ${showDeleteAdminUserModal ? 'active' : ''}`} onClick={(e) => {
        if (e.target === e.currentTarget) closeDeleteAdminUserModal();
      }}>
        <div className="modal-content">
          <div className="modal-header">
            <h2><i className="fas fa-trash-alt"></i> Felhasználó törlése</h2>
            <button className="modal-close" onClick={closeDeleteAdminUserModal}><i className="fas fa-times"></i></button>
          </div>
          <p>Biztosan törölni akarod ezt a felhasználót?</p>
          <p><strong>{adminUserToDelete?.fullName || 'Ismeretlen felhasználó'}</strong> - {adminUserToDelete?.email || ''}</p>
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={closeDeleteAdminUserModal}>Mégse</button>
            <button type="button" className="btn btn-primary" onClick={() => deleteAdminUser(adminUserToDelete?.id)} disabled={!adminUserToDelete || deletingAdminUserId === adminUserToDelete.id}>
              {deletingAdminUserId === adminUserToDelete?.id ? 'Törlés...' : 'Törlés'}
            </button>
          </div>
        </div>
      </div>

      <div className={`modal modal-front ${showDeleteProgressPhotoModal ? 'active' : ''}`} onClick={(e) => {
        if (e.target === e.currentTarget) closeDeleteProgressPhotoModal();
      }}>
        <div className="modal-content">
          <div className="modal-header">
            <h2><i className="fas fa-trash-alt"></i> Fotó törlése</h2>
            <button className="modal-close" onClick={closeDeleteProgressPhotoModal}><i className="fas fa-times"></i></button>
          </div>
          <p>Biztosan törölni szeretnéd ezt a fejlődésfotót?</p>
          <p><strong>{progressPhotoToDelete?.date || 'Kiválasztott fotó'}</strong></p>
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={closeDeleteProgressPhotoModal}>Mégse</button>
            <button type="button" className="btn btn-primary" onClick={() => deleteProgressPhoto(progressPhotoToDelete?.id)}>Törlés</button>
          </div>
        </div>
      </div>

      <div className={`modal modal-front ${showDeleteWorkoutModal ? 'active' : ''}`} onClick={(e) => {
        if (e.target === e.currentTarget) closeDeleteWorkoutModal();
      }}>
        <div className="modal-content">
          <div className="modal-header">
            <h2><i className="fas fa-trash-alt"></i> Edzés törlése</h2>
            <button className="modal-close" onClick={closeDeleteWorkoutModal}><i className="fas fa-times"></i></button>
          </div>
          <p>Biztosan törölni szeretnéd ezt az edzést?</p>
          <p><strong>{workoutToDelete?.name || 'Ismeretlen edzés'}</strong> - {formatWorkoutTypeLabel(workoutToDelete?.workout_type || '')}</p>
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={closeDeleteWorkoutModal}>Mégse</button>
            <button type="button" className="btn btn-primary" onClick={() => deleteWorkout(workoutToDelete?.id)}>Törlés</button>
          </div>
        </div>
      </div>

      {/* MODAL: Edzés részletek */}
      {showWorkoutDetailsModal && selectedWorkout && (
        <div className="modal active" onClick={(e) => {
          if (e.target.className === 'modal active') closeWorkoutDetailsModal();
        }}>
          <div className="modal-content workout-details-modal">
            <div className="modal-header">
              <h2><i className="fas fa-dumbbell"></i> {selectedWorkout.name}</h2>
              <button className="modal-close" onClick={closeWorkoutDetailsModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="workout-details">
              <div className="workout-meta">
                <span className="badge">{formatWorkoutTypeLabel(selectedWorkout.workout_type)}</span>
                <span className="date">{new Date(selectedWorkout.created_at).toLocaleDateString('hu-HU')}</span>
              </div>
              <div className="exercises-list">
                <h3>Gyakorlatok:</h3>
                {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 ? (
                  selectedWorkout.exercises.map((ex, idx) => (
                    <div key={idx} className="exercise-detail-card">
                      <div className="exercise-header">
                        <h4>{ex.name}</h4>
                        <span className="muscle-group">{ex.muscleGroup}</span>
                      </div>
                      <div className="sets-table">
                        <table>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Súly</th>
                              <th>Ismétlés</th>
                              <th>RPE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ex.sets && ex.sets.map((set, setIdx) => (
                              <tr key={setIdx}>
                                <td>{setIdx + 1}</td>
                                <td>{set.weight || '-'}</td>
                                <td>{set.reps || '-'}</td>
                                <td>{set.rpe || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">Nincsenek gyakorlatok ehhez az edzéshez.</p>
                )}
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn btn-secondary" onClick={closeWorkoutDetailsModal}>Bezárás</button>
              <button className="btn btn-secondary" onClick={() => openDeleteWorkoutModal(selectedWorkout)}>Törlés</button>
              <button className="btn btn-primary" onClick={startEditWorkout}>Szerkesztés</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edzés (új vagy szerkesztés) */}
      <div className={`modal ${modalOpen === 'workoutLog' ? 'active' : ''}`} onClick={(e) => {
        if (e.target.className === 'modal active') closeModal();
      }}>
        <div className="modal-content" style={{ maxWidth: '700px' }}>
          <div className="modal-header">
            <h2><i className="fas fa-dumbbell"></i> {editingWorkoutId ? 'Edzés szerkesztése' : 'Új edzés'}</h2>
            <button className="modal-close" onClick={closeModal}><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={handleWorkoutSubmit}>
            <div className="form-group">
              <label>Edzés neve</label>
              <input type="text" className="form-control" placeholder="Pl. Mell-nap" 
                value={workoutFormDetails.name} 
                onChange={(e) => setWorkoutFormDetails({...workoutFormDetails, name: e.target.value})} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nap</label>
                <select className="form-control" value={workoutFormDetails.day} 
                  onChange={(e) => setWorkoutFormDetails({...workoutFormDetails, day: e.target.value})} required>
                  <option value="">Válasszon...</option>
                  <option value="monday">Hétfő</option>
                  <option value="tuesday">Kedd</option>
                  <option value="wednesday">Szerda</option>
                  <option value="thursday">Csütörtök</option>
                  <option value="friday">Péntek</option>
                  <option value="saturday">Szombat</option>
                  <option value="sunday">Vasárnap</option>
                </select>
              </div>
              <div className="form-group">
                <label>Típus</label>
                <select className="form-control" value={workoutFormDetails.type} 
                  onChange={(e) => {
                    setWorkoutFormDetails({...workoutFormDetails, type: e.target.value});
                    setExercisesList([{ id: Date.now(), muscleGroup: '', name: '', sets: [{ weight: '', reps: '', rpe: '' }] }]);
                  }} required>
                  <option value="">Válasszon...</option>
                  <option value="push">push</option>
                  <option value="pull">pull</option>
                  <option value="leg">leg</option>
                  <option value="upper">upper</option>
                  <option value="lower">lower</option>
                  <option value="full body">full body</option>
                  <option value="arms">arms</option>
                </select>
              </div>
            </div>
            
            <hr />
            
            {exercisesList.map((exercise, exIndex) => {
              const allowedMuscles = workoutFormDetails.type
                ? (MUSCLE_FILTER[workoutFormDetails.type] || Object.keys(EXERCISE_DB_WITH_VIDEOS))
                : Object.keys(EXERCISE_DB_WITH_VIDEOS);
              return (
                <div key={exercise.id} className="exercise-block">
                  <div className="exercise-block-header">
                    <h4>{exIndex + 1}. gyakorlat</h4>
                    {exercisesList.length > 1 && (
                      <button type="button" className="btn-icon" onClick={() => handleRemoveExerciseBlock(exercise.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Izomcsoport</label>
                      <select className="form-control" value={exercise.muscleGroup} 
                        onChange={(e) => handleExerciseChange(exercise.id, 'muscleGroup', e.target.value)} required>
                        <option value="">Válasszon...</option>
                        {allowedMuscles.map(muscle => (
                          <option key={muscle} value={muscle}>{muscle}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Gyakorlat</label>
                      <select className="form-control" value={exercise.name} 
                        onChange={(e) => handleExerciseChange(exercise.id, 'name', e.target.value)} 
                        required disabled={!exercise.muscleGroup}>
                        <option value="">Válasszon...</option>
                        {exercise.muscleGroup && EXERCISE_DB_WITH_VIDEOS[exercise.muscleGroup]?.map(exName => (
                          <option key={exName.name} value={exName.name}>{exName.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="sets-container">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="set-row">
                        <input type="number" placeholder="Súly (kg)" value={set.weight} onWheel={preventNumberInputWheel}
                          onChange={(e) => handleSetChange(exercise.id, setIndex, 'weight', e.target.value)} required />
                        <input type="number" placeholder="Ismétlés" value={set.reps} onWheel={preventNumberInputWheel}
                          onChange={(e) => handleSetChange(exercise.id, setIndex, 'reps', e.target.value)} required />
                        <input type="number" placeholder="RPE (1-10)" min="1" max="10" value={set.rpe} onWheel={preventNumberInputWheel}
                          onChange={(e) => handleSetChange(exercise.id, setIndex, 'rpe', e.target.value)} />
                        {exercise.sets.length > 1 && (
                          <button type="button" className="btn-icon" onClick={() => handleRemoveSet(exercise.id, setIndex)}>
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn-add-set" onClick={() => handleAddSet(exercise.id)}>
                      + Szett hozzáadása
                    </button>
                  </div>
                </div>
              );
            })}
            
            <button type="button" className="btn-add-exercise" onClick={handleAddExerciseBlock}>
              <i className="fas fa-plus-circle"></i> Még egy gyakorlat
            </button>
            
            <div className="modal-buttons">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Mégse</button>
              {editingWorkoutId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => openDeleteWorkoutModal(selectedWorkout || {
                    id: editingWorkoutId,
                    name: workoutFormDetails.name,
                    workout_type: workoutFormDetails.type
                  })}
                >
                  Törlés
                </button>
              )}
              <button type="submit" className="btn btn-primary">{editingWorkoutId ? 'Mentés' : 'Edzés mentése'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast értesítő */}
      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;