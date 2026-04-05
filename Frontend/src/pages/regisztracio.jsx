import React, { useState } from 'react';
import './regisztracio.css';
import FeedbackModal from '../components/FeedbackModal';

// JAVÍTÁS 1: Behozzuk a navigateTo függvényt a props-ból
function Registration({ navigateTo, registrationDraft, setRegistrationDraft }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const handleInputChange = (event) => {
    const { id, value, type, checked } = event.target;
    setRegistrationDraft((currentDraft) => ({
      ...currentDraft,
      [id]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Jelszó egyezés ellenőrzése
    if (registrationDraft.password !== registrationDraft.confirmPassword) {
      setModalConfig({
        type: 'error',
        title: 'Jelszó hiba',
        message: 'A két jelszó nem egyezik meg.',
        confirmLabel: 'Rendben'
      });
      return;
    }
    
    // 1. Adatok összekészítése a Backend számára
    const userData = {
      full_name: `${registrationDraft.lastName} ${registrationDraft.firstName}`,
      email: registrationDraft.email,
      password: registrationDraft.password,
      fitnessGoal: registrationDraft.fitnessGoal
    };
    
    try {
      const emailCheckResponse = await fetch(`http://localhost:5001/api/register/check-email?email=${encodeURIComponent(registrationDraft.email)}`);
      if (emailCheckResponse.ok) {
        const emailCheckData = await emailCheckResponse.json();
        if (emailCheckData.exists) {
          setModalConfig({
            type: 'error',
            title: 'Regisztráció sikertelen',
            message: 'Ez az email cím már foglalt.',
            confirmLabel: 'Rendben'
          });
          return;
        }
      }

      // VÉGLEGES JAVÍTÁS: localhost használata (a curl parancs ezzel működött!)
      const response = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      // Ellenőrizzük, hogy a válasz valóban JSON-e
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { error: 'A szerver nem JSON választ adott' };
      }

      // 3. Válasz ellenőrzése
      if (response.ok) {
        // Regisztráció után automatikusan "bejelentkeztetjük" a böngészőben, hogy a kérdőívnél legyen userId
        localStorage.setItem('powerplan_user_logged_in', 'true');
        if (data.userId) {
          localStorage.setItem('powerplan_current_user', JSON.stringify({
            id: data.userId,
            full_name: userData.full_name,
            email: userData.email,
            role: 'user',
            is_admin: false
          }));
        }
        setRegistrationDraft({
          lastName: '',
          firstName: '',
          email: '',
          password: '',
          confirmPassword: '',
          fitnessGoal: '',
          termsAccepted: false
        });
        setModalConfig({
          type: 'success',
          title: 'Sikeres regisztráció',
          message: 'Kérlek, töltsd ki a kérdőívet a személyre szabott élményhez.',
          confirmLabel: 'Tovább a kérdőívhez',
          action: 'questionnaire'
        });
      } else {
        setModalConfig({
          type: 'error',
          title: 'Regisztráció sikertelen',
          message: response.status === 409 ? 'Ez az email cím már foglalt.' : (data.error || 'Ismeretlen hiba történt.'),
          confirmLabel: 'Rendben'
        });
      }
    } catch (error) {
      console.error('❌ Hiba a regisztráció során:', error);
      setModalConfig({
        type: 'error',
        title: 'Kapcsolódási hiba',
        message: 'Nem sikerült csatlakozni a szerverhez. Ellenőrizd, hogy a backend fut-e a localhost:5001 címen.',
        confirmLabel: 'Rendben'
      });
    }
  };

  // Segédfüggvény a menüpontok kezeléséhez
  const handleNavClick = (e, page, hash = '') => {
    e.preventDefault();
    navigateTo(page);
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          window.scrollTo({
            top: element.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const handleModalClose = () => {
    const action = modalConfig?.action;
    setModalConfig(null);

    if (action === 'questionnaire') {
      navigateTo('questionnaire');
    }
  };

  return (
    <>
      <div className="regisztracio-container">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        
        {/* Regisztrációs űrlap */}
        <div className="form-container">
          <div className="form-box">
            <h2>Regisztráció</h2>
            <p>Hozz létre egy fiókot, és kezdd el az edzést!</p>
            
            <form id="registerForm" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="lastName">Vezetéknév</label>
                  <div className="input-with-icon">
                    <i className="fas fa-user"></i>
                    <input type="text" id="lastName" placeholder="Vezetéknév" value={registrationDraft.lastName} onChange={handleInputChange} required />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="firstName">Keresztnév</label>
                  <div className="input-with-icon">
                    <i className="fas fa-user"></i>
                    <input type="text" id="firstName" placeholder="Keresztnév" value={registrationDraft.firstName} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email cím</label>
                <div className="input-with-icon">
                  <i className="fas fa-envelope"></i>
                  <input type="email" id="email" placeholder="email.cim@pelda.hu" value={registrationDraft.email} onChange={handleInputChange} required />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Jelszó</label>
                <div className="input-with-icon">
                  <i className="fas fa-lock"></i>
                  <input type={showPassword ? 'text' : 'password'} id="password" placeholder="Válassz erős jelszót" value={registrationDraft.password} onChange={handleInputChange} required />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                    aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Jelszó megerősítése</label>
                <div className="input-with-icon">
                  <i className="fas fa-lock"></i>
                  <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" placeholder="Ismételd meg a jelszót" value={registrationDraft.confirmPassword} onChange={handleInputChange} required />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                    aria-label={showConfirmPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="fitnessGoal">Fitness cél</label>
                <select id="fitnessGoal" required value={registrationDraft.fitnessGoal} onChange={handleInputChange}>
                  <option value="" disabled>Válaszd ki a célodat</option>
                  <option value="weight-loss">Fogyás</option>
                  <option value="muscle-gain">Izomépítés</option>
                  <option value="endurance">Stamina növelés</option>
                  <option value="general-fitness">Általános fitness</option>
                  <option value="competition">Versenyre készülés</option>
                </select>
              </div>
              
              <div className="terms">
                <input type="checkbox" id="termsAccepted" checked={registrationDraft.termsAccepted} onChange={handleInputChange} required />
                <label htmlFor="termsAccepted">Elfogadom a <a href="#" onClick={(e) => handleNavClick(e, 'terms')}>Felhasználási feltételeket</a> és az <a href="#" onClick={(e) => handleNavClick(e, 'privacy')}>Adatvédelmi szabályzatot</a></label>
              </div>
              
              <button type="submit" className="submit-button">REGISZTRÁCIÓ</button>
            </form>
            
            <div className="form-footer">
              Már van fiókod? <a href="#" onClick={(e) => handleNavClick(e, 'bejelentkezes')}>Jelentkezz be!</a>
            </div>
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={Boolean(modalConfig)}
        type={modalConfig?.type}
        title={modalConfig?.title}
        message={modalConfig?.message}
        confirmLabel={modalConfig?.confirmLabel}
        onClose={handleModalClose}
      />
    </>
  );
}

export default Registration;