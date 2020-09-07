/** Renvoie l'heure avec les minutes et les secondes en un seul nombre
 * ([0, 24[) */
export function getTimeInHours(date: Date): number {
    return (date.getTime() - new Date(date).setHours(0, 0, 0, 0)) / 3600e3;
}

/** Renvoie l'heure d'une date au format '9h' (ou '9h00' si `full == true`) */
export function formatTime(date: Date | number, full: boolean) {
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



/** Renvoie un string avec les premières lettres de mots en majuscules et le
 * reste en minuscules */
export function toTitleCase(s: string): string {
    return s.toLowerCase()
    .replace(/(?:^| )\S/gm, char => char.toUpperCase());
}
