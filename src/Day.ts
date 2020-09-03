import DayTemplate from './templates/DayTemplate';
import VEvent from './VEvent';

export default class Day {

    readonly element: DayTemplate;
    protected start: Date = new Date();
    protected end: Date = new Date(Date.now() + 7200e3);
    protected events: VEvent[] = [];



    constructor(name: string) {
        this.element = new DayTemplate();
    }



    addEvent(event: VEvent): void {
        const eventEl = event.getElement().element;

        // Enlèvement au cas où
        eventEl.remove();

        // Position
        // TODO remettre clamped
        eventEl.style.setProperty('--start', '' + this.getProgress(event.start));
        eventEl.style.setProperty('--end', '' + this.getProgress(event.end));

        // Ajout
        this.events.push(event);
        this.element.content.appendChild(eventEl);
    }

    isEmpty(): boolean {
        return this.element.content.childElementCount === 0;
    }

    clear() {
        this.events = [];
        const content = this.element.content;
        while (content.childElementCount > 0) {
            content.firstElementChild?.remove();
        }
    }

    setVisible(visibility: boolean): void {
        this.element.element.style.display = visibility ? '' : 'none';
    }

    setBounds(start: number, end: number) {
        this.start = new Date(start);
        this.end = new Date(end);
        this.element.name.innerText = toTitleCase(
            this.start.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
        );
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



function toTitleCase(s: string): string {
    return s.replace(/(?:^| )\S/gm, char => char.toUpperCase());
}
