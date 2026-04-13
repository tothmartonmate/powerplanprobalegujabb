# PowerPlan – Vizsgaremek

Szoftverfejlesztő és -tesztelő záróvizsga projekt
Résztvevők: Tóth Márton Máté és Pajor Alex

PowerPlan egy összetett, modern Full-Stack webalkalmazás, amely a személyre szabott edzéstervezést, táplálkozási tanácsadást és napi aktivitáskövetést egyetlen letisztult felületre hozza. A célunk az volt, hogy a felhasználók egyszerre kapjanak átlátható rutintervezést, egészséges étrendi támogatást és motivációt a fejlődéshez.

📑 Tartalomjegyzék

1. [A projekt célkitűzése](#1-a-projekt-célkitűzése)
2. [Fő funkciók és modulok](#2-fő-funkciók-és-modulok)
3. [Technológiai stack](#3-technológiai-stack)
4. [Csapatmunka és feladatkörök](#4-csapatmunka-és-feladatkörök)
5. [Adatbázis architektúra](#5-adatbázis-architektúra)
6. [Szoftvertesztelés (QA)](#6-szoftvertesztelés-qa)
7. [Fejlesztési eszközök](#7-fejlesztési-eszközök)
8. [Környezet és futtatás](#8-környezet-és-futtatás)

---

## 1. A projekt célkitűzése

A PowerPlan célja egy olyan digitális edzés- és életmódplatform létrehozása volt, amely a felhasználók valós igényeihez igazodik. A meglévő fitneszalkalmazásokkal ellentétben mi arra törekedtünk, hogy ne csak adatokat jelenítsünk meg, hanem egyszerre segítsük a tervezést, a motivációt és a személyes követést.

A projekt célja:

- egy modern SPA alapú felület kialakítása,
- az edzéstervezés és a táplálkozás összehangolása,
- valós idejű, személyre szabott ajánlások biztosítása,
- a hazai edzőtermek és intézmények könnyű elérése térképpel és információs blokkokkal.

---

## 2. Fő funkciók és modulok

A PowerPlan fő fókusza a felhasználói élményre és a moduláris felépítésre épül.

- Személyre szabott edzéstervezés: a kérdőív eredménye alapján egyéni erőnléti és kondíciós ajánlások jelennek meg.
- Táplálkozási támogatás: napi makrotápanyag- és kalóriaajánlások, valamint személyre szabott étrendi javaslatok.
- Dashboard és előrehaladáskövetés: heti edzések, testsúly-, BMI- és trendadatok megjelenítése.
- Edzésmód és gyakorlatlista: előre definiált edzéstervek, gyakorlatszűrés, ismétlésszámok és pihenőidők.
- Fitnesz térkép: Magyarországi edzőtermek és szolgáltatások vizuális megjelenítése a térképen.
- Üzenetküldés és értesítések: belső üzenetfelület a felhasználók és adminisztrátorok közötti kommunikációhoz.
- Adminisztráció: jogosultságkezelés, tartalomkezelés és moderációs felület.
- AI ajánlás: a felhasználói válaszok alapján célzott javaslatokat kínál a kezdőoldalon.

---

## 3. Technológiai stack

A rendszer felépítése több rétegben és a korszerű fejlesztési eszközökkel történt.

Frontend:

- React.js és Vite
- CSS Grid / Flexbox és egyedi stílusok
- kliensoldali útválasztás és állapotkezelés

Backend:

- Node.js és Express.js
- JWT és Bcrypt az autentikációhoz
- REST API réteg és middleware-ek

Adatbázis és infrastruktúra:

- MySQL relációs adatbázis
- Docker és Docker Compose
- phpMyAdmin adminisztrációs felület

---

## 4. Csapatmunka és feladatkörök

A fejlesztés során együtt dolgoztunk, de mindketten vállaltunk külön felelősségi területeket, hogy minden modul átgondolt és stabil legyen.

### Tóth Márton Máté

- Backend architektúra és API tervezés
- felhasználói autentikáció JWT/Bcrypt megoldással
- táplálkozási ajánlórendszer és a kérdőív logikája
- admin és jogosultságkezelés felépítése
- adatbázis-tervezés és relációs modellezés

### Pajor Alex

- Frontend felület és dashboard fejlesztés
- edzéstervek és gyakorlatok kezelése
- progresszió követése és vizuális visszajelzés
- üzenetküldés és admin dashboard komponensek
- tesztelés és Docker-alapú indítási folyamatok

---

## 5. Adatbázis architektúra

A rendszer adatmodellje normalizált és moduláris, hogy a felhasználói adatok, edzésprogramok és táplálkozási javaslatok jól szervezettek maradjanak.

A kulcsfontosságú logikai blokkok:

- Felhasználók és jogosultságok: regisztráció, jelszóhash, szerepkörök.
- Kérdőív és személyes beállítások: felhasználói profil, célok és preferenciák.
- Edzésprogramok és gyakorlatok: napi/heti bontás, ismétlésszámok, nehézségi szintek.
- Táplálkozás és makrótápanyagok: egyéni ajánlások és napi értékek.
- Interakciók és üzenetek: belső kommunikáció, moderáció és visszajelzés.
- Térkép és helyszínek: edzőtermek és kapcsolódó szolgáltatások lokalizált adatai.

A modell 3NF szerint készült, több kapcsolótáblát és logikai szeparációt használva a skálázhatóság érdekében.

---

## 6. Szoftvertesztelés (QA)

A stabil működés és a hibamentes felhasználói élmény érdekében több szintű minőségbiztosítást alkalmaztunk.

- Manuális ellenőrzés: API-végpontok és jogosultsági rétegek tesztelése Postman vagy hasonló eszköz segítségével.
- Backend egységtesztek: kritikus logikai komponensek automatikus ellenőrzése Jest keretrendszerrel.
- Frontend end-to-end tesztek: automatizált Selenium WebDriver tesztek a browser alapú funkciók felfuttatásához.

Ez azt biztosítja, hogy az alkalmazás mind a funkcionális, mind a felhasználói élmény szempontjából megfeleljen a vizsgakövetelményeknek.

---

## 7. Fejlesztési eszközök

A projekt fejlesztése alatt használtuk a következő eszközöket:

- Visual Studio Code
- Git és GitHub
- Docker Desktop
- phpMyAdmin
- Node.js és npm
- Postman vagy hasonló API tesztelő alkalmazás

---

## 8. Környezet és futtatás

A PowerPlan futtatása Docker Compose segítségével történik a legegyszerűbben. A projekt több konténerből áll, hogy a frontend, backend és adatbázis külön-külön kezelhető legyen.

### Gyors indítás Windowsban

1. Indítsd el a Docker Desktopot.
2. Nyisd meg a projekt gyökérkönyvtárát.
3. Kattints duplán a `PowerPlan-Start.bat` fájlra.
4. Várd meg, hogy a rendszer felálljon.

### Terminálból indítás

A projekt gyökerében futtasd:

```powershell
docker compose up --build -d
```

### Ellenőrzés

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5001/api/health`
- phpMyAdmin: `http://localhost:8081`

### Leállítás

```powershell
docker compose down
```

### Kézi futtatás

Ha Docker nélkül szeretnéd futtatni:

- Backend: `cd Backend && npm install && npm run dev`
- Frontend: `cd Frontend && npm install && npm run dev`

Ez a README a projekt céljait, fő funkcióit, technológiai felépítését és a futtatási környezetet foglalja össze.
