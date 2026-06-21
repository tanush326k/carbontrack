// earth.js — synchronous, uses global THREE + THREE.OrbitControls (loaded via classic script tag)
let earthRenderer = null;
let earthAnimationId = null;
let earthResizeObserver = null;

export function init3DEarth() {
    const container = document.getElementById('earth-container');
    if (!container) return;

    // Dispose previous Earth to prevent memory leaks on re-init
    if (earthRenderer) {
        if (earthAnimationId) cancelAnimationFrame(earthAnimationId);
        try { earthRenderer.dispose(); } catch (_) {}
        try { earthRenderer.forceContextLoss(); } catch (_) {}
        earthRenderer = null;
        earthAnimationId = null;
    }
    if (earthResizeObserver) {
        earthResizeObserver.disconnect();
        earthResizeObserver = null;
    }

    // Guard: THREE and OrbitControls must be loaded as globals
    if (typeof THREE === 'undefined' || typeof THREE.OrbitControls === 'undefined') {
        console.warn('THREE.js or OrbitControls not loaded — skipping 3D Earth.');
        const el = document.getElementById('earth-loading');
        if (el) el.style.display = 'none';
        return;
    }

    // Guard: WebGL support check
    try {
        const t = document.createElement('canvas');
        if (!t.getContext('webgl') && !t.getContext('experimental-webgl')) {
            throw new Error('no webgl');
        }
    } catch (_) {
        container.innerHTML = `<div style="color:var(--text-secondary);text-align:center;padding:2rem;height:100%;display:flex;align-items:center;justify-content:center;">
            <span><i class="fa-solid fa-globe" style="font-size:2rem;opacity:0.4;display:block;margin-bottom:.75rem;"></i>WebGL not supported in this browser.</span>
        </div>`;
        return;
    }

    try {
        const w = container.clientWidth > 0 ? container.clientWidth : 480;
        const h = container.clientHeight > 0 ? container.clientHeight : 260;

        // --- Scene Setup ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 1000);
        camera.position.z = 6.5;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        // Replace loading spinner with canvas
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // --- Procedural Earth Texture (no external CDN required) ---
        function makeEarthTexture() {
            const c = document.createElement('canvas');
            c.width = 1024; c.height = 512;
            const ctx = c.getContext('2d');

            // Ocean gradient
            const ocean = ctx.createLinearGradient(0, 0, 0, 512);
            ocean.addColorStop(0,   '#0a2540');
            ocean.addColorStop(0.4, '#0e4080');
            ocean.addColorStop(0.6, '#0e4080');
            ocean.addColorStop(1,   '#0a2540');
            ctx.fillStyle = ocean;
            ctx.fillRect(0, 0, 1024, 512);

            // Landmass patches (simplified continents)
            const landColor = (a) => `rgba(22,${90 + a},45,0.85)`;

            // Americas
            ctx.fillStyle = landColor(10);
            ctx.beginPath();
            ctx.ellipse(200, 190, 60, 110, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(220, 360, 50, 80, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Europe / Africa
            ctx.fillStyle = landColor(20);
            ctx.beginPath();
            ctx.ellipse(520, 170, 55, 70, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(530, 320, 55, 100, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Asia
            ctx.fillStyle = landColor(15);
            ctx.beginPath();
            ctx.ellipse(720, 160, 120, 100, -0.1, 0, Math.PI * 2);
            ctx.fill();

            // Australia
            ctx.fillStyle = landColor(5);
            ctx.beginPath();
            ctx.ellipse(820, 370, 55, 40, 0, 0, Math.PI * 2);
            ctx.fill();

            // Ice caps
            ctx.fillStyle = 'rgba(220,240,255,0.6)';
            ctx.fillRect(0, 0, 1024, 40);
            ctx.fillRect(0, 472, 1024, 40);

            // Subtle ocean sparkle
            ctx.fillStyle = 'rgba(80,160,255,0.08)';
            for (let i = 0; i < 80; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 1024, Math.random() * 512, Math.random() * 18 + 4, 0, Math.PI * 2);
                ctx.fill();
            }

            return new THREE.CanvasTexture(c);
        }

        function makeCloudTexture() {
            const c = document.createElement('canvas');
            c.width = 512; c.height = 256;
            const ctx = c.getContext('2d');
            ctx.fillStyle = 'transparent';
            ctx.clearRect(0, 0, 512, 256);
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            for (let i = 0; i < 30; i++) {
                ctx.beginPath();
                ctx.ellipse(
                    Math.random() * 512,
                    Math.random() * 256,
                    Math.random() * 60 + 20,
                    Math.random() * 20 + 8,
                    Math.random() * Math.PI,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
            return new THREE.CanvasTexture(c);
        }

        // --- Earth Sphere ---
        const earthTex = makeEarthTexture();
        const earthGeo = new THREE.SphereGeometry(2.5, 48, 48);
        const earthMat = new THREE.MeshPhongMaterial({
            map: earthTex,
            specular: new THREE.Color(0x2a6080),
            shininess: 18,
            emissive: new THREE.Color(0x0a1a2e),
            emissiveIntensity: 0.15
        });
        const earthMesh = new THREE.Mesh(earthGeo, earthMat);
        scene.add(earthMesh);

        // Subtle wireframe overlay for stylized look
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x10b981,
            wireframe: true,
            transparent: true,
            opacity: 0.04
        });
        const wireMesh = new THREE.Mesh(new THREE.SphereGeometry(2.52, 24, 24), wireMat);
        scene.add(wireMesh);

        // --- Cloud Layer ---
        const cloudTex = makeCloudTexture();
        const cloudGeo = new THREE.SphereGeometry(2.56, 32, 32);
        const cloudMat = new THREE.MeshPhongMaterial({
            map: cloudTex,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });
        const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        scene.add(cloudMesh);

        // --- Atmosphere Glow ---
        const atmGeo = new THREE.SphereGeometry(2.7, 32, 32);
        const atmMat = new THREE.MeshBasicMaterial({
            color: 0x1a8cff,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide
        });
        scene.add(new THREE.Mesh(atmGeo, atmMat));

        // --- Stars ---
        const starGeo = new THREE.BufferGeometry();
        const starCount = 800;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) {
            starPos[i] = (Math.random() - 0.5) * 200;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.7 });
        scene.add(new THREE.Points(starGeo, starMat));

        // --- Lighting ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
        scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
        sunLight.position.set(8, 4, 6);
        scene.add(sunLight);
        const rimLight = new THREE.DirectionalLight(0x4499ff, 0.3);
        rimLight.position.set(-6, -2, -4);
        scene.add(rimLight);

        // --- OrbitControls (from global script tag) ---
        let controls = null;
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.06;
            controls.minDistance = 4;
            controls.maxDistance = 12;
            controls.enablePan = false;
            controls.autoRotate = false;
        }

        // --- Animation Loop ---
        function animate() {
            earthAnimationId = requestAnimationFrame(animate);
            earthMesh.rotation.y += 0.0025;
            cloudMesh.rotation.y += 0.003;
            wireMesh.rotation.y += 0.0025;
            if (controls) controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // --- Resize Observer ---
        const ro = new ResizeObserver(() => {
            const rw = container.clientWidth;
            const rh = container.clientHeight;
            if (rw > 0 && rh > 0) {
                camera.aspect = rw / rh;
                camera.updateProjectionMatrix();
                renderer.setSize(rw, rh);
            }
        });
        ro.observe(container);
        earthResizeObserver = ro;

        earthRenderer = renderer;

    } catch (err) {
        console.error('3D Earth initialization failed:', err);
        const el = document.getElementById('earth-loading');
        if (el) el.style.display = 'none';
    }
}
