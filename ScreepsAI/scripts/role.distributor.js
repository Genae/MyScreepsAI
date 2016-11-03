var actionMove = require('action.move');

//convenience


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
var changeToRefilling = function (creep, myExt) {
    //if i have extensions to fill and not enough energy -> refill
    if (myExt !== undefined && myExt !== null && (creep.carry.energy < creep.carryCapacity || creep.carry.energy < myExt.energyCapacity)) {
        creep.memory.state = STATE_REFILLING;
        return true;
    }
    return false;
}

var changeToInjecting = function (creep, myExt) {
    //if i have extensions to fill and enough energy to do so -> inject
    if (myExt !== undefined && myExt !== null && (creep.carry.energy >= myExt.energyCapacity  || creep.carry.energy === creep.carryCapacity)) {
        creep.memory.state = STATE_INJECTING;
        return true;
    }
    return false;
}

var changeToCollecting = function (creep, myExt, droppedEnergy) {
    //if there is no extension to fill -> check if there is energy to collect
    if ((myExt === undefined || myExt === null) && creep.carry.energy === 0 && droppedEnergy.length > 0) {
        creep.memory.state = STATE_COLLECTING;
        return true;
    }
    return false;
}

var changeToEmptying = function (creep, myExt) {
    //if there is no extension to fill -> empty creep
    if (myExt === undefined || myExt === null) {
        creep.memory.state = STATE_EMPTYING;
        return true;
    }
    return false;
}

var changeToStoring = function (creep, myStor) {
    //if there is no extension to fill -> empty creep
    if (myStor !== null && myStor !== undefined) {
        creep.memory.state = STATE_STORING;
        return true;
    }
    return false;
}

//////////////////
//state machine
//////////////////
var roleDistributor = function (creep, room, extensions, droppedEnergy, storage) {
    var it = 0;
    while (it < 10) {
        it++;
        if (creep.memory.moving && creep.room.name === creep.memory.roomName) {
            if (actionMove.continueMove(creep)) {
                return true;
            }
        }

        var myExt = creep.pos.findClosestByRange(extensions);
        var myStor = creep.pos.findClosestByRange(storage);

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
}

var doEmptying = function (creep) {
    var rechargeSpots = creep.room.memory.spawn.rechargeSpots;
    for (var rs = 0; rs < rechargeSpots.length; rs++) {
        if (rechargeSpots[rs].pos.x === creep.pos.x && rechargeSpots[rs].pos.y === creep.pos.y) {
            creep.transfer(Game.getObjectById(creep.room.memory.spawn.resource.id), RESOURCE_ENERGY);
            return;
        }
    }
    actionMove.moveToAny(creep, rechargeSpots.map(function (a) { return a.pos; }));
    return;
}

var doRefilling = function (creep, myStor) {
    var spawn = Game.getObjectById(creep.room.memory.spawn.resource.id);
    if (spawn.energy > 50) {
        var rechargeSpots = creep.room.memory.spawn.rechargeSpots;
        for (var rs = 0; rs < rechargeSpots.length; rs++) {
            if (rechargeSpots[rs].pos.x === creep.pos.x && rechargeSpots[rs].pos.y === creep.pos.y) {
                creep.withdraw(spawn, RESOURCE_ENERGY);
                return;
            }
        }
        actionMove.moveToAny(creep, rechargeSpots.map(function(a) { return a.pos; }));
    } else if (myStor.store[RESOURCE_ENERGY] > 500) {
        if (creep.withdraw(myStor, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, myStor.pos, 1);
        }
    }
    return;
}

var doStoring = function (creep, myStor) {
    if (creep.carry.energy === 0) {
        var needsMove = true;
        var rechargeSpots = creep.room.memory.spawn.rechargeSpots;
        for (var rs = 0; rs < rechargeSpots.length; rs++) {
            if (rechargeSpots[rs].pos.x === creep.pos.x && rechargeSpots[rs].pos.y === creep.pos.y) {
                creep.withdraw(Game.getObjectById(creep.room.memory.spawn.resource.id), RESOURCE_ENERGY);
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
    
}

var doInjecting = function (creep, myExt) {
    if (creep.transfer(myExt, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        actionMove.moveTo(creep, myExt.pos, 1);
    }
    return;
}

var doCollecting = function (creep, droppedEnergy) {
    if (creep.pickup(droppedEnergy[0]) === ERR_NOT_IN_RANGE) {
        actionMove.moveTo(creep, droppedEnergy[0].pos, 1);
    }
    return;
}

module.exports = { roleDistributor: roleDistributor }