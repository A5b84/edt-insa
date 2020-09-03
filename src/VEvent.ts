import EventTemplate from './templates/EventTemplate';



/** Expression régulière qui est censée matcher toutes les descriptions
 * Groupes:
 * 1. Matière (Ex: PC-S3-IF-ACP)
 * 2. Type (Ex: TD, TP, CM, EV)
 * 3. Nom (Ex: Algorithmique et programmation 3)
 * 4. Détails (Ex: TP de synthèse, rarement précisé)
 * 5. Groupe (Ex: 047s3)
 * 6. Prof (pas toujours précisé)
 */
const DESCRIPTION_EXP = /^\n\[(.+):(.+)\] (.+)\n\((.*)\)\n\1:\2::(.+)\n(?:([\s\S]+)\n)?\(Exporté le:/;
// Version après traitement
// const DESCRIPTION_EXP = /\[(.+):(.+)\] (.+)\\n\1:\2::(047s3(\+048s3)?|Ls3)(?:\\n.+)?/



export default class VEvent {

    // readonly stampDate?: Date;
    readonly start: Date;
    readonly end: Date;
    readonly summary: string;
    readonly location: string | null;
    readonly description: string;
    // readonly uid?: string;
    // readonly created?: Date;
    // readonly lastModified?: Date;
    // readonly sequence?: number;

    protected element: EventTemplate | null = null;
    /** Match de la description (pour récupérer des trucs)
     * undefined = pas encore fait, null = échec */
    protected descriptionMatch?: RegExpMatchArray | null;



    constructor(start: Date, end: Date, summary: string, location: string | null, description: string) {
        this.start = start;
        this.end = end;
        this.summary = summary;
        this.location = location;
        this.description = description;
    }



    getElement(): EventTemplate {
        return this.element
            ? this.element
            : this.element = new EventTemplate(this);
    }



    getLocationName(): string {
        if (!this.location) return '?';
        return this.location
        .replace(/^\S+ - /, '') // Id de l'endroit
        .replace(/(?<=Amphi)[^-]*(?= [^-\s]+)/, ''); // Nom complet de l'amphi
    }

    /** Renvoie le lien pour voir une salle sur OpenStreetMap, ex:
     * https://ade-outils.insa-lyon.fr/SALLE:1060101 */
    getLocationLink(): string | null {
        if (!this.location) return null;
        const match = this.location.match(/^\S+/);
        return match
            ? `https://ade-outils.insa-lyon.fr/SALLE:${match[0]}`
            : null;
    }



    /** Renvoie vrai si l'évènement a les infos en plus */
    hasDescriptionInfo(): boolean {
        this.matchDescriptionInfo();
        return this.descriptionMatch !== null;
    }

    /** Matche les infos de la description */
    protected matchDescriptionInfo() {
        if (this.descriptionMatch === undefined) {
            this.descriptionMatch = this.description.match(DESCRIPTION_EXP);
        }
    }

    protected getNthMatch(n: number): string | null {
        this.matchDescriptionInfo();
        return this.descriptionMatch ? this.descriptionMatch[n] : null;
    }

    getSubject(): string | null { return this.getNthMatch(1); }
    getType(): string | null { return this.getNthMatch(2); }
    getName(): string | null { return this.getNthMatch(3); }
    getDetails(): string | null { return this.getNthMatch(4); }
    getGroup(): string | null { return this.getNthMatch(5); }
    getPerson(): string | null { return this.getNthMatch(6); }

}
