import VEvent from './VEvent';
import Day from './Day';

export default class Calendar {

    protected readonly element: HTMLElement;
    protected days: Day[] = [
        new Day('Lundi'), new Day('Mardi'), new Day('Mercredi'),
        new Day('Jeudi'), new Day('Vendredi'), new Day('Samedi'),
        new Day('Dimanche')
    ];

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
                if (!dayStart || event.start.getHours() < dayStart) {
                    dayStart = event.start.getHours();
                }
                const ceiledEndHours = getCeiledHours(event.end);
                if (!dayEnd || ceiledEndHours > dayEnd) {
                    dayEnd = ceiledEndHours;
                }
            }
        }

        // Début/fin des jours + reset
        dayStart = dayStart || 10;
        dayEnd = dayEnd || 14;
        for (var i = 0; i < this.days.length; i++) {
            const day = this.days[i];
            day.clear();
            day.setBounds(
                weekStart + (i + 2) * 86400e3 + dayStart * 3600e3,
                weekStart + (i + 2) * 86400e3 + dayEnd * 3600e3
            );
            //      +2 parce que 'weekStart' c'est un samedi
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



/** Renvoie la première heure pile ([0, 24]) après la date (inclue),
 * ex: 12:34 -> 12, 18:00 -> 18 */
function getCeiledHours(date: Date): number {
    return date.getHours() + (date.getMinutes() > 0 ? 1 : 0);
}
