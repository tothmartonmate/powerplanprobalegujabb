import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Regisztracio from './pages/regisztracio';
import Bejelentkezes from './pages/bejelentkezes';
import Dashboard from './pages/dashboard';
import Questionnaire from './pages/questionnarie';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [registrationDraft, setRegistrationDraft] = useState({
    lastName: '',
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
    fitnessGoal: '',
    termsAccepted: false
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('powerplan_dark_mode');
    return saved !== null ? saved === 'true' : false;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('powerplan_user_completed_questionnaire');
    const token = localStorage.getItem('powerplan_token');
    const isDemoMode = localStorage.getItem('powerplan_demo_mode');
    
    if ((loggedIn || token) && !isDemoMode) {
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('powerplan_dark_mode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('powerplan_dark_mode', 'false');
    }
  }, [darkMode]);

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const navigateToHomeSection = (sectionId) => {
    setCurrentPage('home');
    window.setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        window.scrollTo({
          top: element.offsetTop - 80,
          behavior: 'smooth'
        });
      } else {
        window.scrollTo(0, 0);
      }
    }, 80);
  };

  const handleShowDemoModal = () => {
    setShowDemoModal(true);
  };

  const handleCloseModal = () => {
    setShowDemoModal(false);
    setShowLogoutModal(false);
  };

  const handleStartDemo = () => {
    handleCloseModal();
    
    // Tiszta lappal indul a demó mód, nem keverjük össze a valós fiókkal
    localStorage.removeItem('powerplan_current_user');
    localStorage.removeItem('powerplan_token');
    
    localStorage.setItem('powerplan_demo_mode', 'true');
    localStorage.setItem('powerplan_user_completed_questionnaire', 'true');
    
    const demoUser = {
      id: 'demo-999',
      full_name: 'Demó Felhasználó',
      email: 'demo@powerplan.hu'
    };
    localStorage.setItem('powerplan_current_user', JSON.stringify(demoUser));
    
    const demoData = {
      personalInfo: {
        firstName: 'Demó',
        lastName: 'Felhasználó',
        height: 180,
        weight: 80,
        goal: 'fitness',
        birthDate: '1990-01-01'
      },
      goals: {
        mainGoal: 'fitness',
        timeframe: '3months',
        specificGoal: 'Általános fittség'
      }
    };
    
    localStorage.setItem('powerplan_questionnaire', JSON.stringify(demoData));
    
    setIsLoggedIn(true);
    navigateTo('dashboard');
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const formData = {
      name: document.getElementById('name')?.value,
      email: document.getElementById('email')?.value,
      subject: document.getElementById('subject')?.value,
      message: document.getElementById('message')?.value
    };
    console.log('Kapcsolati űrlap adatok:', formData);
    alert('Köszönjük üzenetét! Hamarosan válaszolunk.');
    e.target.reset();
  };

  useEffect(() => {
    const handleSmoothScroll = (e) => {
      if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }
    };

    document.addEventListener('click', handleSmoothScroll);
    return () => {
      document.removeEventListener('click', handleSmoothScroll);
    };
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('powerplan_user_completed_questionnaire');
    localStorage.removeItem('powerplan_demo_mode');
    localStorage.removeItem('powerplan_questionnaire');
    localStorage.removeItem('powerplan_token');
    localStorage.removeItem('powerplan_current_user');
    localStorage.removeItem('powerplan_user_logged_in');
    localStorage.removeItem('powerplan_remember_me');
    localStorage.removeItem('powerplan_profile_image');
    setIsLoggedIn(false);
    navigateTo('home');
  };

  const handleShowLogoutModal = (e) => {
    if (e) e.preventDefault();
    setShowLogoutModal(true);
  };

  const renderHomePage = () => (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>Éld át a változást!</h1>
          <p>A Power Plan edzőtermi alkalmazás segít elérni edzés céljaidat. Kövesd fejlődésedet, kapj személyre szabott edzés-terveket és társulj közösségünkhöz!</p>
          <div className="cta-buttons">
            <button className="cta-button" onClick={() => navigateTo('regisztracio')}>INGYENES REGISZTRÁCIÓ</button>
            <button className="cta-button secondary" onClick={handleShowDemoModal}>DEMÓ MEGTEKINTÉSE</button>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" alt="Edzőtermi alkalmazás" />
        </div>
      </section>

      <section className="services" id="services">
        <div className="section-title">
          <h2>Szolgáltatásaink</h2>
          <p>Fedezd fel, hogyan segíthetünk elérni fitness céljaidat</p>
        </div>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon"><i className="fas fa-dumbbell"></i></div>
            <h3>Személyre szabott edzéstervek</h3>
            <p>Edzéstervek, amelyek testtípusodhoz, céljaidhoz és időbeosztásodhoz igazodnak.</p>
          </div>
          <div className="service-card">
            <div className="service-icon"><i className="fas fa-chart-line"></i></div>
            <h3>Teljesítménykövetés</h3>
            <p>Részletes statisztikákkal követheted fejlődésedet és motivált maradhatsz.</p>
          </div>
          <div className="service-card">
            <div className="service-icon"><i className="fas fa-utensils"></i></div>
            <h3>Étrend-tervezés</h3>
            <p>Optimális táplálkozási tanácsok és étrend-tervek, amelyek támogatják edzéseid.</p>
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="about-content">
          <div className="about-text">
            <h2>Rólunk</h2>
            <p>A Power Plan egy innovatív edzőtermi alkalmazás, amely segít elérni fitness céljaidat. Célunk, hogy mindenki számára elérhetővé tegyük a személyre szabott edzésélményt.</p>
            <p>Csapatunk tapasztalt edzőkből és fejlesztőkből áll, akik együtt dolgoznak azon, hogy a legjobb digitális fitness megoldást nyújthassuk.</p>
          </div>
          <div className="about-image">
            <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80" alt="Csapat" />
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="section-title">
          <h2>Kapcsolat</h2>
          <p>Vegye fel velünk a kapcsolatot, szívesen válaszolunk kérdéseire</p>
        </div>
        <div className="contact-container">
          <div className="contact-info">
            <h3>Elérhetőségeink</h3>
            <div className="contact-details">
              <div className="contact-detail"><i className="fas fa-map-marker-alt"></i><p>1234 Budapest, Fitness utca 7.</p></div>
              <div className="contact-detail"><i className="fas fa-phone"></i><p>+36 1 234 5678</p></div>
              <div className="contact-detail"><i className="fas fa-envelope"></i><p>info@powerplan.hu</p></div>
            </div>
          </div>
          <div className="contact-form">
            <form id="contactForm" onSubmit={handleContactSubmit}>
              <div className="form-group"><label htmlFor="name">Név</label><input type="text" id="name" required /></div>
              <div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" required /></div>
              <div className="form-group"><label htmlFor="subject">Tárgy</label><input type="text" id="subject" required /></div>
              <div className="form-group"><label htmlFor="message">Üzenet</label><textarea id="message" required></textarea></div>
              <button type="submit" className="submit-button">ÜZENET KÜLDÉSE</button>
            </form>
          </div>
        </div>
      </section>

      <footer style={{ display: currentPage === 'dashboard' ? 'none' : 'block' }}>
        <div className="footer-content">
          <div className="footer-column">
            <h3>Power Plan</h3>
            <p>Edzőtermi alkalmazás, amely segít elérni fitness céljaidat. Éld át a változást velünk!</p>
          </div>
          <div className="footer-column">
            <h3>Gyors linkek</h3>
            <ul className="footer-links">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>Kezdőlap</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateToHomeSection('services'); }}>Szolgáltatások</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateToHomeSection('about'); }}>Rólunk</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateToHomeSection('contact'); }}>Kapcsolat</a></li>
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

      {showDemoModal && (
        <div className="modal active" id="demoModal">
          <div className="modal-content">
            <h3>DEMÓ VÉGREHAJTÁS</h3>
            <p>A demó verzióval az összes funkciót tesztelheti, de az adatait nem mentjük el.</p>
            <div className="modal-buttons">
              <button className="cta-button" onClick={handleStartDemo}>DEMÓ INDÍTÁSA</button>
              <button className="cta-button secondary" onClick={handleCloseModal}>MÉGSE</button>
            </div>
          </div>
        </div>
      )}

    </>
  );

  const renderRegisztracioPage = () => (
    <Regisztracio
      navigateTo={navigateTo}
      registrationDraft={registrationDraft}
      setRegistrationDraft={setRegistrationDraft}
    />
  );
  const renderBejelentkezesPage = () => <Bejelentkezes navigateTo={navigateTo} setIsLoggedIn={setIsLoggedIn} />;
  const renderDashboardPage = () => (
    <Dashboard
      navigateTo={navigateTo}
      handleLogout={handleLogout}
      requestLogout={handleShowLogoutModal}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    />
  );
  const renderQuestionnairePage = () => <Questionnaire navigateTo={navigateTo} setIsLoggedIn={setIsLoggedIn} />;
  const renderTermsPage = () => <TermsPage navigateTo={navigateTo} />;
  const renderPrivacyPage = () => <PrivacyPage navigateTo={navigateTo} />;

  return (
    <>
      {currentPage !== 'dashboard' && (
        <nav>
          <a href="#" className="logo" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>
            <i className="fas fa-dumbbell" style={{marginRight: '8px'}}></i> Power<span>Plan</span>
          </a>
          <ul className="nav-left">
            {isLoggedIn ? (
              <>
                <li><a href="#" onClick={() => navigateTo('dashboard')}>DASHBOARD</a></li>
              </>
            ) : (
              <>
                <li><a href="#" onClick={() => navigateTo('regisztracio')}>REGISZTRÁCIÓ</a></li>
                <li><a href="#" onClick={() => navigateTo('bejelentkezes')}>BEJELENTKEZÉS</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigateToHomeSection('services'); }}>SZOLGÁLTATÁSAINK</a></li>
              </>
            )}
          </ul>
          <ul className="nav-right">
            {isLoggedIn ? (
              <>
                <li><a href="#" onClick={() => navigateTo('dashboard')}>PROFILOM</a></li>
                <li><a href="#" onClick={handleShowLogoutModal}>KIJELENTKEZÉS</a></li>
              </>
            ) : (
              <>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigateToHomeSection('contact'); }}>KAPCSOLAT</a></li>
              </>
            )}
          </ul>
          <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Világos mód' : 'Sötét mód'}>
            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </nav>
      )}

      {currentPage === 'home' ? renderHomePage() 
        : currentPage === 'regisztracio' ? renderRegisztracioPage() 
        : currentPage === 'bejelentkezes' ? renderBejelentkezesPage()
        : currentPage === 'dashboard' ? renderDashboardPage()
        : currentPage === 'questionnaire' ? renderQuestionnairePage()
        : currentPage === 'terms' ? renderTermsPage()
        : currentPage === 'privacy' ? renderPrivacyPage() : null
      }

      {showLogoutModal && (
        <div className="modal active confirm-modal logout-modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon">
              <i className="fas fa-sign-out-alt"></i>
            </div>
            <h3>Kijelentkezés</h3>
            <p>Biztosan ki szeretnél jelentkezni? A jelenlegi munkameneted azonnal lezárul.</p>
            <div className="modal-buttons confirm-modal-actions">
              <button className="cta-button secondary confirm-cancel-btn" onClick={handleCloseModal}>Mégse</button>
              <button className="cta-button confirm-danger-btn" onClick={handleLogout}>Kijelentkezés</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;