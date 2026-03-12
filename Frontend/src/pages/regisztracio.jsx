import React from 'react';
import './regisztracio.css';

// JAVÍTÁS 1: Behozzuk a navigateTo függvényt a props-ból
function Registration({ navigateTo }) {
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Értékek kinyerése
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const fitnessGoal = document.getElementById('fitnessGoal').value;
    
    // Jelszó egyezés ellenőrzése
    if (password !== confirmPassword) {
      alert('A jelszavak nem egyeznek!');
      return;
    }
    
    // 1. Adatok összekészítése a Backend számára
    const userData = {
      nev: `${lastName} ${firstName}`,
      email: email,
      jelszo: password,
      fitnessGoal: fitnessGoal
    };
    
    try {
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
        alert('✅ Sikeres regisztráció! Most már bejelentkezhetsz.');
        navigateTo('bejelentkezes');
      } else {
        alert(`❌ Hiba: ${data.error || 'Ismeretlen hiba történt'}`);
      }
    } catch (error) {
      console.error('❌ Hiba a regisztráció során:', error);
      alert('❌ Nem sikerült csatlakozni a szerverhez! Ellenőrizd, hogy a backend fut-e (http://localhost:5001).');
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

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      {/* Navigáció */}
      <nav>
        <a href="#" className="logo" style={{ textDecoration: 'none' }} onClick={(e) => handleNavClick(e, 'home')}>Power<span>Plan</span></a>
        <ul className="nav-menu">
          <li><a href="#" onClick={(e) => handleNavClick(e, 'home')}>KEZDŐLAP</a></li>
          <li><a href="#" onClick={(e) => handleNavClick(e, 'bejelentkezes')}>BEJELENTKEZÉS</a></li>
          <li><a href="#" onClick={(e) => handleNavClick(e, 'home', 'services')}>SZOLGÁLTATÁSAINK</a></li>
          <li><a href="#" onClick={(e) => handleNavClick(e, 'home', 'about')}>RÓLUNK</a></li>
          <li><a href="#" onClick={(e) => handleNavClick(e, 'home', 'pricing')}>ÁRAK</a></li>
          <li><a href="#" onClick={(e) => handleNavClick(e, 'home', 'contact')}>KAPCSOLAT</a></li>
        </ul>
      </nav>

      {/* Regisztrációs űrlap */}
      <div className="form-container">
        <div className="form-box">
          <h2>Regisztráció</h2>
          <p>Hozz létre egy fiókot, és kezdd el az edzést!</p>
          
          <form id="registerForm" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Keresztnév</label>
                <div className="input-with-icon">
                  <i className="fas fa-user"></i>
                  <input type="text" id="firstName" placeholder="Keresztnév" required />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Vezetéknév</label>
                <div className="input-with-icon">
                  <i className="fas fa-user"></i>
                  <input type="text" id="lastName" placeholder="Vezetéknév" required />
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email cím</label>
              <div className="input-with-icon">
                <i className="fas fa-envelope"></i>
                <input type="email" id="email" placeholder="email.cim@pelda.hu" required />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Jelszó</label>
              <div className="input-with-icon">
                <i className="fas fa-lock"></i>
                <input type="password" id="password" placeholder="Válassz erős jelszót" required />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Jelszó megerősítése</label>
              <div className="input-with-icon">
                <i className="fas fa-lock"></i>
                <input type="password" id="confirmPassword" placeholder="Ismételd meg a jelszót" required />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="fitnessGoal">Fitness cél</label>
              <select id="fitnessGoal" required defaultValue="">
                <option value="" disabled>Válaszd ki a célodat</option>
                <option value="weight-loss">Fogyás</option>
                <option value="muscle-gain">Izomépítés</option>
                <option value="endurance">Stamina növelés</option>
                <option value="general-fitness">Általános fitness</option>
                <option value="competition">Versenyre készülés</option>
              </select>
            </div>
            
            <div className="terms">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">Elfogadom a <a href="#">Felhasználási feltételeket</a> és az <a href="#">Adatvédelmi szabályzatot</a></label>
            </div>
            
            <button type="submit" className="submit-button">REGISZTRÁCIÓ</button>
          </form>
          
          <div className="divider">
            <span>VAGY</span>
          </div>
          
          <div className="social-login">
            <button type="button" className="social-button facebook">
              <i className="fab fa-facebook-f"></i>
            </button>
            <button type="button" className="social-button google">
              <i className="fab fa-google"></i>
            </button>
            <button type="button" className="social-button apple">
              <i className="fab fa-apple"></i>
            </button>
          </div>
          
          <div className="form-footer">
            Már van fiókod? <a href="#" onClick={(e) => handleNavClick(e, 'bejelentkezes')}>Jelentkezz be!</a>
          </div>
        </div>
      </div>

      {/* Lábléc */}
      <footer>
        <div className="footer-content">
          <div className="footer-column">
            <h3>Power Plan</h3>
            <p>Edzőtermi alkalmazás, amely segít elérni fitness céljaidat. Éld át a változást velünk!</p>
          </div>
          <div className="footer-column">
            <h3>Gyors linkek</h3>
            <ul className="footer-links">
              <li><a href="#" onClick={(e) => handleNavClick(e, 'home')}>Kezdőlap</a></li>
              <li><a href="#" onClick={(e) => handleNavClick(e, 'home', 'services')}>Szolgáltatások</a></li>
              <li><a href="#" onClick={(e) => handleNavClick(e, 'home', 'about')}>Rólunk</a></li>
              <li><a href="#" onClick={(e) => handleNavClick(e, 'home', 'pricing')}>Árak</a></li>
              <li><a href="#" onClick={(e) => handleNavClick(e, 'home', 'contact')}>Kapcsolat</a></li>
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
    </>
  );
}

export default Registration;