// earth.js — dynamic OrbitControls import so a CDN failure does not crash the whole app module
let earthRenderer = null;
let earthScene = null;
let earthCamera = null;
let earthAnimationId = null;
let earthResizeObserver = null;

export async function init3DEarth() {
    const container = document.getElementById('earth-container');
    if (!container) return;

    // Dispose previous Earth if exists to prevent memory leaks
    if (earthRenderer) {
        if (earthAnimationId) cancelAnimationFrame(earthAnimationId);
        earthRenderer.dispose();
        if (typeof earthRenderer.forceContextLoss === 'function') {
            earthRenderer.forceContextLoss();
        }
        earthRenderer = null;
        earthScene = null;
        earthCamera = null;
        earthAnimationId = null;
    }

    if (earthResizeObserver) {
        earthResizeObserver.disconnect();
        earthResizeObserver = null;
    }

    // Verify WebGL support
    try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
        if (!gl) throw new Error('WebGL not supported');
    } catch (e) {
        container.innerHTML = `<div id="earth-error" style="color: var(--text-secondary); text-align: center; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
            <i class="fa-solid fa-globe" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <p>3D Earth requires WebGL support.</p>
        </div>`;
        return;
    }

    // Dynamically import OrbitControls so a CDN failure doesn't crash the module
    let OrbitControls = null;
    try {
        const mod = await import("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js");
        OrbitControls = mod.OrbitControls;
    } catch (e) {
        console.warn("OrbitControls could not be loaded, continuing without it:", e);
    }

    // THREE must be available globally via the CDN script tag
    if (typeof THREE === 'undefined') {
        console.warn("THREE.js not available, skipping 3D Earth.");
        const loadingElem = document.getElementById('earth-loading');
        if (loadingElem) loadingElem.style.display = 'none';
        return;
    }

    try {
        const scene = new THREE.Scene();
        const w = container.clientWidth > 0 ? container.clientWidth : 300;
        const h = container.clientHeight > 0 ? container.clientHeight : 180;
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio || 1);

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Hide loading indicator immediately now that canvas is in the DOM
        const loadingElem = document.getElementById('earth-loading');
        if (loadingElem) loadingElem.style.display = 'none';

        // Add OrbitControls if available
        let controls = null;
        if (OrbitControls) {
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 5;
            controls.maxDistance = 15;
        }

        // Create Earth with realistic texture and cloud layer
        const textureLoader = new THREE.TextureLoader();
        const earthTexture = textureLoader.load('https://threejs.org/examples/textures/earth_atmos_2048.jpg');
        const material = new THREE.MeshStandardMaterial({
            map: earthTexture,
            roughness: 0.5,
            metalness: 0.2,
            emissive: 0x111111,
            emissiveIntensity: 0.3
        });
        const geometry = new THREE.SphereGeometry(2.5, 32, 32);
        const earth = new THREE.Mesh(geometry, material);
        scene.add(earth);

        // Cloud layer
        const cloudTexture = textureLoader.load('https://threejs.org/examples/textures/earth_clouds_1024.png');
        const cloudMaterial = new THREE.MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.4,
            depthWrite: false
        });
        const cloudGeometry = new THREE.SphereGeometry(2.51, 32, 32);
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        scene.add(clouds);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 3, 5);
        scene.add(dirLight);
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);

        camera.position.z = 7;

        function animate() {
            earthAnimationId = requestAnimationFrame(animate);
            if (controls) controls.update();
            earth.rotation.y += 0.005;
            renderer.render(scene, camera);
        }
        animate();

        // Resize observer
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const rw = entry.contentRect.width;
                const rh = entry.contentRect.height;
                if (rw > 0 && rh > 0) {
                    camera.aspect = rw / rh;
                    camera.updateProjectionMatrix();
                    renderer.setSize(rw, rh);
                }
            }
        });
        resizeObserver.observe(container);
        earthResizeObserver = resizeObserver;

        earthRenderer = renderer;
        earthScene = scene;
        earthCamera = camera;
    } catch (err) {
        console.error("3D Earth initialization failed:", err);
        const loadingElem = document.getElementById('earth-loading');
        if (loadingElem) loadingElem.style.display = 'none';
    }
}
