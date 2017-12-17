let actionMove = require('action.move');
let storageHelper = require('util.storageHelper');

////////////////////////
//       states      //
////////////////////////
const STATE_REFILLING = 'refilling';
const STATE_INJECTING = 'injecting';
const STATE_COLLECTING = 'collecting';
const STATE_EMPTYING = 'emptying';
const STATE_STORING = 'storing';

////////////////////////
//  state conditions  //
////////////////////////
let changeToRefilling = function (creep, myExt) {
    //if i have extensions to fill and not enough energy -> refill
    if (myExt !== undefined && myExt !== null && creep.carry.energy < myExt.energyCapacity) {
        creep.memory.state = STATE_REFILLING;
        return true;
    }
    return false;
};

let changeToInjecting = function (creep, myExt) {
    //if i have extensions to fill and enough energy to do so -> inject
    if (myExt !== undefined && myExt !== null && (creep.carry.energy >= myExt.energyCapacity || creep.carry.energy === creep.carryCapacity)) {
        creep.memory.state = STATE_INJECTING;
        return true;
    }
    return false;
};

let changeToCollecting = function (creep, myExt, droppedEnergy) {
    //if there is no extension to fill -> check if there is energy to collect
    if ((myExt === undefined || myExt === null) && creep.carry.energy === 0 && droppedEnergy.length > 0) {
        creep.memory.state = STATE_COLLECTING;
        return true;
    }
    return false;
};

let changeToEmptying = function (creep, myExt) {
    //if there is no extension to fill -> empty creep
    if (myExt === undefined || myExt === null) {
        creep.memory.state = STATE_EMPTYING;
        return true;
    }
    return false;
};

let changeToStoring = function (creep, myStor) {
    //if there is no extension to fill -> empty creep
    if (myStor !== null && myStor !== undefined) {
        creep.memory.state = STATE_STORING;
        return true;
    }
    return false;
};

//////////////////
//state machine
//////////////////
let roleDistributor = function (creep) {
    let it = 0;
    if (creep.memory.moving && creep.room.name === creep.memory.roomName) {
        if (actionMove.continueMove(creep)) {
            return true;
        }
    }
    let roomStructures = storageHelper.getStructuresInRoom(creep.room, true, true);
    let extensions = roomStructures.priorityStorage;
    let storage = roomStructures.storage;
    let droppedEnergy = roomStructures.drops;
    for (let l = 0; l < creep.room.memory.structures.links.length; l++) {
        let sl = creep.room.memory.structures.links[l];
        let slObj = Game.getObjectById(sl.link.id);
        if (sl.type === 'store' && slObj.energy <= 200)
            extensions.push(slObj);
    }

    let myExt = creep.pos.findClosestByRange(extensions);
    let myStor = creep.pos.findClosestByRange(storage);

    while (it < 10) {
        it++;


        //+++++++++++ STATE EMPTYING +++++++++++++++
        if (creep.memory.state === STATE_EMPTYING) {
            if (changeToRefilling(creep, myExt)) {
                continue;
            }
            if (changeToInjecting(creep, myExt)) {
                continue;
            }
            if (changeToCollecting(creep, myExt, droppedEnergy)) {
                continue;
            }
            if (changeToStoring(creep, myStor)) {
                continue;
            }

            //I did not change state, so do whatever I have to do here
            return doEmptying(creep);
        }
        //+++++++++++ STATE REFILLING +++++++++++++++
        else if (creep.memory.state === STATE_REFILLING) {
            if (changeToInjecting(creep, myExt)) {
                continue;
            }
            if (changeToEmptying(creep, myExt)) {
                continue;
            }

            //I did not change state, so do whatever I have to do here
            return doRefilling(creep, myStor);
        }
        //+++++++++++ STATE INJECTING +++++++++++++++
        else if (creep.memory.state === STATE_INJECTING) {
            if (myExt === undefined || myExt === null || !((creep.carry.energy - myExt.energy >= myExt.energyCapacity || creep.carry.energy === creep.carryCapacity))) { // i do not have enough energy or no job
                if (changeToRefilling(creep, myExt)) {
                    continue;
                }
                if (changeToEmptying(creep, myExt)) {
                    continue;
                }
            }

            //I did not change state, so do whatever I have to do here
            return doInjecting(creep, myExt);
        }
        //+++++++++++ STATE COLLECTING +++++++++++++++
        else if (creep.memory.state === STATE_COLLECTING) {
            if (creep.carry.energy > 0 || droppedEnergy.length === 0) { //done collecting
                if (changeToInjecting(creep, myExt)) {
                    continue;
                }
                if (changeToRefilling(creep, myExt)) {
                    continue;
                }
                if (changeToEmptying(creep, myExt)) {
                    continue;
                }
            }

            //I did not change state, so do whatever I have to do here
            return doCollecting(creep, droppedEnergy);
        }
        //+++++++++++ STATE STORING +++++++++++++++
        else if (creep.memory.state === STATE_STORING) {
            if (changeToInjecting(creep, myExt)) {
                continue;
            }
            if (changeToRefilling(creep, myExt)) {
                continue;
            }
            if ((myStor === undefined || myStor === null) && changeToEmptying(creep, myExt)) {
                continue;
            }

            //I did not change state, so do whatever I have to do here
            return doStoring(creep, myStor);
        }
        else {
            creep.memory.state = STATE_EMPTYING;
            return 0;
        }
    }
};

let doEmptying = function (creep) {
    let rechargeSpots = creep.room.memory.structures.spawn.rechargeSpots;
    for (let rs = 0; rs < rechargeSpots.length; rs++) {
        if (rechargeSpots[rs].pos.x === creep.pos.x && rechargeSpots[rs].pos.y === creep.pos.y) {
            creep.transfer(Game.getObjectById(creep.room.memory.structures.spawn.obj.id), RESOURCE_ENERGY);
            return;
        }
    }
    actionMove.moveToAny(creep, rechargeSpots.map(function (a) { return a.pos; }));
};

let doRefilling = function (creep, myStor) {
    for (let l = 0; l < creep.room.memory.structures.links.length; l++) {
        if (creep.room.memory.structures.links[l].type === 'store') {
            let link = Game.getObjectById(creep.room.memory.structures.links[l].link.id);
            if (link.energy > 500) {
                if (creep.withdraw(link, RESOURCE_ENERGY, 100) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(link);
                } else if (creep.withdraw(link, RESOURCE_ENERGY, 100) === ERR_FULL) {
                    creep.withdraw(link, RESOURCE_ENERGY);
                }
                return;
            }
        }
    }
    let spawn = Game.getObjectById(creep.room.memory.structures.spawn.obj.id);
    if (myStor === null || (myStor !== null && myStor.store[RESOURCE_ENERGY] <= 500)) {
        let rechargeSpots = creep.room.memory.structures.spawn.rechargeSpots;
        for (let rs = 0; rs < rechargeSpots.length; rs++) {
            if (rechargeSpots[rs].pos.x === creep.pos.x && rechargeSpots[rs].pos.y === creep.pos.y) {
                creep.withdraw(spawn, RESOURCE_ENERGY);
                return;
            }
        }
        actionMove.moveToAny(creep, rechargeSpots.map(function(a) { return a.pos; }));
    } else if (myStor !== null && myStor.store[RESOURCE_ENERGY] > 500) {
        if (creep.withdraw(myStor, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, myStor.pos, 1);
        }
    }
};

let doStoring = function (creep, myStor) {
    if (creep.carry.energy === 0) {
        for (let l = 0; l < creep.room.memory.structures.links.length; l++) {
            if (creep.room.memory.structures.links[l].type === 'store') {
                let link = Game.getObjectById(creep.room.memory.structures.links[l].link.id);
                if (link.energy > 500) {
                    if (creep.withdraw(link, RESOURCE_ENERGY, 100) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(link);
                    } else if (creep.withdraw(link, RESOURCE_ENERGY, 100) === ERR_FULL) {
                        creep.withdraw(link, RESOURCE_ENERGY);
                    }
                    return;
                }
            }
        }
        let needsMove = true;
        let rechargeSpots = creep.room.memory.structures.spawn.rechargeSpots;
        for (let rs = 0; rs < rechargeSpots.length; rs++) {
            if (rechargeSpots[rs].pos.x === creep.pos.x && rechargeSpots[rs].pos.y === creep.pos.y) {
                creep.withdraw(Game.getObjectById(creep.room.memory.structures.spawn.obj.id), RESOURCE_ENERGY);
                needsMove = false;
                if(creep.carry.energy === 0)
                    return;
            }
        }
        if (needsMove) {
            actionMove.moveToAny(creep, rechargeSpots.map(function (a) { return a.pos; }));
            return;
        }
    }
    if (creep.carry.energy > 0) {
        if (creep.transfer(myStor, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, myStor.pos, 1);
        }
    }

};

let doInjecting = function (creep, myExt) {
    if (creep.transfer(myExt, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        actionMove.moveTo(creep, myExt.pos, 1);
    }
};

let doCollecting = function (creep, droppedEnergy) {
    if (creep.pickup(droppedEnergy[0]) === ERR_NOT_IN_RANGE) {
        actionMove.moveTo(creep, droppedEnergy[0].pos, 1);
    }
};

module.exports = { roleDistributor: roleDistributor };