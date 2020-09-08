import Day from './Day';
import { getTimeInHours } from './Utils';
import VEvent from './VEvent';

export default class Calendar {

    readonly element: HTMLElement;
    readonly hours: HTMLDivElement;
    readonly dayNames: HTMLDivElement;
    readonly dayContents: HTMLDivElement;

    // Faut toujours au moins un jour visible par semaine (pour pas tout casser)
    protected readonly days: Day[] = new Array(7).fill(0).map((_, i) => new Day(i < 5));
    protected focusedDay: number;
    protected currDate: Date;
    events: VEvent[] = [];



    constructor(element: HTMLElement) {
        this.element = element;
        this.hours = <HTMLDivElement> element.querySelector('.hours');
        this.dayNames = <HTMLDivElement> element.querySelector('.day-names');
        this.dayContents = <HTMLDivElement> element.querySelector('.day-contents');

        // Ajout des jours
        for (const day of this.days) {
            this.dayNames.appendChild(day.name);
            this.dayContents.appendChild(day.content);
        }

        this.currDate = new Date(Date.now() - 7 * 86400e3);
        this.focusedDay = getDayIndex(this.currDate);
        //      ^ Valeurs temporaires modifiées dans setDate
        this.setDate(new Date());

        this.rebuild();
    }



    /** Recrée tous les trucs pour l'affichage */
    rebuild(): void {
        const weekStart = getWeekStart(this.currDate);
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
        dayStart = dayStart ? floorHours(dayStart) : 9.75;
        dayEnd = dayEnd ? ceilHours(dayEnd) : 14.25;
        this.element.style.setProperty('--day-start', '' + dayStart);
        this.element.style.setProperty('--day-end', '' + dayEnd);
        this.element.style.setProperty('--day-start-mod-1', '' + dayStart % 1);

        for (var i = 0; i < this.days.length; i++) {
            const day = this.days[i];
            day.clear();
            day.setBounds(
                weekStart + i * 86400e3 + dayStart * 3600e3,
                weekStart + i * 86400e3 + dayEnd * 3600e3
            );
        }

        // Heures à gauche
        //      Enlèvement
        while (this.hours.childElementCount) {
            this.hours.firstElementChild?.remove();
        }

        //      Ajout
        const ceilededDayEnd = Math.ceil(dayEnd);
        for (var i = Math.ceil(dayStart); i < ceilededDayEnd; i++) {
            const el = document.createElement('span');
            el.innerText = `${i}h`;
            el.style.setProperty('--hours', '' + i);
            this.hours.appendChild(el);
        }

        // Ajout des évènements aux jours
        for (const event of weekEvents) {
            const eventDay = getDayIndex(event.start);
            this.days[eventDay].addEvent(event);
        }

        // Visibilité des jours
        for (var i = this.days.length - 1; i >= 0; i--) {
            // Masquage des jours vides avec rien à leur droite
            const day = this.days[i];
            if (day.isEmpty() && !day.alwaysVisible) {
                day.setVisible(false);
            } else {
                break;
            }
        }

        for (; i >= 0; i--) {
            // Reste des jours visibles
            if (this.days[i].alwaysVisible) break;
            //      ^ Toujours visible -> jamais de trucs masqués avant

            this.days[i].setVisible(true);
        }

        // Fini
        this.updateEventsOverflow();
    }



    getDate(): Date {
        return this.currDate;
    }

    setDate(date: Date, adjustToVisible: boolean = true): void {
        const oldDate = this.currDate;
        this.currDate = date;
        if (!areSameWeek(oldDate, date)) this.rebuild();

        this.setFocusedDay(getDayIndex(date));
        if (adjustToVisible && !this.days[this.focusedDay].isVisible()) {
            this.moveToNextVisibleDay();
        }
    }

    protected setFocusedDay(index: number): void {
        this.days[this.focusedDay].setFocused(false);
        this.days[index].setFocused(true);
        this.focusedDay = index;
        this.currDate = new Date(getWeekStart(this.currDate) + index * 86400e3);
    }

    moveToNextVisibleDay(): void {
        for (var i = this.focusedDay + 1; i < this.days.length; i++) {
            if (this.days[i].isVisible()) {
                this.setDate(
                    new Date(this.currDate.getTime() + (i - this.focusedDay) * 86400e3)
                );
                return;
            }
        }

        // Semaine suivante si plus rien de visible cette semaine
        this.moveToWeekRelative(1);
    }

    moveToPreviousVisibleDay(): void {
        for (var i = this.focusedDay - 1; i >= 0; i--) {
            if (this.days[i].isVisible()) {
                this.setDate(
                    new Date(this.currDate.getTime() - (this.focusedDay - i) * 86400e3)
                );
                return;
            }
        }

        // Semaine précédente
        this.moveToWeekRelative(-1);
    }

    moveToWeekRelative(weeks: number): void {
        this.setDate(
            new Date(this.currDate.getTime() + weeks * 7 * 86400e3),
            false
        );

        // Sélection du jour (plutôt que le jour que c'était déjà avant)
        // (ie vendredi + moveToWeekRelative(1) = lundi)
        if (weeks > 0) this.setFocusedDay(this.getFirstVisibleDay());
        else this.setFocusedDay(this.getLastVisibleDay());
    }



    updateEventsOverflow(): void {
        for (const day of this.days) {
            day.updateEventsOverflow();
        }
    }



    protected getFirstVisibleDay(): number {
        for (var i = 0; i < this.days.length; i++) {
            if (this.days[i].isVisible()) return i;
        }
        return 0;
    }

    protected getLastVisibleDay(): number {
        for (var i = this.days.length - 1; i >= 0; i--) {
            if (this.days[i].isVisible()) return i;
        }
        return this.days.length - 1;
    }

}



/** Renvoie l'indice d'une date dans les jours du calendrier (Lundi = 0,
 * mardi = 1, ..., dimanche = 6) */
function getDayIndex(date: Date): number {
    return (date.getDay() + 6) % 7;
}

/** Renvoie le début de la semaine d'une date (lundi matin à minuit) */
function getWeekStart(date: Date): number {
    return new Date(date).setHours(0, 0, 0, 0) - getDayIndex(date) * 86400e3;
}

function areSameWeek(d1: Date, d2: Date): boolean {
    return getWeekStart(d1) === getWeekStart(d2);
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
