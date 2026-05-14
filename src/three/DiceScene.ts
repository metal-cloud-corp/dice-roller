import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { DieResult } from '../dice/types';
import { makeFaceTexture } from './diceTextures';

// A pragmatic 3D scene: we render only cubes (d6-style) regardless of die type,
// but tinted by sides and labeled with the correct value. For full geometry
// fidelity (icosahedron etc) we'd swap meshes per sides; this keeps the scope
// manageable while delivering the "dice tumbling on a table" feel.

interface DiceBody {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  result: DieResult;
}

export class DiceScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private world: CANNON.World;
  private dice: DiceBody[] = [];
  private rafId = 0;
  private container: HTMLElement;
  private resizeObs?: ResizeObserver;
  private color = '#ef4444';

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 14, 10);
    this.camera.lookAt(0, 0, 0);

    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(8, 15, 8);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    this.scene.add(dir);

    // table
    const tableGeo = new THREE.PlaneGeometry(40, 40);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    this.scene.add(table);

    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;

    const floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(floorBody);

    // walls to keep dice on the visible area
    this.addWall(new CANNON.Vec3(0, 0, -10), new CANNON.Vec3(0, 0, 0));
    this.addWall(new CANNON.Vec3(0, 0, 10), new CANNON.Vec3(0, Math.PI, 0));
    this.addWall(new CANNON.Vec3(-10, 0, 0), new CANNON.Vec3(0, Math.PI / 2, 0));
    this.addWall(new CANNON.Vec3(10, 0, 0), new CANNON.Vec3(0, -Math.PI / 2, 0));

    this.handleResize();
    this.resizeObs = new ResizeObserver(() => this.handleResize());
    this.resizeObs.observe(container);

    this.loop();
  }

  setColor(hex: string) {
    this.color = hex;
  }

  setGravity(g: number) {
    this.world.gravity.set(0, -g, 0);
  }

  private addWall(pos: CANNON.Vec3, rotEuler: CANNON.Vec3) {
    const b = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    b.position.copy(pos);
    const q = new CANNON.Quaternion();
    q.setFromEuler(rotEuler.x, rotEuler.y, rotEuler.z);
    b.quaternion.copy(q);
    this.world.addBody(b);
  }

  private handleResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private loop = () => {
    this.world.step(1 / 60);
    for (const d of this.dice) {
      d.mesh.position.copy(d.body.position as unknown as THREE.Vector3);
      d.mesh.quaternion.copy(d.body.quaternion as unknown as THREE.Quaternion);
    }
    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.loop);
  };

  clear() {
    for (const d of this.dice) {
      this.scene.remove(d.mesh);
      this.world.removeBody(d.body);
      d.mesh.geometry.dispose();
      (d.mesh.material as THREE.Material[]).forEach?.((m) => m.dispose());
    }
    this.dice = [];
  }

  async rollDice(results: DieResult[]): Promise<void> {
    this.clear();

    for (let i = 0; i < results.length && i < 50; i++) {
      const r = results[i];
      const { mesh, body } = this.makeDie(r);
      this.scene.add(mesh);
      this.world.addBody(body);
      this.dice.push({ mesh, body, result: r });
    }

    // Wait for dice to settle
    await this.waitForSettle();

    // Orient each die so its top face shows the correct value
    for (const d of this.dice) {
      this.orientToValue(d);
    }
  }

  private makeDie(result: DieResult): { mesh: THREE.Mesh; body: CANNON.Body } {
    const size = 1;
    const geo = new THREE.BoxGeometry(size, size, size);

    // 6 face materials. The cube face order in three.js BoxGeometry is:
    //   +X, -X, +Y, -Y, +Z, -Z
    // We pick values for each face based on the rolled result and the die sides.
    const faces = this.facesForDie(result);
    const materials = faces.map((n) =>
      new THREE.MeshStandardMaterial({ map: makeFaceTexture(n, this.color), roughness: 0.5 })
    );

    const mesh = new THREE.Mesh(geo, materials);
    mesh.castShadow = true;

    const body = new CANNON.Body({
      mass: 0.3,
      shape: new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2)),
      position: new CANNON.Vec3(
        (Math.random() - 0.5) * 4,
        8 + Math.random() * 2,
        (Math.random() - 0.5) * 4
      ),
    });
    body.velocity.set(
      (Math.random() - 0.5) * 12,
      -Math.random() * 4,
      (Math.random() - 0.5) * 12
    );
    body.angularVelocity.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    );
    body.allowSleep = true;
    body.sleepSpeedLimit = 0.2;
    body.sleepTimeLimit = 0.3;

    return { mesh, body };
  }

  // The 6 face labels for a die. For dN (N != 6) we show the rolled value on
  // the +Y face after orientToValue runs; other faces are filled with plausible
  // values from 1..N for cosmetic purposes.
  private facesForDie(r: DieResult): number[] {
    const max = r.sides;
    const labels: number[] = [];
    for (let i = 0; i < 6; i++) {
      labels.push(((r.value + i - 1) % max) + 1);
    }
    // Ensure +Y (index 2) shows the rolled value — orientToValue assumes this
    labels[2] = r.value;
    return labels;
  }

  private waitForSettle(): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        clearInterval(iv);
        resolve();
      }, 5000);
      const iv = setInterval(() => {
        const allRest = this.dice.every((d) => {
          const v = d.body.velocity;
          const a = d.body.angularVelocity;
          return v.length() < 0.1 && a.length() < 0.1;
        });
        if (allRest) {
          clearInterval(iv);
          clearTimeout(timeout);
          // small delay for visual stability
          setTimeout(resolve, 150);
        }
      }, 100);
    });
  }

  private orientToValue(d: DiceBody) {
    // The face we baked at +Y (index 2) carries the correct value.
    // Smoothly rotate the body so +Y points up in world space.
    const upLocal = new THREE.Vector3(0, 1, 0);
    const currentQuat = new THREE.Quaternion(
      d.body.quaternion.x,
      d.body.quaternion.y,
      d.body.quaternion.z,
      d.body.quaternion.w
    );
    const upWorld = upLocal.clone().applyQuaternion(currentQuat);
    const desiredUp = new THREE.Vector3(0, 1, 0);
    const correction = new THREE.Quaternion().setFromUnitVectors(upWorld, desiredUp);
    const target = correction.multiply(currentQuat);

    // Tween over ~400ms
    const start = performance.now();
    const dur = 400;
    const startQuat = currentQuat.clone();
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / dur);
      const q = startQuat.clone().slerp(target, t);
      d.body.quaternion.set(q.x, q.y, q.z, q.w);
      d.body.velocity.set(0, 0, 0);
      d.body.angularVelocity.set(0, 0, 0);
      if (t < 1) requestAnimationFrame(step);
    };
    step();
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.resizeObs?.disconnect();
    this.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
