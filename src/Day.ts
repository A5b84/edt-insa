import ElementTemplate from './templates/ElementTemplate';
import { isToday, toTitleCase } from './Utils';
import VEvent from './VEvent';

export default class Day extends ElementTemplate {

    readonly name: HTMLDivElement;
    readonly content: HTMLDivElement;

    protected events: VEvent[] = [];
    readonly alwaysVisible: boolean;
    protected visible: boolean = true;



    constructor(alwaysVisible: boolean) {
        super('day-template');

        this.alwaysVisible = alwaysVisible;
        this.name = this.getEl<'div'>('.day-name');
        this.content = this.getEl<'div'>('.day-content');
    }



    addEvent(event: VEvent): void {
        const eventEl = event.getElement().element;
        eventEl.remove(); // Au cas où
        this.events.push(event);
        this.content.appendChild(eventEl);
    }

    clear() {
        this.events = [];
        const content = this.content;
        while (content.childElementCount > 0) {
            content.firstElementChild?.remove();
        }
    }

    isEmpty(): boolean {
        return this.content.childElementCount === 0;
    }

    isVisible(): boolean {
        return this.visible;
    }

    setVisible(visible: boolean): void {
        if (this.alwaysVisible) return;
        this.visible = visible;
        this.content.style.display
            = this.name.style.display
            = (visible ? '' : 'none');
    }

    setDate(date: Date): void {
        var s = toTitleCase(date.toLocaleString('fr', { weekday: 'long', day: 'numeric', month: 'short' }));
        const affixes = NAME_AFFIXES[date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })];
        if (affixes) {
            if (affixes[0]) s = affixes[0] + '\u00a0' + s;
            if (affixes[1]) s += '\u00a0' + affixes[1];
        }

        this.name.innerText = s;
        this.name.title = affixes && affixes[2] || '';
        this.content.classList.toggle('today', isToday(date));
    }

    getStartEnd(): [number, number] | null {
        if (this.events.length === 0) return null;

        var start: number = this.events[0].start.getTime();
        var end: number = this.events[0].end.getTime();

        for (const event of this.events) {
            if (event.start.getTime() < start) start = event.start.getTime();
            if (event.end.getTime() > end) end = event.end.getTime();
        }

        return [start, end];
    }

    setFocused(focused: boolean): void {
        this.name.classList.toggle('focused-day', focused);
        this.content.classList.toggle('focused-day', focused);
        this.updateEventsOverflow();
    }

    updateEventsOverflow(): void {
        for (const event of this.events) {
            event.getElement().updateOverflow();
        }
    }

}



const NAME_AFFIXES: { [key: string]: string[] | undefined } = {
    '01/01': ['🛏️', '💤', 'Nouvel an'],
    '02/02': ['🥞', '🧇', 'Chandeleur'],
    '02/14': ['❤️', '🍫', 'Saint Valentin'],
    '03/17': ['☘️', '🍺', 'Saint Patrick'],
    '03/21': ['🌼', '🐝', 'Printemps'],
    '04/01': ['🐟', '🐡', '1er Avril'],
    '06/22': ['☀️', '⛱️', 'Été'],
    '09/23': ['🍂', '🌰', 'Automne'],
    '10/31': ['🎃', '👻', 'Halloween'],
    '12/21': ['❄️', '☃️', 'Hiver'],
    '12/25': ['🎅', '🦌', 'Noël'],
    '12/31': ['🍾', '🎉', 'Réveillon'],
};
