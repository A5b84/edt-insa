import EventElement from './templates/EventElement';
import { hasKey } from './Utils';

/** Expression régulière qui est censée matcher toutes les descriptions */
// TODO à modifier pour les évènements qui ont plusieurs lignes avec des classes/personnes
const DESCRIPTION_EXP = /^\n\[(?<subject>.+?):(?<type>.+?)\] (?<name>.+)\n(?<details>.*)\n\n(?:\k<subject>:\k<type>::)?(?<groups>.+)\n(?:(?<people>(?:[^?\n].*\n)*[^?\n].*)\n)?(?:(?<comments>\?.+)\n)?\n\(Exporté le:/;
const COVID_GROUP_EXP = /Autres activités pédagogiques (?:- .+enseignement présentiel des sous-groupes ?.|\tprésentiel pour \(.\) hors TP)|présentiel P2i pour \(.\)/;
const PRESENTIEL = 'Présentiel';

/** Type de `DESCRIPTION_EXP.exec(...).groups` */
type DescriptionMatchGroups = {
    subject: string,
    type: string,
    name: string,
    details: string,
    groups: string,
    people?: string,
    comments?: string,
};
type DescriptionMatchGroup =  keyof DescriptionMatchGroups;



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

    private element: EventElement | null = null;
    /** Groupes matchés dans la description (pour récupérer des trucs)
     * `undefined` = pas encore fait, `null` = échec */
    private descriptionGroups?: DescriptionMatchGroups | null;



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



    /** @returns Tableau de lieux au format `[nom, lien]` */
    getLocations(): [string, string][] {
        if (!this.location) return [];
        return this.location.split('\\,').map(loc => {
            const id = loc.slice(0, loc.indexOf(' '));
            const name = loc.slice(id.length + ' - '.length)
            .replace(/(?<=Amphi)théâtre[^-]*(?= [^-\s])/, '');
            //      ^ Remplace 'Amphithéâtre' par 'Amphi' et enlève le prénom
            //      (enlève tous les mots entre 'Amphi' et le dernier mot
            //      avant la fin ou avant un tiret)
            return [name, `https://ade-outils.insa-lyon.fr/SALLE:${id}`];
        });
    }



    /** Récupère les informations depuis la description et renvoie vrai si
     * l'évènement en a */
    hasDescriptionInfo(): boolean {
        // On récupère les informations si c'est pas déjà fait
        if (this.descriptionGroups === undefined) {
            const match = this.description.match(DESCRIPTION_EXP);

            if (match?.groups) {
                const groups = this.descriptionGroups = <DescriptionMatchGroups> match.groups;
                // Ajustements

                //      Nom des matières
                if (hasKey(ALIAS_MAP, groups.name)) {
                    groups.name = ALIAS_MAP[groups.name];

                } else if (COVID_GROUP_EXP.test(groups.name)) {
                    groups.name = PRESENTIEL;

                } else if (groups.name.startsWith('Parcours Architecture Matérielle')) {
                    // P2i 2
                    groups.name = 'P2i\u00a02';
                    const details = groups.details;
                    let subName: string = '';

                    if (hasKey(P2I2_ALIAS_MAP, details)) { // Matières normales
                        subName = P2I2_ALIAS_MAP[details];
                    } else if (/^P[123']/.test(details)) { // Projet
                        subName = `${details.slice(0, 2)}\u00a0: projet`;
                    } else if (details.startsWith('M4') || details.startsWith('PR.HU')) {
                        subName = 'Sciences humaines et sociales'; // SHES
                    } else if (details.startsWith('PR.RD')) { // Recherche doc
                        subName = 'Recherche documentaire';
                    } else if (details.startsWith('PR.TU')) { // Architecture
                        subName = 'Architecture';
                    }

                    if (subName) groups.name += ` - ${subName}`;
                }

                //      Liste des groupes
                groups.groups = groups.groups
                .replace(/\+/g, '\u200a-\u200a'); // \u200a = hair space

            } else {
                // Échec
                this.descriptionGroups = null; // Au cas où le problème soit les groupes
                console.warn(`Description qui correspond pas à l'expression régulière`, this, this.description);
            }
        }

        // Fini
        return this.descriptionGroups !== null;
    }

    private getGroup<K extends DescriptionMatchGroup>(group: K): string {
        return this.hasDescriptionInfo() && this.descriptionGroups![group]! || '';
    }

    /** Matière (Ex: PC-S3-IF-ACP) */
    getSubject(): string { return this.getGroup('subject'); }
    /** Type (Ex: TD, TP, CM, EV) */
    getType(): string { return this.getGroup('type'); }
    /** Nom (Ex: Algorithmique et programmation 3) */
    getName(): string { return this.getGroup('name'); }
    /** Détails (optionnel (rarement précisé), ex: TP de synthèse) */
    getDetails(): string { return this.getGroup('details'); }
    /** Groupe (Ex: 047s3) */
    getGroups(): string { return this.getGroup('groups'); }
    /** Prof(s) (optionnel (pas toujours précisé), ex: NOM Prénom) */
    getPeople(): string { return this.getGroup('people'); }



    getColor(): string {
        // Présentiel
        if (this.getName() === PRESENTIEL) return 'hsl(15 25% 40%)';

        // Matières
        const subject = this.getSubject();
        if (subject.startsWith('PC-S4-P2i')) {
            // P2i
            if (subject.startsWith('PC-S4-P2i2')) {
                // Couleurs spécifiques au P2i 2
                const details = this.getDetails();
                if (details.startsWith('M1')) return 'hsl(270 65% 65%)';
                if (details.startsWith('M2')) return COLORS[14];
                if (details.startsWith('M3')) return COLORS[22];
                if (details.startsWith('M4') || details.startsWith('PR.HU')
                        || details.startsWith('PR.RD')) return COLORS[13];
                if (details.startsWith('P')) return COLORS[3];
            }

            return `hsl(240 55% 67%)`;
        }
        if (hasKey(COLOR_MAP, subject)) return COLOR_MAP[subject];

        // Couleur basée sur le hash
        const hash = hashCode(subject || this.summary);
        return COLORS[((hash % COLORS.length) + COLORS.length) % COLORS.length];
    }

}



/** Liste de couleurs utilisées pour en choisir une au hasard */
const COLORS = <const> [
    'hsl(0 67% 50%)', 'hsl(15 72% 50%)', 'hsl(30 75% 50%)', 'hsl(45 75% 50%)',
    'hsl(60 75% 45%)', 'hsl(75 80% 42%)', 'hsl(90 75% 42%)', 'hsl(105 70% 43%)',
    'hsl(120 69% 42%)', 'hsl(135 65% 40%)', 'hsl(150 75% 45%)', 'hsl(165 80% 44%)',
    'hsl(180 80% 45%)', 'hsl(195 80% 48%)', 'hsl(210 70% 50%)', 'hsl(225 65% 50%)',
    'hsl(240 62% 52%)', 'hsl(255 65% 55%)', 'hsl(270 65% 55%)', 'hsl(285 65% 55%)',
    'hsl(300 62% 57%)', 'hsl(315 67% 55%)', 'hsl(330 70% 55%)', 'hsl(345 75% 55%)',
];

const COLOR_MAP = <const> {
    // Maths
    'PC-S3-MA-P':     COLORS[0],
    'PC-S4-MA-P':     COLORS[0],
    // EPS
    'EPS-2-S1':       COLORS[2],
    'EPS-2-S2':       COLORS[2],
    'PC-SX-EPS-EDT':  COLORS[2],
    // Conception-production
    'PC-S3-CO-TF':    COLORS[3],
    'PC-S3-PR-TF':    COLORS[3],
    // Physique
    'PC-S3-PH-ACP':   COLORS[10],
    'PC-S4-PH-ACP':   COLORS[10],
    // Chimie
    'PC-S3-CH-ACEMP': COLORS[13],
    // Anglais
    'HU-L-S1-ANG':    COLORS[15],
    'PC-S13-LV-EDT':  COLORS[15],
    // Mécanique générale
    'PC-S3-MG-ACEMP': COLORS[18],
    'PC-S4-MG-ACEMP': COLORS[18],
    // Informatique
    'PC-S3-IF-ACP':   COLORS[20],
    'PC-S4-IF-ACEMP': COLORS[20],
    // Cultures, Sciences, Sociétés
    'PC-S3-CSS-P':    COLORS[23],
};

const ALIAS_MAP = <const> {
    'Activités Physiques et Sportives': 'EPS',
    'Activités Physiques et Sportives - affichage à l\'edt': 'EPS',
    'affichage des Langues à l\'edt': 'Anglais',
    'Physique:électromagnétisme-ondes': 'Physique\u00a0: électromagnétisme - ondes',
    'Physique:ondes': 'Physique\u00a0: ondes',
};

const P2I2_ALIAS_MAP = <const> {
    'M1.CA': 'M1\u00a0: Chaîne d\'acquisition',
    'M1.PC': 'M1\u00a0: Physique des capteurs',
    'M2': 'M2\u00a0: Statistiques et séries de Fourier',
    'M3.BD': 'M3\u00a0: Base de données capteurs',
    'M3.RC': 'M3\u00a0: Réseaux de capteurs',
};



// Inspiré de https://stackoverflow.com/a/7616484
function hashCode(str: string): number {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i) | 0;
    }
    return hash;
}
