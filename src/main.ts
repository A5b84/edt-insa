import * as pako from 'pako';
import Calendar from './Calendar';
import { parseIcal } from './parseIcal';



const MAX_CACHE_AGE = 6 * 3600e3;

const themeStylesheet = <HTMLLinkElement> document.getElementById('theme-stylesheet');

const homeBtn = <HTMLButtonElement> document.getElementById('home-btn');
const dateInput = <HTMLInputElement> document.getElementById('date-input');
const previousWeekBtn = <HTMLButtonElement> document.getElementById('previous-week-btn');
const nextWeekBtn = <HTMLButtonElement> document.getElementById('next-week-btn');
const calendarEl = <HTMLDivElement> document.getElementById('calendar');
const fetchDateEl = <HTMLDivElement> document.getElementById('fetch-date');
const themeBtn = <HTMLButtonElement> document.getElementById('theme-btn');
const forceRefreshBtn = <HTMLButtonElement> document.getElementById('force-refresh-btn');

const calendar: Calendar = new Calendar(calendarEl);
(<any> window).calendar = calendar; // Variable globale accessible depuis la console
calendar.currDate = new Date(Date.now() + 14 * 86400e3); // TODO tmp

const search = new URLSearchParams(location.search);
const calendarId = search.get('cal');
const cacheKey = `adeCache_${calendarId}`;
const cacheTimeKey = `adeCacheTime_${calendarId}`;



function loadIcal(ical: string): void {
    calendar.events = parseIcal(ical);
    calendar.rebuild();

    // Date de récupération
    const cacheTime: number = +localStorage[cacheTimeKey];
    if (isFinite(cacheTime)) {
        const d = new Date(cacheTime);
        fetchDateEl.innerText = `Récupéré le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR')}`;
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



function getDate(): Date {
    return dateInput.valueAsDate || new Date();
}

function setDate(date: Date): void {
    dateInput.valueAsDate = date; // Convertit les dates invalide en null
    calendar.currDate = getDate();
    calendar.rebuild();
}

function moveDateRelative(weeks: number): void {
    setDate(
        new Date(getDate().getTime() + weeks * 7 * 86400e3)
    );
}



addEventListener('resize', () => {
    if (calendar) calendar.updateEventsOverflow();
});

addEventListener('keydown', e => {
    // Raccourics
    if (e.target instanceof HTMLInputElement
            || e.ctrlKey || e.altKey || e.shiftKey) {
        return;
    }
    if (e.key === 'ArrowLeft') previousWeekBtn.click();
    else if (e.key === 'ArrowRight') nextWeekBtn.click();
});

homeBtn.addEventListener('click', () => setDate(new Date()));

dateInput.valueAsDate = calendar.currDate;
dateInput.addEventListener('change', () => setDate(getDate()));

previousWeekBtn.addEventListener('click', () => moveDateRelative(-1));
nextWeekBtn.addEventListener('click', () => moveDateRelative(1));

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
    let cal = prompt('Entrez le lien d\'un calendrier');

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
