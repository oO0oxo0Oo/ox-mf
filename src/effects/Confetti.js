import { ConfettiStage } from './ConfettiStorage.js'
import * as THREE from 'three'

export class Confetti {
	constructor(game) {
		this.game = game;
		this.started = 0;

		this.options = {
			speed: { min: 0.0011, max: 0.0022 },
			revolution: { min: 0.01, max: 0.05 },
			size: { min: 0.1, max: 0.15 },
			colors: [0x41aac8, 0x82ca38, 0xffef48, 0xef3923, 0xff8c0a],
		};

		this.geometry = new THREE.PlaneGeometry(1, 1);
		this.material = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });

		this.holders = [
			new ConfettiStage(this.game, this, 1, 20),
			new ConfettiStage(this.game, this, -1, 30),
		];
	}

	start() {
		if (this.started > 0) return;

		this.holders.forEach((holder) => {
			this.game.world.scene.add(holder.holder);
			holder.start();
			this.started++;
		});
	}

	stop() {
		if (this.started == 0) return;

		this.holders.forEach((holder) => {
			holder.stop(() => {
				this.game.world.scene.remove(holder.holder);
				this.started--;
			});
		});
	}

	updateColors(colors) {
		this.holders.forEach((holder) => {
			holder.options.colors.forEach((color, index) => {
				holder.options.colors[index] = colors[["D", "F", "R", "B", "L"][index]];
			});
		});
	}
}