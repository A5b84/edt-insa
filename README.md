# EDT INSA

Page web pour voir son emploi du temps de l'INSA, très très inspiré de [edt.jordan-martin.fr](https://edt.jordan-martin.fr/) (peut-être même un peu trop)

## Customisation
* Couleurs des cours
    - [VEvent.ts](./src/VEvent.ts) > `COLORS`
    - [VEvent.ts](./src/VEvent.ts) > `COLOR_MAP`
* Noms de cours
    - [VEvent.ts](./src/VEvent.ts) > `ALIAS_MAP`
* Emojis à côté des noms des jours
    - [Day.ts](./src/Day.ts) > `NAME_AFFIXES`

## Compilation
1. Packages globaux : `npm i -g typescript browserify`
2. Packages locaux : `npm i`
3. `Ctrl+Shift+B` (pour VSCode, sinon voir [tasks.json](tasks.json))

## Licences
- [Material Design Icons](https://material.io/resources/icons/) (licence [Apache v2.0](https://www.apache.org/licenses/LICENSE-2.0.html))
- [pako](https://github.com/nodeca/pako#readme) (licence [MIT](https://github.com/nodeca/pako/blob/master/LICENSE) et [Zlib](https://github.com/nodeca/pako/tree/master/lib/zlib#readme))
- [Water.css](https://github.com/kognise/water.css) (licence [MIT](https://github.com/kognise/water.css/blob/master/LICENSE.md))
