const { spawn, execSync } = require('child_process');

console.log('\x1b[33m%s\x1b[0m', '⏳ A POWERPLAN rendszer indítása Dockerrel folyamatban... (Kérlek várj pár másodpercet)');

// 1. A Docker indítása a háttérben (docker-compose up -d --build)
const docker = spawn('docker', ['compose', 'up', '-d', '--build'], { stdio: 'inherit', shell: true });

docker.on('close', (code) => {
    if (code === 0) {
        // Ha sikeresen elindult a Docker, letöröljük a képernyőt és kiírjuk a kattintható linkeket
        console.clear();
        console.log('\x1b[32m%s\x1b[0m', '✅ A RENDSZER SIKERESEN ELINDULT DOCKERBEN!');
        console.log('--------------------------------------------------');
        console.log('🌍 \x1b[36mWEBOLDAL (Frontend):\x1b[0m   http://localhost:5173');
        console.log('⚙️  \x1b[36mBACKEND API:\x1b[0m           http://localhost:5000');
        console.log('🗄️  \x1b[36mADATBÁZIS (phpMyAdmin):\x1b[0m http://localhost:8081');
        console.log('--------------------------------------------------');
        console.log('\x1b[33m%s\x1b[0m', '🛑 A RENDSZER LEÁLLÍTÁSÁHOZ NYOMJ: CTRL + C');
        
        // Folyamatosan életben tartjuk a scriptet, hogy lásd a menüt
        setInterval(() => {}, 1000);
    } else {
        console.error('\n❌ Hiba történt a Docker indításakor! Ellenőrizd, hogy fut-e a Docker Desktop a gépeden.');
        process.exit(1);
    }
});

// 2. Ha a terminálban megnyomod a CTRL + C-t, akkor szépen leállítjuk a Docker konténereket is
process.on('SIGINT', () => {
    console.log('\n\x1b[31m%s\x1b[0m', '🛑 Leállítás folyamatban... (A Docker konténerek leállnak, kérlek várj)');
    try {
        // Kiadjuk a docker compose down parancsot
        execSync('docker compose down', { stdio: 'inherit' });
        console.log('\x1b[32m%s\x1b[0m', '✅ Minden Docker konténer sikeresen leállt. Viszlát!');
        process.exit(0);
    } catch (e) {
        console.log('Hiba a leállításkor, de a program kilép.');
        process.exit(1);
    }
});