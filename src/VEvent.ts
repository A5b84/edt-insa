import EventElement from './templates/EventElement';



/** Expression régulière qui est censée matcher toutes les descriptions
 * Groupes:
 *  1. Matière (Ex: PC-S3-IF-ACP)
 *  2. Type (Ex: TD, TP, CM, EV)
 *  3. Nom (Ex: Algorithmique et programmation 3)
 *  4. Détails (optionnel (rarement précisé), ex: TP de synthèse)
 *  5. Groupe (Ex: 047s3)
 *  6. Prof(s) (optionnel (pas toujours précisé))
 * (optionnel = peut être '')
 */
const DESCRIPTION_EXP = /^\n\[(.+?):(.+?)\] (.*?)\n(.*?)\n\n(?:\1:\2::)?(.*?)\n([\s\S]*?)\n\(Exporté le:/;
const SUBGROUP_EXP = /Autres activités pédagogiques - .+enseignement présentiel des sous-groupes ?./;



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

    protected element: EventElement | null = null;
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



    getElement(): EventElement {
        return this.element
            ? this.element
            : this.element = new EventElement(this);
    }



    getLocationName(): string {
        if (!this.location) return '?';
        return this.location
        .replace(/^\S+ - /, '') // Id de l'endroit
        .replace(/(?<=Amphi)[^-]*(?= [^-\s])/, ''); // Nom complet de l'amphi
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

            if (this.descriptionMatch) {
                // Ajustements
                //      Nom des matières
                const alias = ALIAS_MAP[this.descriptionMatch[3]];
                if (alias) {
                    this.descriptionMatch[3] = alias;
                } else if (SUBGROUP_EXP.test(this.descriptionMatch[3])) {
                    this.descriptionMatch[3] = 'Présentiel';
                }

                //      Liste des groupes
                this.descriptionMatch[5] = this.descriptionMatch[5]
                .replace(/\+/g, '\u200a+\u200a'); // \u200a = hair space
            }
        }
    }

    protected getNthMatch(n: number): string {
        this.matchDescriptionInfo();
        return this.descriptionMatch ? this.descriptionMatch[n] : '';
    }

    /** Matière (Ex: PC-S3-IF-ACP) */
    getSubject(): string { return this.getNthMatch(1); }
    /** Type (Ex: TD, TP, CM, EV) */
    getType(): string { return this.getNthMatch(2); }
    /** Nom (Ex: Algorithmique et programmation 3) */
    getName(): string { return this.getNthMatch(3); }
    /** Détails (optionnel (rarement précisé), ex: TP de synthèse) */
    getDetails(): string { return this.getNthMatch(4); }
    /** Groupe (optionnel (presque toujours précisé), ex: 047s3) */
    getGroup(): string { return this.getNthMatch(5); }
    /** Prof(s) (optionnel (pas toujours précisé)) */
    getPerson(): string { return this.getNthMatch(6); }



    getColor(): string {
        const subject = this.getSubject();
        // Couleur fixe
        if (subject in COLOR_MAP) return COLOR_MAP[subject];

        // Hash
        const hash = hashCode(subject || this.summary);
        return COLORS[((hash % COLORS.length) + COLORS.length) % COLORS.length];
    }

}



const COLORS = [
    'hsl(0 67% 50%)', 'hsl(15 72% 50%)', 'hsl(30 75% 50%)', 'hsl(45 75% 50%)',
    'hsl(60 75% 45%)', 'hsl(75 80% 42%)', 'hsl(90 75% 42%)', 'hsl(105 70% 43%)',
    'hsl(120 69% 42%)', 'hsl(135 72% 45%)', 'hsl(150 75% 45%)', 'hsl(165 80% 44%)',
    'hsl(180 80% 45%)', 'hsl(195 80% 48%)', 'hsl(210 70% 50%)', 'hsl(225 65% 50%)',
    'hsl(240 62% 52%)', 'hsl(255 65% 55%)', 'hsl(270 65% 55%)', 'hsl(285 65% 55%)',
    'hsl(300 62% 57%)', 'hsl(315 67% 55%)', 'hsl(330 70% 55%)', 'hsl(345 75% 55%)',
];

const COLOR_MAP: { [key: string]: string } = {
    'PC-S3-MA-P':     COLORS[0], // Maths
    'PC-SX-EPS-EDT':  COLORS[2], // EPS
    'PC-S3-CO-TF':    COLORS[3], // Conception
    'PC-S3-PR-TF':    COLORS[3], // Production
    'PC-S3-PH-ACP':   COLORS[10], // Physique
    'PC-S3-CH-ACEMP': COLORS[13], // Chimie
    'HU-L-S1-ANG':    COLORS[15], // Anglais
    'PC-S13-LV-EDT':  COLORS[15], // Anglais bis
    'PC-S3-MG-ACEMP': COLORS[18], // Mécanique générale
    'PC-S3-IF-ACP':   COLORS[20], // Informatique
    'PC-S3-CSS-P':    COLORS[23], // Cultures, Sciences, Sociétés

    'PC-S3-ACT-EDT': 'hsl(15 25% 40%)', // 'Autres activités pédagogiques'
};

const ALIAS_MAP: { [key: string]: string } = {
    'Activités Physiques et Sportives - affichage à l\'edt': 'EPS',
    'affichage des Langues à l\'edt': 'Anglais',
    'Physique:électromagnétisme-ondes': 'Physique\u00a0: électromagnétisme - ondes'
};



// Inspiré de https://stackoverflow.com/a/7616484
function hashCode(str: string): number {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i) | 0;
    }
    return hash;
}
