var createLink = function (link) {
    var minesInRange = link.pos.findInRange(FIND_SOURCES, 2);
    var controllerRange = link.pos.getRangeTo(link.room.controller);

    var type;
    if (minesInRange.length > 0 && controllerRange > 2) {
        type = "empty";
    }
    else if (minesInRange.length === 0 && controllerRange <= 2) {
        type = "fill";
    } else {
        type = "store";
    }

    //save object
    return {
        link: { id: link.id, pos: link.pos },
        type: type,
        improvedTo: 0
    };
}

module.exports = { createController: createController };