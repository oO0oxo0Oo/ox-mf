import { Animation } from "../animationEngine"
import { Particle } from "./Particals.js"
import * as THREE from 'three'

export class ConfettiStage extends Animation {
	constructor(game, parent, distance, count) {
		super(false);

		this.game = game;
		this.parent = parent;

		this.distanceFromCube = distance;

		this.count = count;
		this.particles = [];

		this.holder = new THREE.Object3D();
		this.holder.rotation.copy(this.game.world.camera.rotation);

		this.object = new THREE.Object3D();
		this.holder.add(this.object);

		this.resizeViewport = this.resizeViewport.bind(this);
		this.game.world.onResize.push(this.resizeViewport);
		this.resizeViewport();

		this.geometry = this.parent.geometry;
		this.material = this.parent.material;

		this.options = this.parent.options;

		let i = this.count;
		while (i--) this.particles.push(new Particle(this));
	}

	start() {
		this.time = performance.now();
		this.playing = true;

		let i = this.count;
		while (i--) this.particles[i].reset();

		super.start();
	}

	stop(callback) {
		this.playing = false;
		this.completed = 0;
		this.callback = callback;
	}

	reset() {
		super.stop();

		this.callback();
	}

	update() {
		const now = performance.now();
		const delta = now - this.time;
		this.time = now;

		let i = this.count;

		while (i--)
			if (!this.particles[i].completed) this.particles[i].update(delta);

		if (!this.playing && this.completed == this.count) this.reset();
	}

	resizeViewport() {
		const fovRad = this.game.world.camera.fov * THREE.MathUtils.DEG2RAD;

		this.height =
			2 *
			Math.tan(fovRad / 2) *
			(this.game.world.camera.position.length() - this.distanceFromCube);
		this.width = this.height * this.game.world.camera.aspect;

		const scale = 1 / this.game.transition.data.cameraZoom;

		this.width *= scale;
		this.height *= scale;

		this.object.position.z = this.distanceFromCube;
		this.object.position.y = this.height / 2;
	}
}