
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// tslint:disable:organize-imports
// tslint:disable:ban-malformed-import-paths
// tslint:disable:no-new-decorators

import { LitElement, css, html, PropertyValueMap } from 'lit';
import { UpdatingElement } from 'lit/updating-element.js'; // Import UpdatingElement specifically
import { customElement, property, state }
from 'lit/decorators.js';
import { Analyser } from './live-audio-analyzer';

import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
// import { FXAAShader } from 'three/addons/shaders/FXAAShader.js'; // FXAA can be optional if MSAA is used
import { fs as backdropFS, vs as backdropVS } from './live-audio-backdrop-shader';
import { vs as sphereVS } from './live-audio-sphere-shader';

/**
 * 3D live audio visual.
 */
@customElement('gdm-live-audio-visuals-3d')
export class GdmLiveAudioVisuals3D extends LitElement {
  private inputAnalyser: Analyser | null = null;
  private outputAnalyser: Analyser | null = null;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private backdrop!: THREE.Mesh;
  private composer!: EffectComposer;
  private sphere!: THREE.Mesh;
  private prevTime = 0;
  private rotation = new THREE.Vector3(0, 0, 0);

  private originalSphereEmissive = new THREE.Color(0x000010);
  private originalSphereEmissiveIntensity = 1.5;
  private directiveTimeout: number | null = null;


  @property({ type: Object })
  set outputNode(node: AudioNode | null) {
    const oldNode = this._outputNode;
    this._outputNode = node;
    if (this.outputAnalyser && this.outputAnalyser['nodeConnected'] === node) {
      // Node hasn't changed, do nothing
    } else {
      this.outputAnalyser?.disconnect(); // Disconnect old one if exists
      if (node) {
        this.outputAnalyser = new Analyser(node);
      } else {
        this.outputAnalyser = null;
      }
    }
    this.requestUpdate('outputNode', oldNode);
  }
  get outputNode(): AudioNode | null {
    return this._outputNode;
  }
  private _outputNode: AudioNode | null = null;


  @property({ type: Object })
  set inputNode(node: AudioNode | null) {
    const oldNode = this._inputNode;
    this._inputNode = node;
    if (this.inputAnalyser && this.inputAnalyser['nodeConnected'] === node) {
      // Node hasn't changed, do nothing
    } else {
      this.inputAnalyser?.disconnect(); // Disconnect old one if exists
      if (node) {
        this.inputAnalyser = new Analyser(node);
      } else {
        this.inputAnalyser = null;
      }
    }
    this.requestUpdate('inputNode', oldNode);
  }
  get inputNode(): AudioNode | null {
    return this._inputNode;
  }
  private _inputNode: AudioNode | null = null;

  @property({ type: String })
  currentAvatarExpression?: string;

  @property({ type: String })
  currentAvatarGesture?: string;


  private canvas!: HTMLCanvasElement;
  private animationFrameId: number | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 0; 
      overflow: hidden;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
      image-rendering: auto;
    }
  `;
  
  constructor() {
    super();
    console.log('[gdm-live-audio-visuals-3d] Constructor');
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('[gdm-live-audio-visuals-3d] Connected');
    // Initialization deferred to firstUpdated
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    console.log('[gdm-live-audio-visuals-3d] Disconnected');
    this.stopAnimationLoop();
    window.removeEventListener('resize', this.handleResize);
    this.disposeThreeObjects();
    this.inputAnalyser?.disconnect();
    this.inputAnalyser = null;
    this.outputAnalyser?.disconnect();
    this.outputAnalyser = null;
    if (this.directiveTimeout) clearTimeout(this.directiveTimeout);
  }
  
  protected firstUpdated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.firstUpdated(changedProperties);
    this.canvas = this.renderRoot.querySelector('canvas') as HTMLCanvasElement;
    if (this.canvas) {
        this.initThree();
        this.startAnimationLoop();
        window.addEventListener('resize', this.handleResize);
    } else {
        console.error("[gdm-live-audio-visuals-3d] Canvas element not found in shadow DOM!");
    }
  }

  protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('inputNode')) {
        if (this.inputNode) {
            if (!this.inputAnalyser || this.inputAnalyser['nodeConnected'] !== this.inputNode) {
                this.inputAnalyser?.disconnect();
                this.inputAnalyser = new Analyser(this.inputNode);
                console.log('[gdm-live-audio-visuals-3d] Input analyser re-initialized/updated.');
            }
        } else {
            this.inputAnalyser?.disconnect();
            this.inputAnalyser = null;
        }
    }
    if (changedProperties.has('outputNode')) {
        if (this.outputNode) {
            if (!this.outputAnalyser || this.outputAnalyser['nodeConnected'] !== this.outputNode) {
                this.outputAnalyser?.disconnect();
                this.outputAnalyser = new Analyser(this.outputNode);
                console.log('[gdm-live-audio-visuals-3d] Output analyser re-initialized/updated.');
            }
        } else {
            this.outputAnalyser?.disconnect();
            this.outputAnalyser = null;
        }
    }
    if (changedProperties.has('currentAvatarExpression') && this.currentAvatarExpression) {
        this.handleExpressionVisual(this.currentAvatarExpression);
    }
    if (changedProperties.has('currentAvatarGesture') && this.currentAvatarGesture) {
        this.handleGestureVisual(this.currentAvatarGesture);
    }
  }

  private handleExpressionVisual(expression: string) {
    if (!this.sphere || !(this.sphere.material instanceof THREE.MeshStandardMaterial)) return;

    if (this.directiveTimeout) clearTimeout(this.directiveTimeout);

    let newEmissive = this.originalSphereEmissive.getHex();
    let newIntensity = this.originalSphereEmissiveIntensity;

    switch (expression.toLowerCase()) {
        case 'angry':
            newEmissive = 0xff0000; // Red
            newIntensity = this.originalSphereEmissiveIntensity * 1.7;
            break;
        case 'happy':
            newEmissive = 0x00ff00; // Green
            newIntensity = this.originalSphereEmissiveIntensity * 1.5;
            break;
        case 'surprised':
            newEmissive = 0xffff00; // Yellow
            newIntensity = this.originalSphereEmissiveIntensity * 2.0;
            break;
        case 'sad':
            newEmissive = 0x0000ff; // Blue
            newIntensity = this.originalSphereEmissiveIntensity * 1.3;
            break;
        case 'skeptical':
             newEmissive = 0xffa500; // Orange
             newIntensity = this.originalSphereEmissiveIntensity * 1.4;
             break;
        case 'confused':
            newEmissive = 0x800080; // Purple
            newIntensity = this.originalSphereEmissiveIntensity * 1.4;
            break;
        case 'neutral': // Explicitly handle neutral to revert
        default:
            // Revert immediately if neutral or unknown
            this.sphere.material.emissive.setHex(this.originalSphereEmissive.getHex());
            this.sphere.material.emissiveIntensity = this.originalSphereEmissiveIntensity;
            return; 
    }

    this.sphere.material.emissive.setHex(newEmissive);
    this.sphere.material.emissiveIntensity = newIntensity;

    this.directiveTimeout = window.setTimeout(() => {
        if (this.sphere && this.sphere.material instanceof THREE.MeshStandardMaterial) {
            this.sphere.material.emissive.setHex(this.originalSphereEmissive.getHex());
            this.sphere.material.emissiveIntensity = this.originalSphereEmissiveIntensity;
        }
        this.directiveTimeout = null;
    }, 700);
  }

  private handleGestureVisual(gesture: string) {
    if (!this.sphere) return;

    if (this.directiveTimeout) clearTimeout(this.directiveTimeout); // Can share timeout or have separate

    const originalScale = this.sphere.scale.x; // Assuming uniform scale

    switch (gesture.toLowerCase()) {
        case 'nod':
        case 'shrug':
        case 'wave_dismiss':
        case 'facepalm': // Generic pulse for now
            this.sphere.scale.setScalar(originalScale * 1.08);
            break;
        case 'shake_head':
            this.sphere.scale.setScalar(originalScale * 0.95); // Slight shrink
            break;
        default:
            return; // No visual for unknown gestures
    }
    
    this.directiveTimeout = window.setTimeout(() => {
        if (this.sphere) {
            this.sphere.scale.setScalar(originalScale);
        }
        this.directiveTimeout = null;
    }, 300);
  }

  private handleResize = () => {
    if (!this.camera || !this.renderer || !this.composer || !this.backdrop) return;

    const width = (this as any).offsetWidth;
    const height = (this as any).offsetHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    if (this.backdrop.material instanceof THREE.RawShaderMaterial) {
        this.backdrop.material.uniforms.resolution.value.x = width;
        this.backdrop.material.uniforms.resolution.value.y = height;
    }
  }

  private _animationLoop = (time: number) => {
    this.animationFrameId = requestAnimationFrame(this._animationLoop);

    const deltaTime = (time - this.prevTime) * 0.001;
    this.prevTime = time;

    this.inputAnalyser?.update();
    this.outputAnalyser?.update();

    const sphereMaterial = this.sphere.material as THREE.MeshStandardMaterial;
    if (sphereMaterial.userData.uniforms) {
        const uniforms = sphereMaterial.userData.uniforms;
        if (uniforms.time) {
            uniforms.time.value = time * 0.001;
        }
        if (uniforms.inputData && this.inputAnalyser) {
             uniforms.inputData.value.set(
                (this.inputAnalyser.data[0] || 0) / 255,
                (this.inputAnalyser.data[1] || 0) / 255,
                (this.inputAnalyser.data[2] || 0) / 255,
                (this.inputAnalyser.data[3] || 0) / 255
            );
        }
        if (uniforms.outputData && this.outputAnalyser) {
            uniforms.outputData.value.set(
                (this.outputAnalyser.data[0] || 0) / 255,
                (this.outputAnalyser.data[1] || 0) / 255,
                (this.outputAnalyser.data[2] || 0) / 255,
                (this.outputAnalyser.data[3] || 0) / 255
            );
        }
    }


    if (this.backdrop.material instanceof THREE.RawShaderMaterial) {
        this.backdrop.material.uniforms.rand.value = Math.random();
    }

    this.rotation.x += 0.001 + ((this.inputAnalyser?.data[0] || 0) / 255) * 0.005;
    this.rotation.y += 0.002 + ((this.outputAnalyser?.data[0] || 0) / 255) * 0.005;
    this.sphere.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);

    this.composer.render(deltaTime);
  }

  private startAnimationLoop = () => {
    if (this.animationFrameId === null) {
        this.prevTime = performance.now();
        this._animationLoop(this.prevTime);
    }
  }

  private stopAnimationLoop = () => {
    if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }
  }

  private disposeThreeObjects = () => {
    if (this.scene) {
        this.scene.traverse(object => {
            if (object instanceof THREE.Mesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else if (object.material) {
                    (object.material as THREE.Material).dispose();
                }
            }
        });
        while(this.scene.children.length > 0){
            this.scene.remove(this.scene.children[0]);
        }
    }
    if (this.renderer) {
        this.renderer.dispose();
    }
  }


  private initThree() {
    if (!this.canvas) {
        console.error("[gdm-live-audio-visuals-3d] Attempted to initThree without a canvas.");
        return;
    }
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x100c14); // Dark background

    const backdropGeometry = new THREE.IcosahedronGeometry(10, 5);
    const backdropMaterial = new THREE.RawShaderMaterial({
        uniforms: {
          resolution: {value: new THREE.Vector2((this as any).offsetWidth, (this as any).offsetHeight)},
          rand: {value: 0},
        },
        vertexShader: backdropVS,
        fragmentShader: backdropFS,
        glslVersion: THREE.GLSL3,
      });
    backdropMaterial.side = THREE.BackSide;
    this.backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
    this.scene.add(this.backdrop);

    this.camera = new THREE.PerspectiveCamera(
      75,
      (this as any).offsetWidth / (this as any).offsetHeight,
      0.1,
      1000,
    );
    this.camera.position.set(2, -2, 5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true, 
    });
    this.renderer.setSize((this as any).offsetWidth, (this as any).offsetHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const sphereGeometry = new THREE.IcosahedronGeometry(1, 10);
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x000010,
      metalness: 0.5,
      roughness: 0.1,
      emissive: this.originalSphereEmissive.clone(), // Use stored original
      emissiveIntensity: this.originalSphereEmissiveIntensity, // Use stored original
      envMapIntensity: 1.0
    });

    sphereMaterial.userData.uniforms = {
        time: { value: 0.0 },
        inputData: { value: new THREE.Vector4(0, 0, 0, 0) },
        outputData: { value: new THREE.Vector4(0, 0, 0, 0) },
    };

    sphereMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.time = sphereMaterial.userData.uniforms.time;
        shader.uniforms.inputData = sphereMaterial.userData.uniforms.inputData;
        shader.uniforms.outputData = sphereMaterial.userData.uniforms.outputData;

        shader.vertexShader = `
            uniform float time;
            uniform vec4 inputData;
            uniform vec4 outputData;

            vec3 calc_custom_vs( vec3 pos, float time_custom, vec4 inputData_custom, vec4 outputData_custom ) {
              vec3 dir = normalize( pos );
              // vec3 p = dir + vec3( time_custom, 0., 0. ); // p is not used in example
              return pos +
                1. * inputData_custom.x * inputData_custom.y * dir * (.5 + .5 * sin(inputData_custom.z * pos.x + time_custom)) +
                1. * outputData_custom.x * outputData_custom.y * dir * (.5 + .5 * sin(outputData_custom.z * pos.y + time_custom));
            }

            vec3 spherical_custom_vs( float r, float theta, float phi ) {
              return r * vec3(
                cos( theta ) * cos( phi ),
                sin( theta ) * cos( phi ),
                sin( phi )
              );
            }
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>

            float r_custom_vs = length( position );
            // Standard UVs might not be what's expected if geometry isn't a perfect UV sphere
            // or if they are transformed. Using position for theta/phi might be more robust
            // or require passing actual spherical coordinates if available.
            // For IcosahedronGeometry, UVs are generated but might not map perfectly as theta/phi.
            // Using position to derive angles:
            // float theta_custom_vs = atan(transformed.y, transformed.x); 
            // float phi_custom_vs = asin(transformed.z / r_custom_vs); 
            // Using UVs as per the original sphereVS:
            float theta_custom_vs = uv.x * 2. * PI;
            float phi_custom_vs = (uv.y - 0.5) * PI;

            transformed = calc_custom_vs( spherical_custom_vs( r_custom_vs, theta_custom_vs, phi_custom_vs ), time, inputData, outputData );
            `
        );
        // Note: For normals to be correct with vertex displacement, they usually need to be re-calculated.
        // The original sphereVS had logic for this. This simplified onBeforeCompile doesn't re-calculate normals,
        // so lighting on the displaced surface might not be accurate.
    };


    // Note: Using a public URL for the environment map. For production, host this asset locally.
    new EXRLoader().load('https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/royal_esplanade_1k.exr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      sphereMaterial.envMap = texture;
      sphereMaterial.needsUpdate = true;
      pmremGenerator.dispose(); // Dispose after use
    });
    
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(this.sphere);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2((this as any).offsetWidth, (this as any).offsetHeight),
        0.7, // strength
        0.1, // radius
        0.9  // threshold
    );
    this.composer.addPass(bloomPass);

    // Optional FXAA pass for anti-aliasing if MSAA (renderer's antialias:true) is not enough or too costly
    // const fxaaPass = new ShaderPass(FXAAShader);
    // fxaaPass.material.uniforms['resolution'].value.x = 1 / (this.offsetWidth * this.renderer.getPixelRatio());
    // fxaaPass.material.uniforms['resolution'].value.y = 1 / (this.offsetHeight * this.renderer.getPixelRatio());
    // this.composer.addPass(fxaaPass);
  }

  render() {
    return html`<canvas></canvas>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gdm-live-audio-visuals-3d': GdmLiveAudioVisuals3D;
  }
}
