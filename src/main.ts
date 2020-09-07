import Calendar from './Calendar';
import { parseIcal } from './parseIcal';



const homeBtn = <HTMLButtonElement> document.getElementById('home-btn');
const dateInput = <HTMLInputElement> document.getElementById('date-input');
const previousWeekBtn = <HTMLButtonElement> document.getElementById('previous-week-btn');
const nextWeekBtn = <HTMLButtonElement> document.getElementById('next-week-btn');
const calendarEl = <HTMLDivElement> document.getElementById('calendar');

const calendar: Calendar = new Calendar(calendarEl);



function getDate(): Date {
    return dateInput.valueAsDate || new Date();
}

function setDate(date: Date): void {
    dateInput.valueAsDate = date; // Convertit les dates invalide en null
    calendar.currDate = getDate();
    calendar.rebuild();
}

function moveDateRelative(weeks: number) {
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



// Récupération de l'id du calendrier
const search = new URLSearchParams(location.search);
const calendarId = search.get('cal');

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



// TODO gzipper et stocker le calendrier localement pendant un moment
// (6h c'est pas trop mal, 20h ça ferai une fois par jour mais ça prendrai du
// temps à se mettre à jour et cheh si je me trompe d'amphi)
// (Aussi on stocke localement tout le temps et quand il a plus d'un certain
// âge on va le rechercher sur internet et on le remplace discrètement)
(
    localStorage.ade ? Promise.resolve(localStorage.ade) // TODO tmp
    : fetch(`https://cors-anywhere.herokuapp.com/https://ade-outils.insa-lyon.fr/ADE-Cal:~${calendarId}`)
    .then(response => response.text())
    .then(ical => localStorage.ade = ical)
)
.then(parseIcal)
.then(events => {
    events.sort((e1, e2) => e1.start.getTime() - e2.start.getTime()); // TODO tmp
    calendar.events = events;
    calendar.currDate = new Date(Date.now() + 14 * 86400e3); // TODO tmp
    calendar.rebuild();
    (<any> window).calendar = calendar;
});
