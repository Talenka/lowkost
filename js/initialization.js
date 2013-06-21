'use strict';


/**
 * Load web worker
 * @type {string}
 * @const
 */
Physijs.scripts.worker = 'js/physijs_worker.js';


/**
 * Load physical engine
 * @type {string}
 * @const
 */
Physijs.scripts.ammo = 'ammo.js';


/**
 * The universe time
 * @type {Object}
 */
var clock;


/**
 * Window's width in pixel
 * @type {number}
 */
var width;


/**
 * Window's height in pixel
 * @type {number}
 */
var height;


/**
 * The scene with physics
 * @type {Object}
 */
var scene;


/**
 * The renderer engine
 * @type {Object}
 */
var renderer;


/**
 * Conversion ratio from degrees to radians
 * @type {number}
 * @const
 */
var deg2rad = Math.PI / 180;


var camera;


var timer;


var loader;


var droidMaterial;


var getElementPosition = function(element) {
  var top = 0;
  var left = 0;
  do {
    top += element.offsetTop || 0;
    left += element.offsetLeft || 0;
    element = element.offsetParent;
  }
  while (element);

  return {top: top, left: left};
};


// When html is fully loaded :
window.addEventListener('DOMContentLoaded', function() {

  width = window.innerWidth;
  height = window.innerHeight;

  clock = new THREE.Clock();

  scene = new Physijs.Scene;
  scene.setGravity(new THREE.Vector3(0, -9.81, 0));

  // Initialize renderer engine
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(width, height);

  // Activate shadows
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;

  document.body.appendChild(renderer.domElement);

  // Initialize the camera
  camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
  scene.add(camera);

  animate();

  // Start listening to user's controls
  document.addEventListener('keydown', keydownControls);
  document.addEventListener('keyup', keyupControls);
  document.addEventListener('mousemove', mousemoveControls);

  // Say hello, world !
  document.title = 'Talenka Low Kost';

  window.setTimeout(loadStuff, 200);

}, false);
