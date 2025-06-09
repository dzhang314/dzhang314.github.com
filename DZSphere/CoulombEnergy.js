import { isNumericArray } from "./IsNumericArray.js";


export function randomNormalArray(n) {

    if (!(Number.isSafeInteger(n) && (n >= 0))) {
        throw new RangeError("invalid array length");
    }

    const result = new Float64Array(n);
    for (let i = 0; i < n; i += 2) {
        const r = Math.sqrt(-2 * Math.log(Math.random()));
        const theta = 2 * Math.PI * Math.random();
        result[i] = r * Math.cos(theta);
        result[i + 1] = r * Math.sin(theta);
        // No bounds check is needed because writes past
        // the end of a typed array are silently ignored.
    }
    return result;
}


export function normalizePoints(points) {

    if (!isNumericArray(points)) {
        throw new TypeError("points must be an array of finite numbers");
    }
    if (points.length % 3 !== 0) {
        throw new RangeError("points must have length divisible by 3");
    }

    for (let i = 0; i < points.length; i += 3) {
        const x = points[i];
        const y = points[i + 1];
        const z = points[i + 2];
        const r = Math.sqrt(x * x + y * y + z * z);
        points[i] = x / r;
        points[i + 1] = y / r;
        points[i + 2] = z / r;
    }
}


export function calculateCoulombForces(forces, points) {

    if (!isNumericArray(forces)) {
        throw new TypeError("forces must be an array of finite numbers");
    }
    if (!isNumericArray(points)) {
        throw new TypeError("points must be an array of finite numbers");
    }
    if (forces.length % 3 !== 0) {
        throw new RangeError("forces must have length divisible by 3");
    }
    if (points.length % 3 !== 0) {
        throw new RangeError("points must have length divisible by 3");
    }
    if (forces.length !== points.length) {
        throw new RangeError("forces and points must have the same length");
    }

    for (let i = 0; i < points.length; i += 3) {
        let fx = 0;
        let fy = 0;
        let fz = 0;
        const xi = points[i];
        const yi = points[i + 1];
        const zi = points[i + 2];
        for (let j = 0; j < points.length; j += 3) {
            if (i === j) {
                continue;
            }
            const xj = points[j];
            const yj = points[j + 1];
            const zj = points[j + 2];
            const dx = xi - xj;
            const dy = yi - yj;
            const dz = zi - zj;
            const distSq = dx * dx + dy * dy + dz * dz;
            const invDistCb = 1 / (distSq * Math.sqrt(distSq));
            fx += invDistCb * dx;
            fy += invDistCb * dy;
            fz += invDistCb * dz;
        }
        forces[i] = fx;
        forces[i + 1] = fy;
        forces[i + 2] = fz;
    }
}


export function constrainForces(forces, points) {

    if (!isNumericArray(forces)) {
        throw new TypeError("forces must be an array of finite numbers");
    }
    if (!isNumericArray(points)) {
        throw new TypeError("points must be an array of finite numbers");
    }
    if (forces.length % 3 !== 0) {
        throw new RangeError("forces must have length divisible by 3");
    }
    if (points.length % 3 !== 0) {
        throw new RangeError("points must have length divisible by 3");
    }
    if (forces.length !== points.length) {
        throw new RangeError("forces and points must have the same length");
    }

    for (let i = 0; i < forces.length; i += 3) {
        const fx = forces[i];
        const fy = forces[i + 1];
        const fz = forces[i + 2];
        const px = points[i];
        const py = points[i + 1];
        const pz = points[i + 2];
        const overlap = fx * px + fy * py + fz * pz;
        forces[i] = fx - overlap * px;
        forces[i + 1] = fy - overlap * py;
        forces[i + 2] = fz - overlap * pz;
    }
}


export function calculateRmsForce(forces) {

    if (!isNumericArray(forces)) {
        throw new TypeError("forces must be an array of finite numbers");
    }
    if (forces.length % 3 !== 0) {
        throw new RangeError("forces must have length divisible by 3");
    }

    let result = 0;
    for (let i = 0; i < forces.length; i++) {
        result += forces[i] * forces[i];
    }
    return Math.sqrt(result / (forces.length / 3));
}
