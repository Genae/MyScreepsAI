let controlLinks = function (room) {
    let links = {
        store: [],
        empty: [],
        fill: []
    };
    if (room.memory.structures.links === undefined)
        return;

    for (let i = 0; i < room.memory.structures.links.length; i++) {
        links[room.memory.structures.links[i].type].push(room.memory.structures.links[i]);
    }

    for (let i = 0; i < room.memory.structures.links.length; i++) {
        let link = Game.getObjectById(room.memory.structures.links[i].obj.id);
        if (link.cooldown > 0)
            continue;
        let targets = [];
        if (room.memory.structures.links[i].type === 'empty') {
            for (let j = 0; j < links.store.length; j++) {
                let link2 = Game.getObjectById(links.store[j].obj.id);
                targets[Math.floor((800 - link2.energy) / link.pos.getRangeTo(link2.pos))] = link2;
                if (link2.energy < 800) {
                    link.transferEnergy(link2);
                    break;
                }
            }
        }
        if (room.memory.structures.links[i].type === 'empty' || room.memory.structures.links[i].type === 'store') {
            for (let j = 0; j < links.fill.length; j++) {
                let link2 = Game.getObjectById(links.fill[j].obj.id);
                targets[Math.floor((800 - link2.energy) / link.pos.getRangeTo(link2.pos)) * 2] = link2;
                if (link2.energy < 700) {
                    link.transferEnergy(link2);
                    break;
                }
            }

        }
        if (targets.length > 0) {
            link.transferEnergy(targets[targets.length - 1]);
        }
    }
};

module.exports = { controlLinks: controlLinks };