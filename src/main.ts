import * as pako from 'pako';
import Calendar from './Calendar';
import { parseIcal } from './parseIcal';



// TODO bouton pour recharger sans le cache
// TODO bouton pour changer de thème



const MAX_CACHE_AGE = 6 * 3600e3;

const homeBtn = <HTMLButtonElement> document.getElementById('home-btn');
const dateInput = <HTMLInputElement> document.getElementById('date-input');
const previousWeekBtn = <HTMLButtonElement> document.getElementById('previous-week-btn');
const nextWeekBtn = <HTMLButtonElement> document.getElementById('next-week-btn');
const calendarEl = <HTMLDivElement> document.getElementById('calendar');

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
    fetch(`https://cors-anywhere.herokuapp.com/https://ade-outils.insa-lyon.fr/ADE-Cal:~${calendarId}`)
    .then(response => response.text())
    .then(ical => {
        localStorage[cacheKey] = pako.deflate(ical, { to: 'string' });
        localStorage[cacheTimeKey] = Date.now();
        loadIcal(ical);
    });
}
