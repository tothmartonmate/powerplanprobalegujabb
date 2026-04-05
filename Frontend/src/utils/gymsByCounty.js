export const COUNTY_OPTIONS = [
  { key: 'Budapest', label: 'Budapest' },
  { key: 'Bacs-Kiskun', label: 'Bács-Kiskun' },
  { key: 'Baranya', label: 'Baranya' },
  { key: 'Bekes', label: 'Békés' },
  { key: 'Borsod-Abauj-Zemplen', label: 'Borsod-Abaúj-Zemplén' },
  { key: 'Csongrad-Csanad', label: 'Csongrád-Csanád' },
  { key: 'Fejer', label: 'Fejér' },
  { key: 'Gyor-Moson-Sopron', label: 'Győr-Moson-Sopron' },
  { key: 'Hajdu-Bihar', label: 'Hajdú-Bihar' },
  { key: 'Heves', label: 'Heves' },
  { key: 'Jasz-Nagykun-Szolnok', label: 'Jász-Nagykun-Szolnok' },
  { key: 'Komarom-Esztergom', label: 'Komárom-Esztergom' },
  { key: 'Nograd', label: 'Nógrád' },
  { key: 'Pest', label: 'Pest' },
  { key: 'Somogy', label: 'Somogy' },
  { key: 'Szabolcs-Szatmar-Bereg', label: 'Szabolcs-Szatmár-Bereg' },
  { key: 'Tolna', label: 'Tolna' },
  { key: 'Vas', label: 'Vas' },
  { key: 'Veszprem', label: 'Veszprém' },
  { key: 'Zala', label: 'Zala' }
];

export const CITY_COORDINATES = {
  Budapest: [47.4979, 19.0402],
  Kecskemet: [46.9062, 19.6913],
  Baja: [46.1745, 18.9543],
  Kiskunhalas: [46.434, 19.4848],
  Pecs: [46.0727, 18.2323],
  Komlo: [46.1928, 18.2649],
  Bekescsaba: [46.6736, 21.0877],
  Gyula: [46.6473, 21.2784],
  Bekes: [46.7681, 21.1319],
  Oroshaza: [46.5668, 20.6696],
  Miskolc: [48.1031, 20.7784],
  Kazincbarcika: [48.2531, 20.6454],
  Ozd: [48.2241, 20.2869],
  Szeged: [46.253, 20.1414],
  Szekesfehervar: [47.186, 18.4221],
  Dunaujvaros: [46.9619, 18.9355],
  Gyor: [47.6875, 17.6504],
  Sopron: [47.6817, 16.5845],
  Debrecen: [47.5316, 21.6273],
  Eger: [47.9025, 20.3772],
  Gyongyos: [47.7826, 19.928],
  Hatvan: [47.6667, 19.6833],
  Szolnok: [47.1754, 20.1947],
  Jaszbereny: [47.5003, 19.9111],
  Tatabanya: [47.5692, 18.4044],
  Esztergom: [47.7928, 18.7431],
  Komarom: [47.7432, 18.1191],
  Salgotarjan: [48.0935, 19.7995],
  Balassagyarmat: [48.078, 19.2967],
  Batoryterenye: [47.9686, 19.8408],
  Dunakeszi: [47.6364, 19.1386],
  Erd: [47.3918, 18.9045],
  Budaors: [47.4618, 18.9585],
  Szentendre: [47.6694, 19.0756],
  Godollo: [47.5966, 19.3552],
  Vecses: [47.4059, 19.2589],
  Dunaharaszti: [47.3533, 19.0982],
  Vac: [47.7826, 19.1332],
  Kaposvar: [46.3594, 17.7968],
  Siofok: [46.9091, 18.0519],
  Marcali: [46.585, 17.4119],
  Nyiregyhaza: [47.9558, 21.7167],
  Kisvarda: [48.2169, 22.0833],
  Szekszard: [46.3474, 18.7062],
  Paks: [46.6265, 18.8542],
  Dombovar: [46.3766, 18.136],
  Szombathely: [47.2307, 16.6218],
  Kormend: [47.0109, 16.6055],
  Sarvar: [47.253, 16.9358],
  Veszprem: [47.0931, 17.9115],
  Balatonfured: [46.9619, 17.8712],
  Tapolca: [46.8826, 17.4412],
  Zalaegerszeg: [46.8417, 16.8416],
  Heviz: [46.7903, 17.1841],
  Nagykanizsa: [46.4535, 16.991],
  Keszthely: [46.7681, 17.2511]
};

const getCityLabel = (cityKey) => cityKey
    .replace('Kecskemet', 'Kecskemét')
    .replace('Pecs', 'Pécs')
    .replace('Bekescsaba', 'Békéscsaba')
    .replace('Szekesfehervar', 'Székesfehérvár')
    .replace('Gyor', 'Győr')
    .replace('Gyongyos', 'Gyöngyös')
    .replace('Jaszbereny', 'Jászberény')
    .replace('Komarom', 'Komárom')
    .replace('Batoryterenye', 'Bátonyterenye')
    .replace('Erd', 'Érd')
    .replace('Godollo', 'Gödöllő')
    .replace('Kaposvar', 'Kaposvár')
    .replace('Nyiregyhaza', 'Nyíregyháza')
    .replace('Szekszard', 'Szekszárd')
    .replace('Sarvar', 'Sárvár')
    .replace('Veszprem', 'Veszprém')
    .replace('Balatonfured', 'Balatonfüred')
    .replace('Heviz', 'Hévíz')
    .replace('Ozd', 'Ózd')
    .replace('Kormend', 'Körmend');

const createGym = (name, countyKey, cityKey, rank, mapQuery) => {
  const [lat, lng] = CITY_COORDINATES[cityKey];
  const countyLabel = COUNTY_OPTIONS.find((county) => county.key === countyKey)?.label || countyKey;
  const cityLabel = getCityLabel(cityKey);

  return {
    name,
    countyKey,
    countyLabel,
    cityKey,
    cityLabel,
    address: `${cityLabel}, ${countyLabel}`,
    lat,
    lng,
    rank,
    mapQuery: mapQuery || `${name} ${cityLabel}`
  };
};

const createCityGymSearch = (countyKey, cityKey, rank) => {
  const cityLabel = getCityLabel(cityKey);
  return createGym(`${cityLabel} edzőtermek`, countyKey, cityKey, rank, `edzőterem ${cityLabel}`);
};

const VERIFIED_GYM_SEARCH_CITIES = [
  ['Budapest', 'Budapest'],
  ['Bacs-Kiskun', 'Kecskemet'],
  ['Bacs-Kiskun', 'Baja'],
  ['Bacs-Kiskun', 'Kiskunhalas'],
  ['Baranya', 'Pecs'],
  ['Baranya', 'Komlo'],
  ['Bekes', 'Bekescsaba'],
  ['Bekes', 'Gyula'],
  ['Bekes', 'Bekes'],
  ['Bekes', 'Oroshaza'],
  ['Borsod-Abauj-Zemplen', 'Miskolc'],
  ['Borsod-Abauj-Zemplen', 'Kazincbarcika'],
  ['Borsod-Abauj-Zemplen', 'Ozd'],
  ['Csongrad-Csanad', 'Szeged'],
  ['Fejer', 'Szekesfehervar'],
  ['Fejer', 'Dunaujvaros'],
  ['Gyor-Moson-Sopron', 'Gyor'],
  ['Gyor-Moson-Sopron', 'Sopron'],
  ['Hajdu-Bihar', 'Debrecen'],
  ['Heves', 'Eger'],
  ['Heves', 'Gyongyos'],
  ['Heves', 'Hatvan'],
  ['Jasz-Nagykun-Szolnok', 'Szolnok'],
  ['Jasz-Nagykun-Szolnok', 'Jaszbereny'],
  ['Komarom-Esztergom', 'Tatabanya'],
  ['Komarom-Esztergom', 'Esztergom'],
  ['Komarom-Esztergom', 'Komarom'],
  ['Nograd', 'Salgotarjan'],
  ['Nograd', 'Balassagyarmat'],
  ['Nograd', 'Batoryterenye'],
  ['Pest', 'Dunakeszi'],
  ['Pest', 'Erd'],
  ['Pest', 'Budaors'],
  ['Pest', 'Szentendre'],
  ['Pest', 'Godollo'],
  ['Pest', 'Vecses'],
  ['Pest', 'Dunaharaszti'],
  ['Pest', 'Vac'],
  ['Somogy', 'Kaposvar'],
  ['Somogy', 'Siofok'],
  ['Somogy', 'Marcali'],
  ['Szabolcs-Szatmar-Bereg', 'Nyiregyhaza'],
  ['Szabolcs-Szatmar-Bereg', 'Kisvarda'],
  ['Tolna', 'Szekszard'],
  ['Tolna', 'Paks'],
  ['Tolna', 'Dombovar'],
  ['Vas', 'Szombathely'],
  ['Vas', 'Kormend'],
  ['Vas', 'Sarvar'],
  ['Veszprem', 'Veszprem'],
  ['Veszprem', 'Balatonfured'],
  ['Veszprem', 'Tapolca'],
  ['Zala', 'Zalaegerszeg'],
  ['Zala', 'Heviz'],
  ['Zala', 'Nagykanizsa'],
  ['Zala', 'Keszthely']
];

export const ALL_GYMS = VERIFIED_GYM_SEARCH_CITIES.map(([countyKey, cityKey], index) => (
  createCityGymSearch(countyKey, cityKey, index + 1)
));