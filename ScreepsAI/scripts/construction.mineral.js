let createMineral = function (room, mineral) {

    //save object
    return {
        obj: { id: mineral.id, pos: mineral.pos },
        improvedTo: 0
    };
};

module.exports = { createMineral: createMineral };