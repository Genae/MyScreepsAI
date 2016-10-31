var actionMove = require('action.move');

//convenience


////////////////////////
//       states      //
////////////////////////
const STATE_REFILLING = 'refilling';
const STATE_INJECTING = 'injecting';
const STATE_COLLECTING = 'collecting';
const STATE_EMPTYING = 'emptying';

////////////////////////
//  state conditions  //
////////////////////////
var changeToRefilling = function (creep, myExt) {
    //if i have extensions to fill and not enough energy -> refill
    if (myExt !== undefined && myExt !== null && creep.carry.energy < creep.carryCapacity) {
        creep.memory.state = STATE_REFILLING;
        console.log(creep.memory.state);
        return true;
    }
    return false;
}

var changeToInjecting = function (creep, myExt) {
    //if i have extensions to fill and enough energy to do so -> inject
    if (myExt !== undefined && myExt !== null && (creep.carry.energy - myExt.energy >= myExt.energyCapacity || creep.carry.energy === creep.carryCapacity)) {
        creep.memory.state = STATE_INJECTING;
        console.log(creep.memory.state);
        return true;
    }
    return false;
}

var changeToCollecting = function (creep, myExt, droppedEnergy) {
    //if there is no extension to fill -> check if there is energy to collect
    if (myExt === undefined && creep.carry.energy === 0 && droppedEnergy.length > 0) {
        creep.memory.state = STATE_COLLECTING;
        console.log(creep.memory.state);
        return true;
    }
    return false;
}

var changeToEmptying = function (creep, myExt) {
    //if there is no extension to fill -> empty creep
    if (myExt === undefined) {
        creep.memory.state = STATE_COLLECTING;
        console.log(creep.memory.state);
        return true;
    }
    return false;
}

//////////////////
//state machine
//////////////////
var roleDistributor = function (creep, room, extensions, droppedEnergy) {
    
    if (creep.memory.moving) {
        if (!actionMove.continueMove(creep)) {
            return true;
        }
    }

    var myExt = creep.pos.findClosestByRange(extensions);
   
    //+++++++++++ STATE EMPTYING +++++++++++++++
    if (creep.memory.state === STATE_EMPTYING) {
        if (changeToRefilling(creep, myExt)) {
            return roleDistributor(creep, room, extensions, droppedEnergy);
        }
        if (changeToInjecting(creep, myExt)) {
            return roleDistributor(creep, room, extensions, droppedEnergy);
        }
        if (changeToCollecting(creep, myExt, droppedEnergy)) {
            return roleDistributor(creep, room, extensions, droppedEnergy);
        }

        //I did not change state, so do whatever I have to do here
        return doEmptying(creep);
    }
    //+++++++++++ STATE REFILLING +++++++++++++++
    else if (creep.memory.state === STATE_REFILLING) {
        if (changeToInjecting(creep, myExt)) {
            return roleDistributor(creep, room, extensions, droppedEnergy);
        }
        if (changeToEmptying(creep, myExt)) {
            return roleDistributor(creep, room, extensions, droppedEnergy);
        }

        //I did not change state, so do whatever I have to do here
        return doRefilling(creep);
    }
    //+++++++++++ STATE INJECTING +++++++++++++++
    else if (creep.memory.state === STATE_INJECTING) {
        if (myExt === undefined || myExt === null || !((creep.carry.energy - myExt.energy >= myExt.energyCapacity || creep.carry.energy === creep.carryCapacity))) { // i do not have enough energy or no job
            if (changeToRefilling(creep, myExt)) {
                return roleDistributor(creep, room, extensions, droppedEnergy);
            }
            if (changeToEmptying(creep, myExt)) {
                return roleDistributor(creep, room, extensions, droppedEnergy);
            }
        }

        //I did not change state, so do whatever I have to do here
        return doInjecting(creep, myExt);
    }
    //+++++++++++ STATE INJECTING +++++++++++++++
    else if (creep.memory.state === STATE_COLLECTING) {
        if (creep.carry.energy > 0 || droppedEnergy.length === 0) { //done collecting
            if (changeToInjecting(creep, myExt)) {
                return roleDistributor(creep, room, extensions, droppedEnergy);
            }
           if (changeToRefilling(creep, myExt)) {
               return roleDistributor(creep, room, extensions, droppedEnergy);
            }
            if (changeToEmptying(creep, myExt)) {
                return roleDistributor(creep, room, extensions, droppedEnergy);
            } 
        }

        //I did not change state, so do whatever I have to do here
        return doCollecting(creep, droppedEnergy);
    }
    else {
        creep.memory.state = STATE_EMPTYING;
        return roleDistributor(creep, room, extensions, droppedEnergy);
    }
}

var doEmptying = function (creep) {
    var rechargeSpots = creep.room.memory.spawn.rechargeSpots;
    findRechargeSpot(creep);
    if (creep.memory.rechargeSpot === undefined)
        return;
    if (rechargeSpots[creep.memory.rechargeSpot].pos.x === creep.pos.x && rechargeSpots[creep.memory.rechargeSpot].pos.y === creep.pos.y) {
        creep.transfer(Game.getObjectById(creep.room.memory.spawn.resource.id), RESOURCE_ENERGY);
    } else {
        actionMove.moveTo(creep, rechargeSpots[creep.memory.rechargeSpot].pos);
    }
    return;
}

var doRefilling = function (creep) {
    var rechargeSpots = creep.room.memory.spawn.rechargeSpots;
    findRechargeSpot(creep);
    if (creep.memory.rechargeSpot === undefined)
        return;
    if (rechargeSpots[creep.memory.rechargeSpot].pos.x === creep.pos.x && rechargeSpots[creep.memory.rechargeSpot].pos.y === creep.pos.y) {
        creep.withdraw(Game.getObjectById(creep.room.memory.spawn.resource.id), RESOURCE_ENERGY);
    } else {
        actionMove.moveTo(creep, rechargeSpots[creep.memory.rechargeSpot].pos);
    }
    return;
}

var doInjecting = function (creep, myExt) {
    unblockSlot(creep);
    if (creep.transfer(myExt, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        actionMove.moveTo(creep, myExt.pos);
    }
    return;
}

var doCollecting = function (creep, droppedEnergy) {
    unblockSlot(creep);
    if (creep.pickup(droppedEnergy[0]) === ERR_NOT_IN_RANGE) {
        actionMove.moveTo(creep, droppedEnergy[0].pos);
    }
    return;
}

//Recharge Slots
var findRechargeSpot = function (creep) {
    var rechargeSpots = creep.room.memory.spawn.rechargeSpots;
    if (creep.memory.rechargeSpot === undefined) {
        for (var i = 0; i < rechargeSpots.length; i++) {
            if (!rechargeSpots[i].reserved) {
                rechargeSpots[i].reserved = true;
                creep.memory.rechargeSpot = i;
                break;
            }
        }
    }
}

var unblockSlot = function(creep) {
    if (creep.memory.rechargeSpot !== undefined) {
        creep.room.memory.spawn.rechargeSpots[creep.memory.rechargeSpot].reserved = false;
        creep.memory.rechargeSpot = undefined;
    }
}
module.exports = { roleDistributor: roleDistributor }