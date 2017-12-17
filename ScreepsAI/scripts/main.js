let roleHarvester = require('role.harvester');
let roleBuilder = require('role.builder');
let roleUpgrader = require('role.upgrader');
let roleWarrior = require('role.warrior');
let roleDistributor = require('role.distributor');
let roleOutharvester = require('role.outharvester');
let roleReserver = require('role.reserver');
let roleMiner = require('role.miner');
let roleClaimer = require('role.claimer');
let systemLinks = require('system.links');
let systemTowers = require('system.towers');
let planningUnits = require('planning.units');
let planningRoom = require('planning.room');
let grafana = require('util.grafana');
let storageHelper = require('util.storageHelper');

let last = 0;
let snapshot = { byRoom:{}, byRole: {}};


let createSnapshot = function (role, room) {
    let cpu = Game.cpu.getUsed();
    if (last > cpu)
        last = 0;
    let change = cpu - last;
    last = cpu;
    if (snapshot.byRoom[room] === undefined)
        snapshot.byRoom[room] = {cpu: 0, count: 0};
    snapshot.byRoom[room].cpu += change;
    snapshot.byRoom[room].count++;
    if (snapshot.byRole[role] === undefined)
        snapshot.byRole[role] = {cpu: 0, count: 0};
    snapshot.byRole[role].cpu += change;
    snapshot.byRole[role].count++;
};

////////////
//INIT
////////////
module.exports.loop = function () {
    last = 0;
    snapshot = { byRoom:{}, byRole: {}};
    if (Memory.globalSettings){}
    createSnapshot('memory', 'global');
    let errors = [];
    try {
        mainLoop(errors);
    }
    catch (e) {
        errors.push(e);
        console.log("Uncaught error in Main Loop: " + e);
    }

    if (errors.length > 0) {
        console.log(errors.length + " errors");
        throw errors[0];
    }
};
////////////
//Main Loop
////////////
let mainLoop = function (errors) {
    let e;
    //Load Settings
    const settings = loadGlobalSettings();
    if (!settings.runScripts)
        return;
    createSnapshot('loadSettings', 'global');

    //Global Planning
    let globalInfo;
    try {
        storageHelper.cleanCache();
        globalInfo = loadGlobalInfo();
        if (globalInfo.needsGlobalPlanning) {
            //TODO global planning
        }
        globalInfo.needsGlobalPlanning = false;
        createSnapshot('globalPlanning', 'global');
    } catch (e) {
        console.log("Error while global Planning: " + e);
        errors.push(e);
    }

    //Load Room Infos
    const roomInfo = [];
    try {
        for (let name in Game.rooms) {
            roomInfo[name] = loadRoomInfo(name);
            createSnapshot('loadRoomInfo', name);
        }
        //TODO other rooms for mining/expanding/attacking
        for (let roomName in Game.rooms){
            let room = Game.rooms[roomName];
            if (room.memory.underAttack) {
                globalInfo.roomsUnderAttack.push(room.controller.pos);
                break;
            }
            createSnapshot('loadRoomInfo', 'global');
        }
    } catch (e) {
        console.log("Error while getting room info: " + e);
        errors.push(e);
    }
    try {
        tickDownControllers();
    } catch (e) {
        console.log("Error while ticking down controllers: " + e);
        errors.push(e);
    }
    try {
        checkSlaveRooms();
        createSnapshot('checkSlaveRooms', 'global');
    } catch (e) {
        console.log("Error while checking for new slave rooms: " + e);
        errors.push(e);
    }

    //Cleanup Memory
    try {
        removeDeadCreeps();
    } catch (e) {
        console.log("Error while removing dead creeps: " + e);
        errors.push(e);
    }

    try {
        removeMissingDrops();
        createSnapshot('cleanupMemory', 'global');
    } catch (e) {
        console.log("Error while removing missing drops: " + e);
        errors.push(e);
    }

    //Run Systems
    try {
        for (let roomName in Game.rooms) {
            systemTowers.controlTowers(Game.rooms[roomName]);
            createSnapshot('runTowers', roomName);
        }
    } catch (e) {
        console.log("Error while controlling towers: " + e);
        errors.push(e);
    }

    //Run Units
    let builders = [];
    for (let creepName in Game.creeps) {
        let creep = Game.creeps[creepName];
        try {
            if (creep.memory.roomName === undefined)
                creep.memory.roomName = creep.room.name;
            let homeRoom = Game.rooms[creep.memory.roomName];

            if (creep.memory.role === 'harvester') {
                roleHarvester.roleHarvester(creep);
            }
            if (creep.memory.role === 'outharvester') {
                roleOutharvester.roleOutHarvester(creep);
            }
            if (creep.memory.role === 'builder') {
                builders.push(creep);
            }
            if (creep.memory.role === 'upgrader') {
                roleUpgrader.roleUpgrader(creep);
            }
            if (creep.memory.role === 'attacker') {
                roleWarrior.roleWarrior(creep);
            }
            if (creep.memory.role === 'healer') {
                roleWarrior.roleWarrior(creep);
            }
            if (creep.memory.role === 'reserver') {
                roleReserver.roleReserver(creep);
            }
            if (creep.memory.role === 'miner') {
                roleMiner.roleMiner(creep);
            }
            if (creep.memory.role === 'distributor') {
                roleDistributor.roleDistributor(creep, homeRoom);
            }
            if (creep.memory.role === 'claimer') {
                roleClaimer.roleClaimer(creep);
            }
            createSnapshot('role_' + creep.memory.role, homeRoom.name);
        } catch (e) {
            console.log("error with " + creep.memory.role + " " + creep.name + ": " + e);
            errors.push(e);
        }

    }
    for (let b = 0; b < builders.length; b++) {
        let homeRoom = Game.rooms[builders[b].memory.roomName];
        try {
            roleBuilder.roleBuilder(builders[b]);
            createSnapshot('role_builder', homeRoom.name);
        } catch (e) {
            console.log("error with builder " + builders[b].name + ": " + e);
            errors.push(e);
        }
    }

    //Plan Room Development
    try {
        let i = 0;
        for (const roomName in Game.rooms){
            if (roomInfo[roomName].rescan){
                planningRoom.scanRoom(Game.rooms[roomName]);
                roomInfo[roomName].rescan = false;
            }
            if (((Game.time + i) % 2) === 0)
                planningRoom.planRoomConstruction(Game.rooms[roomName]);
            if (((Game.time + i + 1) % 2) === 0)
                planningUnits.buildUnits(Game.rooms[roomName]);
            i+=2;
            createSnapshot('roomPlanning', roomName);
        }
    } catch (e) {
        console.log("Error while planning rooms: " + e);
        errors.push(e);
    }

    try {
        for (const roomName in Game.rooms){
            systemLinks.controlLinks(Game.rooms[roomName]);
            createSnapshot('runLinks', roomName);
        }
    } catch (e) {
        console.log("Error while controlling links: " + e);
        errors.push(e);
    }
    
    try{
        if (((Game.time) % 10) === 0)
            grafana.collectStats(snapshot, last);
    }
    catch (e){
        console.log("Error while getting game stats: " + e);
        errors.push(e);
    }

};

////////////
// Functions
////////////

//Load GlobalSettings
let loadGlobalSettings = function() {
    if (Memory.globalSettings === undefined) {
        Memory.globalSettings = {
            runScripts: false,
            autoMineExternal: false,
            autoExpand: false,
            autoAttack: false,
        };
    }
    if (Memory.flags === undefined){
        Memory.flags = {};
    }
    Memory.globalSettings.allies = ['Hosmagix', 'KHJGames'];
    return Memory.globalSettings;
};


//Load GlobalInfo
let loadGlobalInfo = function () {
    if (Memory.globalInfo === undefined) {
        Memory.globalInfo = {
            needsGlobalPlanning: false,
            roomsUnderAttack: []
        };
    }
    Memory.globalInfo.roomsUnderAttack = [];
    return Memory.globalInfo;
};

//Load RoomInfo
let loadRoomInfo = function(roomName){
    const room = Game.rooms[roomName];
    if (room.memory === undefined)
        room.memory = {};
    if (room.memory.info === undefined) {
        room.memory.thisJobs = {};
        room.memory.info = {
            lastSeen: Game.time,
            isMaster: room.controller && room.controller.my,
            masterRoom: undefined,
            slaveRooms: [],
            controllerLevel: room.controller ? room.controller.level : -1,
            needsPlanning: true,
            rescan: true,
            underAttack: false,
            energy: {
                reservedDrops: [],
                canBuild: true,
                fullSpawn: 0
            }
        };
    }
    room.memory.info.lastSeen = Game.time;
    if (room.controller && room.controller.level > 1 && !room.isMaster){
        removeSlaveStatus(room.name);
    }
    //check attackers
    let enemys = room.find(FIND_HOSTILE_CREEPS, {
        filter: function (hc) { return Memory.globalSettings.allies.indexOf(hc.owner.username) === -1 }
    });
    let spawnCount = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN } }).length;
    room.memory.underAttack = enemys.length > 0 && (Memory.rooms[roomName].info.masterRoom !== undefined || spawnCount > 0);
    //check new Base
    if (spawnCount > 0 && room.memory.info.masterRoom !== undefined) {
        let index = Memory.rooms[room.memory.info.masterRoom].info.slaveRooms.indexOf(roomName);
        if (index > -1) {
            Memory.rooms[Memory.rooms[roomName].info.masterRoom].info.slaveRooms.splice(index, 1);
        }
        room.memory.info.masterRoom = undefined
    }
    //check contoller upgraded
    if (room.memory.info.isMaster){
        if (room.memory.info.controllerLevel !== room.controller.level){
            room.memory.info.controllerLevel = room.controller.level;
            room.memory.info.needsPlanning = true;
        }
    }

    //reset jobs
    room.memory.lastJobs = room.memory.thisJobs;
    room.memory.thisJobs = {};

    return room.memory.info;
};

//check slave rooms
let checkSlaveRooms = function () {
    for (let flagName in Game.flags) {
        let flag = Game.flags[flagName];
        if (flag.color === COLOR_BROWN) {
            if (flag.memory === undefined)
                flag.memory = {
                    improvedTo: 0
                };
            if (Memory.rooms[flag.pos.roomName] === undefined) {
                Memory.rooms[flag.pos.roomName] = {
                    info: {
                        lastSeen: Game.time,
                        isMaster: false,
                        masterRoom: undefined,
                        slaveRooms: [],
                        controllerLevel: -1,
                        needsPlanning: true,
                        rescan: true,
                        underAttack: false,
                        energy: {
                            reservedDrops: [],
                            canBuild: true,
                            fullSpawn: 0
                        }
                    }
                };
            }
            if (Memory.rooms[flag.pos.roomName].info.isMaster){
                Memory.rooms[flag.pos.roomName].info.slaveRooms = [];
                flag.remove();
            }
            let master = Memory.rooms[flag.pos.roomName].info.masterRoom;
            if (Memory.rooms[flag.pos.roomName].info.masterRoom === undefined) {
                master = findClosestRoom(flag.pos);
                Memory.rooms[flag.pos.roomName].info.masterRoom = master;
                Game.rooms[master].memory.info.slaveRooms.push(flag.pos.roomName);
            } else {
                if (Game.rooms[flag.pos.roomName] !== undefined && flag.room.controller.level > 1) {
                    removeSlaveStatus(flag.pos.roomName);
                    flag.remove();
                }
            }
            if (flag.memory.improvedTo === 0 && Game.rooms[master] && Game.rooms[master].memory.structures.improveTo >= 3){
                Game.rooms[master].memory.info.needsPlanning = true;
            }
        }
    }
};
let removeSlaveStatus = function (roomName) {
    Memory.rooms[roomName].underAttack = false;
    let master = Memory.rooms[roomName].info.masterRoom;
    Memory.rooms[roomName].info.masterRoom = undefined;
    Memory.rooms[roomName].info.isMaster = true;
    let index = Game.rooms[master] ? (Game.rooms[master].memory.slaveRooms ? Game.rooms[master].memory.slaveRooms.indexOf(roomName) : -1) : -1;
    if (index > -1) {
        Game.rooms[master].memory.slaveRooms.splice(index, 1);
    }
};

let findClosestRoom = function (start) {
    let goals = [];
    for (let spawn in Game.spawns) {
        goals.push({ pos: Game.spawns[spawn].pos, range: 1 });
    }
    let res = PathFinder.search(start, goals);
    return res.path[res.path.length - 1].roomName;
};

//Remove Dead Creeps
let removeDeadCreeps = function () {
    for (let i in Memory.creeps) {
        if (!Game.creeps[i]) {
            if (Memory.creeps[i].rechargeSpot !== undefined) {
                const cr = Game.rooms[Memory.creeps[i].roomName];
                cr.memory.spawn.rechargeSpots[Memory.creeps[i].rechargeSpot].reserved = false;
            }
            delete Memory.creeps[i];
        }
    }
};

//Remove Missing Drops
let removeMissingDrops = function () {
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];
        const drops = [];
        let energy = room.memory.info.energy;
        for (let i = 0; i < energy.reservedDrops.length; i++) {
            if (Game.getObjectById(energy.reservedDrops[i]) !== null)
                drops.push(energy.reservedDrops[i]);
        }
        energy.reservedDrops = drops;
    }
};

//tick down Controller Reservations
let tickDownControllers = function () {
    for (let rn in Memory.rooms) {
        let room = Memory.rooms[rn];
        if (room.controllerTicks !== undefined)
            room.controllerTicks--;
    }
};