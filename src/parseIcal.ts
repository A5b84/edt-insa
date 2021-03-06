import VEvent from './VEvent';

const COMMA_EXP = /\\,/g;
const NEW_LINE_PATTERN = /\\n/g;
const DATE_PATTERN = /(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)(Z|)/;



/** Fonction ghetto pour lire un fichier ICS (parce j'arrive pas à faire
 * marcher les librairies :'( */
export function parseIcal(ical: string): VEvent[] {
    // Préparatifs qui peuvent pas être mis dans VEvent pour opti
    ical = ical.replace(/\r?\n /g, '') // Retours à la ligne inutiles

    const events = ical.split(/(?:\r?\nEND:VEVENT)?\r?\nBEGIN:VEVENT\r?\n/gm);
    const result = [];
    for (var i = 1; i < events.length; i++) {
        try {
            // Création de l'évènement
            const lines = events[i].split(/\r?\n/);

            var start: Date | null = null;
            var end: Date | null = null;
            var summary: string | null = null;
            var location: string | null = null;
            var description: string | null = null;

            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex < 0) continue;

                switch (line.slice(0, colonIndex)) {
                case 'DTSTART':
                    if (!start) start = toValidDate(line.slice(colonIndex + 1));
                    break;

                case 'DTEND':
                    if (!end) end = toValidDate(line.slice(colonIndex + 1));
                    break;

                case 'LOCATION':
                    if (!location) location = line.slice(colonIndex + 1);
                    break;

                case 'SUMMARY':
                    if (!summary) summary = line.slice(colonIndex + 1);
                    break;

                case 'DESCRIPTION':
                    if (description) break;
                    description = line.slice(colonIndex + 1)
                    .replace(COMMA_EXP, ',') // Virgules échappées
                    .replace(NEW_LINE_PATTERN, '\n') // Faux sauts de ligne
                    // .replace(/\(Exporté le:[^)]*\)/, '') // Date d'export
                    // .replace(/^\s+|\s+$/g, ''); // Sauts de lignes et espaces inutiles
                    break;
                }
            }

            // Ajout si on a tout ce qui faut
            if (start && end && summary && description) {
                result.push(new VEvent(start, end, summary, location, description));
            }
        } catch (e) {
            console.error(`Erreur pour l'évènement '${events[i]}'`);
            console.error(e);
        }
    }
    return result;
}



/** Renvoie la date correspondant à la valeur entrée
 * https://tools.ietf.org/html/rfc5545#section-3.3.5 */
function toValidDate(s: string): Date | null {
    const m = s.match(DATE_PATTERN);
    if (!m) return null;
    const date = new Date(`${m[1]}/${m[2]}/${m[3]} ${m[4]}:${m[5]}:${m[6]}${m[7]}`);
    return isNaN(date.getTime()) ? null : date;
}
