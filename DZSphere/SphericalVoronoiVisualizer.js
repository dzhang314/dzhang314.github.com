import * as THREE from "three";
/** @import { NumericArray } from "./InputValidation.js" */
import {
    assertFiniteNumber, assertHTMLElement,
    assertNumericArray3D, assertPositiveNumber,
} from "./InputValidation.js";
/** @import { Face } from "three/addons/math/ConvexHull.js" */
import { ConvexHull } from "three/addons/math/ConvexHull.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";


const OUTLINE_SCALE = 1.0 + 0.5 ** 10; // eslint-disable-line no-magic-numbers
const MAX_VORONOI_EDGES = 12;
const VORONOI_COLOR_DEFAULT = new THREE.Color(1.0, 1.0, 1.0);
const VORONOI_COLOR_MAP = new Map([
    [3, new THREE.Color(1.0, 0.0, 1.0)],
    [4, new THREE.Color(1.0, 1.0, 0.0)],
    [5, new THREE.Color(1.0, 0.0, 0.0)],
    [6, new THREE.Color(0.0, 1.0, 0.0)],
    [7, new THREE.Color(0.0, 0.0, 1.0)],
    [8, new THREE.Color(0.0, 1.0, 1.0)],
]);


/**
 * @param {readonly THREE.Vector3[]} vertices
 * @param {readonly Face[]} faces
 * @returns {number[][][]}
 */
function computeDualPolyhedron(vertices, faces) {

    /* Assign indices to vertices and faces. */

    /** @type {Map<THREE.Vector3, number>} */
    const vertexMap = new Map();
    for (const [i, vertex] of vertices.entries()) { vertexMap.set(vertex, i); }

    /** @type {Map<Face, number>} */
    const faceMap = new Map();
    for (const [i, face] of faces.entries()) { faceMap.set(face, i); }

    /* To compute the dual of a convex polyhedron, we need to construct: */

    /* (1) The list of faces incident to each vertex. */
    /** @type {number[][]} */
    const vertexFaceIndices = Array.from({ length: vertices.length });
    for (let i = 0; i < vertices.length; i++) { vertexFaceIndices[i] = []; }

    /* (2) The list of vertices incident to each face. */
    /** @type {number[][]} */
    const faceVertexIndices = Array.from({ length: faces.length });
    for (let i = 0; i < faces.length; i++) { faceVertexIndices[i] = []; }

    /* (3) The list of faces adjacent to each face. */
    /** @type {number[][]} */
    const faceNeighborIndices = Array.from({ length: faces.length });
    for (let i = 0; i < faces.length; i++) { faceNeighborIndices[i] = []; }

    for (const [i, face] of faces.entries()) {
        /* THREE.js represents each face as a linked list of half-edges. */
        let currentEdge = face.edge;
        do {
            const headIndex = vertexMap.get(currentEdge.vertex.point);
            if (headIndex === undefined) {
                throw new Error("found vertex not in provided vertex list");
            }
            vertexFaceIndices[headIndex].push(i);
            faceVertexIndices[i].push(headIndex);
            const adjacentFaceIndex = faceMap.get(currentEdge.twin.face);
            if (adjacentFaceIndex === undefined) {
                throw new Error("found face not in provided face list");
            }
            faceNeighborIndices[i].push(adjacentFaceIndex);
            currentEdge = currentEdge.next;
        } while (currentEdge !== face.edge);
    }

    /* For each vertex of the original polyhedron, we construct
     * the corresponding face of the dual polyhedron. */
    /** @type {number[][][]} */
    const dualFaces = Array.from({ length: vertices.length });
    for (let i = 0; i < vertices.length; i++) { dualFaces[i] = []; }

    for (let i = 0; i < vertices.length; i++) {
        /* We represent each face of the dual polyhedron as a list of dual
         * vertices, each of which is a face of the original polyhedron. */
        if (vertexFaceIndices[i].length > 0) {
            const [firstFaceIndex] = vertexFaceIndices[i];
            let currentFaceIndex = firstFaceIndex;
            do {
                const dualVertex = faceVertexIndices[currentFaceIndex];
                dualFaces[i].push(dualVertex);
                const neighborIndices = faceNeighborIndices[currentFaceIndex];
                currentFaceIndex = neighborIndices[dualVertex.indexOf(i)];
            } while (currentFaceIndex !== firstFaceIndex);
        }
    }

    return dualFaces;
}


export class SphericalVoronoiVisualizer {


    /**
     * @param {number[]} points
     * @param {HTMLElement} container
     * @param {number} particleRadius
     * @param {number} zOffset
     */
    // eslint-disable-next-line no-magic-numbers
    constructor(points, container, particleRadius = 0.02, zOffset = 15) {

        assertNumericArray3D(points);
        assertHTMLElement(container);
        assertFiniteNumber(particleRadius);
        assertPositiveNumber(particleRadius);
        assertFiniteNumber(zOffset);
        assertPositiveNumber(zOffset);

        /** @private @type {number} */
        this.numPoints = points.length / 3;

        /** @private @type {THREE.Vector3[]} */
        this.points = Array.from({ length: this.numPoints });

        /* Convert from flat (x, y, z) coordinates to THREE.Vector3 objects. */
        for (let i = 0; i < this.numPoints; i++) {
            this.points[i] = new THREE.Vector3(
                points[3 * i], points[3 * i + 1], points[3 * i + 2]);
        }

        /** @private @type {HTMLElement} */
        this.container = container;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        /** @private @type {THREE.WebGLRenderer} */
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.container.append(this.renderer.domElement);

        /** @private @type {ResizeObserver} */
        this.resizeObserver = new ResizeObserver(
            () => this.onContainerResize());
        this.resizeObserver.observe(this.container);

        /* Compute FOV to inscribe a sphere of radius r at distance zOffset. */
        const r = 1.0 + particleRadius;

        /** @private @type {number} */
        this.fovAngle = (360.0 / Math.PI) * Math.asin(r / zOffset);

        /** @private @type {THREE.PerspectiveCamera} */
        this.camera = new THREE.PerspectiveCamera(
            Math.max(1.0, height / width) * this.fovAngle,
            width / height, zOffset - r, zOffset + r);
        this.camera.position.z = zOffset;

        /** @private @type {OrbitControls} */
        this.controls = new OrbitControls(
            this.camera, this.renderer.domElement);
        this.controls.autoRotate = true;
        this.controls.enableDamping = true;
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.touches.TWO = null;

        /** @private @type {THREE.Scene} */
        this.scene = new THREE.Scene();

        /** @private @type {THREE.Mesh[]} */
        this.particles = Array.from({ length: this.numPoints });
        const particleGeometry = new THREE.IcosahedronGeometry(
            particleRadius, 1);
        const particleMaterial = new THREE.MeshBasicMaterial(
            { color: new THREE.Color(0.0, 0.0, 0.0) });
        for (let i = 0; i < this.numPoints; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(this.points[i]);
            this.particles[i] = particle;
            this.scene.add(this.particles[i]);
        }

        /** @private @type {ConvexHull} */
        this.hull = new ConvexHull();
        this.hull.setFromPoints(this.points);

        /** @private @type {number[][][]} */
        this.voronoiCellIndices =
            computeDualPolyhedron(this.points, this.hull.faces);

        /** @private @type {THREE.BufferAttribute[]} */ this.voronoiBuffers =
            Array.from({ length: this.numPoints });
        for (let i = 0; i < this.numPoints; i++) {
            const vertices = new Float32Array(3 * (MAX_VORONOI_EDGES + 1));
            vertices[0] = this.points[i].x;
            vertices[1] = this.points[i].y;
            vertices[2] = this.points[i].z;
            this.voronoiBuffers[i] = new THREE.BufferAttribute(vertices, 3);
        }

        /** @private @type {THREE.MeshBasicMaterial[]} */
        this.voronoiCellMaterials = Array.from({ length: this.numPoints });
        for (let i = 0; i < this.numPoints; i++) {
            this.voronoiCellMaterials[i] = new THREE.MeshBasicMaterial({
                color: VORONOI_COLOR_DEFAULT,
                opacity: 1.0,
                side: THREE.FrontSide,
                transparent: true,
            });
        }

        /* Compute Voronoi cells. */
        this.updateVoronoiCells();

        /** @private @type {THREE.Mesh[]} */
        this.voronoiCells = Array.from({ length: this.numPoints });
        const cellIndices = Array.from({ length: 3 * MAX_VORONOI_EDGES });
        for (let i = 0; i < MAX_VORONOI_EDGES; i++) {
            cellIndices[3 * i] = 0;
            cellIndices[3 * i + 1] = i + 1;
            cellIndices[3 * i + 2] = i + 2;
        }
        cellIndices[3 * MAX_VORONOI_EDGES - 1] = 1;
        for (let i = 0; i < this.numPoints; i++) {
            const geometry = new THREE.BufferGeometry();
            geometry.setIndex(cellIndices);
            geometry.setAttribute("position", this.voronoiBuffers[i]);
            geometry.setAttribute("normal", this.voronoiBuffers[i]);
            this.voronoiCells[i] = new THREE.Mesh(
                geometry, this.voronoiCellMaterials[i]);
            this.scene.add(this.voronoiCells[i]);
        }

        /** @private @type {THREE.Line[]} */
        this.voronoiOutlines = Array.from({ length: this.numPoints });
        const outlineIndices = Array.from({ length: MAX_VORONOI_EDGES + 1 });
        for (let i = 0; i < MAX_VORONOI_EDGES; i++) {
            outlineIndices[i] = i + 1;
        }
        outlineIndices[MAX_VORONOI_EDGES] = 1;
        const outlineMaterial = new THREE.LineBasicMaterial(
            { color: new THREE.Color(0.0, 0.0, 0.0) });
        for (let i = 0; i < this.numPoints; i++) {
            const geometry = new THREE.BufferGeometry();
            geometry.setIndex(outlineIndices);
            geometry.setAttribute("position", this.voronoiBuffers[i]);
            this.voronoiOutlines[i] = new THREE.Line(geometry, outlineMaterial);
            this.voronoiOutlines[i].scale.set(
                OUTLINE_SCALE, OUTLINE_SCALE, OUTLINE_SCALE);
            this.scene.add(this.voronoiOutlines[i]);
        }

    }


    /** @param {NumericArray} points */
    updatePoints(points) {

        assertNumericArray3D(points);

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
        this.voronoiCellIndices = computeDualPolyhedron(
            this.points, this.hull.faces);
    }


    updateVoronoiCells() {
        for (let i = 0; i < this.numPoints; i++) {
            const vertexList = [];
            for (const indices of this.voronoiCellIndices[i]) {
                if (indices.length !== 3) {
                    console.log("WARNING: Non-triangular face in convex hull!");
                }
                const circumcenter = new THREE.Vector3();
                for (let j = 0; j < indices.length; j++) {
                    const x = this.points[indices[j]];
                    const y = this.points[indices[(j + 1) % indices.length]];
                    circumcenter.add(x.clone().cross(y));
                }
                circumcenter.normalize();
                vertexList.push(circumcenter);
            }
            const vertexBuffer = this.voronoiBuffers[i].array;
            if (vertexList.length <= MAX_VORONOI_EDGES) {
                // eslint-disable-next-line unicorn/no-for-loop
                for (let j = 0; j < vertexList.length; j++) {
                    vertexBuffer[3 * j + 3] = vertexList[j].x;
                    vertexBuffer[3 * j + 4] = vertexList[j].y;
                    vertexBuffer[3 * j + 5] = vertexList[j].z;
                }
                for (let j = vertexList.length; j < MAX_VORONOI_EDGES; j++) {
                    vertexBuffer[3 * j + 3] = vertexList[0].x;
                    vertexBuffer[3 * j + 4] = vertexList[0].y;
                    vertexBuffer[3 * j + 5] = vertexList[0].z;
                }
            } else {
                for (let j = 0; j < MAX_VORONOI_EDGES; j++) {
                    vertexBuffer[3 * j + 3] = 0;
                    vertexBuffer[3 * j + 4] = 0;
                    vertexBuffer[3 * j + 5] = 0;
                }
            }
            this.voronoiBuffers[i].needsUpdate = true;
            this.voronoiCellMaterials[i].color =
                VORONOI_COLOR_MAP.get(vertexList.length) ??
                VORONOI_COLOR_DEFAULT;
        }
    }


    onContainerResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.fov = Math.max(1.0, height / width) * this.fovAngle;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }


}
