import Day from './Day';
import { getTimeInHours } from './Utils';
import VEvent from './VEvent';



/** Temps en heure entre les valeurs possibles pour arrondir en heure */
const ROUNDED_HOURS_STEP = .25;

/** Décalage de quelques heures parce que minuit pile ça peut poser un
 * problème avec les changements d'heure */
const MIDNIGHT_OFFSET = 14400e3;



export default class Calendar {

    protected static readonly DEFAULT_DAY_START = floorHours(10);
    protected static readonly DEFAULT_DAY_END = ceilHours(14);



    readonly element: HTMLElement;
    readonly hours: HTMLDivElement;
    readonly dayNames: HTMLDivElement;
    readonly dayContents: HTMLDivElement;

    // Faut toujours au moins un jour visible par semaine (pour pas tout casser)
    protected readonly days: Day[] = new Array(7).fill(0).map((_, i) => new Day(i < 5));
    events: VEvent[] = [];
    protected currDate: Date;
    protected focusedDay: number;
    protected wasWeekLayout: boolean = this.isWeekLayout();



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

        this.currDate = new Date();
        this.currDate.setHours(6); // Pour les problèmes de changements d'heures
        this.focusedDay = 0; // Valeur temporaire modifiée juste après
        this.setFocusedDay(getDayIndex(this.currDate));

        this.buildWeek();
    }



    /** Recrée tous les trucs pour l'affichage */
    buildWeek(): void {
        const weekStart = getWeekStart(this.currDate);
        const weekEnd = weekStart + 86400e3 * 7;

        // Reset des jours
        for (var i = 0; i < this.days.length; i++) {
            this.days[i].clear();
            this.days[i].setDate(new Date(weekStart + i * 86400e3 + MIDNIGHT_OFFSET));
        }

        // Ajout des évènements
        for (const event of this.events) {
            if (weekStart <= event.start.getTime() && event.start.getTime() < weekEnd) {
                // Ajout
                const index = getDayIndex(event.start);
                this.days[index].addEvent(event);
            }
        }

        // Début/fin des jours
        var weekDayStart: number | undefined;
        var weekDayEnd: number | undefined;
        for (const day of this.days) {
            const bounds = this.getRoundedDayStartEnd(day);
            if (!bounds) continue;

            if (weekDayStart === undefined || bounds[0] < weekDayStart) weekDayStart = bounds[0];
            if (weekDayEnd === undefined || bounds[1] > weekDayEnd) weekDayEnd = bounds[1];
        }

        if (weekDayStart === undefined) weekDayStart = Calendar.DEFAULT_DAY_START;
        if (weekDayEnd === undefined) weekDayEnd = Calendar.DEFAULT_DAY_END;

        this.element.style.setProperty('--shared-day-start', weekDayStart + '');
        this.element.style.setProperty('--shared-day-end', weekDayEnd + '');
        this.element.style.setProperty('--shared-day-start-mod-1', weekDayStart % 1 + '');

        // Heures à gauche
        this.buildHours();

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
        this.notifyResized();
    }

    protected buildHours(): void {
        // Enlèvement
        while (this.hours.childElementCount) {
            this.hours.firstElementChild?.remove();
        }

        // Ajout
        const [start, end] = this.getStartEnd();
        for (var i = Math.ceil(start); i < end; i++) {
            const el = document.createElement('span');
            el.innerText = `${i}h`;
            el.style.setProperty('--hours', '' + i);
            this.hours.appendChild(el);
        }
    }

    protected getRoundedDayStartEnd(day: Day): [number, number] | null {
        const bounds = day.getStartEnd();
        if (!bounds) return null;
        return [
            floorHours(getTimeInHours(new Date(bounds[0]))),
            ceilHours(getTimeInHours(new Date(bounds[1])))
        ];
    }



    getDate(): Date {
        return this.currDate;
    }

    setDate(date: Date, adjustToVisible: boolean = true): void {
        const oldDate = this.currDate;
        this.currDate = new Date(date);
        this.currDate.setHours(6); // Pour les changements d'heure
        if (!areSameWeek(oldDate, date)) this.buildWeek();

        this.setFocusedDay(getDayIndex(date));
        if (adjustToVisible && !this.days[this.focusedDay].isVisible()) {
            this.moveToNextVisibleDay();
        }
    }

    protected setFocusedDay(index: number): void {
        this.days[this.focusedDay].setFocused(false);
        this.days[index].setFocused(true);
        this.focusedDay = index;
        this.currDate = new Date(getWeekStart(this.currDate) + index * 86400e3 + MIDNIGHT_OFFSET);
        const bounds = this.getRoundedDayStartEnd(this.days[index])
            || [Calendar.DEFAULT_DAY_START, Calendar.DEFAULT_DAY_END];
        this.element.style.setProperty('--focused-day-start', bounds[0] + '');
        this.element.style.setProperty('--focused-day-end', bounds[1] + '');
        this.element.style.setProperty('--focused-day-start-mod-1', bounds[0] % 1 + '');

        if (!this.isWeekLayout()) this.buildHours();
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



    notifyResized(): void {
        const isWeekLayout = this.isWeekLayout();

        // Évènements qui dépassent
        if (isWeekLayout) {
            for (const day of this.days) {
                day.updateEventsOverflow();
            }
        } else {
            this.days[this.focusedDay].updateEventsOverflow();
        }

        // Heures à gauche
        if (isWeekLayout !== this.wasWeekLayout) this.buildHours();

        // Fini
        this.wasWeekLayout = isWeekLayout;
    }

    isWeekLayout(): boolean {
        return innerWidth > 640;
    }

    protected getStartEnd(): [number, number] {
        const style = getComputedStyle(this.element);
        const start = style.getPropertyValue('--day-start');
        const end = style.getPropertyValue('--day-end');
        return [
            start && !isNaN(+start) ? +start : Calendar.DEFAULT_DAY_START,
            end && !isNaN(+end) ? +end : Calendar.DEFAULT_DAY_END
        ]
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
