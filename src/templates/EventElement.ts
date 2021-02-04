import { DEBUG, formatTime, getTimeInHours } from '../Utils';
import VEvent from '../VEvent';
import ElementTemplate from './ElementTemplate';

export default class EventElement extends ElementTemplate {

    readonly element: HTMLDivElement;



    constructor(event: VEvent) {
        super('event-template');

        const el = this.element = this.getEl<'div'>('.event');
        el.style.backgroundColor = event.getColor();

        // Début/fin/durée
        const start = getTimeInHours(event.start);
        const end = getTimeInHours(event.end);
        el.style.setProperty('--event-start', start + '');
        el.style.setProperty('--event-end', end + '');
        if (end - start < 1.5) el.classList.add('short');

        this.getEl('.event-start').innerText = formatTime(event.start);
        this.getEl('.event-end').innerText = formatTime(event.end);
        this.getEl('.event-duration').innerText = formatTime(event.end.getTime() - event.start.getTime());

        // Infos
        if (event.hasDescriptionInfo()) {
            el.title = event.getSubject();
            this.getEl('.event-name').innerText = event.getName();

            const type = event.getType();
            this.getEl('.event-type').innerText = type;
            el.setAttribute('data-type', type);

            const group = event.getGroups();
            if (group) this.getEl('.event-group').innerText = group;
            else this.getEl('.event-group').remove();

            const details = event.getDetails();
            if (details) el.title += '\n' + details;

            const person = event.getPeople();
            if (person) this.getEl('.event-person-name').innerText = person;
            else this.getEl('.event-person').remove();
        } else {
            this.getEl('.event-name').innerText = event.summary;
            this.getEl('.event-details').remove();
            this.getEl('.event-person').remove();
        }

        // Salle(s)
        const locations = event.getLocations();
        if (locations.length > 0) {
            const linkContainer = this.getEl('.event-location-links');
            for (const location of locations) {
                const a = document.createElement('a');
                a.href = location[1];
                a.target = '_blank';
                a.innerText = location[0];
                linkContainer.append(a);
            }
        } else {
            this.getEl('.event-location').remove();
        }

        // Debug
        if (DEBUG) {
            el.addEventListener('click', () => console.log(event));
        }
    }



    updateOverflow(): void {
        const el = this.element;
        el.classList.remove('overflowing'); // Pour pas que le bord réduise
        //      le clientHeight
        if (el.clientHeight < el.scrollHeight) el.classList.add('overflowing');
    }

}
