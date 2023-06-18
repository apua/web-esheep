export const listPetSources = async () => {
    const ref = 'https://adrianotiger.github.io/desktopPet/Pets/pets.json';
    const petSrc = folder => `https://adrianotiger.github.io/desktopPet/Pets/${folder}/animations.xml`;
    const resp = await fetch(ref, {credentials: 'same-origin', cache: "force-cache"});
    const json = await resp.json();
    return new Map(json.pets.map(obj => [obj.folder, petSrc(obj.folder)]));
};


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


const getFrames = ({baseframes, repeat, repeatfrom}) => (function*_(){
    yield* baseframes;
    for (const _ of Array(repeat))
        yield* baseframes.slice(repeatfrom);
})();


const getDelaySequence = ({delay: {start, end}, framesLength}) => (function*_(){
    const delta = (end - start) / framesLength;
    let delay = start;
    for (const _ of Array(framesLength))
        yield delay += delta;
})();


const loopSteps = animation => (function*_(){
    while (true) {
        const delaySeq = getDelaySequence(animation);
        for (const index of getFrames(animation)) {
            yield {
                index: index,
                delay: delaySeq.next().value,
            };
        }
    }
})();


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
            rowLength: Number(dict.get('image').get('tilesx')),
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

    getAnimation(id) {
        const animation = this.config.animations[id];
        const _baseframes = animation.frames;
        const _repeat = eval(animation.repeat) | 0;
        const _repeatfrom = eval(animation.repeatfrom);
        const _framesLength = _baseframes.length + (_baseframes.length - _repeatfrom) * _repeat;
        return {
            repeat: _repeat, repeatfrom: _repeatfrom, baseframes: _baseframes,
            delay: animation.delay, framesLength: _framesLength,
        };
    }

    draw(idx) {
        const {size, rowLength} = this.config;
        const x = idx % rowLength * size.w;
        const y = (idx / rowLength | 0) * size.h;
        this.img.style.objectPosition = `-${x}px -${y}px`;
    }

    loop() {
        const {value, done} = this.steps.next();
        if (done) return;

        const {index, delay} = value;
        this.draw(index);
        this.timeoutID = setTimeout(() => this.loop(), delay);
    }

    startAnimation(id) {  // loop animation by ID
        this.steps = loopSteps(this.getAnimation(id));
        this.loop();
        this.img.hidden = false;

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
