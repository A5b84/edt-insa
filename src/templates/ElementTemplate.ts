export default class ElementTemplate {

    private static template?: HTMLTemplateElement | null;

    readonly fragment: DocumentFragment;



    /** @param id Id du `<template>` */
    constructor(id: string) {
        const clazz = this.getClass();
        clazz.init(id);
        this.fragment = <DocumentFragment> clazz.template!.content.cloneNode(true);
    }



    private getClass() {
        return <typeof ElementTemplate> this.constructor;
    }

    /** Initialise le template (récupère l'élément) */
    private static init(id: string): void {
        if (this.template) return;

        this.template = <HTMLTemplateElement | null> document.getElementById(id);
        if (!this.template) {
            throw new Error(`Template '${id}' introuvable`);
        }
    }



    /** @template K Nom de l'élément en quoi caster,
     *      ex: `getEl<'div'>(...)` pour avoir un `HTMLDivElement`
     * @throws si l'élément est introuvable */
    protected getEl<K extends keyof HTMLElementTagNameMap>(selector: string | K):
    HTMLElementTagNameMap[K] {
        const el = this.getElSafe(selector);

        if (!el) {
            const id = this.getClass().template!.id;
            throw new Error(
                `Élément '${selector}' introuvable pour le template '${id}'`
            );
        }

        return el;
    }

    /** @template K Nom de l'élément en quoi caster,
     *      ex: `getEl<'div'>(...)` pour avoir un `HTMLDivElement`
     * @returns L'élément si trouvé, `null` sinon */
    protected getElSafe<K extends keyof HTMLElementTagNameMap>(selector: string | K):
    HTMLElementTagNameMap[K] | null {
        return this.fragment.querySelector(selector);
    }

    /** @template K Nom de l'élément en quoi caster,
     *      ex: `getEls<'div'>(...)` pour avoir un `HTMLDivElement[]` */
    protected getEls<K extends keyof HTMLElementTagNameMap>(selector: string | K) {
        return <HTMLElementTagNameMap[K][]> [
            ...this.fragment.querySelectorAll(selector)
        ];
    }

}
