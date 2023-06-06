import { listPetSources, Sheep } from "./esheep5.1.js";


petSelector.addEventListener('input', async event => {
    const xmlPath = event.target.value
    const sheep = petSelector.nextElementSibling.sheep;

    sheep.stopAnimation();
    [...animationList.querySelectorAll('img')].forEach(elm => elm.sheep.stopAnimation());

    await sheep.useXml(xmlPath).then(self => self.startAnimation(31));
    // set petSprite
    petSprite.src = sheep.img.src;
    // re-create and list sheeps
    animationList.replaceChildren(...[...Object.entries(sheep.config.animations)].map(([id, a]) => {
        const sheep = new Sheep();
        sheep.useXml(xmlPath);
        sheep.startAnimation(id);

        const temp = document.createElement('template');
        temp.innerHTML = `<tr><td>${id} ${a.name}</td><td></td><td></td></tr>`;
        temp.content.querySelector('td:nth-child(2)').append(sheep.img);
        temp.content.querySelector('td:nth-child(3)').textContent = [
            a.frames, a.repeat, a.repeatfrom,
        ].join(' ');
        return temp.content;
    }));
});


listPetSources().then(srcs => {
    petSelector.parentElement.append(new Sheep().img);

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
