import { toTitleCase } from './Utils';
import VEvent from './VEvent';
import ElementTemplate from './templates/ElementTemplate';

export default class Day extends ElementTemplate {

    readonly name: HTMLDivElement;
    readonly content: HTMLDivElement;

    protected start: Date = new Date();
    protected end: Date = new Date(Date.now() + 7200e3);
    protected events: VEvent[] = [];



    constructor() {
        super('day-template');

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

        // TODO: jour même en bleu
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

    setVisible(visibility: boolean): void {
        this.content.style.display
            = this.name.style.display
            = (visibility ? '' : 'none');
    }

    setBounds(start: number, end: number) {
        this.start = new Date(start);
        this.end = new Date(end);
        this.name.innerText = toTitleCase(
            this.start.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
        );
        // TODO déplacer ça dans Calendar
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
