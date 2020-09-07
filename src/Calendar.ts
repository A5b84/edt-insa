import Day from './Day';
import { getTimeInHours as getTimeInHours } from './Utils';
import VEvent from './VEvent';

export default class Calendar {

    protected readonly element: HTMLElement;
    protected days: Day[] = new Array(7).fill(0).map(() => new Day());

    currDate: Date = new Date();
    events: VEvent[] = [];
    /** Date dans la semaine à afficher */



    constructor(element: HTMLElement) {
        this.element = element;

        // Ajout des jours
        for (const day of this.days) {
            element.appendChild(day.element.fragment);
        }
    }



    /** Recrée tous les trucs pour l'affichage */
    rebuild(): void {
        const weekDay = (this.currDate.getDay() + 1) % 7;
        //      Samedi = 0, dimanche = 1, ..., vendredi = 6
        //      (Comme ça quand c'est samedi on affiche la semaine suivante)
        //      (Problème : si y a des trucs le samedi ou le dimanche, faut
        //      retourner à la semaine d'avant pour le voir)

        // Début et fin de la semaine (samedi du coup)
        const weekStart = this.currDate.setHours(0, 0, 0, 0) - weekDay * 86400e3;
        const weekEnd = weekStart + 86400e3 * 7;

        // On récupère les trucs de la semaine
        const weekEvents = [];
        var dayStart: number | undefined, dayEnd: number | undefined;
        for (const event of this.events) {
            if (weekStart <= event.start.getTime() && event.start.getTime() < weekEnd) {
                // Ajout
                weekEvents.push(event);

                // Heures de début/fin de journée
                const eventStart = getTimeInHours(event.start);
                const eventEnd = getTimeInHours(event.end);
                if (dayStart === undefined || eventStart < dayStart) dayStart = eventStart;
                if (dayEnd === undefined || eventEnd > dayEnd) dayEnd = eventEnd;
            }
        }

        // Début/fin des jours + reset
        dayStart = dayStart ? floorHours(dayStart) : 10;
        dayEnd = dayEnd ? ceilHours(dayEnd) : 14;
        this.element.style.setProperty('--day-start', '' + dayStart);
        this.element.style.setProperty('--day-end', '' + dayEnd);
        this.element.style.setProperty('--day-start-mod-1', '' + dayStart % 1);

        for (var i = 0; i < this.days.length; i++) {
            const day = this.days[i];
            day.clear();
            day.setBounds(
                weekStart + (i + 2) * 86400e3 + dayStart * 3600e3,
                weekStart + (i + 2) * 86400e3 + dayEnd * 3600e3
            );
            //      +2 parce que 'weekStart' c'est un samedi
            //      et i = 0 -> lundi
        }

        // Ajout des évènements aux jours
        for (const event of weekEvents) {
            const eventDay = (event.start.getDay() + 6) % 7;
            //      Lundi = 0, mardi = 1, ..., dimanche = 6
            //      (Comme ça c'est dans l'ordre normal)
            this.days[eventDay].addEvent(event);
        }

        // Visibilité des jours
        for (var i = this.days.length - 1; i > 4; i--) {
            // Masquage de samedi/dimanche si vides et rien à leur droite
            if (this.days[i].isEmpty()) {
                this.days[i].setVisible(false);
            } else {
                break;
            }
        }

        for (; i > 4; i--) {
            // Reste des éléments visibles
            this.days[i].setVisible(true);
        }
    }

    updateEventsOverflow(): void {
        for (const day of this.days) {
            day.updateEventsOverflow();
        }
    }

}



/** Temps en heure entre les valeurs possibles pour arrondir en heure */
const ROUNDED_HOURS_STEP = .25;

function floorHours(hours: number) {
    const remainder = hours % ROUNDED_HOURS_STEP;
    hours -= remainder; // Valeur arrondie précédente
    return remainder < ROUNDED_HOURS_STEP / 2
        ? hours - ROUNDED_HOURS_STEP // Trop près -> on décale encore
        : hours; // Sinon c'est bon
}

function ceilHours(hours: number) {
    const remainder = hours % ROUNDED_HOURS_STEP;
    hours += ROUNDED_HOURS_STEP - remainder; // Valeur arrondie suivante
    return remainder > ROUNDED_HOURS_STEP / 2
        ? hours + ROUNDED_HOURS_STEP // Trop près -> on décale encore
        : hours; // Sinon c'est bon
}
