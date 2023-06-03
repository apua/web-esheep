function parseXml(xml) {
    const dom = (new DOMParser()).parseFromString(xml, 'text/xml');

    // Collect data from dom to dict, focus on web used only
    const dict = new Map([...dom.querySelector(':root').children].map(elm => [ elm.nodeName,
        elm.nodeName == 'header' ?
            new Map([...elm.children].map(elm => [ elm.nodeName,
                elm.textContent
            ]))
        : elm.nodeName == 'image' ?
            new Map([...elm.children].map(elm => [ elm.nodeName,
                elm.textContent
            ]))
        : elm.nodeName == 'spawns' ?
            [...elm.children].map(elm => {
                const dict = new Map();
                [...elm.attributes].forEach(attr => dict.set(attr.name, attr.value));
                [...elm.children].forEach(elm => dict.set(elm.nodeName, elm.textContent));
                return dict;
            })
        : elm.nodeName == 'childs' ?
            [...elm.children].map(elm => {
                const dict = new Map();
                [...elm.attributes].forEach(attr => dict.set(attr.name, attr.value));
                [...elm.children].forEach(elm => dict.set(elm.nodeName, elm.textContent));
                return dict;
            })
        : elm.nodeName == 'animations' ?
            [...elm.children].map(elm => {
                const dict = new Map();
                [...elm.attributes].forEach(attr => dict.set(attr.name, attr.value));
                [...elm.children].forEach(elm => dict.set(elm.nodeName,
                    elm.nodeName == 'name' ?
                        elm.textContent
                    : elm.nodeName == 'start' ?
                        new Map([...elm.children].map(elm => [elm.nodeName, elm.textContent]))
                    : elm.nodeName == 'end' ?
                        new Map([...elm.children].map(elm => [elm.nodeName, elm.textContent]))
                    : elm.nodeName == 'sequence' ?
                        (() => {
                            const dict = new Map(), frame = [], next = [];
                            dict.set('frame', frame);
                            dict.set('next', next);
                            [...elm.attributes].forEach(attr => dict.set(attr.name, attr.value));
                            [...elm.children].forEach(elm => {
                                if (elm.nodeName == 'frame') {
                                    frame.push(elm.textContent);
                                } else if (elm.nodeName == 'next') {
                                    const dict = new Map();
                                    [...elm.attributes].forEach(attr => dict.set(attr.name, attr.value));
                                    dict.set(elm.nodeName, elm.textContent);
                                    next.push(dict);
                                } else {
                                }
                            });
                            return dict;
                        })()
                    : elm.nodeName == 'border' ?
                        [...elm.children].map(elm => {
                            const dict = new Map();
                            [...elm.attributes].forEach(attr => dict.set(attr.name, attr.value));
                            dict.set(elm.nodeName, elm.textContent);
                            return dict;
                        })
                    : elm.nodeName == 'gravity' ?
                        [...elm.children].map(elm => {
                            const dict = new Map();
                            [...elm.attributes].forEach(attr => dict.set(attr.name, attr.value));
                            dict.set(elm.nodeName, elm.textContent);
                            return dict;
                        })
                    : null
                ));
                return dict;
            })
        : null
    ]));

    return dict;
}


export function evaluate(str) {
    const value = Number(str);
    if (!Number.isNaN(value))
        return value;

    console.debug(str);
    const code = str.replace(/random/g, Math.random()*100);
    try {
        return eval(code);
    } catch (error) {
        console.error(error, `str: ${str}, code: ${code}`);
        return 0;
    }
}


export async function fromUri(xmlPath) {
    const resp = await fetch(xmlPath);
    const dict = parseXml(await resp.text());

    {  // setImg
        console.assert(!dict.has('img'));
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${dict.get('image').get('png')}`;
        await new Promise(resolve => img.addEventListener('load', resolve, {once: true}));
        const width = img.width / dict.get('image').get('tilesx');
        const height = img.height / dict.get('image').get('tilesy');
        img.style = `width: ${width}px; height: ${height}px; image-rendering: crisp-edges; object-fit: none`;
        dict.set('img', img);
    }

    dict.getSpecById = function (id) {
        const animation = this.get('animations').find(elm => elm.get('id') == id);

        const frames = animation.get('sequence').get('frame').map(evaluate);
        const repeat = evaluate(animation.get('sequence').get('repeat'));
        const repeatfrom = evaluate(animation.get('sequence').get('repeatfrom')) | 0;
        const delay = {
            start: evaluate(animation.get('start').get('interval')),
            end: evaluate(animation.get('end').get('interval')),
        };

        return {};
    }

    return dict;
}


export async function listPetSources() {
    return new Map([['esheep64', './animation.xml']]);

    const ref = 'https://adrianotiger.github.io/desktopPet/Pets/pets.json';
    const petSrc = folder => `https://adrianotiger.github.io/desktopPet/Pets/${folder}/animations.xml`;
    const resp = await fetch(ref, {credentials: 'same-origin', cache: "force-cache"});
    const json = await resp.json();
    return new Map(json.pets.map(obj => [obj.folder, petSrc(obj.folder)]));
}


// Main
async function main() {
    await fromUri('animation.xml');
}
//main()
