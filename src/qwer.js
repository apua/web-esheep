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
    const pet = petDemo.pet ??= new Sheep(petDemo);
    pet.stopAnimation();
    await pet.useXml(xmlPath);
    pet.startAnimation(1);
    return Object.entries(pet.config.animations);
};


// Define how `animationList` update
animationList.update = async function(xmlPath, animations) {
    const detail = a => `${a.frames} ${a.repeat} ${a.repeatfrom}`;
    const children = animations.map(([id, a]) => {
        const temp = document.createElement('template');
        temp.innerHTML = `<tr><td>${id} ${a.name}</td><td><img></td><td>${detail(a)}</td></tr>`;
        const img = temp.content.querySelector('img');
        img.pet = new Sheep(img);
        img.dataset.id = id;
        return temp.content;
    });
    [...animationList.querySelectorAll('img')].forEach(img => img.pet.stopAnimation());
    animationList.replaceChildren(...children);
    const imgs = [...animationList.querySelectorAll('img')];
    await Promise.all(imgs.map(img => img.pet.useXml(xmlPath)));
    imgs.forEach(img => img.pet.startAnimation(img.dataset.id));
};


// Select a option
const esheep64 = [...petSelector.children].find(elm => elm.label == 'esheep64');
esheep64.selected = true;
petSelector.dispatchEvent(new Event('input'));
