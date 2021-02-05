/** `true` si en mode debug (si `debug` est en paramètre dans l'url),
 * `false` sinon */
export const DEBUG = new URLSearchParams(location.href).get('debug') !== null;



/** Renvoie l'heure avec les minutes et les secondes en un seul nombre
 * ([0, 24[) */
export function getTimeInHours(date: Date): number {
    return (date.getTime() - new Date(date).setHours(0, 0, 0, 0)) / 3600e3;
}

export function isToday(date: Date): boolean {
    return new Date(date).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
}

/** Renvoie l'heure d'une date dans un format lisible (ex: 9h, 15h30, ...)
 * @param date Date (objet) ou *différence* entre deux dates en ms (nombre) */
export function formatTime(date: Date | number) {
    var hours: number, minutes: number;

    if (date instanceof Date) {
        hours = date.getHours();
        minutes = date.getMinutes();
    } else {
        hours = (date % 86400e3 / 3600e3) | 0;
        minutes = (date % 3600e3 / 60e3) | 0;
    }

    var s = `${hours}h`;

    if (minutes) {
        if (minutes < 10) s += '0' + minutes;
        else s += minutes;
    }

    return s;
}



/** @returns un string avec les premières lettres de mots en majuscules et le
 * reste en minuscules */
export function toTitleCase(s: string): string {
    return s.toLowerCase()
    .replace(/(?:^| )\S/gm, char => char.toUpperCase());
}



/** @returns `true` ssi `key` a une valeur dans `o` */
export function hasKey<K extends PropertyKey>(o: Record<K, unknown>, key: PropertyKey): key is K {
    return Object.prototype.hasOwnProperty.call(o, key);
}



export function addSwipeListener(
    target: EventTarget, onSwipeUp: (() => any) | null = null,
    onSwipeDown: (() => any) | null = null, onSwipeLeft: (() => any) | null = null,
    onSwipeRight: (() => any) | null = null, minRadius: number = 24
): void {
    minRadius *= minRadius;
    var startX: number | null = null;
    var startY: number | null = null;


    target.addEventListener('touchstart', e => [startX, startY] = getTouchXY(e));
    target.addEventListener('touchend', () => startX = startY = null);

    target.addEventListener('touchmove', e => {
        if (startX === null || startY === null) return;

        const [newX, newY] = getTouchXY(e);
        const dx = newX - startX, dy = newY - startY;
        if (dx * dx + dy * dy < minRadius) return;

        if (Math.abs(dy) > Math.abs(dx)) {
            if (dy < 0) onSwipeUp?.();
            else onSwipeDown?.();
        } else {
            if (dx < 0) onSwipeLeft?.();
            else onSwipeRight?.();
        }

        startX = startY = null;
    });

}

function getTouchXY(e: Event): [number, number] {
    return e instanceof TouchEvent
        ? [e.touches[0].clientX, e.touches[0].clientY]
        : [0, 0];
}
