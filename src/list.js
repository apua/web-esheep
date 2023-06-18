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
    await petDemo.update(xmlPath);
    petSprite.src = petDemo.src;
    await animationList.update(xmlPath, petDemo.animations);
}));


// Define how `petDemo` update
petDemo.update = async function(xmlPath) {
    this.stopAnimation();
    this.dataset.id = 1;
    await this.useXml(xmlPath);
    this.startAnimation();
};


// Define how `animationList` update
animationList.update = async function(xmlPath, animations) {
    [...this.querySelectorAll('e-sheep')].forEach(esheep => esheep.stopAnimation());
    this.replaceChildren(...animations.map(([id, a]) => {
        const temp = document.createElement('template');
        temp.innerHTML = `<tr>
            <td>${id} ${a.name}</td>
            <td><e-sheep data-id="${id}"></e-sheep>
            </td><td>${a.frames} ${a.repeat} ${a.repeatfrom}</td>
        </tr>`;
        return temp.content;
    }));
    await Promise.all([...this.querySelectorAll('e-sheep')].map(async pet => {
        await pet.useXml(xmlPath);
        pet.startAnimation();
    }));
};


// Select a option
const esheep64 = [...petSelector.children].find(elm => elm.label == 'esheep64');
esheep64.selected = true;
petSelector.dispatchEvent(new Event('input'));
