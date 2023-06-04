import { fromUri, listPetSources, startAnimation } from "./esheep5.1.js";


/*
function setAnimation(sprite, dict) {
    const imageSize = {
        w: sprite.width / dict.get('image').get('tilesx'),
        h: sprite.height / dict.get('image').get('tilesy'),
    };

    ani01.style.width = `${imageSize.w}px`;
    ani01.style.height = `${imageSize.h}px`;
    ani01.style.overflow = 'hidden';
    ani01Img.src = sprite.src;
    ani01Img.style.imageRendering = 'crisp-edges';
    ani01Img.style.position = 'relative';
    ani01Img.style.left = `-${10 * imageSize.w}px`;
    ani01Img.style.top = `-${9 * imageSize.h}px`;
    const ani01Run01 = (x = 0) => {
        ani01Img.style.left = `-${(10 + x) * imageSize.w}px`;
        setTimeout(() => ani01Run01(x^1), 250);
    };
    //ani01Run01();
    let last = 0, x = 0;
    const ani01Run02 = (timestamp) => {
        if ((timestamp - last) > 250) {
            last = timestamp;
            x ^= 1;
            ani01Img.style.left = `-${(10 + x) * imageSize.w}px`;
        }
        window.requestAnimationFrame(ani01Run02);
    };
    //ani01Run02();


    ani02.style.imageRendering = 'crisp-edges';
    ani02.style.width = `${imageSize.w}px`;
    ani02.style.height = `${imageSize.h}px`;
    ani02.style.backgroundImage = `url("${sprite.src}")`;
    //ani02.style.backgroundPosition = `-${10 * imageSize.w}px -${9 * imageSize.h}px`;
    ani02.classList.add('runningBg');

    ani03.style.imageRendering = 'crisp-edges';
    ani03.style.width = `${imageSize.w}px`;
    ani03.style.height = `${imageSize.h}px`;
    ani03.src = sprite.src;
    ani03.style.objectFit = 'none';
    //ani03.style.objectPosition = `-${10 * imageSize.w}px -${9 * imageSize.h}px`;
    ani03.animate([
        { objectPosition: '-400px -360px' },
        { objectPosition: '-480px -360px' },
    ], {
        duration: 500,
        easing: 'steps(2)',
        iterations: Infinity,
    });
}
*/


async function setPetSprite(dict) {
    petSprite.src = `data:image/png;base64,${dict.get('image').get('png')}`
}


async function animate01(id, dict, imageSize) {
    const ani = dict.get('animations').find(elm => elm.get('id') == id);
    const seq = ani.get('sequence');
    const arrFrame = seq.get('frame').map(dict.evaluate);
    const repeat = dict.evaluate(seq.get('repeat')) | 0;
    const repeatfrom = dict.evaluate(seq.get('repeatfrom'));
    const delay = {
        start: dict.evaluate(ani.get('start').get('interval')),
        end: dict.evaluate(ani.get('end').get('interval')),
    };
    function* iterSteps(arrFrame, repeat, repeatfrom=0) {
        yield* arrFrame;
        yield* repeat ? iterSteps(arrFrame.slice(repeatfrom), repeat-1) : [];
    }
    const toPos = idx => {
        const pos = {
            x: idx % dict.get('image').get('tilesx'),
            y: idx / dict.get('image').get('tilesx') | 0,
        };
        return `-${pos.y * imageSize.h}px -${pos.x * imageSize.w}px`;
    };
    const lenSteps = arrFrame.length + (arrFrame.length - repeatfrom) * repeat;
    //console.log('rrrr', repeatfrom, repeat);
    const delayDelta = (delay.end - delay.start) / lenSteps;
    //console.log(delayDelta);
    const ani01Run03 = (iterSteps, delay, delayDelta) => {
        const n = iterSteps.next();
        if (!n.done) {
            ani01Img.style.inset = toPos(n.value);
            //console.log('???', n.value, delay, delayDelta);
            setTimeout(() => ani01Run03(iterSteps, delay+delayDelta, delayDelta), delay);
        } else {
            console.log('done');
        }
    };
    //console.log(delay);
    ani01Run03(iterSteps(arrFrame, repeat, repeatfrom), delay.start, delayDelta);
}


async function initAni01(selector, dict) {
    ani01Img.src = `data:image/png;base64,${dict.get('image').get('png')}`;
    await new Promise(resolve => ani01Img.addEventListener('load', resolve, {once: true}));
    const imageSize = {
        w: ani01Img.width / dict.get('image').get('tilesx'),
        h: ani01Img.height / dict.get('image').get('tilesy'),
    };

    ani01.style.width = `${imageSize.w}px`;
    ani01.style.height = `${imageSize.h}px`;
    ani01.style.overflow = 'hidden';
    ani01Img.style.imageRendering = 'crisp-edges';
    ani01Img.style.position = 'relative';

    selector.addEventListener('input', event => animate01(event.target.value, dict, imageSize));
}


async function setAnimationSelector(dict) {
    animationSelector.replaceChildren(...[...dict.get('animations')].map(ani => {
        const opt = document.createElement('option');
        opt.label = `${ani.get('id')} ${ani.get('name')}`;
        opt.value = ani.get('id');
        return opt;
    }));
    [ani01].forEach(elm => elm.toggleAttribute('hidden'));
    await Promise.all([initAni01].map(init => init(animationSelector, dict)));
    animationSelector.dispatchEvent(new Event('input'));
    [ani01].forEach(elm => elm.toggleAttribute('hidden'));
}


async function setAnimationList(dict) {
    const img = dict.get('img');
    animationList.append(...[...dict.get('animations')].map(ani => {
        const temp = document.createElement('template');
        temp.innerHTML = `<tr><td>${ani.get('id')} ${ani.get('name')}</td><td></td><td></td></tr>`;
        temp.content.querySelector('td:nth-child(2)').append(img.cloneNode());
        const spec = dict.getSpecById(ani.get('id'));
        if (spec.delay.start != spec.delay.end)
            temp.content.querySelector('td:nth-child(3)').textContent = [
              `[${spec.repeatfrom},${spec.repeat}]`,
              `[${spec.frames}]`,
              `[${spec.delay.start},${spec.delay.end}]`,
            ].join(' ');
        temp.content.querySelector('img').spec = spec;
        temp.content.querySelector('img').dict = dict;
        return temp.content;
    }));
    animationList.querySelectorAll('img').forEach(startAnimation);
}


petSelector.addEventListener('input', async event => {
    const dict = await fromUri(event.target.value);
    setPetSprite(dict);
    setAnimationSelector(dict);
    setAnimationList(dict);
});


listPetSources().then(srcs => {
    petSelector.append(...[...srcs.entries()].map(
        ([name, src]) => {
            const opt = document.createElement('option');
            opt.label = name;
            opt.value = src;
            return opt;
        }
    ));

    // Select :pet:`esheep64`
    [...petSelector.children].find(elm => elm.label == 'esheep64').selected = true;
    petSelector.dispatchEvent(new Event('input'));
});


document.body.addEventListener('keydown', event => {
    const s = animationSelector;
    if (event.key == 'ArrowDown' && s.selectedIndex < s.options.length-1) {
        s.selectedIndex += 1;
        s.dispatchEvent(new Event('input'));
    } else if (event.key == 'ArrowUp' && s.selectedIndex > 0) {
        s.selectedIndex -= 1;
        s.dispatchEvent(new Event('input'));
    } else {
    }
});
