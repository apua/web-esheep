import { listPetSources, Sheep } from "./esheep5.1.js";
import { withDisabled } from "./utils.js";


// Define `petSelector`
const srcs = await listPetSources();
const options = [...srcs.entries()].map(([name, src]) => {
    const opt = document.createElement('option');
    opt.label = name;
    opt.value = src;
    return opt;
});
petSelector.append(...options);
petSelector.addEventListener('input', withDisabled(async event => {
    const xmlPath = event.target.value;
    const animations = await petDemo.update(xmlPath);
    await animationList.update(xmlPath, animations);
}));


// Define how `petDemo` update
petDemo.update = async function(xmlPath) {
    petDemo.stopAnimation();
    await petDemo.useXml(xmlPath);
    petDemo.startAnimation(1);
    return Object.entries(petDemo.animations);
};


// Define how `animationList` update
animationList.update = async function(xmlPath, animations) {
    const detail = a => `${a.frames} ${a.repeat} ${a.repeatfrom}`;
    [...animationList.querySelectorAll('e-sheep')].forEach(esheep => esheep.stopAnimation());
    animationList.replaceChildren(...animations.map(([id, a]) => {
        const temp = document.createElement('template');
        temp.innerHTML = `<tr><td>${id} ${a.name}</td><td><e-sheep data-id="${id}"></e-sheep></td><td>${detail(a)}</td></tr>`;
        return temp.content;
    }));
    const esheeps = [...animationList.querySelectorAll('e-sheep')];
    await Promise.all(esheeps.map(esheep => esheep.useXml(xmlPath)));
    esheeps.forEach(esheep => esheep.startAnimation(esheep.dataset.id));
};


// Select a option
const esheep64 = [...petSelector.children].find(elm => elm.label == 'esheep64');
esheep64.selected = true;
petSelector.dispatchEvent(new Event('input'));
