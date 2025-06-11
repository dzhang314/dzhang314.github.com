/** @param {number} x @returns {void} */
export function assertFiniteNumber(x) {
    if (!Number.isFinite(x)) {
        throw new TypeError("input must be a finite number")
    }
}


/** @param {number} x @returns {void} */
export function assertPositiveNumber(x) {
    if (!(Number.isFinite(x) && (x > 0))) {
        throw new TypeError("input must be a positive number")
    }
}


/** @param {number} n @returns {void} */
export function assertValidLength(n) {
    if (!(Number.isSafeInteger(n) && (n >= 0))) {
        throw new RangeError("invalid array length");
    }
}


/** @param {any} x @param {any} T @returns {void} */
export function assertArrayOf(x, T) {
    if (!Array.isArray(x)) {
        throw new TypeError("input must be an array");
    }
    for (const entry of x) {
        if (!(entry instanceof T)) {
            throw new TypeError(`input must be an array of ${T.name}`);
        }
    }
}


/** @typedef {number[] | Float32Array | Float64Array} NumericArray */


/** @param {NumericArray} x @returns {boolean} */
function isNumericArray(x) {
    if (!(
        Array.isArray(x) ||
        (x instanceof Float32Array) ||
        (x instanceof Float64Array)
    )) {
        return false;
    }
    for (const entry of x) {
        if (!Number.isFinite(entry)) { return false; }
    }
    return true;
}


/** @param {NumericArray} x @returns {void} */
export function assertNumericArray3D(x) {
    if (!isNumericArray(x)) {
        throw new TypeError("input must be an array of finite numbers");
    }
    if (x.length % 3 !== 0) {
        throw new RangeError("input must have length divisible by 3");
    }
}


/** @param {NumericArray} x @param {NumericArray} y @returns {void} */
export function assertSameLength(x, y) {
    if (x.length !== y.length) {
        throw new RangeError("inputs must have the same length");
    }
}


/** @param {HTMLElement} x @returns {void} */
export function assertHTMLElement(x) {
    if (!(x instanceof HTMLElement)) {
        throw new TypeError("input must be an HTMLElement");
    }
}
