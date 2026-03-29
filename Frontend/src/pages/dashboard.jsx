import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// GYAKORLAT ADATBÁZIS
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

// ÉTELEK ADATBÁZIS
const FOOD_DB = {
  'Reggeli': [
    { name: 'Zabkása banánnal', calories: 350 },
    { name: 'Zabkása áfonyával', calories: 320 },
    { name: 'Tojásrántotta (3 tojás)', calories: 320 },
    { name: 'Omlett sonkával', calories: 380 },
    { name: 'Görög joghurt mézzel', calories: 280 },
    { name: 'Teljes kiőrlésű szendvics', calories: 400 },
    { name: 'Protein shake', calories: 200 },
    { name: 'Rizskása fahéjjal', calories: 280 },
    { name: 'Chia puding', calories: 310 },
    { name: 'Palacsinta túróval', calories: 420 }
  ],
  'Ebéd': [
    { name: 'Grillezett csirkemell rizzsel', calories: 550 },
    { name: 'Csirkemell édesburgonyával', calories: 530 },
    { name: 'Marhapörkölt tarhonyával', calories: 650 },
    { name: 'Sült lazac quinoával', calories: 580 },
    { name: 'Túrós csusza', calories: 480 },
    { name: 'Zöldséges wok csirkével', calories: 420 },
    { name: 'Csirkepaprikás nokedlivel', calories: 580 },
    { name: 'Spagetti bolognese', calories: 620 },
    { name: 'Penne csirkével', calories: 540 }
  ],
  'Vacsora': [
    { name: 'Ropogós csirkemell salátával', calories: 420 },
    { name: 'Grillezett csirkemell salátával', calories: 380 },
    { name: 'Omlett zöldségekkel', calories: 350 },
    { name: 'Túró zöldségekkel', calories: 280 },
    { name: 'Halrudacska édesburgonyával', calories: 450 },
    { name: 'Sült lazac salátával', calories: 410 },
    { name: 'Tonhal saláta', calories: 320 },
    { name: 'Csirkemell sajttal', calories: 450 }
  ],
  'Snack': [
    { name: 'Alma', calories: 95 },
    { name: 'Körte', calories: 100 },
    { name: 'Banán', calories: 105 },
    { name: 'Narancs', calories: 62 },
    { name: 'Fehérjeszelet', calories: 180 },
    { name: 'Dió (30g)', calories: 200 },
    { name: 'Mandula (30g)', calories: 175 },
    { name: 'Skyr joghurt', calories: 120 },
    { name: 'Protein puding', calories: 150 },
    { name: 'Sárgarépa', calories: 41 }
  ]
};

// EDZÉSTÍPUS SZŰRŐ
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

  const weekDays = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
  
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
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    if (onWeekChange) onWeekChange(newStart);
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
const GymMap = () => {
  const gyms = [
    { name: 'Life1 Fitness', address: 'Budapest, Teréz krt. 55.', phone: '+36 1 123 4567', rating: 4.5 },
    { name: 'Cutler Fitness', address: 'Budapest, Rákóczi út 12.', phone: '+36 1 234 5678', rating: 4.7 },
    { name: 'Scitec Gold Gym', address: 'Budapest, Váci út 45.', phone: '+36 1 345 6789', rating: 4.8 },
    { name: 'World Class', address: 'Budapest, Andrássy út 66.', phone: '+36 1 456 7890', rating: 4.6 },
    { name: '4% Fitness', address: 'Budapest, Lehel u. 15.', phone: '+36 1 567 8901', rating: 4.4 },
    { name: 'Gilda Max Fitness', address: 'Budapest, Dózsa György út 78.', phone: '+36 1 678 9012', rating: 4.3 }
  ];

  const openGoogleMaps = (gym) => {
    const query = encodeURIComponent(`${gym.name} ${gym.address}`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  return (
    <div className="gyms-container">
      <div className="gyms-header-banner">
        <i className="fas fa-map-marked-alt"></i>
        <h3>Magyarország legjobb edzőtermei</h3>
        <p>Kattints egy teremre az útvonaltervhez →</p>
      </div>
      <div className="gyms-list">
        {gyms.map((gym, index) => (
          <div key={index} className="gym-card" onClick={() => openGoogleMaps(gym)}>
            <div className="gym-header">
              <h3>{gym.name}</h3>
              <span className="gym-rating"><i className="fas fa-star"></i> {gym.rating} / 5</span>
            </div>
            <p className="gym-address"><i className="fas fa-map-marker-alt"></i> {gym.address}</p>
            <p className="gym-phone"><i className="fas fa-phone"></i> {gym.phone}</p>
            <button className="btn-gym-direction" onClick={(e) => { e.stopPropagation(); openGoogleMaps(gym); }}>
              <i className="fas fa-directions"></i> Útvonalterv
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = ({ navigateTo, handleLogout }) => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [sidebarActive, setSidebarActive] = useState(false);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [modalOpen, setModalOpen] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  
  // Edzés részletek modalhoz
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
  
  // Szerkesztéshez: tároljuk a szerkesztendő edzés ID-ját
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  
  // Sötét mód
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('powerplan_dark_mode');
    return saved !== null ? saved === 'true' : false;
  });
  
  // Profil adatok
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('powerplan_profile_image') || null;
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    height: '',
    weight: '',
    birthDate: '',
    phone: '',
    location: ''
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
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekWorkouts, setWeekWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  const [workoutFormDetails, setWorkoutFormDetails] = useState({ name: '', type: '', day: '' });
  const [exercisesList, setExercisesList] = useState([
    { id: 1, muscleGroup: '', name: '', sets: [{ weight: '', reps: '', rpe: '' }] }
  ]);

  // Dark mode alkalmazása
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('powerplan_dark_mode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('powerplan_dark_mode', 'false');
    }
  }, [darkMode]);

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

      if (currentUser.id && token && currentUser.id !== 'demo-999') {
        loadUserData(currentUser.id, token);
        loadDashboardData(currentUser.id, token);
      }
    } else {
      if (navigateTo) navigateTo('home');
    }
  }, []);

  const loadUserData = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5001/api/questionnaire/${userId}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.questionnaire) {
          setUserData(prev => ({ 
            ...data.questionnaire, 
            ...prev, 
            personalInfo: { ...data.questionnaire.personalInfo, ...prev.personalInfo } 
          }));
          setEditFormData(prev => ({
            ...prev,
            height: data.questionnaire.personalInfo?.height || '',
            weight: data.questionnaire.personalInfo?.weight || '',
            birthDate: data.questionnaire.personalInfo?.birthDate || ''
          }));
        }
      }
    } catch (error) { console.error(error); }
  };

  const loadDashboardData = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5001/api/dashboard/${userId}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNutritionData(data.nutrition);
          setWorkoutData(data.workout);
        }
      }
    } catch (error) { console.error(error); }
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
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setWeekWorkouts(data.workouts || []);
        calculateBadgesAndRecords(data.workouts || []);
      }
    } catch (error) { console.error(error); } 
    finally { setLoadingWorkouts(false); }
  };

  // Jelvények és rekordok számítása
  const calculateBadgesAndRecords = (workouts) => {
    const newBadges = [];
    const newAchievements = [];
    
    const weeklyWorkoutCount = workouts.length;
    if (weeklyWorkoutCount >= 5) {
      newBadges.push({ name: 'Edzésőrült', icon: 'fa-fire', color: '#e63946', description: 'Heti 5+ edzés teljesítve!' });
      newAchievements.push('🏆 Új jelvény: Edzésőrült! (Heti 5+ edzés)');
    } else if (weeklyWorkoutCount >= 3) {
      newBadges.push({ name: 'Kitartó', icon: 'fa-heart', color: '#2a9d8f', description: 'Heti 3+ edzés teljesítve!' });
      newAchievements.push('⭐ Új jelvény: Kitartó! (Heti 3+ edzés)');
    }
    
    let maxBench = personalRecords.benchPress;
    let maxSquat = personalRecords.squat;
    let maxDeadlift = personalRecords.deadlift;
    
    workouts.forEach(workout => {
      workout.exercises?.forEach(ex => {
        const maxWeight = Math.max(...(ex.sets?.map(s => parseFloat(s.weight) || 0) || [0]));
        
        if (ex.name?.includes('Fekvenyomás') && maxWeight > maxBench) {
          maxBench = maxWeight;
          newAchievements.push(`🎉 ÚJ REKORD! Fekvenyomás: ${maxWeight} kg`);
        }
        if (ex.name?.includes('Guggolás') && maxWeight > maxSquat) {
          maxSquat = maxWeight;
          newAchievements.push(`🎉 ÚJ REKORD! Guggolás: ${maxWeight} kg`);
        }
        if (ex.name?.includes('Felhúzás') && maxWeight > maxDeadlift) {
          maxDeadlift = maxWeight;
          newAchievements.push(`🎉 ÚJ REKORD! Felhúzás: ${maxWeight} kg`);
        }
      });
    });
    
    setPersonalRecords({ benchPress: maxBench, squat: maxSquat, deadlift: maxDeadlift });
    setBadges(newBadges);
    setAchievements(newAchievements);
    
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const hasWorkout = workouts.some(w => {
        const workoutDate = new Date(w.created_at);
        return workoutDate.toDateString() === checkDate.toDateString();
      });
      if (hasWorkout) streak++;
      else break;
    }
    setWorkoutStreak(streak);
  };

  useEffect(() => {
    if (currentSection === 'workout-plan') {
      loadWeekWorkouts(selectedDate);
    }
  }, [selectedDate, currentSection]);

  // Profilkép feltöltés
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        localStorage.setItem('powerplan_profile_image', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Profil mentés
  const handleProfileSave = () => {
    setUserData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        height: editFormData.height,
        weight: editFormData.weight,
        birthDate: editFormData.birthDate
      },
      phone: editFormData.phone,
      location: editFormData.location
    }));
    setEditingProfile(false);
    alert('Profil adatok mentve!');
  };

  // Kor számítás
  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    if (!currentUser.id || currentUser.id === 'demo-999') {
      alert('Demó módban az adat mentése nem elérhető.');
      return;
    }

    const mealData = {
      userId: currentUser.id, 
      mealType: document.getElementById('mealType').value,
      foodName: selectedFood?.name || document.getElementById('mealName').value, 
      description: document.getElementById('mealDescription')?.value || '',
      calories: selectedFood?.calories || document.getElementById('mealCalories').value
    };

    try {
      const response = await fetch('http://localhost:5001/api/meals', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify(mealData) 
      });
      if (response.ok) {
        alert('Étkezés naplózva!'); 
        closeModal(); 
        loadDashboardData(currentUser.id, token);
        setSelectedFood(null);
        document.getElementById('mealLogForm')?.reset();
      }
    } catch (error) { 
      alert('Hiba a mentéskor!'); 
    }
  };

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

  // Új edzés mentése (POST) vagy meglévő szerkesztése (PUT)
  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('powerplan_current_user') || '{}');
    const token = localStorage.getItem('powerplan_token');
    
    if (!currentUser.id || currentUser.id === 'demo-999') {
      alert('Demó módban a mentés nem elérhető!');
      return;
    }
    if (!workoutFormDetails.type) {
      alert('Kérlek válassz edzés típust!');
      return;
    }
    
    const isValid = exercisesList.every(ex => ex.muscleGroup && ex.name && ex.sets.length > 0);
    if (!isValid) {
      alert('Kérlek válassz izomcsoportot és gyakorlatot minden blokkban!');
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
        alert(editingWorkoutId ? 'Edzés frissítve!' : 'Edzésterv elmentve!');
        closeModal();
        setEditingWorkoutId(null);
        loadDashboardData(currentUser.id, token);
        loadWeekWorkouts(selectedDate);
        setWorkoutFormDetails({ name: '', type: '', day: '' });
        setExercisesList([{ id: 1, muscleGroup: '', name: '', sets: [{ weight: '', reps: '', rpe: '' }] }]);
      } else { 
        alert('Hiba a mentés során.'); 
      }
    } catch (error) { 
      alert('Hálózat hiba!'); 
    }
  };

  const getWorkoutsForDay = (dayOfWeek) => {
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const targetDay = dayNames[dayOfWeek];
    return weekWorkouts.filter(w => w.scheduled_day === targetDay);
  };

  // Edzés részletek megjelenítése
  const handleWorkoutClick = (workout) => {
    setSelectedWorkout(workout);
    setShowWorkoutDetailsModal(true);
  };

  const closeWorkoutDetailsModal = () => {
    setShowWorkoutDetailsModal(false);
    setSelectedWorkout(null);
  };

  // Szerkesztés indítása: bezárjuk a részletek modalt, betöltjük az adatokat a szerkesztő űrlapba, és megnyitjuk a szerkesztő modalt
  const startEditWorkout = () => {
    if (!selectedWorkout) return;
    // Betöltjük a kiválasztott edzés adatait a szerkesztő űrlapba
    setWorkoutFormDetails({
      name: selectedWorkout.name,
      type: selectedWorkout.workout_type,
      day: selectedWorkout.scheduled_day
    });
    // Átalakítjuk a gyakorlatokat a szerkesztő formátumára
    const exercises = selectedWorkout.exercises.map((ex, idx) => ({
      id: idx + 1,
      muscleGroup: ex.muscle,
      name: ex.name,
      sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps, rpe: s.rpe || '' }))
    }));
    setExercisesList(exercises);
    setEditingWorkoutId(selectedWorkout.id);
    // Bezárjuk a részletek modalt
    setShowWorkoutDetailsModal(false);
    // Megnyitjuk a szerkesztő modalt
    setModalOpen('workoutLog');
  };

  const navigateToSection = (section) => { 
    setCurrentSection(section); 
    if (window.innerWidth <= 992) setSidebarActive(false); 
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
    const interval = setInterval(updateDateTime, 60000);
    let timer;
    if (workoutActive) timer = setInterval(() => setWorkoutTime(prev => prev + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [workoutActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60); 
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleWorkout = () => setWorkoutActive(!workoutActive);
  const stopWorkout = () => { 
    setWorkoutActive(false); 
    setWorkoutTime(0); 
    alert('Edzés befejezve!'); 
  };
  const toggleSidebar = () => setSidebarActive(!sidebarActive);
  const closeModal = () => { 
    setModalOpen(null); 
    setSelectedFood(null);
    setEditingWorkoutId(null);
    // űrlap reset
    setWorkoutFormDetails({ name: '', type: '', day: '' });
    setExercisesList([{ id: 1, muscleGroup: '', name: '', sets: [{ weight: '', reps: '', rpe: '' }] }]);
  };
  const showMealLogModal = () => setModalOpen('mealLog');
  const showWorkoutModal = () => {
    setEditingWorkoutId(null);
    setWorkoutFormDetails({ name: '', type: '', day: '' });
    setExercisesList([{ id: 1, muscleGroup: '', name: '', sets: [{ weight: '', reps: '', rpe: '' }] }]);
    setModalOpen('workoutLog');
  };
  const logout = () => { 
    if (window.confirm('Biztosan ki szeretnél jelentkezni?')) { 
      localStorage.clear(); 
      if (navigateTo) navigateTo('home'); 
    } 
  };

  const userWeight = userData.personalInfo?.weight ? parseFloat(userData.personalInfo.weight) : 0;
  const weightChartData = {
    labels: ['Indulás', '1 hete', 'Ma'],
    datasets: [{ 
      label: 'Testsúly (kg)', 
      data: userWeight ? [userWeight+1, userWeight+0.5, userWeight] : [80, 79, 78], 
      borderColor: '#e63946', 
      backgroundColor: 'rgba(230, 57, 70, 0.1)', 
      fill: true, 
      tension: 0.4 
    }]
  };

  const workoutMinutes = [0, 0, 0, 0, 0, 0, 0];
  const workoutChartData = {
    labels: ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'],
    datasets: [{ data: workoutMinutes, backgroundColor: '#e63946' }]
  };
  
  const chartOptions = { 
    responsive: true, 
    plugins: { legend: { display: false } }, 
    scales: { y: { beginAtZero: true } } 
  };

  const totalCaloriesToday = nutritionData.todayMeals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0;
  const calorieGoal = 2500;
  const calorieProgress = (totalCaloriesToday / calorieGoal) * 100;

  const sectionTitles = {
    'dashboard': { icon: 'fa-home', text: 'Dashboard', subtitle: 'Üdvözöljük!' },
    'workout-plan': { icon: 'fa-dumbbell', text: 'Edzésterv', subtitle: 'Heti edzésterv' },
    'workout-mode': { icon: 'fa-play-circle', text: 'Edzés mód', subtitle: 'Aktív edzés' },
    'progress': { icon: 'fa-chart-line', text: 'Haladás', subtitle: 'Statisztikák' },
    'nutrition': { icon: 'fa-utensils', text: 'Táplálkozás', subtitle: 'Kalóriakövetés' },
    'gyms': { icon: 'fa-map-marker-alt', text: 'Edzőtermek', subtitle: 'Közeli termek' },
    'exercises': { icon: 'fa-video', text: 'Gyakorlatok', subtitle: 'Oktatóvideók' },
    'badges': { icon: 'fa-trophy', text: 'Jelvények', subtitle: 'Teljesítmények' },
    'profile': { icon: 'fa-user-circle', text: 'Profil', subtitle: 'Személyes adatok' }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarActive ? 'active' : ''}`}>
        <button className="menu-toggle" onClick={toggleSidebar}><i className="fas fa-bars"></i></button>
        <div className="logo"><i className="fas fa-dumbbell"></i><span>PowerPlan</span></div>
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
          <div className="nav-item" onClick={() => setDarkMode(!darkMode)}>
            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            <span>{darkMode ? 'Világos mód' : 'Sötét mód'}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}><i className="fas fa-sign-out-alt"></i><span>Kijelentkezés</span></button>
      </div>

      <div className={`main-content ${sidebarActive ? 'full-width' : ''}`}>
        <div className="top-bar">
          <div className="page-title">
            <h1><i className={`fas ${sectionTitles[currentSection]?.icon}`}></i><span>{sectionTitles[currentSection]?.text}</span></h1>
            <p>{sectionTitles[currentSection]?.subtitle}</p>
          </div>
          <div className="top-actions"><div className="date-time" id="currentDateTime"></div></div>
        </div>

        {/* DASHBOARD SECTION */}
        <div className={`content-section ${currentSection === 'dashboard' ? 'active' : ''}`}>
          <div className="card">
            <h2>Üdvözöljük, <span>{editFormData.fullName.split(' ')[0] || 'Felhasználó'}</span>!</h2>
            <div className="ai-box">
              <h3><i className="fas fa-robot"></i> AI Ajánlás:</h3>
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
            <div className="chart-container"><h3>Edzési gyakoriság</h3><Bar data={workoutChartData} options={chartOptions} /></div>
          </div>
        </div>

        {/* WORKOUT PLAN SECTION */}
        <div className={`content-section ${currentSection === 'workout-plan' ? 'active' : ''}`}>
          <div className="card">
            <h2><i className="fas fa-dumbbell"></i> Heti Edzésterv</h2>
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
            <div className="section-header">
              <h2><i className="fas fa-play-circle"></i> Edzés mód</h2>
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

        {/* NUTRITION SECTION */}
        <div className={`content-section ${currentSection === 'nutrition' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-utensils"></i> Táplálkozás</h2>
              <button className="btn btn-primary" onClick={showMealLogModal}><i className="fas fa-plus"></i> Étkezés</button>
            </div>
            <div className="calorie-summary">
              <div className="calorie-circle">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" strokeWidth="12"/>
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e63946" strokeWidth="12" 
                    strokeDasharray={`${2 * Math.PI * 54 * calorieProgress / 100} ${2 * Math.PI * 54}`} 
                    transform="rotate(-90 60 60)"/>
                </svg>
                <div className="calorie-text">
                  <span className="calorie-value">{totalCaloriesToday}</span>
                  <span className="calorie-label">/ {calorieGoal}</span>
                </div>
              </div>
            </div>
            <div className="meal-plan">
              {nutritionData.todayMeals?.map((meal, i) => (
                <div key={i} className="meal-card">
                  <div className="meal-time">{meal.meal_type === 'breakfast' ? 'Reggeli' : meal.meal_type === 'lunch' ? 'Ebéd' : meal.meal_type === 'dinner' ? 'Vacsora' : 'Snack'}</div>
                  <h4>{meal.name}</h4>
                  <div className="macros">
                    <div className="macro">
                      <div className="macro-value">{meal.calories}</div>
                      <div className="macro-label">Kcal</div>
                    </div>
                  </div>
                </div>
              ))}
              {(!nutritionData.todayMeals || nutritionData.todayMeals.length === 0) && (
                <p className="no-data">Még nincs naplózott étkezés.</p>
              )}
            </div>
          </div>
        </div>

        {/* GYMS SECTION */}
        <div className={`content-section ${currentSection === 'gyms' ? 'active' : ''}`}>
          <div className="card">
            <h2><i className="fas fa-map-marker-alt"></i> Edzőtermek</h2>
            <GymMap />
          </div>
        </div>

        {/* EXERCISES SECTION */}
        <div className={`content-section ${currentSection === 'exercises' ? 'active' : ''}`}>
          <div className="card">
            <h2><i className="fas fa-video"></i> Gyakorlatok</h2>
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
            <h2><i className="fas fa-trophy"></i> Jelvények</h2>
            
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
                      <i className={`fas ${badge.icon}`} style={{ color: badge.color }}></i>
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
                <div className="badge-card locked"><i className="fas fa-heart"></i><h4>Kitartó</h4><p>Heti 3+ edzés</p></div>
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
                <div className="form-group">
                  <label>Telefonszám</label>
                  <input type="tel" className="form-control" value={editFormData.phone} 
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Lakhely</label>
                  <input type="text" className="form-control" value={editFormData.location} 
                    onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} />
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
                  <div className="info-item"><label>Telefonszám</label><p>{editFormData.phone || '-'}</p></div>
                  <div className="info-item"><label>Lakhely</label><p>{editFormData.location || '-'}</p></div>
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
              <select className="form-control" id="mealType" required onChange={() => setSelectedFood(null)}>
                <option value="">Válasszon...</option>
                <option value="breakfast">Reggeli</option>
                <option value="lunch">Ebéd</option>
                <option value="dinner">Vacsora</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Válassz előre megadott ételt</label>
              <select className="form-control" onChange={(e) => {
                if (e.target.value) {
                  const [mealType, foodIndex] = e.target.value.split('|');
                  const food = FOOD_DB[mealType][parseInt(foodIndex)];
                  setSelectedFood(food);
                  document.getElementById('mealName').value = food.name;
                  document.getElementById('mealCalories').value = food.calories;
                }
              }}>
                <option value="">-- Válassz ételt --</option>
                {Object.keys(FOOD_DB).map(mealType => (
                  <optgroup key={mealType} label={mealType}>
                    {FOOD_DB[mealType].map((food, idx) => (
                      <option key={idx} value={`${mealType}|${idx}`}>{food.name} - {food.calories} kcal</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Étel neve</label>
              <input type="text" className="form-control" id="mealName" required />
            </div>
            <div className="form-group">
              <label>Leírás (opcionális)</label>
              <input type="text" className="form-control" id="mealDescription" />
            </div>
            <div className="form-group">
              <label>Kalória (kcal)</label>
              <input type="number" className="form-control" id="mealCalories" required />
            </div>
            <div className="modal-buttons">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Mégse</button>
              <button type="submit" className="btn btn-primary">Naplózás</button>
            </div>
          </form>
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
                              <th>Szett</th>
                              <th>Súly (kg)</th>
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
    </div>
  );
};

export default Dashboard;