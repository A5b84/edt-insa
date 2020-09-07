import ElementTemplate from './ElementTemplate';

export default class DayTemplate extends ElementTemplate {

    readonly name: HTMLDivElement;
    readonly content: HTMLDivElement;

    constructor() {
        super('day-template');

        this.name = this.getEl<'div'>('.day-name');
        this.content = this.getEl<'div'>('.day-content');
    }

}
