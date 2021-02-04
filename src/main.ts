import Pako from 'pako';
import Calendar from './Calendar';
import { parseIcal } from './parseIcal';
import { addSwipeListener } from './Utils';



const MAX_CACHE_AGE = 6 * 3600e3;

const themeStylesheet = getElementById<'link'>('theme-stylesheet');

const homeBtn = getElementById<'button'>('home-btn');
const dateInput = getElementById<'input'>('date-input');
const prevBtn = getElementById<'button'>('prev-btn');
const nextBtn = getElementById<'button'>('next-btn');
const calendarEl = getElementById<'div'>('calendar');
const fetchDateEl = getElementById<'div'>('fetch-date');
const simpleModeBtn = getElementById<'button'>('simple-mode-btn');
const themeBtn = getElementById<'button'>('theme-btn');
const forceRefreshBtn = getElementById<'button'>('force-refresh-btn');

const calendar: Calendar = new Calendar(calendarEl);

const search = new URLSearchParams(location.search);
const calendarId = search.get('cal');
const cacheKey = `adeCache_${calendarId}`;
const cacheTimeKey = `adeCacheTime_${calendarId}`;

const help = <const> { Pako, calendar, cacheKey, cacheTimeKey, loadIcal, fetchIcal };
Object.assign(window, { help, ...help }); // Variables dans la console pour jouer avec



addEventListener('resize', () => calendar.notifyLayoutChanged());

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

simpleModeBtn.addEventListener('click', () => {
    const simple = document.documentElement.classList.toggle('simple');
    if (simple) localStorage.simple = '1';
    else delete localStorage.simple;
    calendar.notifyLayoutChanged();
});
if (localStorage.simple) simpleModeBtn.click();

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

forceRefreshBtn.addEventListener('click', () => fetchIcal());



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
        loadIcal(Pako.inflate(localStorage[cacheKey], { to: 'string' }));
    } catch (e) {
        // Au cas où
        console.error('Erreur lors de la lecture du calendrier', e);
        delete localStorage[cacheKey];
    }
}

// Chargement du calendrier sur Internet (ou planification)
{
    let fetchDelay = 0; // Délai avant de le ré-récupérer
    if (localStorage[cacheKey]) {
        // Récupération plus tard si il a déjà été récupéré récemment
        const cacheTime = +localStorage[cacheTimeKey];
        if (isFinite(cacheTime)) fetchDelay = MAX_CACHE_AGE - (Date.now() - cacheTime);
    }
    setTimeout(() => {
        fetchIcal();
        setInterval(() => fetchIcal(), MAX_CACHE_AGE);
    }, fetchDelay);
}



function getElementById<T extends keyof HTMLElementTagNameMap>(id: string): HTMLElementTagNameMap[T] {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Élément introuvable : '${id}'`);
    return <HTMLElementTagNameMap[T]> el;
}

/** Charge un calendrier à partir du contenu d'un fichier iCalendar */
function loadIcal(ical: string): void {
    calendar.setEvents(parseIcal(ical));
    updateFetchDateText();
}

/** Récupère et charge le calendrier correspondant à `calendarId` */
function fetchIcal(): void {
    forceRefreshBtn.disabled = true;
    document.body.classList.add('fetching');

    fetch(`https://a5b84.herokuapp.com/https://ade-outils.insa-lyon.fr/ADE-Cal:~${calendarId}`)
    .then(response => {
        if (!response.ok) throw response;
        return response.text()
    })
    .then(ical => {
        localStorage[cacheTimeKey] = Date.now();
        loadIcal(ical);
        localStorage[cacheKey] = Pako.deflate(ical, { to: 'string' });
    })
    .catch(error => {
        console.error('Erreur pendant la récupération du calendrier :', error);
        updateFetchDateText(true);
    })
    .finally(() => {
        forceRefreshBtn.disabled = false;
        document.body.classList.remove('fetching');
    });
}

/** Actualise la date de récupération affichée */
function updateFetchDateText(error: boolean = false) {
    let text: string;
    // Date
    const cacheTime = +localStorage[cacheTimeKey];
    if (isFinite(cacheTime)) { // Mieux que isNaN (pas d'infini)
        const d = new Date(cacheTime);
        const date = d.toLocaleDateString('fr', { month: 'short', day: 'numeric' });
        const time = d.toLocaleTimeString('fr', { hour: 'numeric', minute: 'numeric' });
        text = `Récupéré le ${date} à\u00a0${time}`;
    } else {
        text = 'Date de récupération inconnue';
    }

    // Erreur
    if (error) text += ' (⚠)';

    fetchDateEl.innerText = text;
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

/** Change la date affichée et du calendrier */
function setDate(date: Date): void {
    dateInput.valueAsDate = date; // Convertit les dates invalide en null
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (dateInput.valueAsDate) {
        calendar.setDate(dateInput.valueAsDate);
    } else {
        calendar.setDate(new Date());
        updateInputDate();
    }
}



/** Avance/recule d'un jour / une semaine */
function timeButtonHandler(offset: -1 | 1): void {
    if (offset > 0) calendar.moveToNext();
    else calendar.moveToPrevious();

    updateInputDate();
}
