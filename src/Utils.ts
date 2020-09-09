/** Renvoie l'heure avec les minutes et les secondes en un seul nombre
 * ([0, 24[) */
export function getTimeInHours(date: Date): number {
    return (date.getTime() - new Date(date).setHours(0, 0, 0, 0)) / 3600e3;
}

export function isToday(date: Date): boolean {
    return new Date(date).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
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
            if (dy < 0) onSwipeUp && onSwipeUp();
            else onSwipeDown && onSwipeDown();
        } else {
            if (dx < 0) onSwipeLeft && onSwipeLeft();
            else onSwipeRight && onSwipeRight();
        }

        startX = startY = null;
    });

}

function getTouchXY(e: Event): [number, number] {
    return e instanceof TouchEvent
        ? [e.touches[0].clientX, e.touches[0].clientY]
        : [0, 0];
}
