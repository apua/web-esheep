import { fromUri, listPetSources, startAnimation } from "./esheep5.1.js";


async function setPetSprite(dict) {
    petSprite.src = `data:image/png;base64,${dict.get('image').get('png')}`
}


async function setAnimationList(dict) {
    const img = dict.get('img');
    animationList.replaceChildren(...[...dict.get('animations')].map(ani => {
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
