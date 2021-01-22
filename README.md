# EDT INSA
Page web pour voir son emploi du temps de l'INSA, très très inspiré de [edt.jordan-martin.fr](https://edt.jordan-martin.fr/) (peut-être même un peu trop)

## Customisation
- Couleurs des cours
    - [`VEvent` > `COLORS`](src/VEvent.ts)
    - [`VEvent` > `COLOR_MAP`](src/VEvent.ts)
- Noms de cours
    - [`VEvent` > `ALIAS_MAP`](src/VEvent.ts)
- Emojis à côté des noms des jours
    - [`Day` > `NAME_AFFIXES`](src/Day.ts)

## Compilation
1. Packages globaux : `npm i -g browserify`
2. Packages locaux : `npm i`
3. Compilation : `Ctrl+Shift+B` (voir [tasks.json](.vscode/tasks.json))

## Licences
- [Material Design Icons](https://material.io/resources/icons/) (licence [Apache v2.0](https://www.apache.org/licenses/LICENSE-2.0.html))
- [pako](https://github.com/nodeca/pako#readme) (licence [MIT](https://github.com/nodeca/pako/blob/master/LICENSE) et [Zlib](https://github.com/nodeca/pako/tree/master/lib/zlib#readme))
- [Water.css](https://github.com/kognise/water.css) (licence [MIT](https://github.com/kognise/water.css/blob/master/LICENSE.md))
