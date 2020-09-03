import { parseIcal } from './parseIcal';
import Calendar from './Calendar';



const content = <HTMLDivElement> document.getElementById('content');

const calendar: Calendar = new Calendar(content);



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



addEventListener('resize', () => {
    if (calendar) calendar.updateEventsOverflow();
});



// TODO gzipper et stocker le calendrier localement pendant un moment
// (6h c'est pas trop mal, 20h ça ferai une fois par jour mais ça prendrai du
// temps à se mettre à jour et cheh si je me trompe d'amphi)
// (Aussi on stocke localement tout le temps et quand il a plus d'un certain
// âge on va le rechercher sur internet et on le remplace discrètement)
// fetch(`https://cors-anywhere.herokuapp.com/https://ade-outils.insa-lyon.fr/ADE-Cal:~${calendarId}`)
// .then(response => response.text())
Promise.resolve(localStorage.ade) // TODO tmp
.then(parseIcal)
.then(events => {
    calendar.events = events;
    calendar.currDate = new Date(Date.now() + 14 * 86400e3); // TODO tmp
    calendar.rebuild();
    (<any> window).calendar = calendar;
});
