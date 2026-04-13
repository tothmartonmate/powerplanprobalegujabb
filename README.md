# PowerPlan

PowerPlan egy edzéstervező és életmód-követő webalkalmazás React frontenddel, Express backenddel és MySQL adatbázissal.

Ez a leírás úgy készült, hogy teljesen kezdőként is végig lehessen menni rajta, és biztosan el lehessen indítani a projektet.

## Tartalomjegyzék

1. Mi fog elindulni
2. Előfeltételek
3. Gyors indítás Windowsban (dupla kattintással)
4. Indítás terminálból (PowerShell)
5. Első indítás utáni ellenőrzés
6. Leállítás
7. Kézi futtatás Docker nélkül
8. Gyakori hibák és gyors megoldások
9. Hasznos URL-ek

---

## 1. Mi fog elindulni

A projekt indításakor 4 szolgáltatás fut:

- `db`: MySQL 8 adatbázis
- `phpmyadmin`: webes adatbázis-kezelő felület
- `backend`: Express API
- `frontend`: React + Vite fejlesztői szerver

Alap portok:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Backend health: `http://localhost:5001/api/health`
- phpMyAdmin: `http://localhost:8081`
- MySQL host port: `3308`

---

## 2. Előfeltételek

### Kötelező (Dockeres indításhoz)

- Docker Desktop telepítve
- Docker Desktop fut

### Kötelező (tesztfuttatáshoz)

- Node.js telepítve (npm és npx elérhető)
- Google Chrome telepítve

### Gyors ellenőrzés PowerShellből

Nyiss egy PowerShellt a projekt gyökérmappájában, és futtasd:

```powershell
docker --version
docker compose version
node -v
npm -v
npx -v
```

Ha bármelyik parancs hibát ad, előbb azt kell javítani.

---

## 3. Gyors indítás Windowsban (dupla kattintással)

Ez a legegyszerűbb módszer.

A projekt gyökerében 3 batch fájl van:

- `PowerPlan-Start.bat`: teljes rendszer indítása
- `PowerPlan-Tests.bat`: build + backend tesztek + frontend Selenium tesztek
- `PowerPlan-Stop.bat`: teljes rendszer leállítása

### Pontos lépések

1. Indítsd el a Docker Desktopot.
2. Várd meg, amíg teljesen feláll (ne csak megnyíljon, hanem futó állapotban legyen).
3. Nyisd meg a projekt mappáját a Fájlkezelőben.
4. Kattints duplán a `PowerPlan-Start.bat` fájlra.
5. Várd meg, amíg kiírja, hogy minden szolgáltatás elindult.
6. Automatikusan megnyílnak az oldalak böngészőben.

### Amit a start script csinál a háttérben

- ellenőrzi, hogy elérhető-e a Docker
- elindítja a compose szolgáltatásokat
- megvárja, amíg a backend health endpoint válaszol
- megnyitja a Frontend, Health és phpMyAdmin oldalakat

---

## 4. Indítás terminálból (PowerShell)

Ha inkább parancssorból indítanád, a projekt gyökérmappájában futtasd:

### 4.1 Előtérben futtatás (logok folyamatosan látszanak)

```powershell
docker compose up --build
```

### 4.2 Háttérben futtatás (ajánlott)

```powershell
docker compose up --build -d
```

### 4.3 Konténerállapot ellenőrzése

```powershell
docker compose ps
```

Elvárt: minden szolgáltatás `Up` állapotban legyen.

---

## 5. Első indítás utáni ellenőrzés

Ezt a részt mindig érdemes végigcsinálni, hogy biztosan jó legyen a környezet.

### 5.1 Backend health ellenőrzés

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5001/api/health | Select-Object StatusCode,Content
```

Elvárt:

- StatusCode: `200`
- Content: `{"ok":true,"service":"powerplan-backend"}`

### 5.2 Frontend ellenőrzés

Nyisd meg böngészőben:

- `http://localhost:5173`

### 5.3 phpMyAdmin ellenőrzés

Nyisd meg böngészőben:

- `http://localhost:8081`

Belépési adatok:

- Szerver: `db` (vagy `localhost` / `127.0.0.1` a helyzettől függően)
- Felhasználónév: `root`
- Jelszó: `root`

---

## 6. Leállítás

### Dupla kattintással

- futtasd a `PowerPlan-Stop.bat` fájlt

### Terminálból

```powershell
docker compose down
```

Ha teljesen törölni akarod a volume-okat is (adatvesztéssel jár):

```powershell
docker compose down -v
```

Fontos: a `-v` törli az adatbázis tartós adatait.

---

## 7. Kézi futtatás Docker nélkül

Ez haladóbb útvonal. Akkor használd, ha tudatosan külön akarod kezelni a szolgáltatásokat.

## 8.1 Adatbázis

Szükség van egy MySQL szerverre `powerplan` adatbázissal.

Egyszerű opció: csak DB + phpMyAdmin indítása Dockerrel:

```powershell
docker compose up db phpmyadmin -d
```

Host oldali elérés:

- host: `127.0.0.1`
- port: `3308`
- user: `root`
- password: `root`
- database: `powerplan`

## 8.2 Backend kézi indítása

```powershell
cd Backend
npm install
npm run dev
```

vagy

```powershell
cd Backend
npm install
npm start
```

### Fontos `.env` megjegyzés

A Dockeres futtatásnál a DB host jellemzően `powerplan_db`.

Ha host gépről futtatod a backendet, általában ez működik:

```env
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=root
DB_PASSWORD=root
DB_NAME=powerplan
PORT=5000
```

## 8.3 Frontend kézi indítása

```powershell
cd Frontend
npm install
npm run dev
```

Build:

```powershell
cd Frontend
npm run build
```

Preview:

```powershell
cd Frontend
npm run preview
```

---

## 8. Gyakori hibák és gyors megoldások

### Hiba: a start script szerint nem érhető el a Docker

Teendő:

1. Indítsd el a Docker Desktopot.
2. Várj 30-60 másodpercet.
3. Ellenőrizd PowerShellből: `docker info`
4. Futtasd újra a scriptet.

### Hiba: frontend nem jön be, de a backend health jó

Teendő:

1. Ellenőrizd a konténereket: `docker compose ps`
2. Nézd meg a frontend logot: `docker compose logs frontend --tail=100`
3. Próbáld meg újraindítani: `docker compose restart frontend`

### Hiba: `Cannot GET /` a backend címen

Ez normális lehet. A backend API főleg az `/api/...` útvonalakon ad választ.

Ellenőrzésre ezt használd:

- `http://localhost:5001/api/health`

### Hiba: MySQL hostról nem érhető el `powerplan_db` néven

Ez normális. A `powerplan_db` név Docker hálózaton belüli hostnév.

Host gépről használd ezt:

- host: `127.0.0.1`
- port: `3308`

### Hiba: Selenium tesztek megbuknak induláskor

Teendő:

1. Ellenőrizd, hogy fut a Docker Desktop.
2. Ellenőrizd, hogy telepítve van a Chrome.
3. Futtasd külön a frontend buildet: `cd Frontend && npm run build`.
4. Utána indítsd újra a teszteket.

### Hiba: új regisztráció után hiányos dashboard adatok

Ellenőrizd:

- él-e a backend (`/api/health`)
- van-e aktuális user adat localStorage-ben
- létrejött-e kérdőív adat az adott felhasználóhoz

---

## 9. Hasznos URL-ek

- Frontend: `http://localhost:5173`
- Backend root: `http://localhost:5001/`
- Backend health: `http://localhost:5001/api/health`
- phpMyAdmin: `http://localhost:8081`


