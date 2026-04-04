import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ALL_GYMS } from '../utils/gymsByCounty';
import { FOOD_DB, FLAT_FOOD_OPTIONS } from '../utils/foodDatabase';
import './dashboard.css';

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

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

const safeSetHungaryView = (map) => {
  map.setView(HUNGARY_CENTER, 7, { animate: false });
};

const safeFitBounds = (map, bounds, fallbackToHungary = true) => {
  if (!map) return;

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
    { name: 'Ferde pados nyomás', video: 'https://www.youtube.com/embed/0G2_XV3kHjM', difficulty: 'intermediate' },
    { name: 'Tárogatás', video: 'https://www.youtube.com/embed/Z57CtMZmK9k', difficulty: 'beginner' },
    { name: 'Kábelkereszt', video: 'https://www.youtube.com/embed/taI4XduLpTk', difficulty: 'advanced' }
  ],
  'Hát': [
    { name: 'Húzódzkodás', video: 'https://www.youtube.com/embed/eGo4IYlbE5g', difficulty: 'intermediate' },
    { name: 'Lehúzás csigán', video: 'https://www.youtube.com/embed/CAwf7n6Luuc', difficulty: 'beginner' },
    { name: 'Felhúzás (Deadlift)', video: 'https://www.youtube.com/embed/op9kVnSso6Q', difficulty: 'advanced' }
  ],
  'Láb': [
    { name: 'Guggolás', video: 'https://www.youtube.com/embed/Ua6C4jQvP7M', difficulty: 'intermediate' },
    { name: 'Lábnyomás', video: 'https://www.youtube.com/embed/IxLZ0YimtK0', difficulty: 'beginner' }
  ],
  'Váll': [
    { name: 'Vállból nyomás', video: 'https://www.youtube.com/embed/2yjwXTZQDDI', difficulty: 'intermediate' },
    { name: 'Oldalemelés', video: 'https://www.youtube.com/embed/3VcKaXpzqRo', difficulty: 'beginner' }
  ],
  'Bicepsz': [
    { name: 'Bicepsz karhajlítás rúddal', video: 'https://www.youtube.com/embed/ykJmrZ5v0Oo', difficulty: 'beginner' }
  ],
  'Tricepsz': [
    { name: 'Tricepsz letolás csigán', video: 'https://www.youtube.com/embed/vB5OI2CYLFQ', difficulty: 'beginner' }
  ],
  'Has': [
    { name: 'Hasprés', video: 'https://www.youtube.com/embed/9Pp5fXF7I9c', difficulty: 'beginner' },
    { name: 'Plank', video: 'https://www.youtube.com/embed/pSHjTRCQxIw', difficulty: 'beginner' }
  ]
};

const MUSCLE_FILTER = {
  'push': ['Mell', 'Váll', 'Tricepsz'],
  'pull': ['Hát', 'Bicepsz'],
  'legs': ['Láb', 'Has'],
  'full_body': Object.keys(EXERCISE_DB_WITH_VIDEOS)
};

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
  const [mapMessage, setMapMessage] = useState(`Az országos nézet mind a ${ALL_GYMS.length} rögzített edzőtermet egyszerre mutatja Magyarország térképén.`);
  const mapElementRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerLayerRef = useRef(null);

  const openGoogleMaps = () => {
    if (mapMode === 'nearby' && nearbyCenter) {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent('edzőterem')}/@${nearbyCenter.lat},${nearbyCenter.lng},13z`, '_blank');
      return;
    }

    window.open(`https://www.google.com/maps/search/${encodeURIComponent('edzőterem Magyarország')}/@${HUNGARY_CENTER[0]},${HUNGARY_CENTER[1]},7z`, '_blank');
  };

  useEffect(() => {
    if (!mapElementRef.current || leafletMapRef.current) return;

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      maxBounds: HUNGARY_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: 7
    }).setView(HUNGARY_CENTER, 7);

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
      map.invalidateSize();
      map.panInsideBounds(HUNGARY_BOUNDS, { animate: false });
    };

    const timeoutId = window.setTimeout(refreshMapSize, 120);
    window.requestAnimationFrame(refreshMapSize);

    return () => window.clearTimeout(timeoutId);
  }, [isActive, mapMode]);

  useEffect(() => {
    if (!leafletMapRef.current || !markerLayerRef.current) return;

    const map = leafletMapRef.current;
    const markerLayer = markerLayerRef.current;
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
          <a href="https://www.google.com/maps/search/${encodeURIComponent(`${gym.name} ${gym.cityLabel}`)}" target="_blank" rel="noreferrer">Megnyitás Google Mapsben</a>
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
      setMapMessage(`Az országos nézet mind a ${ALL_GYMS.length} rögzített edzőtermet egyszerre mutatja Magyarország térképén.`);
    }

    if (mapMode === 'country') {
      safeSetHungaryView(map);
    } else if (markerBounds.length > 0) {
      safeFitBounds(map, markerBounds);
    } else {
      safeSetHungaryView(map);
    }

    map.panInsideBounds(HUNGARY_BOUNDS, { animate: false });
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
          <span>{mapMode === 'nearby' && nearbyCenter ? 'Geolokáció alapján szűrve' : `${ALL_GYMS.length} terem az adatbázisban`}</span>
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
  
  // Jelvények és rekordok
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [personalRecords, setPersonalRecords] = useState({
    benchPress: 0,
    squat: 0,
    deadlift: 0
  });
  const [workoutStreak, setWorkoutStreak] = useState(0);
  
  const [userData, setUserData] = useState({});
  const [workoutData, setWorkoutData] = useState({ weeklyPlan: [], stats: {}, aiRecommendation: '' });
  const [nutritionData, setNutritionData] = useState({ todayMeals: [], dailyCalories: 0 });
  const [nutritionWeekData, setNutritionWeekData] = useState({ dailyTotals: [], meals: [] });
  const [weightHistory, setWeightHistory] = useState([]);
  const [nutritionSelectedDate, setNutritionSelectedDate] = useState(new Date());
  const [currentDayKey, setCurrentDayKey] = useState(formatLocalDate(new Date()));

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

    setUserData((prev) => ({
      ...prev,
      ...questionnaire,
      email: questionnaire.email || prev.email || '',
      personalInfo: {
        ...prev.personalInfo,
        ...questionnaire.personalInfo
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
  const deleteProgressPhoto = async (photoId) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a fotót?')) {
      const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
      const token = localStorage.getItem('powerplan_token');
      
      // Ha már mentve van az adatbázisban, küldjük a DELETE kérést
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
      
      // Eltávolítjuk a state-ből
      const updatedPhotos = progressPhotos.filter(photo => photo.id !== photoId);
      setProgressPhotos(updatedPhotos);
      showToast('Fotó sikeresen törölve!', 'success');
    }
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

  const openDeleteMealModal = (meal) => {
    setMealToDelete(meal);
    setShowDeleteMealModal(true);
  };

  const closeDeleteMealModal = () => {
    setMealToDelete(null);
    setShowDeleteMealModal(false);
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
      workoutType: workoutFormDetails.type,
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
        showToast('Hiba a mentés során.', 'error');
      }
    } catch (error) { 
      showToast('Hálózat hiba!', 'error');
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
      type: selectedWorkout.workout_type,
      day: selectedWorkout.scheduled_day
    });
    const exercises = selectedWorkout.exercises.map((ex, idx) => ({
      id: idx + 1,
      muscleGroup: ex.muscle,
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
      minute: '2-digit' 
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
    }, 60000);
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

  const userWeight = userData.personalInfo?.weight ? parseFloat(userData.personalInfo.weight) : 0;
  const weightHistoryData = weightHistory.length > 0 ? weightHistory : [];
  const weightChartLabels = weightHistoryData.length > 0
    ? weightHistoryData.map(item => new Date(item.date).toLocaleDateString('hu-HU'))
    : ['Indulás', '1 hete', 'Ma'];
  const weightChartValues = weightHistoryData.length > 0
    ? weightHistoryData.map(item => parseFloat(item.weight))
    : userWeight
      ? [userWeight + 1, userWeight + 0.5, userWeight]
      : [80, 79, 78];

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
  const calorieGoal = 2500;
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
    'profile': { icon: 'fa-user-circle', text: 'Profil', subtitle: 'Személyes adatok' }
  };

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
            <h2>Üdvözöljük, <span>{editFormData.fullName.split(' ')[0] || 'Felhasználó'}</span>!</h2>
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
            <div className="chart-container"><h3>Súlyfejlődés</h3><Line data={weightChartData} options={chartOptions} /></div>
            <div className="chart-container"><h3>Edzési gyakoriság</h3><Bar data={workoutChartData} options={workoutChartOptions} /></div>
          </div>
        </div>

        {/* WORKOUT PLAN SECTION */}
        <div className={`content-section ${currentSection === 'workout-plan' ? 'active' : ''}`}>
          <div className="card">
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
                          <div className="workout-type">{workout.workout_type}</div>
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
                <Line data={weightChartData} options={chartOptions} />
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
                      <button className="delete-meal-btn" onClick={() => deleteProgressPhoto(photo.id)} title="Kép törlése">🗑️</button>
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
        <div className={`content-section ${currentSection === 'profile' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-user-circle"></i> Profilom</h2>
              <button className="btn btn-secondary" onClick={() => setEditingProfile(!editingProfile)}>
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
                    onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" value={editFormData.email} 
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Magasság (cm)</label>
                  <input type="number" className="form-control" value={editFormData.height} 
                    onChange={(e) => setEditFormData({...editFormData, height: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Súly (kg)</label>
                  <input type="number" className="form-control" value={editFormData.weight} 
                    onChange={(e) => setEditFormData({...editFormData, weight: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Születési dátum</label>
                  <input type="date" className="form-control" value={editFormData.birthDate} 
                    onChange={(e) => setEditFormData({...editFormData, birthDate: e.target.value})} />
                </div>
                <button className="btn btn-primary" onClick={handleProfileSave}>
                  <i className="fas fa-save"></i> Mentés
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
                <span className="badge">{selectedWorkout.workout_type}</span>
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
                  <option value="push">Push (Mell, Váll, Tricepsz)</option>
                  <option value="pull">Pull (Hát, Bicepsz)</option>
                  <option value="legs">Legs (Láb, Has)</option>
                  <option value="full_body">Teljes Test</option>
                </select>
              </div>
            </div>
            
            <hr />
            
            {exercisesList.map((exercise, exIndex) => {
              const allowedMuscles = workoutFormDetails.type ? MUSCLE_FILTER[workoutFormDetails.type] : Object.keys(EXERCISE_DB_WITH_VIDEOS);
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
                        <input type="number" placeholder="Súly (kg)" value={set.weight} 
                          onChange={(e) => handleSetChange(exercise.id, setIndex, 'weight', e.target.value)} required />
                        <input type="number" placeholder="Ismétlés" value={set.reps} 
                          onChange={(e) => handleSetChange(exercise.id, setIndex, 'reps', e.target.value)} required />
                        <input type="number" placeholder="RPE (1-10)" min="1" max="10" value={set.rpe} 
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