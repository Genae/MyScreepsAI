let createController = function (controller, room) {

    //find path
    let spanws = room.find(FIND_MY_SPAWNS);
    let pathTo = PathFinder.search(spanws[0].pos, {pos: controller.pos, range: 2});

    //save object
    return {
        obj: {id: controller.id, pos: controller.pos},
        pathTo: pathTo,
        improvedTo: 0
    };
};

module.exports = { createController: createController };