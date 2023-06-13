import { listPetSources, Sheep } from "./esheep5.1.js";


// Init petDemo
const demo = new Sheep().img;
demo.dataset.id = demo.id;
demo.id = petDemo.id;
petDemo.replaceWith(demo);


// Fetch and set options
const srcs = await listPetSources();
const options = [...srcs.entries()].map(([name, src]) => {
    const opt = document.createElement('option');
    opt.label = name;
    opt.value = src;
    return opt;
});
petSelector.append(...options);


// Register listener
petSelector.addEventListener('input', async event => {
    event.target.toggleAttribute('disabled');

    const xmlPath = event.target.value
    const sheep = petDemo.sheep;

    sheep.stopAnimation();
    [...animationList.querySelectorAll('img')].forEach(elm => elm.sheep.stopAnimation());

    await sheep.useXml(xmlPath).then(self => self.startAnimation(1));
    // set petSprite
    petSprite.src = sheep.img.src;
    // re-create and list sheeps
    animationList.replaceChildren(...[...Object.entries(sheep.config.animations)].map(([id, a]) => {
        const sheep = new Sheep();
        sheep.img.dataset.id = id;

        const temp = document.createElement('template');
        temp.innerHTML = `<tr><td>${id} ${a.name}</td><td></td><td></td></tr>`;
        temp.content.querySelector('td:nth-child(2)').append(sheep.img);
        temp.content.querySelector('td:nth-child(3)').textContent = [
            a.frames, a.repeat, a.repeatfrom,
        ].join(' ');
        return temp.content;
    }));
    [...animationList.querySelectorAll('img')].forEach(elm =>
        elm.sheep.useXml(xmlPath).then(self => self.startAnimation(elm.dataset.id))
    );

    event.target.toggleAttribute('disabled');
});


// Select a option
const esheep64 = [...petSelector.children].find(elm => elm.label == 'esheep64');
esheep64.selected = true;
petSelector.dispatchEvent(new Event('input'));
