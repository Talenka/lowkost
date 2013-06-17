

/**
 * List of keyboard codes.
 * @type {Object.<string, number>}
 * @const
 */
var keyboard = {
    escape: 27,
    space: 32,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    q: 81,
    s: 83,
    z: 90,
};


/**
 * true/false : 1st/3rd person camera mode.
 * @type {boolean}
 */
var isCameraFirstPerson = false;


/**
 * Distance betwenn camera and player in 1st person mode
 * @type {number}
 * @const
 */
var firstPersonCameraDistance = 0.5;


/**
 * Distance betwenn camera and player in 3rd person mode
 * @type {number}
 * @const
 */
var thirdPersonCameraDistance = 5;


/**
 * Mouse position
 * @type {{x: number, y: number}}
 */
var mouse = {x: 0, y: 0};


/**
 * Pointer position in the scene
  * @type {{x: number, y: number}}
 */
var pointer = {x: 0, y: 0};


/**
 * Previous pointer position in the scene
 * (in the former iteration of the animation)
  * @type {{x: number, y: number}}
 */
var oldPointer = {x: 0, y: 0};


/**
 * Controls triggered when the mouse position changes within the window.
 * @param {MouseEvent} e
 */
function mousemoveControls(e) {

    mouse = {x: e.clientX - getElementPosition(renderer.domElement).left,
             y: e.clientY - getElementPosition(renderer.domElement).top};

    pointer.x =   (mouse.x / renderer.domElement.width) * 2 - 1;
    pointer.y = - (mouse.y / renderer.domElement.height) * 2 + 1;

    player.camera.x += (oldPointer.x - pointer.x) * player.camera.speed;
    player.camera.y += (oldPointer.y - pointer.y) * player.camera.speed;

    // Bound azimutal camera rotation
    if (player.camera.y > 160) player.camera.y = 160; 
    else if (player.camera.y < -15) player.camera.y = -15;
        
    moveState.angle = (player.camera.x / 2) % 360;

    oldPointer = {x: pointer.x, y: pointer.y};
}


/**
 * Controls triggered when a keyboard key is pressed.
 * @param {KeyboardEvent} e
 */
function keydownControls(e) {

    if (e.keyCode === keyboard.space) {
        changeMotion('jump');
        player.setLinearVelocity(new THREE.Vector3(0, 10, 0));
    }

    if (e.keyCode === keyboard.f) {
        isCameraFirstPerson = !isCameraFirstPerson;

        player.camera.distance = isCameraFirstPerson ?
                                 firstPersonCameraDistance :
                                 thirdPersonCameraDistance;

    }
    else if (e.keyCode === keyboard.c) {
        if (player.model.state === 'stand') changeMotion('crstand');
        else if (player.model.state === 'crstand') changeMotion('stand');
    }
    else if (e.keyCode === keyboard.z || e.keyCode === keyboard.up) {
        moveState.front = true;
        moveState.Backwards = false;
    }
    else if (e.keyCode === keyboard.s || e.keyCode === keyboard.down) {
        moveState.Backwards = true;
        moveState.front = false;
    }
    else if (e.keyCode === keyboard.q || e.keyCode === keyboard.left) {
        moveState.left = true;
        moveState.right = false;
    }
    else if (e.keyCode === keyboard.d || e.keyCode === keyboard.right) {
        moveState.right = true;
        moveState.left = false;
    }
    else return;


    if (!moveState.moving) {
        if (player.model.state === 'stand') changeMotion('run');
        if (player.model.state === 'crstand') changeMotion('crwalk');
        
        moveState.moving = true;
        move();
        timer = setInterval(function(){move();}, 1000 / 60);
    }


}

/**
 * Controls triggered when a keyboard key is released.
 * @param {KeyboardEvent} e
 */
function keyupControls(e) {

    if (e.keyCode === keyboard.z ||
        e.keyCode === keyboard.up) moveState.front = false;

    else if (e.keyCode === keyboard.s ||
             e.keyCode === keyboard.down) moveState.Backwards = false;

    else if (e.keyCode === keyboard.q ||
             e.keyCode === keyboard.left) moveState.left = false;

    else if (e.keyCode === keyboard.d ||
             e.keyCode === keyboard.right) moveState.right = false;

    if (!moveState.front &&
        !moveState.Backwards &&
        !moveState.left &&
        !moveState.right) {
        changeMotion(player.model.state);
        moveState.moving = false;
        clearInterval(timer);
    }
}