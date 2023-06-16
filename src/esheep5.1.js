const parseXml = xml => {
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
};


export const listPetSources = async () => {
    const ref = 'https://adrianotiger.github.io/desktopPet/Pets/pets.json';
    const petSrc = folder => `https://adrianotiger.github.io/desktopPet/Pets/${folder}/animations.xml`;
    const resp = await fetch(ref, {credentials: 'same-origin', cache: "force-cache"});
    const json = await resp.json();
    return new Map(json.pets.map(obj => [obj.folder, petSrc(obj.folder)]));
};


export class Sheep {
    static count = 0;
    static cache = {};

    constructor(img) {  // __init__
        const cls = this.constructor;
        this.img = img === undefined ? document.createElement('img') : img;
        this.pk = cls.count++;
    }

    async useXml(xmlPath) {
        const cls = this.constructor;

        if (xmlPath in cls.cache) {
            this.config = Object.create(cls.cache[xmlPath]);
            this.config.seed = Math.random() * 100;
            await this.initImg(this.config.dict);
            return this;
        }

        const dict = await fetch(xmlPath).then(resp => resp.text()).then(parseXml);
        const size = await this.initImg(dict);
        this.config = {
            xmlPath: xmlPath,
            dict: dict,
            size: size,
            rowlength: Number(dict.get('image').get('tilesx')),
            seed: Math.random() * 100,
            animations: Object.fromEntries(dict.get('animations').map(a => [a.get('id'), {
                name: a.get('name'),
                frames: a.get('sequence').get('frame').map(Number),
                repeat: this.cleanEval(a.get('sequence').get('repeat')),
                repeatfrom: this.cleanEval(a.get('sequence').get('repeatfrom')),
                delay: {
                    start: Number(a.get('start').get('interval')),
                    end: Number(a.get('end').get('interval')),
                },
            }])),
        };
        cls.cache[xmlPath] = this.config;
        return this;
    }

    async initImg(dict) {
        this.img.hidden = true;
        this.img.src = `data:image/png;base64,${dict.get('image').get('png')}`;
        await new Promise(resolve => this.img.addEventListener('load', resolve, {once: true}));
        const size = {
            w: this.img.width / dict.get('image').get('tilesx'),
            h: this.img.height / dict.get('image').get('tilesy'),
        };
        this.img.style = `width: ${size.w}px; height: ${size.h}px; image-rendering: crisp-edges; object-fit: none`;
        return size;
    }

    cleanEval(str) {
        const code = str
            .replace(/random/g, 'Math.random()*100')
            .replace(/screenW|areaW/g, 'window.innerWidth')
            .replace(/screenH|areaH/g, 'window.innerHeight')
            .replace(/randS/g, 'this.config.seed')
            .replace(/imageW/g, 'this.config.size.w')
            .replace(/imageH/g, 'this.config.size.h')
            //.replace(/imageX/g, sheep.imageX)
            //.replace(/imageY/g, sheep.imageY)
            .replace(/Convert\((.*),System.Int32\)/, '$1')
            ;
        return code;
    }

    startAnimation(id) {
        const size = this.config.size;
        const rowLength = this.config.rowlength;
        const a = this.config.animations[id];
        const repeat = eval(a.repeat) | 0, repeatfrom = eval(a.repeatfrom);
        const delayDelta = (a.delay.end - a.delay.start) / a.frames.length
          + (a.frames.length - repeatfrom) * repeat;

        const pos = idx => {
            const x = idx % rowLength;
            const y = idx / rowLength | 0;
            return `-${x * size.w}px -${y * size.h}px`;
        };
        function* steps() {
            yield* a.frames;
            for (const _ of Array(repeat))
                yield* a.frames.slice(repeatfrom);
        }
        const next = () => {
            return {
                stepsIter: steps(),
                delay: a.delay.start,
                delayDelta: delayDelta,
            }
        };
        const draw = args => {
            let step = args.stepsIter.next();
            if (step.done) {
                args = next();
                step = args.stepsIter.next();
            }
            this.img.style.objectPosition = pos(step.value);
            args.delay += delayDelta;
            return args;
        }
        const delay = args => args.delay;

        this.loop(next(), draw, delay);
        this.img.hidden = false;
    }

    loop(args, draw, delay) {
        args = draw(args);
        this.timeoutID = setTimeout(() => this.loop(args, draw, delay), delay(args));
    }

    stopAnimation() {
        if (this.timeoutID !== undefined)
            clearTimeout(this.timeoutID);
    }
}


customElements.define('e-sheep', class Pet extends HTMLElement {
    constructor() {
        super();
        this.pet = new Sheep();
        this.append(this.pet.img);
    }
    get src() {
        return this.pet.img.src;
    }
    get animations() {
        return Object.entries(this.pet.config.animations);
    }
    useXml(xmlPath) {
        return this.pet.useXml(xmlPath);
    }
    startAnimation() {
        return this.pet.startAnimation(this.dataset.id);
    }
    stopAnimation() {
        return this.pet.stopAnimation();
    }
});
