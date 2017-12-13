let controlTowers = function (room) {
    let towers = room.find(FIND_MY_STRUCTURES, { filter: function (structure) { return structure.structureType === STRUCTURE_TOWER; }});
    if (room.memory.info.underAttack) {
        //shoot with towers
        for (let tower of towers) {
            let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: function (hc) { return Memory.globalSettings.allies.indexOf(hc.owner.username) === -1 }
            });
            if (closestHostile) {
                tower.attack(closestHostile);
            }
        }
        //check save mode
        for (let creep of Game.creeps) {
            if (room.name === creep.room.name) {
                if (creep.memory.role === 'attacker') {
                    //fight
                } else if (creep.memory.role === 'builder' || creep.memory.role === 'outharvester') {
                    //dont care
                } else {
                    let targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, {
                        filter: function (hc) { return Memory.globalSettings.allies.indexOf(hc.owner.username) === -1 && hc.pos.x > 2 && hc.pos.x < 47 && hc.pos.y > 2 && hc.pos.y < 47 }
                    });
                    for (let attacker of targets) {
                        if (creep.pos.getRangeTo(attacker.pos) <= 4) {
                            room.controller.activateSafeMode();
                        }
                    }
                    if (targets.length > 0) {
                        //flee
                    }
                }
            }
        }
    } else {
        //repair with tower
        for (let tower of towers) {
            if (towers.energy <= 500)
                continue;
            let repairs = towers.pos.findInRange(FIND_STRUCTURES, 5, {
                filter: function (structure) {
                    return (structure.hits <= structure.hitsMax - 2000 && structure.structureType !== STRUCTURE_RAMPART && structure.structureType !== STRUCTURE_WALL) ||
                        (structure.hits <= room.memory.structures.wallHitpoints - 2000 && (structure.structureType === STRUCTURE_RAMPART || structure.structureType === STRUCTURE_WALL));
                }
            });
            if (repairs.length > 0) {
                tower.repair(repairs[0]);
            }
        }
    }
};

module.exports = { controlTowers: controlTowers };