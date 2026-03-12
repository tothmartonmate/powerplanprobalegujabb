import React, { useState } from 'react';
import axios from 'axios';
import './bejelentkezes.css';

// Megjegyzés: A Questionnaire komponenst az App.jsx kezeli a navigateTo-n keresztül, 
// így itt nem kell közvetlenül renderelni, de az importot megtarthatod, ha bővíteni akarod.

function Bejelentkezes({ navigateTo, setIsLoggedIn }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // JAVÍTÁS: API URL a Dockerben futó backendhez (port: 5001 a gazdagépen)
  const API_URL = 'http://localhost:5001/api';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      errors.email = 'Az email cím megadása kötelező';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Érvényes email címet adjon meg';
    }

    if (!formData.password) {
      errors.password = 'A jelszó megadása kötelező';
    } else if (formData.password.length < 6) {
      errors.password = 'A jelszónak legalább 6 karakter hosszúnak kell lennie';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      setServerError('');
      
      try {
        // JAVÍTÁS: API hívás a backend felé a helyes porton
        const response = await axios.post(`${API_URL}/login`, {
          email: formData.email,
          password: formData.password
        });

        if (response.data.success) {
          // Adatok mentése a munkamenethez
          localStorage.setItem('powerplan_token', response.data.token || 'auth_token');
          localStorage.setItem('powerplan_current_user', JSON.stringify(response.data.user));
          localStorage.setItem('powerplan_user_logged_in', 'true');
          
          if (formData.remember) {
            localStorage.setItem('powerplan_remember_me', 'true');
            localStorage.setItem('powerplan_remembered_email', formData.email);
          }
          
          // Jelezzük a fő App komponensnek, hogy bejelentkeztünk
          if (setIsLoggedIn) setIsLoggedIn(true);
          
          alert('✅ Sikeres bejelentkezés! Üdvözöljük újra!');
          
          // --- NAVIGÁCIÓS LOGIKA JAVÍTÁSA ---
          // Megnézzük, hogy a kérdőív (Questionnaire) ki lett-e már töltve valaha
          const completed = localStorage.getItem('powerplan_user_completed_questionnaire');
          
          if (navigateTo) {
            if (completed === 'true') {
              // Ha már kitöltötte, mehet a Dashboard-ra
              navigateTo('dashboard');
            } else {
              // Ha még nem töltötte ki, irány a Kérdőív!
              navigateTo('questionnaire');
            }
          } else {
            window.location.href = '/';
          }
        }
      } catch (error) {
        console.error('Bejelentkezési hiba:', error);
        
        if (error.response) {
          // Ha a szerver válaszolt (pl. 401 vagy 404 hiba)
          setServerError(error.response.data.error || '❌ Hibás email cím vagy jelszó');
        } else if (error.request) {
          // Ha a szerver nem elérhető (Docker hiba)
          setServerError('❌ Nem sikerült kapcsolódni a szerverhez. Ellenőrizd a Docker futását! (backend port: 5001)');
        } else {
          setServerError('❌ Váratlan hiba történt a bejelentkezés során.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setFormErrors(errors);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('🔧 Jelszó visszaállítási funkció fejlesztés alatt. Kérjük, forduljon az ügyfélszolgálathoz.');
  };

  const handleSocialLogin = (provider) => {
    alert(`🔧 ${provider} bejelentkezés - Ez a funkció jelenleg fejlesztés alatt van.`);
  };

  return (
    <div className="bejelentkezes-container">
      <div className="form-container">
        <div className="form-box">
          <h2>Bejelentkezés</h2>
          <p>Add meg az adataidat a belépéshez</p>
          
          {serverError && (
            <div className="error-message general-error">
              <i className="fas fa-exclamation-circle"></i>
              {serverError}
            </div>
          )}
          
          <form id="loginForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email cím</label>
              <div className="input-with-icon">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  placeholder="email.cim@pelda.hu" 
                  value={formData.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? 'input-error' : ''}
                  disabled={isLoading}
                />
              </div>
              {formErrors.email && <span className="error-message">{formErrors.email}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Jelszó</label>
              <div className="input-with-icon">
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  placeholder="Add meg a jelszavad" 
                  value={formData.password}
                  onChange={handleInputChange}
                  className={formErrors.password ? 'input-error' : ''}
                  disabled={isLoading}
                />
              </div>
              {formErrors.password && <span className="error-message">{formErrors.password}</span>}
            </div>
            
            <div className="form-options">
              <div className="remember-me">
                <input 
                  type="checkbox" 
                  id="remember" 
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <label htmlFor="remember">Emlékezz rám</label>
              </div>
              <a href="#" className="forgot-password" onClick={handleForgotPassword}>
                Elfelejtetted a jelszavad?
              </a>
            </div>
            
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> BEJELENTKEZÉS...
                </>
              ) : (
                'BEJELENTKEZÉS'
              )}
            </button>
          </form>
          
          <div className="divider"><span>VAGY</span></div>
          
          <div className="social-login">
            <button className="social-button facebook" onClick={() => handleSocialLogin('Facebook')} disabled={isLoading}>
              <i className="fab fa-facebook-f"></i>
            </button>
            <button className="social-button google" onClick={() => handleSocialLogin('Google')} disabled={isLoading}>
              <i className="fab fa-google"></i>
            </button>
            <button className="social-button apple" onClick={() => handleSocialLogin('Apple')} disabled={isLoading}>
              <i className="fab fa-apple"></i>
            </button>
          </div>
          
          <div className="form-footer">
            Még nincs fiókod? <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('regisztracio'); }}>Regisztrálj most!</a>
          </div>
        </div>
      </div>

      <footer>
        <div className="footer-content">
          <div className="footer-column">
            <h3>Power Plan</h3>
            <p>Edzőtermi alkalmazás, amely segít elérni fitness céljaidat. Éld át a változást velünk!</p>
          </div>
          <div className="footer-column">
            <h3>Gyors linkek</h3>
            <ul className="footer-links">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>Kezdőlap</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>Szolgáltatások</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>Rólunk</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>Árak</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>Kapcsolat</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Kövess minket</h3>
            <div className="social-icons">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-youtube"></i></a>
              <a href="#"><i className="fab fa-tiktok"></i></a>
            </div>
          </div>
        </div>
        <div className="copyright">
          <p>&copy; 2026 Power Plan Edzőtermi Alkalmazás. Minden jog fenntartva.</p>
        </div>
      </footer>
    </div>
  );
}

export default Bejelentkezes;