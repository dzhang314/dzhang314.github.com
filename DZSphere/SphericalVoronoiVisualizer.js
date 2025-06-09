import * as THREE from "three";
import { ConvexHull } from "three/addons/math/ConvexHull.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { isNumericArray } from "./IsNumericArray.js";


const MAX_VORONOI_EDGES = 12;
const VORONOI_COLOR_DEFAULT = new THREE.Color(0xFFFFFF);
const VORONOI_COLOR_MAP = new Map([
    [4, new THREE.Color(0xFFFF00)],
    [5, new THREE.Color(0xFF0000)],
    [6, new THREE.Color(0x00FF00)],
    [7, new THREE.Color(0x0000FF)],
]);


export class SphericalVoronoiVisualizer {


    constructor(points) {

        if (!isNumericArray(points)) {
            throw new TypeError("points must be an array of finite numbers");
        }
        if (points.length % 3 !== 0) {
            throw new RangeError("points must have length divisible by 3");
        }

        this.scene = new THREE.Scene();

        // TODO: Add configurable lighting parameters.
        this.scene.add(new THREE.AmbientLight());

        // TODO: Add configurable camera parameters.
        this.camera = new THREE.PerspectiveCamera(
            15, window.innerWidth / window.innerHeight, 8, 12);
        this.camera.position.z = 10;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        window.addEventListener("resize", () => this.onWindowResize());

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = false;
        this.controls.enableDamping = true;
        this.controls.autoRotate = true;

        this.numPoints = points.length / 3;
        this.points = new Array(this.numPoints);
        for (let i = 0; i < this.numPoints; i++) {
            this.points[i] = new THREE.Vector3(
                points[3 * i], points[3 * i + 1], points[3 * i + 2]);
        }

        const particleGeometry = new THREE.IcosahedronGeometry(0.02, 1);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.particles = new Array(this.numPoints);
        for (let i = 0; i < this.numPoints; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(this.points[i]);
            this.particles[i] = particle;
            this.scene.add(this.particles[i]);
        }

        this.voronoiBuffers = new Array(this.numPoints);
        for (let i = 0; i < this.numPoints; i++) {
            const vertices = new Float32Array(3 * (MAX_VORONOI_EDGES + 1));
            vertices[0] = this.particles[i].position.x;
            vertices[1] = this.particles[i].position.y;
            vertices[2] = this.particles[i].position.z;
            this.voronoiBuffers[i] = new THREE.BufferAttribute(vertices, 3);
        }

        this.voronoiCellMaterials = new Array(this.numPoints);
        for (let i = 0; i < this.numPoints; i++) {
            this.voronoiCellMaterials[i] = new THREE.MeshBasicMaterial({
                color: VORONOI_COLOR_DEFAULT,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1.0,
            });
        }

        const cellIndices = new Array(3 * MAX_VORONOI_EDGES);
        for (let i = 0; i < MAX_VORONOI_EDGES; i++) {
            cellIndices[3 * i] = 0;
            cellIndices[3 * i + 1] = i + 1;
            cellIndices[3 * i + 2] = i + 2;
        }
        cellIndices[3 * MAX_VORONOI_EDGES - 1] = 1;
        this.voronoiCells = new Array(this.numPoints);
        for (let i = 0; i < this.numPoints; i++) {
            const geometry = new THREE.BufferGeometry();
            geometry.setIndex(cellIndices);
            geometry.setAttribute("position", this.voronoiBuffers[i]);
            this.voronoiCells[i] = new THREE.Mesh(
                geometry, this.voronoiCellMaterials[i]);
            this.scene.add(this.voronoiCells[i]);
        }

        const edgeIndices = new Array(MAX_VORONOI_EDGES + 1);
        for (let i = 0; i < MAX_VORONOI_EDGES; i++) {
            edgeIndices[i] = i + 1;
        }
        edgeIndices[MAX_VORONOI_EDGES] = 1;
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.voronoiEdges = new Array(this.numPoints);
        for (let i = 0; i < this.numPoints; i++) {
            const geometry = new THREE.BufferGeometry();
            geometry.setIndex(edgeIndices);
            geometry.setAttribute("position", this.voronoiBuffers[i]);
            this.voronoiEdges[i] = new THREE.Line(geometry, edgeMaterial);
            this.scene.add(this.voronoiEdges[i]);
        }

        this.hull = new ConvexHull();
    }


    get domElement() { return this.renderer.domElement; }


    updatePoints(points) {

        if (!isNumericArray(points)) {
            throw new TypeError("points must be an array of finite numbers");
        }
        if (points.length !== 3 * this.numPoints) {
            throw new RangeError("points must have length 3 * numPoints");
        }

        for (let i = 0; i < this.numPoints; i++) {
            this.points[i].x = points[3 * i];
            this.points[i].y = points[3 * i + 1];
            this.points[i].z = points[3 * i + 2];
            this.particles[i].position.copy(this.points[i]);
            this.voronoiBuffers[i].array[0] = this.points[i].x;
            this.voronoiBuffers[i].array[1] = this.points[i].y;
            this.voronoiBuffers[i].array[2] = this.points[i].z;
            this.voronoiBuffers[i].needsUpdate = true;
        }
    }


    updateHull() {

        this.hull.setFromPoints(this.points);
        const numFaces = this.hull.faces.length;

        const pointIndexMap = new Map();
        for (let i = 0; i < this.numPoints; i++) {
            pointIndexMap.set(this.points[i], i);
        }
        const faceIndexMap = new Map();
        for (let i = 0; i < numFaces; i++) {
            faceIndexMap.set(this.hull.faces[i], i);
        }

        const faceVertices = new Array(numFaces);
        const faceNeighbors = new Array(numFaces);
        const adjacentFaces = new Array(this.numPoints);
        for (let i = 0; i < this.numPoints; i++) { adjacentFaces[i] = []; }
        for (let i = 0; i < numFaces; i++) {
            const face = this.hull.faces[i];
            const vertices = [];
            const neighbors = [];
            let currentEdge = face.edge;
            do {
                const headIndex = pointIndexMap.get(currentEdge.vertex.point);
                vertices.push(headIndex);
                neighbors.push(faceIndexMap.get(currentEdge.twin.face));
                adjacentFaces[headIndex].push(i);
                currentEdge = currentEdge.next;
            } while (currentEdge !== face.edge);
            faceVertices[i] = vertices;
            faceNeighbors[i] = neighbors;
        }

        for (let i = 0; i < this.numPoints; i++) {
            const firstFaceIndex = adjacentFaces[i][0];
            let currentFaceIndex = firstFaceIndex;
            const faceCenters = [];
            do {
                // TODO: We should compute the circumcenter of the face.
                const vertexIndices = faceVertices[currentFaceIndex];
                const center = new THREE.Vector3();
                for (const j of vertexIndices) { center.add(this.points[j]); }
                center.normalize();
                faceCenters.push(center);
                const headIndex = vertexIndices.indexOf(i);
                currentFaceIndex = faceNeighbors[currentFaceIndex][headIndex];
            } while (currentFaceIndex !== firstFaceIndex);
            if (faceCenters.length <= MAX_VORONOI_EDGES) {
                for (let j = 0; j < faceCenters.length; j++) {
                    this.voronoiBuffers[i].array[3 * j + 3] = faceCenters[j].x;
                    this.voronoiBuffers[i].array[3 * j + 4] = faceCenters[j].y;
                    this.voronoiBuffers[i].array[3 * j + 5] = faceCenters[j].z;
                }
                for (let j = faceCenters.length; j < MAX_VORONOI_EDGES; j++) {
                    this.voronoiBuffers[i].array[3 * j + 3] = faceCenters[0].x;
                    this.voronoiBuffers[i].array[3 * j + 4] = faceCenters[0].y;
                    this.voronoiBuffers[i].array[3 * j + 5] = faceCenters[0].z;
                }
            } else {
                for (let j = 0; j < MAX_VORONOI_EDGES; j++) {
                    this.voronoiBuffers[i].array[3 * j + 3] = 0;
                    this.voronoiBuffers[i].array[3 * j + 4] = 0;
                    this.voronoiBuffers[i].array[3 * j + 5] = 0;
                }
            }
            this.voronoiBuffers[i].needsUpdate = true;
            this.voronoiCellMaterials[i].color =
                VORONOI_COLOR_MAP.get(faceCenters.length) ??
                VORONOI_COLOR_DEFAULT;
        }
    }


    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }


} // class SphericalVoronoiVisualizer
