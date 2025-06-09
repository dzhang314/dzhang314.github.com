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


export class SphericalOptimizerState {


    constructor(points, energy, forces, stepDirection) {

        if (!isNumericArray(points)) {
            throw new TypeError("points must be an array of finite numbers");
        }
        if (!Number.isFinite(energy)) {
            throw new TypeError("energy must be a finite number");
        }
        if (!isNumericArray(forces)) {
            throw new TypeError("forces must be an array of finite numbers");
        }
        if (!isNumericArray(stepDirection)) {
            throw new TypeError("stepDirection must be an array of finite numbers");
        }
        if (points.length % 3 !== 0) {
            throw new RangeError("points must have length divisible by 3");
        }
        if (forces.length % 3 !== 0) {
            throw new RangeError("forces must have length divisible by 3");
        }
        if (stepDirection.length % 3 !== 0) {
            throw new RangeError("stepDirection must have length divisible by 3");
        }
        if (points.length !== forces.length) {
            throw new RangeError("points and forces must have the same length");
        }
        if (points.length !== stepDirection.length) {
            throw new RangeError("points and stepDirection must have the same length");
        }

        this.numPoints = points.length / 3;
        this.points = points;
        this.energy = energy;
        this.forces = forces;
        this.stepDirection = stepDirection;

    }


    clone() {
        return new SphericalOptimizerState(
            this.points.slice(), this.energy,
            this.forces.slice(), this.stepDirection.slice()
        );
    }


} // class SphericalOptimizerState


export function sphericalStep(newPoints, oldPoints, stepDirection, stepSize) {

    if (!isNumericArray(newPoints)) {
        throw new TypeError("newPoints must be an array of finite numbers");
    }
    if (!isNumericArray(oldPoints)) {
        throw new TypeError("oldPoints must be an array of finite numbers");
    }
    if (!isNumericArray(stepDirection)) {
        throw new TypeError("stepDirection must be an array of finite numbers");
    }
    if (!Number.isFinite(stepSize)) {
        throw new TypeError("stepSize must be a finite number");
    }
    if (newPoints.length % 3 !== 0) {
        throw new RangeError("newPoints must have length divisible by 3");
    }
    if (oldPoints.length % 3 !== 0) {
        throw new RangeError("oldPoints must have length divisible by 3");
    }
    if (stepDirection.length % 3 !== 0) {
        throw new RangeError("stepDirection must have length divisible by 3");
    }
    if (newPoints.length !== oldPoints.length) {
        throw new RangeError("newPoints and oldPoints must have the same length");
    }
    if (newPoints.length !== stepDirection.length) {
        throw new RangeError("newPoints and stepDirection must have the same length");
    }

    const numPoints = newPoints.length / 3;
    // let result = 0;
    for (let i = 0; i < numPoints; i++) {
        const dx = stepSize * stepDirection[3 * i];
        const dy = stepSize * stepDirection[3 * i + 1];
        const dz = stepSize * stepDirection[3 * i + 2];
        // result = Math.max(result, dx * dx + dy * dy + dz * dz);
        const x = oldPoints[3 * i] + dx;
        const y = oldPoints[3 * i + 1] + dy;
        const z = oldPoints[3 * i + 2] + dz;
        const invDist = 1.0 / Math.sqrt(x * x + y * y + z * z);
        newPoints[3 * i] = invDist * x;
        newPoints[3 * i + 1] = invDist * y;
        newPoints[3 * i + 2] = invDist * z;
    }
}


function quadraticLineSearchHelper(energyFunction, state, h, e1, e2) {

    if (typeof energyFunction !== "function") {
        throw new TypeError("energyFunction must be a function");
    }
    if (!(state instanceof SphericalOptimizerState)) {
        throw new TypeError("state must be a SphericalOptimizerState");
    }
    if (!(Number.isFinite(h) && (h > 0.0))) {
        throw new TypeError("h must be a finite positive number");
    }
    if (!Number.isFinite(e1)) {
        throw new TypeError("e1 must be a finite number");
    }
    if (!Number.isFinite(e2)) {
        throw new TypeError("e2 must be a finite number");
    }

    if (!(
        ((state.energy >= e1) && (e1 < e2)) ||
        ((state.energy > e1) && (e1 <= e2))
    )) {
        throw new Error("invalid energy bracket");
    }

    const d1 = (e1 - state.energy) / h;
    const d2 = (e2 - e1) / h;
    const d3 = d2 - d1;
    const denominator = (d3 + d3);
    const numerator = d3 - (d1 + d1);
    const hQuad = (numerator / denominator) * h;
    const tempPoints = new state.points.constructor(3 * state.numPoints);
    sphericalStep(tempPoints, state.points, state.stepDirection, hQuad);
    const eQuad = energyFunction(tempPoints);
    if (!Number.isFinite(eQuad)) {
        throw new Error("non-finite energy");
    }

    let hBest = 0.0;
    let eBest = state.energy;
    if (eQuad < eBest) {
        hBest = hQuad;
        eBest = eQuad;
    }
    if (e1 < eBest) {
        hBest = h;
        eBest = e1;
    }
    if (e2 < eBest) {
        hBest = h + h;
        eBest = e2;
    }
    return hBest;
}


export function quadraticLineSearch(energyFunction, state, initialStepSize) {

    if (typeof energyFunction !== "function") {
        throw new TypeError("energyFunction must be a function");
    }
    if (!(state instanceof SphericalOptimizerState)) {
        throw new TypeError("state must be a SphericalOptimizerState");
    }
    if (!Number.isFinite(initialStepSize)) {
        throw new TypeError("initialStepSize must be a finite number");
    }

    const tempPoints = new state.points.constructor(3 * state.numPoints);
    sphericalStep(tempPoints,
        state.points, state.stepDirection, initialStepSize);
    let trialEnergy = energyFunction(tempPoints);
    if (!Number.isFinite(trialEnergy)) {
        throw new Error("non-finite energy");
    }

    if (trialEnergy <= state.energy) {
        let h1 = initialStepSize;
        let h2 = h1 + h1;
        while (true) {
            sphericalStep(tempPoints, state.points, state.stepDirection, h2);
            const nextEnergy = energyFunction(tempPoints);
            if (!Number.isFinite(nextEnergy)) {
                throw new Error("non-finite energy");
            }
            if (nextEnergy > trialEnergy) {
                return quadraticLineSearchHelper(
                    energyFunction, state, h1, trialEnergy, nextEnergy);
            }
            trialEnergy = nextEnergy;
            h1 = h2;
            h2 = h1 + h1;
        }
    } else {
        let h2 = initialStepSize;
        let h1 = 0.5 * h2;
        while (true) {
            sphericalStep(tempPoints, state.points, state.stepDirection, h1);
            const nextEnergy = energyFunction(tempPoints);
            if (!Number.isFinite(nextEnergy)) {
                throw new Error("non-finite energy");
            }
            if (nextEnergy <= state.energy) {
                return quadraticLineSearchHelper(
                    energyFunction, state, h1, nextEnergy, trialEnergy);
            }
            trialEnergy = nextEnergy;
            h2 = h1;
            h1 = 0.5 * h2;
        }
    }
}
