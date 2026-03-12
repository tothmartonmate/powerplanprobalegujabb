import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useJsApiLoader } from '@react-google-maps/api';
import './dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ navigateTo, handleLogout }) => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [sidebarActive, setSidebarActive] = useState(false);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [modalOpen, setModalOpen] = useState(null);
  
  // App state
  const [userData, setUserData] = useState({});
  const [workoutData, setWorkoutData] = useState({});
  const [nutritionData, setNutritionData] = useState({});
  const [challengesData, setChallengesData] = useState({});

  // Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyDummyKey' // Replace with your actual API key
  });

  useEffect(() => {
    loadUserData();
    initializeData();
    
    // Update datetime every minute
    const interval = setInterval(updateDateTime, 60000);
    updateDateTime();
    
    return () => clearInterval(interval);
  }, []);

  const loadUserData = () => {
    const savedQuestionnaire = localStorage.getItem('powerplan_questionnaire');
    const savedUser = localStorage.getItem('powerplan_current_user');
    
    if (savedQuestionnaire) {
      setUserData(JSON.parse(savedQuestionnaire));
    } else if (savedUser) {
      const user = JSON.parse(savedUser);
      setUserData({
        personalInfo: {
          firstName: user.firstName || 'Márton',
          lastName: user.lastName || 'Kovács',
          height: user.height || 185,
          weight: user.weight || 84.3,
          goal: user.goal || 'weightLoss'
        },
        goals: {
          mainGoal: user.goal || 'weightLoss',
          timeframe: '3months',
          specificGoal: '-10 kg'
        }
      });
    } else {
      setUserData({
        personalInfo: {
          firstName: 'Márton',
          lastName: 'Kovács',
          height: 185,
          weight: 84.3,
          goal: 'weightLoss'
        },
        goals: {
          mainGoal: 'weightLoss',
          timeframe: '3months',
          specificGoal: '-10 kg'
        }
      });
    }
  };

  const initializeData = () => {
    generateMockData();
  };

  const generateMockData = () => {
    setWorkoutData({
      currentWeek: 0,
      weeklyPlan: generateWeeklyWorkoutPlan(),
      todayWorkout: generateTodayWorkout(),
      workoutHistory: generateWorkoutHistory(),
      stats: {
        totalWorkouts: 24,
        workoutHours: 36.5,
        totalWeightLifted: 12850,
        streak: 7,
        weeklyTarget: 4,
        completedWorkouts: 3
      }
    });
    
    setNutritionData({
      dailyCalories: 2100,
      macros: {
        protein: 150,
        carbs: 250,
        fat: 70
      },
      todayMeals: generateTodayMeals(),
      mealHistory: generateMealHistory()
    });
    
    setChallengesData({
      level: 12,
      points: 1250,
      activeChallenges: generateActiveChallenges(),
      earnedBadges: generateEarnedBadges(),
      leaderboard: generateLeaderboard()
    });
  };

  const navigateToSection = (section) => {
    setCurrentSection(section);
    if (window.innerWidth <= 992) {
      setSidebarActive(false);
    }
  };

  const updateDateTime = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    document.getElementById('currentDateTime') && 
      (document.getElementById('currentDateTime').textContent = now.toLocaleDateString('hu-HU', options));
  };

  // Timer functions
  useEffect(() => {
    let timer;
    if (workoutActive) {
      timer = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [workoutActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleWorkout = () => {
    setWorkoutActive(!workoutActive);
  };

  const stopWorkout = () => {
    setWorkoutActive(false);
    setWorkoutTime(0);
    alert('Edzés sikeresen befejezve!');
  };

  // Chart data
  const weightChartData = {
    labels: ['1 hónapja', '3 hete', '2 hete', '1 hete', 'Ma'],
    datasets: [{
      label: 'Testsúly (kg)',
      data: [85.5, 85.1, 84.8, 84.5, 84.3],
      borderColor: '#e63946',
      backgroundColor: 'rgba(230, 57, 70, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4
    }]
  };

  const workoutChartData = {
    labels: ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'],
    datasets: [{
      data: [45, 60, 75, 60, 90, 30, 0],
      backgroundColor: [
        '#e63946', '#f4a261', '#2a9d8f', '#e63946', 
        '#f4a261', '#e9c46a', '#ddd'
      ]
    }]
  };

  const chartOptions = (yLabel) => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { 
        beginAtZero: false,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        title: { display: true, text: yLabel }
      },
      x: { grid: { display: false } }
    }
  });

  // Data generation functions
  const generateWeeklyWorkoutPlan = () => {
    return [
      { type: 'Felsőtest', exercises: generateExercises('upper') },
      { type: 'Láb', exercises: generateExercises('legs') },
      { type: 'Pihenő', exercises: [] },
      { type: 'Teljes test', exercises: generateExercises('full') },
      { type: 'Kardió', exercises: generateExercises('cardio') },
      { type: 'Pihenő', exercises: [] },
      { type: 'Aktív pihenés', exercises: generateExercises('active') }
    ];
  };

  const generateTodayWorkout = () => {
    const today = new Date().getDay();
    const adjustedIndex = (today + 6) % 4;
    return generateExercises(['upper', 'legs', 'full', 'cardio'][adjustedIndex]);
  };

  const generateExercises = (type) => {
    const exercises = {
      upper: [
        { name: 'Fekvenyomás', sets: '4', reps: '8-12', icon: 'fas fa-weight-hanging', description: 'Mellizom fejlesztés' },
        { name: 'Húzódzkodás', sets: '3', reps: 'Max', icon: 'fas fa-arrows-alt-v', description: 'Hátizom' },
        { name: 'Vállnyomás', sets: '3', reps: '10-12', icon: 'fas fa-arrow-up', description: 'Vállizom' },
        { name: 'Bicepsz hajlítás', sets: '3', reps: '10-12', icon: 'fas fa-dumbbell', description: 'Bicepsz' }
      ],
      legs: [
        { name: 'Guggolás', sets: '4', reps: '6-8', icon: 'fas fa-user', description: 'Combfejlesztés' },
        { name: 'Lábnyomás', sets: '3', reps: '10-12', icon: 'fas fa-shoe-prints', description: 'Quad izom' },
        { name: 'Lábemelés', sets: '3', reps: '15-20', icon: 'fas fa-walking', description: 'Vádli' },
        { name: 'Kitörés', sets: '3', reps: '10-12', icon: 'fas fa-football-ball', description: 'Fenék és comb' }
      ],
      full: [
        { name: 'Guggolás', sets: '3', reps: '12-15', icon: 'fas fa-user', description: 'Alapgyakorlat' },
        { name: 'Fekvenyomás', sets: '3', reps: '10-12', icon: 'fas fa-weight-hanging', description: 'Felsőtest' },
        { name: 'Felhúzás', sets: '3', reps: '8-10', icon: 'fas fa-arrows-alt-v', description: 'Hát és comb' },
        { name: 'Plank', sets: '3', reps: '45 mp', icon: 'fas fa-stopwatch', description: 'Magizom' }
      ],
      cardio: [
        { name: 'Futás', sets: '1', reps: '20 perc', icon: 'fas fa-running', description: 'Kitartás' },
        { name: 'Kerékpár', sets: '1', reps: '15 perc', icon: 'fas fa-bicycle', description: 'Láb kardió' },
        { name: 'Evezőgép', sets: '3', reps: '5 perc', icon: 'fas fa-water', description: 'Teljes test' }
      ],
      active: [
        { name: 'Sétálás', sets: '1', reps: '30 perc', icon: 'fas fa-walking', description: 'Könnyű aktivitás' },
        { name: 'Nyújtás', sets: '3', reps: '30 mp', icon: 'fas fa-spa', description: 'Rugalmasság' }
      ]
    };
    return exercises[type] || exercises.upper;
  };

  const generateWorkoutHistory = () => [];
  const generateMealHistory = () => [];

  const generateTodayMeals = () => {
    return [
      { time: 'Reggeli (08:00)', name: 'Zabkása gyümölccsel', description: 'Zabpehely, banán, mogyoróvaj', calories: 350, protein: 15, carbs: 60, fat: 8 },
      { time: 'Tízórai (11:00)', name: 'Fehérjeturmix', description: 'Tejsavófehérje, banán, mandulatej', calories: 250, protein: 25, carbs: 20, fat: 5 },
      { time: 'Ebéd (13:30)', name: 'Csirkemell rizzsel', description: 'Grillezett csirkemell, basmati rizs, párolt zöldség', calories: 450, protein: 40, carbs: 50, fat: 10 },
      { time: 'Uzsonna (16:30)', name: 'Görög joghurt', description: 'Görög joghurt, bogyós gyümölcs, dió', calories: 200, protein: 20, carbs: 15, fat: 8 },
      { time: 'Vacsora (19:00)', name: 'Lazac brokkolival', description: 'Sütőben sült lazac, brokkoli, édesburgonya', calories: 400, protein: 35, carbs: 30, fat: 15 }
    ];
  };

  const generateActiveChallenges = () => {
    return [
      { title: 'Hétköznap Warrior', description: 'Edzz 5 egymást követő hétköznap', progress: 80, points: 500, icon: 'fas fa-calendar-check' },
      { title: 'Kardió Király', description: 'Fuss összesen 50 km', progress: 60, points: 300, icon: 'fas fa-running' },
      { title: 'Erő Mester', description: 'Emelj összesen 10 tonna súlyt', progress: 45, points: 750, icon: 'fas fa-dumbbell' }
    ];
  };

  const generateEarnedBadges = () => {
    return [
      { title: 'Kezdő Lépések', description: 'Első 5 edzés teljesítése', date: '2024. Jan 10.', icon: 'fas fa-shoe-prints', color1: '#4CAF50', color2: '#8BC34A' },
      { title: 'Kitartó Harcos', description: '30 napos streak', date: '2024. Jan 25.', icon: 'fas fa-fire', color1: '#FF9800', color2: '#FF5722' },
      { title: 'Kardió Bajnok', description: '100 km futás', date: '2024. Feb 05.', icon: 'fas fa-trophy', color1: '#2196F3', color2: '#03A9F4' }
    ];
  };

  const generateLeaderboard = () => {
    return [
      { name: 'Nagy Ádám', points: 2450, level: 15 },
      { name: 'Kiss Éva', points: 2200, level: 14 },
      { name: 'Kovács Márton', points: 1950, level: 12 },
      { name: 'Tóth István', points: 1800, level: 11 },
      { name: 'Szabó Anna', points: 1650, level: 10 }
    ];
  };

  const getGoalText = (goal) => {
    const goals = {
      'weightLoss': 'Fogyás',
      'muscleGain': 'Izomnövelés',
      'fitness': 'Általános fittség',
      'strength': 'Erőnövelés'
    };
    return goals[goal] || 'Általános fittség';
  };

  const getMotivationMessage = (goal) => {
    const messages = {
      'weightLoss': 'Már 68%-nál jársz a heti céljaidban!',
      'muscleGain': 'A múlt héten 5% több súlyt emeltél!',
      'fitness': 'Kitartó vagy, folytasd így!',
      'strength': 'Erőnléted folyamatosan javul!'
    };
    return messages[goal] || 'Nagyszerűen haladsz!';
  };

  const getDailyQuote = (goal) => {
    const quotes = {
      'weightLoss': '"Minden nagy utazás apró lépésekből áll. Ma is tedd meg a tiéd!"',
      'muscleGain': '"Az erő nem a testben, hanem a lélekben lakozik. Ma bizonyítsd!"',
      'fitness': '"Az egészség a legnagyobb kincs. Ma is ápolni fogod!"',
      'strength': '"A lehetetlen csak több időt igényel. Kitartás!"'
    };
    return quotes[goal] || '"Ma te vagy a legjobb versenytársad. Tegnapnál jobb legyél!"';
  };

  const getWorkoutType = (goal) => {
    const types = {
      'weightLoss': 'KARDIO & HIIT',
      'muscleGain': 'ERŐEDZÉS',
      'fitness': 'TELJES TEST',
      'strength': 'NEHÉZ SÚLYZÓS'
    };
    return types[goal] || 'KÖR EDZÉS';
  };

  const logout = () => {
    if (window.confirm('Biztosan ki szeretnél jelentkezni?')) {
      // Ha kaptunk handleLogout prop-ot, használjuk azt
      if (handleLogout) {
        handleLogout();
      } else {
        // Fallback megoldás
        localStorage.removeItem('powerplan_user_completed_questionnaire');
        localStorage.removeItem('powerplan_demo_mode');
        localStorage.removeItem('powerplan_questionnaire');
        localStorage.removeItem('powerplan_token');
        localStorage.removeItem('powerplan_current_user');
        localStorage.removeItem('powerplan_user_logged_in');
        localStorage.removeItem('powerplan_remember_me');
        
        if (navigateTo) {
          navigateTo('home');
        } else {
          window.location.href = '/';
        }
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  const showNotifications = () => {
    setModalOpen('notifications');
  };

  const closeModal = () => {
    setModalOpen(null);
  };

  const showMealLogModal = () => {
    setModalOpen('mealLog');
  };

  const saveProfile = () => {
    const profileData = {
      name: document.getElementById('profileName')?.value,
      email: document.getElementById('profileEmail')?.value,
      phone: document.getElementById('profilePhone')?.value,
      birthDate: document.getElementById('profileBirthDate')?.value,
      height: document.getElementById('profileHeight')?.value,
      weight: document.getElementById('profileWeight')?.value,
      targetWeight: document.getElementById('profileTargetWeight')?.value,
      goal: document.getElementById('profileMainGoal')?.value
    };
    
    // Mentés localStorage-ba
    localStorage.setItem('powerplan_profile', JSON.stringify(profileData));
    
    // Frissítsük a userData-t is
    setUserData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        firstName: profileData.name?.split(' ')[1] || prev.personalInfo?.firstName,
        lastName: profileData.name?.split(' ')[0] || prev.personalInfo?.lastName,
        height: profileData.height,
        weight: profileData.weight,
        goal: profileData.goal
      },
      goals: {
        ...prev.goals,
        mainGoal: profileData.goal
      }
    }));
    
    alert('Profil sikeresen mentve!');
  };

  const changeWeek = (delta) => {
    setCurrentWeek(prev => prev + delta);
  };

  const selectDay = (dayIndex) => {
    document.querySelectorAll('.day-card').forEach((card, index) => {
      card.classList.toggle('active', index === dayIndex);
    });
    
    // Update exercises for selected day
    const workoutExercises = document.getElementById('workoutExercises');
    if (workoutExercises) {
      const workout = workoutData.weeklyPlan?.[dayIndex] || { exercises: [] };
      // Itt lehetne frissíteni a gyakorlatok listáját
    }
  };

  // Section titles
  const sectionTitles = {
    'dashboard': { icon: 'fa-home', text: 'Dashboard', subtitle: 'Üdvözöljük az Ön személyre szabott edzés dashboard-án' },
    'workout-plan': { icon: 'fa-dumbbell', text: 'Edzésterv', subtitle: 'Heti edzésterv és gyakorlatok' },
    'workout-mode': { icon: 'fa-play-circle', text: 'Edzés mód', subtitle: 'Aktív edzés követése' },
    'progress': { icon: 'fa-chart-line', text: 'Haladás', subtitle: 'Statisztikák és fejlődés' },
    'gyms': { icon: 'fa-map-marker-alt', text: 'Edzőtermek', subtitle: 'Közeli edzőtermek és felszerelések' },
    'nutrition': { icon: 'fa-utensils', text: 'Táplálkozás', subtitle: 'Táplálkozási terv és kalóriakövetés' },
    'profile': { icon: 'fa-user-circle', text: 'Profil', subtitle: 'Személyes adatok és beállítások' },
    'challenges': { icon: 'fa-trophy', text: 'Kihívások', subtitle: 'Kitüntetések, kihívások és ranglista' }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarActive ? 'active' : ''}`}>
        <button className="menu-toggle" onClick={toggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
        
        <div className="logo">
          <i className="fas fa-dumbbell"></i>
          <span>PowerPlan</span>
        </div>
        
        <div className="user-profile">
          <div className="profile-pic" onClick={() => navigateToSection('profile')}>
            <i className="fas fa-user"></i>
          </div>
          <div className="user-name" id="userName">
            {userData.personalInfo?.lastName} {userData.personalInfo?.firstName}
          </div>
          <div className="user-goal" id="userGoal">
            {getGoalText(userData.goals?.mainGoal)}
          </div>
        </div>
        
        <div className="nav-menu">
          {Object.keys(sectionTitles).map(section => (
            <div 
              key={section}
              className={`nav-item ${currentSection === section ? 'active' : ''}`} 
              onClick={() => navigateToSection(section)}
            >
              <i className={`fas ${sectionTitles[section].icon}`}></i>
              <span>{sectionTitles[section].text}</span>
              {section === 'workout-plan' && <span className="nav-badge">Ma</span>}
              {section === 'progress' && <span className="nav-badge">+15%</span>}
              {section === 'nutrition' && <span className="nav-badge">1200 kcal</span>}
              {section === 'challenges' && <span className="nav-badge">3 új</span>}
            </div>
          ))}
        </div>
        
        <button className="logout-btn" onClick={logout}>
          <i className="fas fa-sign-out-alt"></i>
          <span>Kijelentkezés</span>
        </button>
      </div>

      {/* Main Content */}
      <div className={`main-content ${sidebarActive ? 'full-width' : ''}`}>
        {/* Top Bar */}
        <div className="top-bar">
          <div className="page-title">
            <h1>
              <i className={`fas ${sectionTitles[currentSection].icon}`}></i>
              <span>{sectionTitles[currentSection].text}</span>
            </h1>
            <p>{sectionTitles[currentSection].subtitle}</p>
          </div>
          
          <div className="top-actions">
            <div className="date-time" id="currentDateTime"></div>
            <button className="notification-btn" onClick={showNotifications}>
              <i className="fas fa-bell"></i>
              <span className="notification-badge" id="notificationCount">3</span>
            </button>
          </div>
        </div>

        {/* Dashboard Section */}
        <div className={`content-section ${currentSection === 'dashboard' ? 'active' : ''}`}>
          {/* Welcome Card */}
          <div className="card">
            <div className="section-header">
              <h2>Üdvözöljük, <span id="userFirstName">{userData.personalInfo?.firstName}</span>!</h2>
              <div className="streak-counter">
                <div className="streak-number" id="streakCount">{workoutData.stats?.streak || 7}</div>
                <div className="streak-label">EGYMÁST KÖVETŐ NAP</div>
              </div>
            </div>
            <p id="welcomeMessage">Ma kiváló nap az edzésre! {getMotivationMessage(userData.goals?.mainGoal)}</p>
            <div className="motivation-quote" id="dailyQuote">{getDailyQuote(userData.goals?.mainGoal)}</div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-dumbbell"></i>
              </div>
              <div className="stat-info">
                <h3>HETI EDZÉSEK</h3>
                <div className="stat-number" id="weeklyWorkouts">
                  {workoutData.stats?.completedWorkouts}/{workoutData.stats?.weeklyTarget}
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-fire"></i>
              </div>
              <div className="stat-info">
                <h3>ELÉGETETT KALÓRIA</h3>
                <div className="stat-number" id="caloriesBurned">2,450</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-weight"></i>
              </div>
              <div className="stat-info">
                <h3>MEGVÁLTOZOTT SÚLY</h3>
                <div className="stat-number" id="weightChange">-1.2 kg</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-heartbeat"></i>
              </div>
              <div className="stat-info">
                <h3>ÁTLAGOS PULZUS</h3>
                <div className="stat-number" id="avgHeartRate">142</div>
              </div>
            </div>
          </div>

          {/* Today's Workout */}
          <div className="card">
            <div className="section-header">
              <h2>Mai edzésed</h2>
              <div className="workout-type-badge" id="workoutType">
                {getWorkoutType(userData.goals?.mainGoal)}
              </div>
            </div>
            
            <div className="exercise-list" id="todaysExercises">
              {workoutData.todayWorkout?.map((exercise, index) => (
                <div key={index} className="exercise-card">
                  <div className="exercise-icon">
                    <i className={exercise.icon}></i>
                  </div>
                  <div className="exercise-info">
                    <h4>{exercise.name}</h4>
                    <div className="exercise-details">{exercise.sets} × {exercise.reps}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="workout-actions">
              <button className="btn btn-secondary" onClick={() => navigateToSection('workout-plan')}>
                <i className="fas fa-list"></i> Teljes edzésterv
              </button>
              <button className="btn btn-primary" onClick={() => navigateToSection('workout-mode')}>
                <i className="fas fa-play"></i> Edzés indítása
              </button>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-container">
              <div className="section-header">
                <h3>Súlyfejlődés</h3>
              </div>
              <Line data={weightChartData} options={chartOptions('Testsúly (kg)')} />
            </div>
            
            <div className="chart-container">
              <div className="section-header">
                <h3>Edzési gyakoriság</h3>
              </div>
              <Bar data={workoutChartData} options={chartOptions('Perc')} />
            </div>
          </div>
        </div>

        {/* Workout Plan Section */}
        <div className={`content-section ${currentSection === 'workout-plan' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-dumbbell"></i> Heti Edzésterv</h2>
              <div className="week-navigation">
                <button className="btn btn-secondary" onClick={() => changeWeek(-1)}>
                  <i className="fas fa-chevron-left"></i> Előző hét
                </button>
                <h3 id="currentWeek">2024. {currentWeek + 3}. hét (Jan 22-28)</h3>
                <button className="btn btn-secondary" onClick={() => changeWeek(1)}>
                  Következő hét <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

            <div className="week-days" id="weekDays">
              {['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'].map((day, index) => {
                const today = new Date().getDay();
                const isToday = (index === (today + 6) % 7);
                const workout = workoutData.weeklyPlan?.[index] || { type: 'Pihenő', exercises: [] };
                
                return (
                  <div 
                    key={index}
                    className={`day-card ${isToday ? 'active' : ''}`}
                    onClick={() => selectDay(index)}
                  >
                    <div className="day-name">{day}</div>
                    <div className="day-workout">{workout.type}</div>
                    <div className="day-exercises">{workout.exercises.length} gyakorlat</div>
                  </div>
                );
              })}
            </div>

            <div className="exercise-list" id="workoutExercises">
              {workoutData.weeklyPlan?.[(new Date().getDay() + 6) % 7]?.exercises?.map((exercise, index) => (
                <div key={index} className="exercise-card">
                  <div className="exercise-icon">
                    <i className={exercise.icon}></i>
                  </div>
                  <div className="exercise-info">
                    <h4>{exercise.name}</h4>
                    <div className="exercise-details">{exercise.sets} × {exercise.reps}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '5px' }}>
                      {exercise.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workout Mode Section */}
        <div className={`content-section ${currentSection === 'workout-mode' ? 'active' : ''}`}>
          <div className="workout-mode">
            <div className="section-header">
              <h2><i className="fas fa-play-circle"></i> Edzés mód</h2>
              <button className="btn btn-secondary" onClick={stopWorkout}>
                <i className="fas fa-stop"></i> Edzés befejezése
              </button>
            </div>

            <div className="current-exercise">
              <h3 id="currentExerciseName">Fekvenyomás</h3>
              <p id="currentExerciseDetails">4 sorozat × 8-12 ismétlés</p>
            </div>

            <div className="workout-timer" id="workoutTimer">{formatTime(workoutTime)}</div>

            <div className="exercise-stats">
              <div className="stat-box">
                <div className="stat-value" id="currentSet">1/4</div>
                <div className="stat-label">Sorozat</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" id="currentReps">8</div>
                <div className="stat-label">Ismétlés</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" id="currentWeight">60 kg</div>
                <div className="stat-label">Súly</div>
              </div>
            </div>

            <div className="workout-controls">
              <button className="control-btn" onClick={() => {}}>
                <i className="fas fa-step-backward"></i>
              </button>
              <button className="control-btn" onClick={toggleWorkout} id="playPauseBtn">
                <i className={`fas ${workoutActive ? 'fa-pause' : 'fa-play'}`} id="playPauseIcon"></i>
              </button>
              <button className="control-btn" onClick={() => {}}>
                <i className="fas fa-step-forward"></i>
              </button>
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <h3><i className="fas fa-list"></i> Mai edzés gyakorlatai</h3>
            </div>
            <div className="exercise-list" id="workoutModeExercises">
              {workoutData.todayWorkout?.map((exercise, index) => (
                <div key={index} className="exercise-card">
                  <div className="exercise-icon">
                    <i className={exercise.icon}></i>
                  </div>
                  <div className="exercise-info">
                    <h4>{exercise.name}</h4>
                    <div className="exercise-details">{exercise.sets} × {exercise.reps}</div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                        <i className="fas fa-check"></i> Kész
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                        <i className="fas fa-redo"></i> Ismétlés
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className={`content-section ${currentSection === 'progress' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-chart-line"></i> Haladás és Statisztikák</h2>
              <select className="form-control" style={{ width: '200px' }} id="progressPeriod">
                <option value="month">1 hónap</option>
                <option value="quarter" selected>3 hónap</option>
                <option value="year">1 év</option>
              </select>
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <h3>Testsúly változás</h3>
                <canvas id="progressWeightChart"></canvas>
              </div>
              <div className="chart-container">
                <h3>Izomerő fejlődés</h3>
                <canvas id="strengthChart"></canvas>
              </div>
              <div className="chart-container">
                <h3>Edzés gyakoriság</h3>
                <canvas id="frequencyChart"></canvas>
              </div>
              <div className="chart-container">
                <h3>Kalória egyensúly</h3>
                <canvas id="caloriesChart"></canvas>
              </div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-value" id="totalWorkouts">{workoutData.stats?.totalWorkouts}</div>
                <div className="quick-stat-label">ÖSSZES EDZÉS</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value" id="workoutHours">{workoutData.stats?.workoutHours}</div>
                <div className="quick-stat-label">EDZÉS ÖSSZES ÓRA</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value" id="totalWeightLifted">{workoutData.stats?.totalWeightLifted}</div>
                <div className="quick-stat-label">EMELT SÚLY ÖSSZESEN (KG)</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value" id="achievementRate">78%</div>
                <div className="quick-stat-label">CÉLOK ELÉRÉSI ARÁNYA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gyms Section */}
        <div className={`content-section ${currentSection === 'gyms' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-map-marker-alt"></i> Közeli Edzőtermek</h2>
              <div className="top-actions">
                <select className="form-control" style={{ width: '200px' }} id="gymFilter">
                  <option value="all">Összes edzőterem</option>
                  <option value="24_7">24/7 nyitva</option>
                  <option value="crossfit">CrossFit</option>
                  <option value="women_only">Női terem</option>
                  <option value="beginner_friendly">Kezdőbarát</option>
                </select>
              </div>
            </div>

            <div className="map-container" id="gymMap">
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', color: 'var(--gray)' }}>
                <i className="fas fa-map" style={{ fontSize: '3rem', marginRight: '15px' }}></i>
                <div>
                  <h3>Edzőterem térkép</h3>
                  <p>A térkép itt jelenik meg a közeli edzőtermekkel</p>
                </div>
              </div>
            </div>

            <div className="gyms-list" id="gymsList">
              {[
                { name: 'Fitness World', address: 'Budapest, Deák tér 3.', distance: '0.8 km', features: ['24/7', 'Szauna', 'CrossFit'], price: '4.990 Ft/hó', hours: '0-24 óra' },
                { name: 'Power Gym', address: 'Budapest, Andrássy út 45.', distance: '1.2 km', features: ['Súlyzók', 'Kardió', 'Csoportos'], price: '6.990 Ft/hó', hours: '6-22 óra' },
                { name: 'Women Only Fitness', address: 'Budapest, Teréz körút 12.', distance: '1.5 km', features: ['Női terem', 'Jóga', 'Pilates'], price: '5.990 Ft/hó', hours: '7-21 óra' },
                { name: 'CrossFit Downtown', address: 'Budapest, Nagymező utca 20.', distance: '2.1 km', features: ['CrossFit', 'Funkcionális', 'Edzőkkel'], price: '8.990 Ft/hó', hours: '6-23 óra' }
              ].map((gym, index) => (
                <div key={index} className="gym-card">
                  <div className="gym-header">
                    <h3>{gym.name}</h3>
                    <div className="gym-distance">{gym.distance}</div>
                  </div>
                  <p style={{ color: 'var(--gray)', marginBottom: '15px' }}>{gym.address}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                    {gym.features.map((feature, i) => (
                      <span key={i} style={{ background: 'var(--light)', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem' }}>{feature}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--dark)' }}>{gym.price}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{gym.hours}</div>
                    </div>
                    <button className="btn btn-primary" style={{ padding: '8px 20px' }}>
                      <i className="fas fa-directions"></i> Útvonal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nutrition Section */}
        <div className={`content-section ${currentSection === 'nutrition' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-utensils"></i> Napi Táplálkozási Terv</h2>
              <button className="btn btn-primary" onClick={showMealLogModal}>
                <i className="fas fa-plus"></i> Étkezés naplózása
              </button>
            </div>

            <div className="meal-plan" id="dailyMealPlan">
              {nutritionData.todayMeals?.map((meal, index) => (
                <div key={index} className="meal-card">
                  <div className="meal-time">{meal.time}</div>
                  <h4 style={{ marginBottom: '10px' }}>{meal.name}</h4>
                  <p style={{ color: 'var(--gray)', marginBottom: '15px' }}>{meal.description}</p>
                  <div className="macros">
                    <div className="macro">
                      <div className="macro-value">{meal.protein}g</div>
                      <div className="macro-label">Fehérje</div>
                    </div>
                    <div className="macro">
                      <div className="macro-value">{meal.carbs}g</div>
                      <div className="macro-label">Szénhidrát</div>
                    </div>
                    <div className="macro">
                      <div className="macro-value">{meal.fat}g</div>
                      <div className="macro-label">Zsír</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="section-header">
                <h3>Makró tápanyagok</h3>
                <div className="macros-overview">
                  <div className="stat-number">2,100 <span style={{ fontSize: '1rem' }}>kcal</span></div>
                  <div style={{ color: 'var(--gray)' }}>Napi cél</div>
                </div>
              </div>
              
              <div className="macros">
                <div className="macro">
                  <div className="macro-value" style={{ color: 'var(--primary)' }}>{nutritionData.macros?.protein}g</div>
                  <div className="macro-label">Fehérje</div>
                </div>
                <div className="macro">
                  <div className="macro-value" style={{ color: 'var(--success)' }}>{nutritionData.macros?.carbs}g</div>
                  <div className="macro-label">Szénhidrát</div>
                </div>
                <div className="macro">
                  <div className="macro-value" style={{ color: 'var(--warning)' }}>{nutritionData.macros?.fat}g</div>
                  <div className="macro-label">Zsír</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className={`content-section ${currentSection === 'profile' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-user-circle"></i> Profilom</h2>
              <button className="btn btn-primary" onClick={saveProfile}>
                <i className="fas fa-save"></i> Módosítások mentése
              </button>
            </div>

            <div className="profile-form" id="profileForm">
              <div>
                <div className="form-group">
                  <label>Teljes név</label>
                  <input type="text" className="form-control" id="profileName" defaultValue={`${userData.personalInfo?.lastName || ''} ${userData.personalInfo?.firstName || ''}`} />
                </div>
                <div className="form-group">
                  <label>Email cím</label>
                  <input type="email" className="form-control" id="profileEmail" defaultValue="kovacs.marton@example.com" />
                </div>
                <div className="form-group">
                  <label>Telefonszám</label>
                  <input type="tel" className="form-control" id="profilePhone" defaultValue="+36 30 123 4567" />
                </div>
                <div className="form-group">
                  <label>Születési dátum</label>
                  <input type="date" className="form-control" id="profileBirthDate" defaultValue="1990-05-15" />
                </div>
              </div>
              
              <div>
                <div className="form-group">
                  <label>Magasság (cm)</label>
                  <input type="number" className="form-control" id="profileHeight" defaultValue={userData.personalInfo?.height} />
                </div>
                <div className="form-group">
                  <label>Jelenlegi testsúly (kg)</label>
                  <input type="number" className="form-control" id="profileWeight" defaultValue={userData.personalInfo?.weight} step="0.1" />
                </div>
                <div className="form-group">
                  <label>Cél testsúly (kg)</label>
                  <input type="number" className="form-control" id="profileTargetWeight" defaultValue="78.0" step="0.1" />
                </div>
                <div className="form-group">
                  <label>Fő cél</label>
                  <select className="form-control" id="profileMainGoal" defaultValue={userData.goals?.mainGoal}>
                    <option value="weightLoss">Fogyás</option>
                    <option value="muscleGain">Izomtömeg-növelés</option>
                    <option value="fitness">Általános fittség</option>
                    <option value="strength">Erőnövelés</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-header">
                <h3>Edzési beállítások</h3>
              </div>
              <div className="profile-form">
                <div>
                  <div className="form-group">
                    <label>Heti edzések száma</label>
                    <select className="form-control" id="profileWorkoutFrequency">
                      <option value="2">2 alkalom</option>
                      <option value="3" selected>3 alkalom</option>
                      <option value="4">4 alkalom</option>
                      <option value="5">5 alkalom</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Edzés hossza</label>
                    <select className="form-control" id="profileWorkoutDuration">
                      <option value="30">30 perc</option>
                      <option value="45">45 perc</option>
                      <option value="60" selected>60 perc</option>
                      <option value="90">90 perc</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="form-group">
                    <label>Kedvenc edzés típus</label>
                    <select className="form-control" id="profileWorkoutType">
                      <option value="strength">Erőedzés</option>
                      <option value="cardio" selected>Kardio</option>
                      <option value="hybrid">Vegyes</option>
                      <option value="crossfit">CrossFit</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Értesítések</label>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <input type="checkbox" id="profileNotifications" defaultChecked style={{ marginRight: '10px' }} />
                        Edzés emlékeztetők
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input type="checkbox" id="profileNewsletter" defaultChecked style={{ marginRight: '10px' }} />
                        Hírlevél és tippek
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Challenges Section */}
        <div className={`content-section ${currentSection === 'challenges' ? 'active' : ''}`}>
          <div className="card">
            <div className="section-header">
              <h2><i className="fas fa-trophy"></i> Kihívások és Kitüntetések</h2>
              <div className="top-actions">
                <div className="user-level">
                  <div className="stat-number" style={{ color: 'var(--secondary)' }}>{challengesData.level}</div>
                  <div style={{ color: 'var(--gray)' }}>Szint</div>
                </div>
              </div>
            </div>

            <div className="challenges-grid" id="activeChallenges">
              {challengesData.activeChallenges?.map((challenge, index) => (
                <div key={index} className="challenge-card">
                  <div className="challenge-badge">
                    <i className={challenge.icon}></i>
                  </div>
                  <h3>{challenge.title}</h3>
                  <p style={{ color: 'var(--gray)', margin: '10px 0' }}>{challenge.description}</p>
                  <div className="challenge-progress">
                    <div className="challenge-progress-fill" style={{ width: `${challenge.progress}%` }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                    <span>{challenge.progress}%</span>
                    <span>{challenge.points} pont</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="section-header">
                <h3>Megszerzett kitüntetések</h3>
              </div>
              <div className="challenges-grid" id="earnedBadges">
                {challengesData.earnedBadges?.map((badge, index) => (
                  <div key={index} className="challenge-card">
                    <div className="challenge-badge" style={{ background: `linear-gradient(135deg, ${badge.color1} 0%, ${badge.color2} 100%)` }}>
                      <i className={badge.icon}></i>
                    </div>
                    <h3>{badge.title}</h3>
                    <p style={{ color: 'var(--gray)', margin: '10px 0' }}>{badge.description}</p>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                      {badge.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="section-header">
                <h3>Ranglista</h3>
                <button className="btn btn-secondary" onClick={() => {}}>
                  <i className="fas fa-list-ol"></i> Teljes ranglista
                </button>
              </div>
              
              <div className="leaderboard" id="weeklyLeaderboard">
                {challengesData.leaderboard?.map((user, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    background: index < 3 ? 'rgba(244, 162, 97, 0.1)' : 'white'
                  }}>
                    <div style={{ fontWeight: 600, width: '40px', textAlign: 'center', color: index < 3 ? 'var(--secondary)' : 'var(--gray)' }}>
                      {index + 1}.
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontWeight: 600 }}>{user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{user.level}. szint</div>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--dark)' }}>
                      {user.points} pont
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for notifications */}
      <div className={`modal ${modalOpen === 'notifications' ? 'active' : ''}`} id="notificationsModal">
        <div className="modal-content">
          <div className="section-header">
            <h2><i className="fas fa-bell"></i> Értesítések</h2>
            <button className="btn btn-secondary" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div id="notificationsList">
            <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 600 }}>Új kihívás elérhető!</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Indítsd el a heti kihívást</div>
            </div>
            <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 600 }}>Mai edzésed 18:00-kor</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>Ne felejtsd el a felsőtest edzést!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for meal logging */}
      <div className={`modal ${modalOpen === 'mealLog' ? 'active' : ''}`} id="mealLogModal">
        <div className="modal-content">
          <div className="section-header">
            <h2><i className="fas fa-plus"></i> Étkezés naplózása</h2>
            <button className="btn btn-secondary" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <form id="mealLogForm" onSubmit={(e) => { e.preventDefault(); alert('Étkezés naplózva!'); closeModal(); }}>
            <div className="form-group">
              <label>Étkezés típusa</label>
              <select className="form-control" id="mealType" required>
                <option value="">Válasszon...</option>
                <option value="breakfast">Reggeli</option>
                <option value="lunch">Ebéd</option>
                <option value="dinner">Vacsora</option>
                <option value="snack">Nassolás</option>
              </select>
            </div>
            <div className="form-group">
              <label>Étel leírása</label>
              <textarea className="form-control" id="mealDescription" rows="3" required></textarea>
            </div>
            <div className="form-group">
              <label>Kalória (kcal)</label>
              <input type="number" className="form-control" id="mealCalories" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fas fa-save"></i> Naplózás
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;