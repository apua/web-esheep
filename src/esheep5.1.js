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
        return {
            id: id,
            frames: animation.get('sequence').get('frame').map(dict.evaluate),
            repeat: dict.evaluate(animation.get('sequence').get('repeat')) | 0,
            repeatfrom: dict.evaluate(animation.get('sequence').get('repeatfrom')),
            delay: {
                start: dict.evaluate(animation.get('start').get('interval')),
                end: dict.evaluate(animation.get('end').get('interval')),
            },
        };
    }

    dict.set('seed', Math.random() * 100);
    dict.evaluate = function (str) {
        const value = Number(str);
        if (!Number.isNaN(value))
            return value;

        console.debug(str);
        const code = str
            .replace(/random/g, Math.random()*100)
            .replace(/screenW|areaW/g, window.innerWidth)
            .replace(/screenH|areaH/g, window.innerHeight)
            .replace(/randS/g, this.get('seed'))
            .replace(/imageW/g, this.get('img').width)
            .replace(/imageH/g, this.get('img').height)
            //.replace(/imageX/g, sheep.imageX)
            //.replace(/imageY/g, sheep.imageY)
            .replace(/Convert\((.*),System.Int32\)/, '$1')
            ;

        try {
            return eval(code);
        } catch (error) {
            console.error(error, `str: ${str}, code: ${code}`);
            return 0;
        }
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


export function startAnimation(elm) {
    const spec = elm.spec, dict = elm.dict;
    const img = dict.get('img'), w = Number.parseInt(img.style.width), h = Number.parseInt(img.style.height);
    const rowLen = Number(dict.get('image').get('tilesx'));
    const delayDelta = (spec.delay.end - spec.delay.start)
        / spec.frames.length + (spec.frames.length - spec.repeatfrom) * spec.repeat;
    const pos = idx => {
        const x = idx % rowLen;
        const y = idx / rowLen | 0;
        return `-${x * w}px -${y * h}px`;
    };
    function* steps() {
        yield* spec.frames;
        for (const _ of Array(spec.repeat))
            yield* spec.frames.slice(spec.repeatfrom);
    }
    const draw = (stepsIter=steps(), delay=spec.delay.start) => {
        const step = stepsIter.next();
        if (step.done) {
            draw();
        } else {
            elm.style.objectPosition = pos(step.value);
            setTimeout(() => draw(stepsIter, delay+delayDelta), delay);
        }
    };
    draw();
}


// Main
async function main() {
    await fromUri('animation.xml');
}
//main()
