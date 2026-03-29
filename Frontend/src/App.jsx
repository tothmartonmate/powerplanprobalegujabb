import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Regisztracio from './pages/regisztracio';
import Bejelentkezes from './pages/bejelentkezes';
import Dashboard from './pages/dashboard';
import Questionnaire from './pages/questionnarie';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
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

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleShowDemoModal = () => {
    setShowDemoModal(true);
  };

  const handleCloseModal = () => {
    setShowDemoModal(false);
    setShowPlanModal(false);
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

  const handleSelectPlan = (planType) => {
    const plans = {
      'basic': {
        title: 'Alap Csomag',
        description: '4.990 Ft/hó - Alap szolgáltatások: edzésnapló, statisztikák, 3 előre megírt edzésprogram.'
      },
      'premium': {
        title: 'Prémium Csomag',
        description: '8.990 Ft/hó - Minden az Alap csomagból + személyre szabott edzéstervek, teljesítményelemzés, korlátlan programok.'
      },
      'pro': {
        title: 'Pro Csomag',
        description: '12.990 Ft/hó - Minden a Prémium csomagból + részletes étrend-tervezés, heti edzői konzultáció, prioritás ügyfélszolgálat.'
      }
    };
    
    const plan = plans[planType];
    setSelectedPlan(plan);
    localStorage.setItem('powerplan_selected_plan', planType);
    setShowPlanModal(true);
  };

  const handleProceedToRegistration = () => {
    handleCloseModal();
    navigateTo('regisztracio');
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
    localStorage.removeItem('powerplan_user_completed_questionnaire');
    localStorage.removeItem('powerplan_demo_mode');
    localStorage.removeItem('powerplan_questionnaire');
    localStorage.removeItem('powerplan_token');
    localStorage.removeItem('powerplan_current_user');
    localStorage.removeItem('powerplan_user_logged_in');
    localStorage.removeItem('powerplan_remember_me');
    setIsLoggedIn(false);
    navigateTo('home');
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

      <section className="pricing" id="pricing">
        <div className="section-title">
          <h2>Áraink</h2>
          <p>Válaszd ki a számodra legmegfelelőbb csomagot</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-icon"><i className="fas fa-user"></i></div>
            <h3>Alap</h3>
            <div className="price">4.990 Ft<span>/hó</span></div>
            <ul className="pricing-features">
              <li><i className="fas fa-check"></i> Korlátlan edzésnapló</li>
              <li><i className="fas fa-check"></i> Alap statisztikák</li>
              <li><i className="fas fa-times"></i> Személyre szabott tervek</li>
            </ul>
            <button className="cta-button" onClick={() => handleSelectPlan('basic')}>KIVÁLASZTÁS</button>
          </div>
          <div className="pricing-card featured">
            <div className="pricing-icon"><i className="fas fa-user-friends"></i></div>
            <h3>Prémium</h3>
            <div className="price">8.990 Ft<span>/hó</span></div>
            <ul className="pricing-features">
              <li><i className="fas fa-check"></i> Minden az Alap csomagból</li>
              <li><i className="fas fa-check"></i> Személyre szabott edzéstervek</li>
              <li><i className="fas fa-check"></i> Alap étrend-tervezés</li>
            </ul>
            <button className="cta-button" onClick={() => handleSelectPlan('premium')}>KIVÁLASZTÁS</button>
          </div>
          <div className="pricing-card">
            <div className="pricing-icon"><i className="fas fa-crown"></i></div>
            <h3>Pro</h3>
            <div className="price">12.990 Ft<span>/hó</span></div>
            <ul className="pricing-features">
              <li><i className="fas fa-check"></i> Minden a Prémium csomagból</li>
              <li><i className="fas fa-check"></i> Részletes étrend-tervezés</li>
              <li><i className="fas fa-check"></i> Heti egyéni edzői konzultáció</li>
            </ul>
            <button className="cta-button" onClick={() => handleSelectPlan('pro')}>KIVÁLASZTÁS</button>
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
            <p>Edzőtermi alkalmazás, amely segít elérni fitness céljaidat.</p>
          </div>
        </div>
        <div className="copyright">
          <p>&copy; 2024 Power Plan Edzőtermi Alkalmazás. Minden jog fenntartva.</p>
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

      {showPlanModal && selectedPlan && (
        <div className="modal active" id="planModal">
          <div className="modal-content">
            <h3 id="planTitle">{selectedPlan.title}</h3>
            <p id="planDescription">{selectedPlan.description}</p>
            <div className="modal-buttons">
              <button className="cta-button" onClick={handleProceedToRegistration}>Tovább a regisztrációhoz</button>
              <button className="cta-button secondary" onClick={handleCloseModal}>Mégse</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderRegisztracioPage = () => <Regisztracio navigateTo={navigateTo} />;
  const renderBejelentkezesPage = () => <Bejelentkezes navigateTo={navigateTo} setIsLoggedIn={setIsLoggedIn} />;
  const renderDashboardPage = () => <Dashboard navigateTo={navigateTo} handleLogout={handleLogout} />;
  const renderQuestionnairePage = () => <Questionnaire navigateTo={navigateTo} setIsLoggedIn={setIsLoggedIn} />;

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
                <li><a href="#" onClick={() => navigateTo('home')}>SZOLGÁLTATÁSAINK</a></li>
              </>
            )}
          </ul>
          <ul className="nav-right">
            {isLoggedIn ? (
              <>
                <li><a href="#" onClick={() => navigateTo('dashboard')}>PROFILOM</a></li>
                <li><a href="#" onClick={handleLogout}>KIJELENTKEZÉS</a></li>
              </>
            ) : (
              <>
                <li><a href="#" onClick={() => navigateTo('home')}>ÁRAK</a></li>
                <li><a href="#" onClick={() => navigateTo('home')}>KAPCSOLAT</a></li>
              </>
            )}
          </ul>
        </nav>
      )}

      {currentPage === 'home' ? renderHomePage() 
        : currentPage === 'regisztracio' ? renderRegisztracioPage() 
        : currentPage === 'bejelentkezes' ? renderBejelentkezesPage()
        : currentPage === 'dashboard' ? renderDashboardPage()
        : currentPage === 'questionnaire' ? renderQuestionnairePage() : null
      }
    </>
  );
}

export default App;