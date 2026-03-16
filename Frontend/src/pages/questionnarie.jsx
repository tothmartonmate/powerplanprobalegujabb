import React, { useState, useEffect } from 'react';
import './questionnaire.css';

const Questionnaire = ({ navigateTo, setIsLoggedIn }) => {
  const [currentSection, setCurrentSection] = useState(1);
  const totalSections = 8;

  // Form state
  const [formData, setFormData] = useState({
    personalInfo: {
      gender: '',
      height: '',
      weight: '',
      birthDate: '',
      activity: ''
    },
    trainingExperience: {
      frequency: '',
      weeklyTraining: '',
      trainingTypes: []
    },
    healthInfo: {
      currentInjury: '',
      chronicConditions: [],
      medications: ''
    },
    goals: {
      mainGoal: '',
      timeframe: '',
      specificGoal: '',
      motivation: []
    },
    lifestyle: {
      sleepHours: '7',
      stressLevel: '5',
      sittingTime: ''
    },
    nutrition: {
      diet: [],
      allergies: '',
      dietControl: '5',
      dietRecommendations: ''
    },
    preferences: {
      trainingLocation: '',
      workoutTime: '',
      preferredFrequency: ''
    },
    selfAssessment: {
      satisfaction: '5',
      energy: '5',
      obstacles: [],
      comments: ''
    }
  });

  // Skip buttons state
  const [skipped, setSkipped] = useState({
    currentInjury: false,
    chronicConditions: false,
    medications: false
  });

  // Errors state for validation
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Set max date for birthDate (18 years old)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    document.getElementById('birthDate')?.setAttribute('max', maxDate.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    updateProgress();
  }, [currentSection]);

  const updateProgress = () => {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
      const progress = (currentSection / totalSections) * 100;
      progressFill.style.width = progress + '%';
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, id } = e.target;
    
    // Handle nested form data structure
    if (id && id.includes('.')) {
      const [category, field] = id.split('.');
      setFormData(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name && name.includes('.')) {
      const [category, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle radio buttons and selects
      setFormData(prev => {
        const newData = { ...prev };
        if (id && id.includes('.')) {
          const [category, field] = id.split('.');
          newData[category][field] = value;
        } else {
          // Find where to put the value
          for (const category in prev) {
            if (prev[category].hasOwnProperty(name)) {
              newData[category][name] = value;
              break;
            }
          }
        }
        return newData;
      });
    }

    // Clear error for this field if exists
    if (errors[name] || errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleCheckboxGroup = (e, category, field, value) => {
    const checked = e.target.checked;
    
    setFormData(prev => {
      const currentArray = [...prev[category][field]];
      
      if (checked) {
        if (!currentArray.includes(value)) {
          currentArray.push(value);
        }
      } else {
        const index = currentArray.indexOf(value);
        if (index > -1) {
          currentArray.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [field]: currentArray
        }
      };
    });
  };

  const handleSliderChange = (e, category, field) => {
    const value = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));

    // Update display value
    const displayElement = document.getElementById(`${field}Value`);
    if (displayElement) {
      if (field === 'sleepHours') {
        displayElement.textContent = value + ' óra';
      } else {
        displayElement.textContent = value + '/10';
      }
    }
  };

  const handleSkip = (field) => {
    setSkipped(prev => ({
      ...prev,
      [field]: true
    }));

    // Clear the field and remove required attribute
    if (field === 'currentInjury') {
      setFormData(prev => ({
        ...prev,
        healthInfo: {
          ...prev.healthInfo,
          currentInjury: ''
        }
      }));
    } else if (field === 'chronicConditions') {
      setFormData(prev => ({
        ...prev,
        healthInfo: {
          ...prev.healthInfo,
          chronicConditions: []
        }
      }));
    } else if (field === 'medications') {
      setFormData(prev => ({
        ...prev,
        healthInfo: {
          ...prev.healthInfo,
          medications: ''
        }
      }));
    }

    // Update button text
    const btn = document.getElementById(`skip-${field}`);
    if (btn) {
      btn.textContent = 'Kihagyva ✓';
      btn.disabled = true;
    }
  };

  const validateSection = (section) => {
    const sectionErrors = {};
    const sectionEl = document.getElementById(`section${section}`);
    
    if (!sectionEl) return true;

    const requiredInputs = sectionEl.querySelectorAll('[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
      const isCheckboxGroup = input.type === 'checkbox' && input.name && input.name.includes('[]');
      
      if (isCheckboxGroup) {
        const name = input.name.replace('[]', '');
        const checkedExists = sectionEl.querySelectorAll(`input[name="${input.name}"]:checked`).length > 0;
        
        if (!checkedExists) {
          isValid = false;
          sectionErrors[name] = 'Kérjük, válasszon legalább egy opciót';
          
          // JAVÍTOTT RÉSZ - optional chaining assignment nélkül
          const group = input.closest('.checkbox-group');
          if (group) {
            group.style.animation = 'shake 0.5s';
            setTimeout(() => {
              if (group) {
                group.style.animation = '';
              }
            }, 500);
          }
        }
      } else {
        const value = input.type === 'checkbox' ? input.checked : input.value;
        
        if (!value) {
          isValid = false;
          input.style.borderColor = 'var(--primary)';
          
          // Add shake animation
          input.style.animation = 'shake 0.5s';
          setTimeout(() => {
            input.style.animation = '';
          }, 500);
        } else {
          input.style.borderColor = '';
        }
      }
    });

    if (!isValid) {
      alert('Kérjük, töltse ki az összes kötelező mezőt!');
    }

    setErrors(sectionErrors);
    return isValid;
  };

  const nextSection = () => {
    if (validateSection(currentSection)) {
      if (currentSection < totalSections) {
        setCurrentSection(currentSection + 1);
      }
    }
  };

  const prevSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  const goToSection = (section) => {
    setCurrentSection(section);
  };

  // JAVÍTOTT submitQuestionnaire függvény
  const submitQuestionnaire = async () => {
    if (!validateSection(currentSection)) return;

    const questionnaireData = {
      ...formData,
      submittedAt: new Date().toISOString()
    };

    try {
      // 1. Adatok elküldése az adatbázisba (Backend hívás)
      const token = localStorage.getItem('powerplan_token');
      const currentUserStr = localStorage.getItem('powerplan_current_user');
      const userId = currentUserStr ? JSON.parse(currentUserStr).id : null;
      
      if (!userId) {
        alert("Hiba: Nem vagy bejelentkezve! Kérjük jelentkezz be a mentéshez.");
        return;
      }

      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:5001/api/questionnaire', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          userId: userId,
          questionnaire: questionnaireData
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('Hiba az adatbázisba mentéskor:', errData);
        alert(`Nem sikerült menteni az adatokat az adatbázisba: ${errData.error || 'Ismeretlen hiba'}`);
        return; // Ne engedjük tovább a dashboardra, ha nem sikerült a mentés!
      }
    } catch (error) {
      console.error('Nem sikerült csatlakozni a szerverhez:', error);
      alert('Szerverhiba: Nem sikerült csatlakozni a backendhez!');
      return;
    }

    // 2. Save to localStorage (megtartjuk, hogy azonnal működjön a dashboard)
    localStorage.setItem('powerplan_questionnaire', JSON.stringify(questionnaireData));
    localStorage.setItem('powerplan_user_completed_questionnaire', 'true');

    // Frissítjük az App komponensben a bejelentkezett állapotot
    if (setIsLoggedIn) setIsLoggedIn(true);

    alert('Köszönjük a kérdőív kitöltését! Az adataid alapján személyre szabott edzéstervet készítünk.');

    setTimeout(() => {
      if (navigateTo) {
        navigateTo('dashboard');
      } else {
        window.location.href = '/dashboard';
      }
    }, 2000);
  };

  // Helper function to get slider display value
  const getSliderDisplay = (category, field) => {
    const value = formData[category]?.[field];
    if (field === 'sleepHours') {
      return value + ' óra';
    }
    return value + '/10';
  };

  return (
    <div className="questionnaire-container">
      <div className="header">
        <h1>Személyre Szabott Edzésterv</h1>
        <p>Kérjük, töltse ki a kérdőívet, hogy az Ön igényeihez tudjuk igazítani az edzéstervet</p>

        <div className="progress-bar">
          <div className="progress-fill" id="progressFill"></div>
        </div>
        <div className="progress-text">
          <span id="currentQuestion">{currentSection}</span> / <span id="totalQuestions">{totalSections}</span> rész
        </div>
      </div>

      <div className="questionnaire-content">
        {/* 1. Alap információk */}
        <div className={`question-section ${currentSection === 1 ? 'active' : ''}`} id="section1">
          <h2 className="question-title">1. Alap információk</h2>

          <div className="question-group">
            <div className="form-group">
              <label htmlFor="gender">Nem</label>
              <select
                className="input-field"
                id="gender"
                value={formData.personalInfo.gender}
                onChange={handleInputChange}
                name="gender"
                required
              >
                <option value="">Válasszon...</option>
                <option value="male">Férfi</option>
                <option value="female">Nő</option>
                <option value="other">Egyéb</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="height">Magasság (cm)</label>
              <input
                type="number"
                className="input-field"
                id="height"
                min="100"
                max="250"
                value={formData.personalInfo.height}
                onChange={handleInputChange}
                name="height"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Testsúly (kg)</label>
              <input
                type="number"
                className="input-field"
                id="weight"
                min="30"
                max="200"
                step="0.1"
                value={formData.personalInfo.weight}
                onChange={handleInputChange}
                name="weight"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">Születési dátum</label>
              <input
                type="date"
                className="input-field"
                id="birthDate"
                value={formData.personalInfo.birthDate}
                onChange={handleInputChange}
                name="birthDate"
                required
              />
            </div>

            <div className="form-group">
              <label>Napi aktivitási szint</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="activity"
                    value="sedentary"
                    checked={formData.personalInfo.activity === 'sedentary'}
                    onChange={handleInputChange}
                    required
                  />
                  Ülőmunka (kevés mozgás)
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="activity"
                    value="light"
                    checked={formData.personalInfo.activity === 'light'}
                    onChange={handleInputChange}
                  />
                  Könnyű mozgás (1-3 nap/hét)
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="activity"
                    value="moderate"
                    checked={formData.personalInfo.activity === 'moderate'}
                    onChange={handleInputChange}
                  />
                  Mérsékelt mozgás (3-5 nap/hét)
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="activity"
                    value="very"
                    checked={formData.personalInfo.activity === 'very'}
                    onChange={handleInputChange}
                  />
                  Nagyon aktív (6-7 nap/hét)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Edzés tapasztalat */}
        <div className={`question-section ${currentSection === 2 ? 'active' : ''}`} id="section2">
          <h2 className="question-title">2. Edzés tapasztalat</h2>

          <div className="question-group">
            <div className="form-group">
              <label htmlFor="trainingFrequency">Milyen gyakran edzel?</label>
              <select
                className="input-field"
                id="trainingFrequency"
                value={formData.trainingExperience.frequency}
                onChange={handleInputChange}
                name="frequency"
                required
              >
                <option value="">Válasszon...</option>
                <option value="never">Soha</option>
                <option value="beginner">Kezdő (0-6 hónap)</option>
                <option value="intermediate">Középhaladó (6-24 hónap)</option>
                <option value="advanced">Haladó (2+ év)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Hetente hányszor szoktál edzeni?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="weeklyTraining"
                    value="0"
                    checked={formData.trainingExperience.weeklyTraining === '0'}
                    onChange={handleInputChange}
                    required
                  />
                  0 alkalom
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="weeklyTraining"
                    value="1-2"
                    checked={formData.trainingExperience.weeklyTraining === '1-2'}
                    onChange={handleInputChange}
                  />
                  1-2 alkalom
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="weeklyTraining"
                    value="3-4"
                    checked={formData.trainingExperience.weeklyTraining === '3-4'}
                    onChange={handleInputChange}
                  />
                  3-4 alkalom
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="weeklyTraining"
                    value="5+"
                    checked={formData.trainingExperience.weeklyTraining === '5+'}
                    onChange={handleInputChange}
                  />
                  5+ alkalom
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Milyen típusú edzéseket végeztél eddig? (több válasz is lehetséges)</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="trainingTypes[]"
                    value="weight"
                    checked={formData.trainingExperience.trainingTypes.includes('weight')}
                    onChange={(e) => handleCheckboxGroup(e, 'trainingExperience', 'trainingTypes', 'weight')}
                  />
                  Súlyzós edzés
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="trainingTypes[]"
                    value="cardio"
                    checked={formData.trainingExperience.trainingTypes.includes('cardio')}
                    onChange={(e) => handleCheckboxGroup(e, 'trainingExperience', 'trainingTypes', 'cardio')}
                  />
                  Kardió
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="trainingTypes[]"
                    value="crossfit"
                    checked={formData.trainingExperience.trainingTypes.includes('crossfit')}
                    onChange={(e) => handleCheckboxGroup(e, 'trainingExperience', 'trainingTypes', 'crossfit')}
                  />
                  Crossfit / funkcionális
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="trainingTypes[]"
                    value="home"
                    checked={formData.trainingExperience.trainingTypes.includes('home')}
                    onChange={(e) => handleCheckboxGroup(e, 'trainingExperience', 'trainingTypes', 'home')}
                  />
                  Otthoni edzés
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Egészségügyi információk */}
        <div className={`question-section ${currentSection === 3 ? 'active' : ''}`} id="section3">
          <h2 className="question-title">3. Egészségügyi információk</h2>

          <div className="warning-note">
            <i className="fas fa-exclamation-triangle"></i>
            <span>
              Ezek az információk segítenek a biztonságos edzésterv elkészítésében. Minden adat bizalmas kezelés alá esik.
            </span>
          </div>

          <div className="question-group">
            <div className="form-group">
              <label>Van-e jelenleg sérülésed?</label>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="radio-group" style={{ flex: 1 }}>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="currentInjury"
                      value="no"
                      checked={formData.healthInfo.currentInjury === 'no'}
                      onChange={handleInputChange}
                      required={!skipped.currentInjury}
                      disabled={skipped.currentInjury}
                    />
                    Nincs
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="currentInjury"
                      value="shoulder"
                      checked={formData.healthInfo.currentInjury === 'shoulder'}
                      onChange={handleInputChange}
                      required={!skipped.currentInjury}
                      disabled={skipped.currentInjury}
                    />
                    Váll
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="currentInjury"
                      value="knee"
                      checked={formData.healthInfo.currentInjury === 'knee'}
                      onChange={handleInputChange}
                      required={!skipped.currentInjury}
                      disabled={skipped.currentInjury}
                    />
                    Térd
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="currentInjury"
                      value="back"
                      checked={formData.healthInfo.currentInjury === 'back'}
                      onChange={handleInputChange}
                      required={!skipped.currentInjury}
                      disabled={skipped.currentInjury}
                    />
                    Hát
                  </label>
                </div>
                <button
                  type="button"
                  className="skip-btn"
                  id="skip-currentInjury"
                  onClick={() => handleSkip('currentInjury')}
                  disabled={skipped.currentInjury}
                >
                  Kihagyom
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Van-e krónikus betegséged?</label>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="checkbox-group" style={{ flex: 1 }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="chronicConditions[]"
                      value="bloodPressure"
                      checked={formData.healthInfo.chronicConditions.includes('bloodPressure')}
                      onChange={(e) => handleCheckboxGroup(e, 'healthInfo', 'chronicConditions', 'bloodPressure')}
                      disabled={skipped.chronicConditions}
                    />
                    Magas vérnyomás
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="chronicConditions[]"
                      value="diabetes"
                      checked={formData.healthInfo.chronicConditions.includes('diabetes')}
                      onChange={(e) => handleCheckboxGroup(e, 'healthInfo', 'chronicConditions', 'diabetes')}
                      disabled={skipped.chronicConditions}
                    />
                    Cukorbetegség
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="chronicConditions[]"
                      value="heart"
                      checked={formData.healthInfo.chronicConditions.includes('heart')}
                      onChange={(e) => handleCheckboxGroup(e, 'healthInfo', 'chronicConditions', 'heart')}
                      disabled={skipped.chronicConditions}
                    />
                    Szívprobléma
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="chronicConditions[]"
                      value="other"
                      checked={formData.healthInfo.chronicConditions.includes('other')}
                      onChange={(e) => handleCheckboxGroup(e, 'healthInfo', 'chronicConditions', 'other')}
                      disabled={skipped.chronicConditions}
                    />
                    Egyéb
                  </label>
                </div>
                <button
                  type="button"
                  className="skip-btn"
                  id="skip-chronicConditions"
                  onClick={() => handleSkip('chronicConditions')}
                  disabled={skipped.chronicConditions}
                >
                  Kihagyom
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="medications">Szed-e rendszeresen gyógyszert?</label>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <textarea
                  className="input-field"
                  id="medications"
                  rows="3"
                  placeholder="Ha igen, kérjük írja le..."
                  value={formData.healthInfo.medications}
                  onChange={handleInputChange}
                  name="medications"
                  disabled={skipped.medications}
                  style={{ flex: 1 }}
                ></textarea>
                <button
                  type="button"
                  className="skip-btn"
                  id="skip-medications"
                  onClick={() => handleSkip('medications')}
                  disabled={skipped.medications}
                >
                  Kihagyom
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Célok */}
        <div className={`question-section ${currentSection === 4 ? 'active' : ''}`} id="section4">
          <h2 className="question-title">4. Célok</h2>

          <div className="question-group">
            <div className="form-group">
              <label>Mi a fő célod?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="mainGoal"
                    value="weightLoss"
                    checked={formData.goals.mainGoal === 'weightLoss'}
                    onChange={handleInputChange}
                    required
                  />
                  Fogyás
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="mainGoal"
                    value="muscleGain"
                    checked={formData.goals.mainGoal === 'muscleGain'}
                    onChange={handleInputChange}
                  />
                  Izomtömeg-növelés
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="mainGoal"
                    value="fitness"
                    checked={formData.goals.mainGoal === 'fitness'}
                    onChange={handleInputChange}
                  />
                  Általános fittség
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="mainGoal"
                    value="strength"
                    checked={formData.goals.mainGoal === 'strength'}
                    onChange={handleInputChange}
                  />
                  Erőnövelés
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="timeframe">Mennyi idő alatt szeretnél eredményt?</label>
              <select
                className="input-field"
                id="timeframe"
                value={formData.goals.timeframe}
                onChange={handleInputChange}
                name="timeframe"
                required
              >
                <option value="">Válasszon...</option>
                <option value="1month">1 hónap</option>
                <option value="3months">3 hónap</option>
                <option value="6months">6 hónap</option>
                <option value="1year">1 év</option>
                <option value="longterm">Hosszú távú</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="specificGoal">Van-e konkrét cél?</label>
              <textarea
                className="input-field"
                id="specificGoal"
                rows="3"
                placeholder="Pl. -10 kg, fekvenyomás 100 kg, futás 5 km..."
                value={formData.goals.specificGoal}
                onChange={handleInputChange}
                name="specificGoal"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Mi a legnagyobb motivációd?</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="motivation[]"
                    value="health"
                    checked={formData.goals.motivation.includes('health')}
                    onChange={(e) => handleCheckboxGroup(e, 'goals', 'motivation', 'health')}
                  />
                  Egészség
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="motivation[]"
                    value="appearance"
                    checked={formData.goals.motivation.includes('appearance')}
                    onChange={(e) => handleCheckboxGroup(e, 'goals', 'motivation', 'appearance')}
                  />
                  Kinézet
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="motivation[]"
                    value="performance"
                    checked={formData.goals.motivation.includes('performance')}
                    onChange={(e) => handleCheckboxGroup(e, 'goals', 'motivation', 'performance')}
                  />
                  Teljesítmény
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="motivation[]"
                    value="confidence"
                    checked={formData.goals.motivation.includes('confidence')}
                    onChange={(e) => handleCheckboxGroup(e, 'goals', 'motivation', 'confidence')}
                  />
                  Magabiztosság
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Életmód */}
        <div className={`question-section ${currentSection === 5 ? 'active' : ''}`} id="section5">
          <h2 className="question-title">5. Életmód</h2>

          <div className="question-group">
            <div className="form-group">
              <label htmlFor="sleepHours">Mennyit alszol átlagosan?</label>
              <div className="slider-container">
                <input
                  type="range"
                  className="range-slider"
                  id="sleepHours"
                  min="4"
                  max="10"
                  step="0.5"
                  value={formData.lifestyle.sleepHours}
                  onChange={(e) => handleSliderChange(e, 'lifestyle', 'sleepHours')}
                />
                <div className="slider-value" id="sleepValue">
                  {getSliderDisplay('lifestyle', 'sleepHours')}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="stressLevel">
                Mennyire stresszes az életviteled? (1 = alacsony, 10 = nagyon magas)
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  className="range-slider"
                  id="stressLevel"
                  min="1"
                  max="10"
                  value={formData.lifestyle.stressLevel}
                  onChange={(e) => handleSliderChange(e, 'lifestyle', 'stressLevel')}
                />
                <div className="slider-value" id="stressValue">
                  {getSliderDisplay('lifestyle', 'stressLevel')}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Mennyit ülsz naponta?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sittingTime"
                    value="low"
                    checked={formData.lifestyle.sittingTime === 'low'}
                    onChange={handleInputChange}
                    required
                  />
                  0-4 óra
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sittingTime"
                    value="medium"
                    checked={formData.lifestyle.sittingTime === 'medium'}
                    onChange={handleInputChange}
                  />
                  4-8 óra
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sittingTime"
                    value="high"
                    checked={formData.lifestyle.sittingTime === 'high'}
                    onChange={handleInputChange}
                  />
                  8+ óra
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Táplálkozás */}
        <div className={`question-section ${currentSection === 6 ? 'active' : ''}`} id="section6">
          <h2 className="question-title">6. Táplálkozás</h2>

          <div className="question-group">
            <div className="form-group">
              <label>Követsz-e speciális étrendet?</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="diet[]"
                    value="none"
                    checked={formData.nutrition.diet.includes('none')}
                    onChange={(e) => handleCheckboxGroup(e, 'nutrition', 'diet', 'none')}
                  />
                  Nem
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="diet[]"
                    value="vegetarian"
                    checked={formData.nutrition.diet.includes('vegetarian')}
                    onChange={(e) => handleCheckboxGroup(e, 'nutrition', 'diet', 'vegetarian')}
                  />
                  Vegetáriánus
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="diet[]"
                    value="vegan"
                    checked={formData.nutrition.diet.includes('vegan')}
                    onChange={(e) => handleCheckboxGroup(e, 'nutrition', 'diet', 'vegan')}
                  />
                  Vegán
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="diet[]"
                    value="keto"
                    checked={formData.nutrition.diet.includes('keto')}
                    onChange={(e) => handleCheckboxGroup(e, 'nutrition', 'diet', 'keto')}
                  />
                  Keto
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="allergies">Van-e ételallergiád?</label>
              <textarea
                className="input-field"
                id="allergies"
                rows="2"
                placeholder="Ha igen, kérjük írja le..."
                value={formData.nutrition.allergies}
                onChange={handleInputChange}
                name="allergies"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="dietControl">
                Mennyire érzed kontrolláltnak az étkezésed? (1 = egyáltalán nem, 10 = teljesen)
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  className="range-slider"
                  id="dietControl"
                  min="1"
                  max="10"
                  value={formData.nutrition.dietControl}
                  onChange={(e) => handleSliderChange(e, 'nutrition', 'dietControl')}
                />
                <div className="slider-value" id="dietControlValue">
                  {getSliderDisplay('nutrition', 'dietControl')}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Szeretnél étrendi ajánlásokat?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="dietRecommendations"
                    value="yes"
                    checked={formData.nutrition.dietRecommendations === 'yes'}
                    onChange={handleInputChange}
                    required
                  />
                  Igen
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="dietRecommendations"
                    value="no"
                    checked={formData.nutrition.dietRecommendations === 'no'}
                    onChange={handleInputChange}
                  />
                  Nem
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="dietRecommendations"
                    value="maybe"
                    checked={formData.nutrition.dietRecommendations === 'maybe'}
                    onChange={handleInputChange}
                  />
                  Talán
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Preferenciák */}
        <div className={`question-section ${currentSection === 7 ? 'active' : ''}`} id="section7">
          <h2 className="question-title">7. Edzés preferenciák</h2>

          <div className="question-group">
            <div className="form-group">
              <label>Hol edzel leggyakrabban?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="trainingLocation"
                    value="gym"
                    checked={formData.preferences.trainingLocation === 'gym'}
                    onChange={handleInputChange}
                    required
                  />
                  Edzőterem
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="trainingLocation"
                    value="home"
                    checked={formData.preferences.trainingLocation === 'home'}
                    onChange={handleInputChange}
                  />
                  Otthon
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="trainingLocation"
                    value="outdoor"
                    checked={formData.preferences.trainingLocation === 'outdoor'}
                    onChange={handleInputChange}
                  />
                  Kint
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="workoutTime">Mennyi időt tudsz egy edzésre szánni?</label>
              <select
                className="input-field"
                id="workoutTime"
                value={formData.preferences.workoutTime}
                onChange={handleInputChange}
                name="workoutTime"
                required
              >
                <option value="">Válasszon...</option>
                <option value="30">30 perc</option>
                <option value="45">45 perc</option>
                <option value="60">60 perc</option>
                <option value="75">75 perc</option>
                <option value="90">90+ perc</option>
              </select>
            </div>

            <div className="form-group">
              <label>Milyen gyakran szeretnél edzeni?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="preferredFrequency"
                    value="2"
                    checked={formData.preferences.preferredFrequency === '2'}
                    onChange={handleInputChange}
                    required
                  />
                  2 alkalom/hét
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="preferredFrequency"
                    value="3"
                    checked={formData.preferences.preferredFrequency === '3'}
                    onChange={handleInputChange}
                  />
                  3 alkalom/hét
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="preferredFrequency"
                    value="4"
                    checked={formData.preferences.preferredFrequency === '4'}
                    onChange={handleInputChange}
                  />
                  4 alkalom/hét
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="preferredFrequency"
                    value="5+"
                    checked={formData.preferences.preferredFrequency === '5+'}
                    onChange={handleInputChange}
                  />
                  5+ alkalom/hét
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 8. Önértékelés */}
        <div className={`question-section ${currentSection === 8 ? 'active' : ''}`} id="section8">
          <h2 className="question-title">8. Önértékelés</h2>

          <div className="question-group">
            <div className="form-group">
              <label htmlFor="satisfaction">
                Mennyire vagy elégedett a jelenlegi fizikumoddal? (1 = egyáltalán nem, 10 = teljesen)
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  className="range-slider"
                  id="satisfaction"
                  min="1"
                  max="10"
                  value={formData.selfAssessment.satisfaction}
                  onChange={(e) => handleSliderChange(e, 'selfAssessment', 'satisfaction')}
                />
                <div className="slider-value" id="satisfactionValue">
                  {getSliderDisplay('selfAssessment', 'satisfaction')}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="energy">Mennyire érzed magad energikusnak napközben?</label>
              <div className="slider-container">
                <input
                  type="range"
                  className="range-slider"
                  id="energy"
                  min="1"
                  max="10"
                  value={formData.selfAssessment.energy}
                  onChange={(e) => handleSliderChange(e, 'selfAssessment', 'energy')}
                />
                <div className="slider-value" id="energyValue">
                  {getSliderDisplay('selfAssessment', 'energy')}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Mi akadályozott eddig a rendszeres edzésben?</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="obstacles[]"
                    value="time"
                    checked={formData.selfAssessment.obstacles.includes('time')}
                    onChange={(e) => handleCheckboxGroup(e, 'selfAssessment', 'obstacles', 'time')}
                  />
                  Időhiány
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="obstacles[]"
                    value="motivation"
                    checked={formData.selfAssessment.obstacles.includes('motivation')}
                    onChange={(e) => handleCheckboxGroup(e, 'selfAssessment', 'obstacles', 'motivation')}
                  />
                  Motiváció hiánya
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="obstacles[]"
                    value="knowledge"
                    checked={formData.selfAssessment.obstacles.includes('knowledge')}
                    onChange={(e) => handleCheckboxGroup(e, 'selfAssessment', 'obstacles', 'knowledge')}
                  />
                  Tudás hiánya
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="obstacles[]"
                    value="money"
                    checked={formData.selfAssessment.obstacles.includes('money')}
                    onChange={(e) => handleCheckboxGroup(e, 'selfAssessment', 'obstacles', 'money')}
                  />
                  Pénzügyi okok
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="comments">Egyéb megjegyzések vagy igények:</label>
              <textarea
                className="input-field"
                id="comments"
                rows="4"
                placeholder="Bármi más, amit szeretnél megosztani..."
                value={formData.selfAssessment.comments}
                onChange={handleInputChange}
                name="comments"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Navigáció */}
        <div className="navigation-buttons" id="navButtons">
          <button
            className="nav-btn prev-btn"
            id="prevBtn"
            onClick={prevSection}
            disabled={currentSection === 1}
          >
            <i className="fas fa-arrow-left"></i> Előző
          </button>
          <button
            className="nav-btn next-btn"
            id="nextBtn"
            onClick={nextSection}
            disabled={currentSection === totalSections}
          >
            Következő <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        {/* Submit gomb */}
        <div
          id="submitContainer"
          style={{
            display: currentSection === totalSections ? 'block' : 'none',
            textAlign: 'center',
            marginTop: '40px'
          }}
        >
          <button className="submit-btn" onClick={submitQuestionnaire}>
            <i className="fas fa-check-circle"></i> Kérdőív beküldése
          </button>
        </div>

        {/* Section counter */}
        <div className="section-counter" id="sectionCounter">
          {[...Array(totalSections)].map((_, i) => (
            <div
              key={i}
              className={`section-dot ${currentSection === i + 1 ? 'active' : ''}`}
              data-section={i + 1}
              onClick={() => goToSection(i + 1)}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;