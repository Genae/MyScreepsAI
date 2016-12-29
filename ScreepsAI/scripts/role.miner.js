var planningJobs = require('planning.jobs');
var _ = require('lodash');

var roleMiner = function (creep) {
    if (_.sum(creep.carry) === creep.carryCapacity) {
        for (var res in creep.carry) {
            if (creep.transfer(creep.room.storage, res) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.storage);
                return;
            }
        }
    } else {
        var mineral = creep.pos.findClosestByRange(FIND_MINERALS);
        if (creep.harvest(mineral) === ERR_NOT_IN_RANGE) {
            creep.moveTo(mineral);
        } 
    }
}

module.exports = { roleMiner: roleMiner };