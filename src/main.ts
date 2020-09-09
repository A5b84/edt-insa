import * as pako from 'pako';
import Calendar from './Calendar';
import { parseIcal } from './parseIcal';
import { addSwipeListener } from './Utils';



const MAX_CACHE_AGE = 6 * 3600e3;

const themeStylesheet = <HTMLLinkElement> document.getElementById('theme-stylesheet');

const homeBtn = <HTMLButtonElement> document.getElementById('home-btn');
const dateInput = <HTMLInputElement> document.getElementById('date-input');
const prevBtn = <HTMLButtonElement> document.getElementById('prev-btn');
const nextBtn = <HTMLButtonElement> document.getElementById('next-btn');
const calendarEl = <HTMLDivElement> document.getElementById('calendar');
const fetchDateEl = <HTMLDivElement> document.getElementById('fetch-date');
const themeBtn = <HTMLButtonElement> document.getElementById('theme-btn');
const forceRefreshBtn = <HTMLButtonElement> document.getElementById('force-refresh-btn');

const calendar: Calendar = new Calendar(calendarEl);
(<any> window).calendar = calendar; // Variable globale accessible depuis la console

const search = new URLSearchParams(location.search);
const calendarId = search.get('cal');
const cacheKey = `adeCache_${calendarId}`;
const cacheTimeKey = `adeCacheTime_${calendarId}`;



function loadIcal(ical: string): void {
    calendar.events = parseIcal(ical);
    calendar.buildWeek();

    // Date de récupération
    const cacheTime: number = +localStorage[cacheTimeKey];
    if (isFinite(cacheTime)) { // Mieux que isNaN (pas d'infini)
        const d = new Date(cacheTime);
        const date = d.toLocaleDateString('fr', { month: 'short', day: 'numeric' });
        const time = d.toLocaleTimeString('fr', { hour: 'numeric', minute: 'numeric' });
        fetchDateEl.innerText = `Récupéré le ${date} à\u00a0${time}`;
    }
}

function fetchIcal(): void {
    forceRefreshBtn.disabled = true;
    document.body.classList.add('fetching');

    fetch(`https://cors-anywhere.herokuapp.com/https://ade-outils.insa-lyon.fr/ADE-Cal:~${calendarId}`)
    .then(response => response.text())
    .then(ical => {
        localStorage[cacheKey] = pako.deflate(ical, { to: 'string' });
        localStorage[cacheTimeKey] = Date.now();
        loadIcal(ical);
    })
    .finally(() => {
        forceRefreshBtn.disabled = false;
        document.body.classList.remove('fetching');
    });
}



/** Met la date du calendrier dans `dateInput` */
function updateInputDate(): void {
    // On peut pas juste faire 'dateInput.valueAsDate = calendar.getDate()'
    // parce que ça utilise pas le fuseau horaire donc ça peut être décalé
    const d = calendar.getDate();
    var month = d.getMonth() + 1 + '';
    var day = d.getDate() + '';
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    dateInput.value = `${d.getFullYear()}-${month}-${day}`;
}

function setDate(date: Date): void {
    dateInput.valueAsDate = date; // Convertit les dates invalide en null
    if (dateInput.valueAsDate) {
        calendar.setDate(dateInput.valueAsDate);
    } else {
        calendar.setDate(new Date());
        updateInputDate();
    }
}



function timeButtonHandler(offset: -1 | 1): void {
    if (calendar.isWeekLayout()) calendar.moveToWeekRelative(offset);
    else if (offset > 0) calendar.moveToNextVisibleDay();
    else calendar.moveToPreviousVisibleDay();

    updateInputDate();
}



addEventListener('resize', () => calendar.notifyResized());

addEventListener('keydown', e => {
    // Raccourics
    if (e.target instanceof HTMLInputElement
            || e.ctrlKey || e.altKey || e.shiftKey) {
        return;
    }
    if (e.key === 'ArrowLeft') prevBtn.click();
    else if (e.key === 'ArrowRight') nextBtn.click();
});

addSwipeListener(
    calendarEl, null, null, () => nextBtn.click(), () => prevBtn.click()
);

homeBtn.addEventListener('click', () => setDate(new Date()));

updateInputDate();
dateInput.addEventListener('change', () => {
    if (dateInput.valueAsDate) setDate(dateInput.valueAsDate);
});

prevBtn.addEventListener('click', () => timeButtonHandler(-1));
nextBtn.addEventListener('click', () => timeButtonHandler(1));

themeBtn.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    if (dark) {
        localStorage.theme = 'dark';
        themeStylesheet.href = themeStylesheet.href.replace('light', 'dark');
    } else {
        delete localStorage.theme;
        themeStylesheet.href = themeStylesheet.href.replace('dark', 'light');
    }
});

if (localStorage.theme) themeBtn.click();

forceRefreshBtn.addEventListener('click', () => {
    delete localStorage[cacheKey];
    delete localStorage[cacheTimeKey];
    fetchIcal();
});



// Id du calendrier
if (!calendarId) {
    // Pas de calendrier -> en demande un et modifie l'url
    let cal = prompt('Entrez le lien d\'un emploi du temps (disponible sur https://ade-outils.insa-lyon.fr/ADE-iCal)');

    if (!cal) throw new Error('Pas d\'url de calendrier');

    // Recoupage + nom
    cal = 'cal=' + encodeURIComponent(cal.slice(cal.lastIndexOf('~') + 1));
    if (location.search && location.search.slice(-1) !== '&') {
        // Search sans '&' à la fin -> on l'ajoute
        cal = '&' + cal;
    }
    location.search += cal;
}

// calendarId valide dans toute la suite du code (normalement)



// Chargement du calendrier dans le cache
if (localStorage[cacheKey]) {
    try {
        loadIcal(pako.inflate(localStorage[cacheKey], { to: 'string' }));
    } catch (e) {
        // Au cas où
        console.error(e);
        delete localStorage[cacheKey];
    }
}

// Chargement du calendrier sur Internet si nécessaire
if (!localStorage[cacheKey]
        || !localStorage[cacheTimeKey]
        || Date.now() - +localStorage[cacheTimeKey] >= MAX_CACHE_AGE) {
    fetchIcal();
}
