/** @import { NumericArray } from "./InputValidation.js" */
import {
    assertFiniteNumber, assertNumericArray3D,
    assertSameLength, assertValidLength,
} from "./InputValidation.js";


/** @param {number} n @returns {Float64Array} */
export function randomNormalArray(n) {

    assertValidLength(n);

    const result = new Float64Array(n);
    for (let i = 0; i < n; i += 2) {
        // eslint-disable-next-line sonarjs/pseudo-random
        const r = Math.sqrt(-2.0 * Math.log(Math.random()));
        // eslint-disable-next-line sonarjs/pseudo-random
        const theta = 2 * Math.PI * Math.random();
        result[i] = r * Math.cos(theta);
        result[i + 1] = r * Math.sin(theta);
        /* No bounds check is needed because writes past
           the end of a typed array are silently ignored. */
    }
    return result;
}


/** @param {NumericArray} points @returns {void} */
export function normalizePoints(points) {

    assertNumericArray3D(points);

    for (let i = 0; i < points.length; i += 3) {
        const x = points[i];
        const y = points[i + 1];
        const z = points[i + 2];
        const invDist = 1.0 / Math.hypot(x, y, z);
        points[i] = invDist * x;
        points[i + 1] = invDist * y;
        points[i + 2] = invDist * z;
    }
}


export class SphericalOptimizerState {


    /**
     * @param {NumericArray} points
     * @param {number} energy
     * @param {NumericArray} forces
     * @param {NumericArray} stepDirection
     */
    constructor(points, energy, forces, stepDirection) {

        assertNumericArray3D(points);
        assertFiniteNumber(energy);
        assertNumericArray3D(forces);
        assertNumericArray3D(stepDirection);
        assertSameLength(points, forces);
        assertSameLength(points, stepDirection);

        /** @public @type {number} */
        this.numPoints = points.length / 3;

        /** @public @type {NumericArray} */
        this.points = points;

        /** @public @type {number} */
        this.energy = energy;

        /** @public @type {NumericArray} */
        this.forces = forces;

        /** @public @type {NumericArray} */
        this.stepDirection = stepDirection;

    }


    /** @returns {SphericalOptimizerState} */
    clone() {
        return new SphericalOptimizerState(
            this.points.slice(), this.energy,
            this.forces.slice(), this.stepDirection.slice()
        );
    }


}


/**
 * @param {NumericArray} result
 * @param {NumericArray} points
 * @param {NumericArray} stepDirection
 * @param {number} stepSize
 * @returns {void}
 */
export function sphericalStep(result, points, stepDirection, stepSize) {

    assertNumericArray3D(result);
    assertNumericArray3D(points);
    assertNumericArray3D(stepDirection);
    assertFiniteNumber(stepSize);
    assertSameLength(result, points);
    assertSameLength(result, stepDirection);

    const numPoints = result.length / 3;
    for (let i = 0; i < numPoints; i++) {
        const dx = stepSize * stepDirection[3 * i];
        const dy = stepSize * stepDirection[3 * i + 1];
        const dz = stepSize * stepDirection[3 * i + 2];
        const x = points[3 * i] + dx;
        const y = points[3 * i + 1] + dy;
        const z = points[3 * i + 2] + dz;
        const invDist = 1.0 / Math.hypot(x, y, z);
        result[3 * i] = invDist * x;
        result[3 * i + 1] = invDist * y;
        result[3 * i + 2] = invDist * z;
    }
}


/**
 * @param {(points: NumericArray) => number} energyFunction
 * @param {SphericalOptimizerState} state
 * @param {number} h
 * @param {number} e1
 * @param {number} e2
 * @returns {number}
 */
function quadraticLineSearchHelper(energyFunction, state, h, e1, e2) {

    assertFiniteNumber(h); // TODO: Should we assert positivity?
    assertFiniteNumber(e1);
    assertFiniteNumber(e2);

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
    const tempPoints = new Float64Array(3 * state.numPoints);
    sphericalStep(tempPoints, state.points, state.stepDirection, hQuad);
    const eQuad = energyFunction(tempPoints);
    if (!Number.isFinite(eQuad)) {
        throw new TypeError("non-finite energy");
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
        // Omitted: eBest = e2;
    }
    return hBest;
}


/**
 * @param {(points: NumericArray) => number} energyFunction
 * @param {SphericalOptimizerState} state
 * @param {number} initialStepSize
 * @returns {number}
 */
export function quadraticLineSearch(energyFunction, state, initialStepSize) {

    if (typeof energyFunction !== "function") {
        throw new TypeError("energyFunction must be a function");
    }
    if (!(state instanceof SphericalOptimizerState)) {
        throw new TypeError("state must be a SphericalOptimizerState");
    }
    assertFiniteNumber(initialStepSize); // TODO: Should we assert positivity?

    const tempPoints = new Float64Array(3 * state.numPoints);
    sphericalStep(tempPoints,
        state.points, state.stepDirection, initialStepSize);
    let trialEnergy = energyFunction(tempPoints);
    if (!Number.isFinite(trialEnergy)) {
        throw new TypeError("non-finite energy");
    }

    if (trialEnergy <= state.energy) {
        let h1 = initialStepSize;
        let h2 = h1 + h1;
        while (true) {
            sphericalStep(tempPoints, state.points, state.stepDirection, h2);
            const nextEnergy = energyFunction(tempPoints);
            if (!Number.isFinite(nextEnergy)) {
                throw new TypeError("non-finite energy");
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
                throw new TypeError("non-finite energy");
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
