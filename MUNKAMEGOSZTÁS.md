# PowerPlan – Munkamegosztás

**Készítők:** Pajor Alex és Tóth Márton Máté
**Projekt:** PowerPlan – fitness és edzéstervező webalkalmazás

---

## Szakmai összefoglaló

A projektet úgy osztottuk fel, hogy mindkettőnknek hasonló mennyiségű és nehézségű feladat jusson. Nem az volt, hogy egyikünk csak backenddel, a másik csak frontenddel foglalkozik, hanem mindketten dolgoztunk mindkét oldalon. Emellett kialakítottunk külön fő felelősségi köröket is, hogy átlátható legyen, ki melyik modulért felel.

## Pajor Alex felelősségi körei

### Backend

Pajor Alex főleg a hitelesítési és jogosultságkezelési részeket vitte. Ezekben a modulokban közösen dolgoztunk, de az irányt és a fő megoldásokat Alex határozta meg: együtt építettük fel a regisztráció, bejelentkezés, jelszókezelés és admin jogosultságok logikáját.

Emellett Alex készítette az edzésmodul backend magját is: a személyre szabott edzésajánlások előállítását, illetve az edzések teljes kezelését a létrehozástól a módosításon át a törlésig. A kapcsolódó részfeladatokat közösen teszteltük és finomhangoltuk.

### Frontend

Frontend oldalon Alex az edzésközpontú felületekért felelt. Ide tartozik a heti edzésterv nézet, az edzésállapot kezelése, az időmérő funkció és a heti navigáció, amelyeket az ő koncepciója alapján valósítottunk meg.

Szintén ő valósította meg a gyakorlattárat és a térképes edzőterem-keresőt, beleértve a szűrést és a használható, átlátható navigációt.

### Tesztelés és üzemeltetési támogatás

Alex írta az edzéslogikához és jogosultságkezeléshez tartozó automatizált tesztek jelentős részét, amelyeket közösen futtattunk és ellenőriztünk. Az edzés- és navigációs felületek böngészőalapú tesztelését szintén együtt végeztük.

A fejlesztői futtatási környezet kialakításában is kulcsszerepe volt, különösen a konténeres indítási és leállítási folyamatokban, amelyeket közösen dokumentáltunk és használtunk.

## Tóth Márton Máté felelősségi körei

### Backend

Tóth Márton Máté a táplálkozási modul backend oldalát vitte végig. Ő tervezte és készítette az ajánlási logikát, az étrendi és allergiás szempontok kezelését, illetve a kapcsolódó adatfeldolgozást; ezeket a részeket közösen ellenőriztük és pontosítottuk.

Márton valósította meg a kérdőív, profil, haladási fotók és üzenetkezelés szerveroldali folyamatait is, továbbá az admin funkciók mögötti üzleti logikát.

### Frontend

Frontend oldalon Márton készítette a belépési és regisztrációs felületeket, a több lépéses onboarding kérdőívet, valamint a dashboard általános, felhasználóközpontú részeit, ezekben a részekben az ő struktúráját követtük.

Hozzá tartozott még a profil-, üzenet- és admin felületek kialakítása, a jelvény- és haladáskövetés megjelenítése, valamint a jogi oldalak és visszajelző elemek elkészítése.

### Adatbázis, tesztelés és kiadási előkészítés

Márton felelt az adatbázis struktúra kialakításáért, az adatok rendszerezéséért és a kezdeti mintaadatok előkészítéséért, amelyre a további fejlesztéseinket közösen építettük.

Ő készítette a táplálkozási logikához tartozó automatizált teszteket, illetve a bejelentkezési, dashboard, üzenetkezelési és táplálkozási funkciók böngészőalapú ellenőrzéseit is; ezek eredményeit együtt értékeltük.

A frontend éles futtatásához szükséges konfigurációk és minőségbiztosítási beállítások elkészítése szintén az ő feladata volt.

## Összegzés

Összességében a munkamegosztás szakmailag kiegyensúlyozott volt: mindketten önállóan vittünk fontos backend és frontend modulokat, és mindketten aktívan részt vettünk a tesztelésben, valamint a stabil futtatási környezet kialakításában.