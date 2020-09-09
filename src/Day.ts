import ElementTemplate from './templates/ElementTemplate';
import { getTimeInHours, isToday, toTitleCase } from './Utils';
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

        eventEl.style.setProperty('--event-start', getTimeInHours(event.start) + '');
        eventEl.style.setProperty('--event-end', getTimeInHours(event.end) + '');

        this.events.push(event);
        this.content.appendChild(eventEl);
    }

    isEmpty(): boolean {
        return this.content.childElementCount === 0;
    }

    clear() {
        this.events = [];
        const content = this.content;
        while (content.childElementCount > 0) {
            content.firstElementChild?.remove();
        }
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
        this.name.innerText = toTitleCase(
            date.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
        );
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
