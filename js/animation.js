'use strict';


/**
 * The player
 * @type {Object}
 */
var player = {
  model: {objects: new THREE.Object3D(), motion: 'stand', state: 'stand'},
  position: {x: 0, y: 0, z: 0, direction: 0},
  camera: {speed: 500, distance: thirdPersonCameraDistance, x: 0, y: 0, z: 0},
  physicalShape: false,
  modelHeight: 1.2,
  modelRadius: 0.3
};


var md2meshBody;


/**
 * @type {Object}
 */
var moveState = {
  moving: false,
  front: false,
  Backwards: false,
  left: false,
  right: false,
  speed: .1,
  angle: 0
};


/**
 * Structure of the droid model json file :
 * This file contain a list of all vertex position, for each motion type.
 *
 * MOTION: [START_INDEX,
 *          END_INDEX,
 *          FRAMEPERSECOND,
 *          {state: STANDSTATE, action: false}],
 *
 * @type {Object.<string, Array>}
 * @const
 */
var md2frames = {
  stand: [0, 39, 9, {state: 'stand', action: false}],
  run: [40, 45, 10, {state: 'stand', action: false}],
  attack: [46, 53, 10, {state: 'stand', action: true}],
  pain1: [54, 57, 7, {state: 'stand', action: true}],
  pain2: [58, 61, 7, {state: 'stand', action: true}],
  pain3: [62, 65, 7, {state: 'stand', action: true}],
  jump: [66, 71, 7, {state: 'stand', action: true}],
  flip: [72, 83, 7, {state: 'stand', action: true}],
  salute: [84, 94, 7, {state: 'stand', action: true}],
  taunt: [95, 111, 10, {state: 'stand', action: true}],
  wave: [112, 122, 7, {state: 'stand', action: true}],
  point: [123, 134, 6, {state: 'stand', action: true}],
  crstand: [135, 153, 10, {state: 'crstand', action: false}],
  crwalk: [154, 159, 7, {state: 'crstand', action: false}],
  crattack: [160, 168, 10, {state: 'crstand', action: true}],
  crpain: [196, 172, 7, {state: 'crstand', action: true}],
  crdeath: [173, 177, 5, {state: 'freeze', action: true}],
  death1: [178, 183, 7, {state: 'freeze', action: true}],
  death2: [184, 189, 7, {state: 'freeze', action: true}],
  death3: [190, 197, 7, {state: 'freeze', action: true}],
  boom: [198, 198, 5]};


/**
 * The player direction
 * @type {number}
 */
var direction = 0;


function move() {

  if (player.model.motion !== 'run' && player.model.state === 'stand')
    changeMotion('run');

  else if (player.model.motion !== 'crwalk' && player.model.state === 'crstand')
    changeMotion('crwalk');

  var speed = moveState.speed;

  if (player.model.state === 'crstand') speed *= .5;
  else if (player.model.state === 'freeze') speed = 0;

  direction = moveState.angle;

  if (moveState.front) {
    if (moveState.left) direction = 45;
    else if (moveState.right) direction = 315;
    else direction = 0;
  }
  else if (moveState.Backwards) {
    if (moveState.left) direction = 135;
    else if (moveState.right) direction = 225;
    else direction = 180;
  }
  else {
    if (moveState.left) direction = 90;
    else if (moveState.right) direction = 270;
    else direction = 0;
  }

  direction += player.camera.x / 2;

  player.model.objects.rotation.y = direction * deg2rad;
  player.position.x -= Math.sin(direction * deg2rad) * speed;
  player.position.z -= Math.cos(direction * deg2rad) * speed;
}

function changeMotion(motion) {
  player.model.motion = motion;
  player.model.state = md2frames[motion][3].state;

  var animMin = md2frames[motion][0];
  var animMax = md2frames[motion][1];
  var animFps = md2frames[motion][2];

  md2meshBody.time = 0;
  md2meshBody.duration = 1000 * ((animMax - animMin) / animFps);
  md2meshBody.setFrameRange(animMin, animMax);
}

function animate() {
  requestAnimationFrame(animate);

  player.model.objects.position = {x: player.position.x,
                                    y: player.position.y,
                                    z: player.position.z};

  // Update the physical shape's position
  // @TODO
  if (player.physicalShape) {
    player.physicalShape.position.x = player.position.x;
    player.physicalShape.position.y = player.position.y +
                                      player.modelHeight / 2;
    player.physicalShape.position.z = player.position.z;
  }

  // Camera x-rotation (up-down)
  camera.position.x = player.position.x + player.camera.distance *
                      Math.sin(player.camera.x * deg2rad / 2);

  camera.position.z = player.position.z + player.camera.distance *
                      Math.cos(player.camera.x * deg2rad / 2);

  // Camera y-rotation (left-right)
  camera.position.y = 1 + player.position.y + player.camera.distance *
                      Math.sin(player.camera.y * deg2rad / 2);

  camera.lookAt(new THREE.Vector3(player.position.x,
                                  player.position.y + 1,
                                  player.position.z));

  // Model animation
  var delta = clock.getDelta();

  if (md2meshBody) {

    var isEndFleame =
        (md2frames[player.model.motion][1] === md2meshBody.currentKeyframe);

    var isAction = md2frames[player.model.motion][3].action;

    if (!isAction || (isAction && !isEndFleame))
      md2meshBody.updateAnimation(1000 * delta);

    else if (/freeze/.test(md2frames[player.model.motion][3].state)) {
      // If player is dead...
    }
    else changeMotion(player.model.state);
  }

  renderer.render(scene, camera);

  scene.simulate();
}


/**
 * Function called when the player's shape collide another object
 * @param {Object} collided The collided object pointer.
 * @param {THREE.Vector3} velocity The relative velocity of both objects.
 * @param {THREE.Vector3} momentum The relative angular momentum.
 */
function playerCollision(collided, velocity, momentum) {
  console.log(velocity);
  // @TODO
  // player.physicalShape
}


function loadSkyAndGround() {
  // Create the blue sky
  scene.fog = new THREE.FogExp2(0x9999ff, 0.01);
  var ambientLight = new THREE.AmbientLight(0x202020);
  scene.add(ambientLight);

  // Create the ground (grass field)
  var planeGeometry = new THREE.PlaneGeometry(1000, 1000);

  var planeMaterial = Physijs.createMaterial(
      new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture('images/grass.png'),
        color: 0xffffff}),
      .8, // high friction
      .3 // low restitution
      );

  planeMaterial.map.repeat.set(300, 300);
  planeMaterial.map.wrapS = planeMaterial.map.wrapT = THREE.RepeatWrapping;

  var plane = new Physijs.BoxMesh(planeGeometry, planeMaterial, 0);

  plane.castShadow = false;
  plane.receiveShadow = true;
  scene.add(plane);

  // Create sunlight
  var sunlight = new THREE.DirectionalLight(0xfffffa, 1.5);
  sunlight.position.set(1, 50, 1).normalize();
  sunlight.castShadow = true;
  scene.add(sunlight);
}


function loadPlayerMesh() {

  droidMaterial = new THREE.MeshLambertMaterial({
    map: THREE.ImageUtils.loadTexture('images/1.png'),
    ambient: 0x999999,
    color: 0xffffff,
    specular: 0xffffff,
    shininess: 25,
    morphTargets: true});

  loader = new THREE.JSONLoader();

  loader.load('js/droid.js', function(geometry) {
    md2meshBody = new THREE.MorphAnimMesh(geometry, droidMaterial);
    md2meshBody.rotation.y = -Math.PI / 2;
    md2meshBody.scale.set(.02, .02, .02);
    md2meshBody.position.y = .5;
    md2meshBody.castShadow = true;
    md2meshBody.receiveShadow = true;
    changeMotion('stand');
    player.model.objects.add(md2meshBody);
  });

  // Now that we have the droid model, we have to bind it to a physical shape
  // in order to manage collision and jumps, for example.
  // The shape is simply a cylinder
  player.physicalShape = new Physijs.BoxMesh(
      new THREE.CylinderGeometry(player.modelRadius,
                                 player.modelRadius,
                                 player.modelHeight,
                                 16, 4, false),
      new THREE.MeshLambertMaterial({opacity: 0.3, transparent: true}),
      1); // Mass

  player.physicalShape.position.y = player.modelHeight / 2;

  player.physicalShape.addEventListener('collision', playerCollision);

  // Insert the player
  scene.add(player.model.objects);
  scene.add(player.physicalShape);
}


function createCubes() {
  var meshArray = [];

  for (var i = 0; i < 50; i++) {

    meshArray[i] = new Physijs.BoxMesh(new THREE.CubeGeometry(1 + Math.random(),
                                                              Math.random(), 1),
                                       new THREE.MeshLambertMaterial({
                                         color: 0xffffff * Math.random()}));

    meshArray[i].position.x = i % 2 * 5 - 2.5;
    meshArray[i].position.y = 10 * Math.random();
    meshArray[i].position.z = -0.8 * i;

    meshArray[i].rotation.x = Math.random();
    meshArray[i].rotation.y = Math.random();
    meshArray[i].rotation.z = Math.random();

    meshArray[i].castShadow = true;
    meshArray[i].receiveShadow = true;
    scene.add(meshArray[i]);
  }
}
