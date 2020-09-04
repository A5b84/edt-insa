import ElementTemplate from './ElementTemplate';
import VEvent from '../VEvent';

export default class EventTemplate extends ElementTemplate {

    readonly element: HTMLDivElement;



    constructor(event: VEvent) {
        super('event-template');

        this.element = this.getEl<'div'>('.event');
        this.element.style.backgroundColor = event.getColor();

        // Infos
        if (event.hasDescriptionInfo()) {
            this.getEl('.event-name').innerText = <string> event.getName();
            this.getEl('.event-start').innerText = formatTime(event.start, true);
            this.getEl('.event-end').innerText = formatTime(event.end, true);
            this.getEl('.event-duration').innerText = formatTime(event.end.getTime() - event.start.getTime(), false);
            this.getEl('.event-type').innerText = <string> event.getType();
            this.getEl('.event-group').innerText = <string> event.getGroup();

            const person = event.getPerson();
            if (person) this.getEl('.event-person-name').innerText = person;
            else this.getEl('.event-person').remove();
        } else {
            this.getEl('.event-name').innerText = event.summary;
            this.getEl('.event-schedule').remove();
            this.getEl('.event-details').remove();
            this.getEl('.event-person').remove();
        }

        // Salle
        const locationLink = event.getLocationLink();
        if (locationLink) {
            this.getEl<'a'>('.event-location').href = locationLink;
            this.getEl('.event-location-name').innerText = event.getLocationName();
        } else {
            this.getEl('.event-location').remove();
        }

        // Overflow
        setTimeout(() => this.updateOverflow());
    }



    updateOverflow(): void {
        this.element.classList.toggle(
            'overflowing',
            this.element.clientHeight < this.element.scrollHeight
        );
    }

}



function formatTime(date: Date | number, full: boolean) {
    var hours: number, minutes: number;

    if (date instanceof Date) {
        hours = date.getHours();
        minutes = date.getMinutes();
    } else {
        hours = (date % 86400e3 / 3600e3) | 0;
        minutes = (date % 3600e3 / 60e3) | 0;
    }

    var s = `${hours}h`;

    if (minutes !== 0 || full) {
        if (minutes < 10) s += '0' + minutes;
        else s += minutes;
    }

    return s;
}
