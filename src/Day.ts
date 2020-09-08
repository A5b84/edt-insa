import ElementTemplate from './templates/ElementTemplate';
import { isToday, toTitleCase } from './Utils';
import VEvent from './VEvent';

export default class Day extends ElementTemplate {

    readonly name: HTMLDivElement;
    readonly content: HTMLDivElement;
    
    protected start: Date = new Date();
    protected end: Date = new Date(Date.now() + 7200e3);
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

        // Enlèvement au cas où
        eventEl.remove();

        // Position
        eventEl.style.setProperty('--start', '' + this.getProgress(event.start));
        eventEl.style.setProperty('--end', '' + this.getProgress(event.end));

        // Ajout
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

    setBounds(start: number, end: number): void {
        this.start = new Date(start);
        this.end = new Date(end);
        this.name.innerText = toTitleCase(
            this.start.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
        );

        this.content.classList.toggle('today', isToday(this.start));
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



    /** Renvoie la progression dans la journée d'une date (start = 0, end = 1) */
    protected getProgress(date: Date): number {
        return (date.getTime() - this.start.getTime()) / (this.end.getTime() - this.start.getTime());
    }

}
