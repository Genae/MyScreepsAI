let storageHelper = require('util.storageHelper');
let actionMove = require('action.move');
let lod = require('lodash');

let doRefilling = function (creep, noSpawn) {
    if (noSpawn === undefined)
        noSpawn = false;
    let myStor = storageHelper.getStorageToWithdraw(creep, noSpawn);
    if (myStor !== null) {
        if (closest.resourceType !== undefined) {
            if (creep.pickup(myStor) === ERR_NOT_IN_RANGE) {
                actionMove.moveTo(creep, myStor.pos, 1);
            }
            else {
                return lod.sum(creep.carry) === creep.carryCapacity;
            }
        }
        else {
            if (creep.withdraw(myStor, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                actionMove.moveTo(creep, myStor.pos, 1);
            }
            else {
                return lod.sum(creep.carry) === creep.carryCapacity;
            }
        }
    }
    else if (noSpawn) {
        return 'nothingFound'
    }
    return false;
};

module.exports = {doRefilling: doRefilling};