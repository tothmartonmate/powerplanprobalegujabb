import React, { useState } from 'react';

const AIRecommendation = ({ workoutPlan, dietPlan }) => {
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);
  const [showDietDetails, setShowDietDetails] = useState(false);

  if (!workoutPlan && !dietPlan) {
    return (
      <div className="ai-card-placeholder">
        <div className="ai-icon"><i className="fas fa-robot"></i></div>
        <h3>AI Ajánlás</h3>
        <p>Töltsd ki a kérdőívet a személyre szabott ajánlásokért!</p>
        <button className="btn btn-primary" onClick={() => window.location.href = '/questionnaire'}>
          <i className="fas fa-clipboard-list"></i> Kérdőív kitöltése
        </button>
      </div>
    );
  }

  return (
    <div className="ai-recommendation-container">
      {/* Edzésterv kártya */}
      <div className="ai-card">
        <div className="ai-card-header">
          <i className="fas fa-dumbbell"></i>
          <h3>Ajánlott Edzésterv</h3>
          <span className="badge">{workoutPlan?.name}</span>
        </div>
        <p className="description">{workoutPlan?.description}</p>
        
        <div className="workout-stats">
          <div className="stat">
            <i className="fas fa-calendar-week"></i>
            <span>Heti {workoutPlan?.weeklyDays} edzés</span>
          </div>
          <div className="stat">
            <i className="fas fa-chart-line"></i>
            <span>{workoutPlan?.experience === 'beginner' ? 'Kezdő' : workoutPlan?.experience === 'intermediate' ? 'Haladó' : 'Profi'} szint</span>
          </div>
        </div>
        
        <button className="btn-outline" onClick={() => setShowWorkoutDetails(!showWorkoutDetails)}>
          <i className={`fas fa-chevron-${showWorkoutDetails ? 'up' : 'down'}`}></i>
          {showWorkoutDetails ? 'Részletek elrejtése' : 'Részletek mutatása'}
        </button>
        
        {showWorkoutDetails && (
          <div className="schedule-preview">
            {workoutPlan?.schedule && Object.entries(workoutPlan.schedule).map(([day, data]) => (
              <div key={day} className="day-schedule">
                <div className="day-name">
                  <i className="fas fa-calendar-day"></i>
                  <strong>{day === 'monday' ? 'Hétfő' : day === 'tuesday' ? 'Kedd' : day === 'wednesday' ? 'Szerda' : day === 'thursday' ? 'Csütörtök' : day === 'friday' ? 'Péntek' : day === 'saturday' ? 'Szombat' : 'Vasárnap'}</strong>
                </div>
                <div className="workout-name">{data.name}</div>
                <ul>
                  {data.exercises.map((ex, i) => <li key={i}>{ex}</li>)}
                </ul>
              </div>
            ))}
            <div className="tips">
              <i className="fas fa-lightbulb"></i>
              <span><strong>Tipp:</strong> {workoutPlan?.tips}</span>
            </div>
          </div>
        )}
        
        <button className="btn btn-primary" onClick={() => {
          localStorage.setItem('selected_workout', JSON.stringify(workoutPlan));
          alert('Edzésterv elmentve a profilodba!');
        }}>
          <i className="fas fa-save"></i> Edzésterv alkalmazása
        </button>
      </div>
      
      {/* Étrend kártya */}
      <div className="ai-card">
        <div className="ai-card-header">
          <i className="fas fa-utensils"></i>
          <h3>Ajánlott Étrend</h3>
          <span className="badge">{dietPlan?.name}</span>
        </div>
        <p className="description">{dietPlan?.description}</p>
        
        <div className="calorie-info">
          <div className="calorie-circle-small">
            <span className="calorie-value">{dietPlan?.dailyCalories}</span>
            <span className="calorie-label">kcal/nap</span>
          </div>
          <div className="macros">
            <div className="macro-item">
              <i className="fas fa-drumstick-bite"></i>
              <span>{dietPlan?.macros?.protein}</span>
            </div>
            <div className="macro-item">
              <i className="fas fa-bread-slice"></i>
              <span>{dietPlan?.macros?.carbs}</span>
            </div>
            <div className="macro-item">
              <i className="fas fa-cheese"></i>
              <span>{dietPlan?.macros?.fat}</span>
            </div>
          </div>
        </div>
        
        <button className="btn-outline" onClick={() => setShowDietDetails(!showDietDetails)}>
          <i className={`fas fa-chevron-${showDietDetails ? 'up' : 'down'}`}></i>
          {showDietDetails ? 'Részletek elrejtése' : 'Részletek mutatása'}
        </button>
        
        {showDietDetails && (
          <div className="diet-schedule">
            <div className="meal">
              <i className="fas fa-sun"></i>
              <div><strong>Reggeli</strong><p>{dietPlan?.schedule?.breakfast}</p></div>
            </div>
            <div className="meal">
              <i className="fas fa-utensils"></i>
              <div><strong>Ebéd</strong><p>{dietPlan?.schedule?.lunch}</p></div>
            </div>
            <div className="meal">
              <i className="fas fa-moon"></i>
              <div><strong>Vacsora</strong><p>{dietPlan?.schedule?.dinner}</p></div>
            </div>
            <div className="meal">
              <i className="fas fa-apple-alt"></i>
              <div><strong>Snack</strong><p>{dietPlan?.schedule?.snack}</p></div>
            </div>
          </div>
        )}
        
        <button className="btn btn-primary" onClick={() => {
          localStorage.setItem('selected_diet', JSON.stringify(dietPlan));
          alert('Étrend elmentve a profilodba!');
        }}>
          <i className="fas fa-save"></i> Étrend alkalmazása
        </button>
      </div>
    </div>
  );
};

export default AIRecommendation;