let planningJobs = require('planning.jobs');
let lod = require('lodash');

let roleMiner = function (creep) {
    if (lod.sum(creep.carry) === creep.carryCapacity) {
        for (let res in creep.carry) {
            if (creep.transfer(creep.room.storage, res) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.storage);
                return;
            }
        }
    } else {
        let mineral = creep.pos.findClosestByRange(FIND_MINERALS);
        if (creep.harvest(mineral) === ERR_NOT_IN_RANGE) {
            creep.moveTo(mineral);
        }
    }
};

module.exports = { roleMiner: roleMiner };