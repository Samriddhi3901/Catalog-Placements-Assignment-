/**
 * OPTIMIZED LAGRANGE INTERPOLATION SOLVER
 * Production-ready solution for company coding challenges
 * Handles Shamir's Secret Sharing and polynomial reconstruction
 */

const fs = require('fs').promises;

class OptimizedLagrangeSolver {
    constructor() {
        this.precision = 1e-10;
        this.maxIterations = 1000;
    }

    /**
     * STEP 1: Async JSON file reading with better error handling
     */
    async readJsonFile(filename = 'input.json') {
        console.log('STEP 1: Reading JSON file...');
        
        try {
            const data = await fs.readFile(filename, 'utf8');
            const parsed = JSON.parse(data);
            console.log('JSON file loaded successfully');
            return parsed;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('File not found, using demo data');
                return this.getDemoData();
            } else if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON format: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Demo data for testing when no file exists
     */
    getDemoData() {
        return {
            keys: { n: 4, k: 3 },
            "1": { base: "10", value: "4" },
            "2": { base: "2", value: "111" },
            "3": { base: "10", value: "12" },
            "4": { base: "16", value: "13" }
        };
    }

    /**
     * STEP 2: Optimized base conversion with validation
     */
    decodeYValues(data) {
        console.log('STEP 2: Decoding y-values...');
        
        const points = [];
        const keys = Object.keys(data).filter(key => !isNaN(parseInt(key)));
        
        if (keys.length === 0) {
            throw new Error('No valid data points found in JSON');
        }

        for (const key of keys) {
            const point = data[key];
            if (!point || typeof point.base === 'undefined' || typeof point.value === 'undefined') {
                throw new Error(`Invalid point data for key ${key}`);
            }

            const x = parseInt(key);
            const base = parseInt(point.base);
            const value = point.value.toString();

            // Validate base
            if (base < 2 || base > 36) {
                throw new Error(`Invalid base ${base} for point ${key}. Base must be 2-36`);
            }

            // Decode value with validation
            const y = this.parseInBase(value, base, key);
            
            points.push({ x, y });
            console.log(`  Point ${key}: "${value}" (base ${base}) -> ${y}`);
        }

        // Sort points by x-coordinate for consistency
        points.sort((a, b) => a.x - b.x);
        console.log('All points decoded and sorted');
        return points;
    }

    /**
     * Robust base conversion with error handling
     */
    parseInBase(value, base, pointKey) {
        try {
            // Check if all characters are valid for the given base
            const validChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, base);
            const upperValue = value.toUpperCase();
            
            for (const char of upperValue) {
                if (!validChars.includes(char)) {
                    throw new Error(`Invalid character '${char}' for base ${base}`);
                }
            }

            const result = parseInt(upperValue, base);
            if (isNaN(result)) {
                throw new Error('Conversion resulted in NaN');
            }

            return result;
        } catch (error) {
            throw new Error(`Failed to decode point ${pointKey}: ${error.message}`);
        }
    }

    /**
     * STEP 3: Optimized Lagrange interpolation using efficient algorithm
     */
    calculatePolynomialCoefficients(points) {
        console.log('STEP 3: Computing polynomial coefficients...');
        
        const n = points.length;
        if (n === 0) throw new Error('No points provided');
        if (n === 1) return [points[0].y]; // Constant polynomial

        // Check for duplicate x-values
        const xValues = points.map(p => p.x);
        const uniqueX = new Set(xValues);
        if (uniqueX.size !== xValues.length) {
            throw new Error('Duplicate x-values found - interpolation not unique');
        }

        const coefficients = new Array(n).fill(0);

        // Optimized Lagrange coefficient calculation
        for (let i = 0; i < n; i++) {
            const basisCoeffs = this.computeLagrangeBasis(points, i);
            
            // Add weighted contribution
            for (let j = 0; j < n; j++) {
                coefficients[j] += points[i].y * (basisCoeffs[j] || 0);
            }
        }

        // Clean up tiny coefficients (numerical precision issues)
        for (let i = 0; i < coefficients.length; i++) {
            if (Math.abs(coefficients[i]) < this.precision) {
                coefficients[i] = 0;
            }
        }

        console.log('Polynomial coefficients computed');
        return coefficients;
    }

    /**
     * Efficient Lagrange basis polynomial computation
     */
    computeLagrangeBasis(points, i) {
        const n = points.length;
        let poly = [1]; // Start with polynomial "1"
        const xi = points[i].x;

        for (let j = 0; j < n; j++) {
            if (i !== j) {
                const xj = points[j].x;
                const denominator = xi - xj;
                
                if (Math.abs(denominator) < this.precision) {
                    throw new Error(`Points ${i} and ${j} have nearly identical x-values`);
                }

                // Multiply polynomial by (x - xj) / (xi - xj)
                poly = this.multiplyPolynomial(poly, [-xj, 1], 1 / denominator);
            }
        }

        // Ensure correct length
        while (poly.length < n) poly.push(0);
        return poly.slice(0, n);
    }

    /**
     * Multiply polynomial by (ax + b) with scaling factor
     */
    multiplyPolynomial(poly, linear, scale = 1) {
        const [b, a] = linear; // linear = [b, a] represents ax + b
        const result = new Array(poly.length + 1).fill(0);

        for (let i = 0; i < poly.length; i++) {
            const coeff = poly[i] * scale;
            result[i] += coeff * b;      // Constant term
            result[i + 1] += coeff * a;  // x term
        }

        return result;
    }

    /**
     * STEP 4: Advanced root finding with multiple algorithms
     */
    findRoots(coefficients) {
        console.log('STEP 4: Finding polynomial roots...');
        
        const degree = this.getActualDegree(coefficients);
        if (degree === 0) return [];

        const roots = [];

        if (degree === 1) {
            // Linear: ax + b = 0
            const root = -coefficients[0] / coefficients[1];
            roots.push(root);
            console.log(`  Linear root: x = ${root.toFixed(8)}`);
        } 
        else if (degree === 2) {
            // Quadratic: ax² + bx + c = 0
            const quadRoots = this.solveQuadratic(coefficients);
            roots.push(...quadRoots);
        }
        else if (degree === 3) {
            // Cubic equation
            const cubicRoots = this.solveCubic(coefficients);
            roots.push(...cubicRoots);
        }
        else {
            // Higher degree - multiple numerical methods
            const numRoots = this.findNumericalRoots(coefficients);
            roots.push(...numRoots);
        }

        console.log(`Found ${roots.length} root(s)`);
        return roots;
    }

    /**
     * Get actual degree (ignore trailing zeros)
     */
    getActualDegree(coefficients) {
        for (let i = coefficients.length - 1; i >= 0; i--) {
            if (Math.abs(coefficients[i]) > this.precision) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Optimized quadratic formula with numerical stability
     */
    solveQuadratic(coeffs) {
        const [c, b, a] = coeffs;
        const discriminant = b * b - 4 * a * c;
        
        if (Math.abs(discriminant) < this.precision) {
            // Single root
            const root = -b / (2 * a);
            console.log(`  Double root: x = ${root.toFixed(8)}`);
            return [root];
        } else if (discriminant > 0) {
            // Two real roots - use numerically stable method
            const sqrtD = Math.sqrt(discriminant);
            const q = -0.5 * (b + Math.sign(b) * sqrtD);
            const root1 = q / a;
            const root2 = c / q;
            console.log(`  Real roots: x1 = ${root1.toFixed(8)}, x2 = ${root2.toFixed(8)}`);
            return [root1, root2];
        } else {
            // Complex roots
            const real = -b / (2 * a);
            const imag = Math.sqrt(-discriminant) / (2 * a);
            console.log(`  Complex roots: x = ${real.toFixed(8)} ± ${imag.toFixed(8)}i`);
            return [
                { real: real, imag: imag },
                { real: real, imag: -imag }
            ];
        }
    }

    /**
     * Cubic equation solver (Cardano's method)
     */
    solveCubic(coeffs) {
        console.log('  Solving cubic equation...');
        // Simplified cubic solver - can be expanded for full implementation
        return this.findNumericalRoots(coeffs);
    }

    /**
     * Enhanced numerical root finding
     */
    findNumericalRoots(coefficients) {
        const roots = [];
        const degree = this.getActualDegree(coefficients);
        
        // Smart starting points based on polynomial bounds
        const bounds = this.getPolynomialBounds(coefficients);
        const startingPoints = this.generateStartingPoints(bounds, degree);
        
        for (const start of startingPoints) {
            const root = this.newtonRaphsonRobust(coefficients, start);
            if (root !== null && !this.isDuplicateRoot(roots, root)) {
                roots.push(root);
                if (roots.length >= degree) break; // Found enough roots
            }
        }

        return roots;
    }

    /**
     * Estimate polynomial bounds for better starting points
     */
    getPolynomialBounds(coefficients) {
        const degree = this.getActualDegree(coefficients);
        if (degree === 0) return { min: 0, max: 0 };
        
        const leading = coefficients[degree];
        let maxCoeff = 0;
        
        for (let i = 0; i < degree; i++) {
            maxCoeff = Math.max(maxCoeff, Math.abs(coefficients[i]));
        }
        
        const bound = 1 + maxCoeff / Math.abs(leading);
        return { min: -bound, max: bound };
    }

    /**
     * Generate smart starting points for root finding
     */
    generateStartingPoints(bounds, degree) {
        const points = [0]; // Always try zero
        const range = bounds.max - bounds.min;
        const step = range / (degree + 5);
        
        for (let i = 1; i <= degree + 5; i++) {
            points.push(bounds.min + i * step);
            points.push(bounds.min + i * step * 0.7); // Slightly offset points
        }
        
        return points;
    }

    /**
     * Robust Newton-Raphson with fallback methods
     */
    newtonRaphsonRobust(coefficients, x0) {
        let x = x0;
        
        for (let iter = 0; iter < this.maxIterations; iter++) {
            const f = this.evaluatePolynomial(coefficients, x);
            const df = this.evaluateDerivative(coefficients, x);
            
            if (Math.abs(f) < this.precision) {
                return x; // Found root
            }
            
            if (Math.abs(df) < this.precision) {
                // Try bisection method as fallback
                return this.bisectionMethod(coefficients, x - 1, x + 1);
            }
            
            const newX = x - f / df;
            
            // Check for convergence
            if (Math.abs(newX - x) < this.precision) {
                return Math.abs(f) < this.precision ? newX : null;
            }
            
            x = newX;
        }
        
        return null;
    }

    /**
     * Bisection method as fallback
     */
    bisectionMethod(coefficients, a, b, maxIter = 100) {
        let fa = this.evaluatePolynomial(coefficients, a);
        let fb = this.evaluatePolynomial(coefficients, b);
        
        if (fa * fb > 0) return null; // No root in interval
        
        for (let i = 0; i < maxIter; i++) {
            const c = (a + b) / 2;
            const fc = this.evaluatePolynomial(coefficients, c);
            
            if (Math.abs(fc) < this.precision || Math.abs(b - a) < this.precision) {
                return c;
            }
            
            if (fa * fc < 0) {
                b = c;
                fb = fc;
            } else {
                a = c;
                fa = fc;
            }
        }
        
        return (a + b) / 2;
    }

    /**
     * Check for duplicate roots
     */
    isDuplicateRoot(roots, newRoot) {
        return roots.some(root => {
            if (typeof root === 'number' && typeof newRoot === 'number') {
                return Math.abs(root - newRoot) < this.precision * 10;
            }
            return false;
        });
    }

    /**
     * Optimized polynomial evaluation using Horner's method
     */
    evaluatePolynomial(coefficients, x) {
        if (coefficients.length === 0) return 0;
        
        let result = coefficients[coefficients.length - 1];
        for (let i = coefficients.length - 2; i >= 0; i--) {
            result = result * x + coefficients[i];
        }
        return result;
    }

    /**
     * Optimized derivative evaluation
     */
    evaluateDerivative(coefficients, x) {
        if (coefficients.length <= 1) return 0;
        
        let result = coefficients[coefficients.length - 1] * (coefficients.length - 1);
        for (let i = coefficients.length - 2; i >= 1; i--) {
            result = result * x + coefficients[i] * i;
        }
        return result;
    }

    /**
     * STEP 5: Extract and display constant C with validation
     */
    extractConstantC(coefficients) {
        console.log('\nSTEP 5: Extracting constant C...');
        
        if (!coefficients || coefficients.length === 0) {
            throw new Error('No coefficients available');
        }
        
        const constantC = coefficients[0];
        
        console.log('==================================================');
        console.log('FINAL RESULT');
        console.log('==================================================');
        console.log(`CONSTANT C = ${constantC}`);
        console.log('==================================================');
        
        return constantC;
    }

    /**
     * Comprehensive verification
     */
    verify(points, coefficients) {
        console.log('\nVERIFICATION:');
        let allCorrect = true;
        
        for (const point of points) {
            const calculated = this.evaluatePolynomial(coefficients, point.x);
            const error = Math.abs(calculated - point.y);
            const isCorrect = error < this.precision * 100;
            
            console.log(`f(${point.x}) = ${calculated.toFixed(8)} ` + 
                       `(expected: ${point.y}, error: ${error.toExponential(2)}) ` +
                       `${isCorrect ? 'PASSED' : 'FAILED'}`);
            
            if (!isCorrect) allCorrect = false;
        }
        
        console.log(`Verification: ${allCorrect ? 'PASSED' : 'FAILED'}`);
        return allCorrect;
    }

    /**
     * Main solver with comprehensive error handling
     */
    async solve(filename = 'input.json') {
        const startTime = Date.now();
        
        try {
            console.log('OPTIMIZED LAGRANGE INTERPOLATION SOLVER');
            console.log('============================================================');
            
            // Execute all steps
            const data = await this.readJsonFile(filename);
            const points = this.decodeYValues(data);
            const coefficients = this.calculatePolynomialCoefficients(points);
            const roots = this.findRoots(coefficients);
            const constantC = this.extractConstantC(coefficients);
            
            // Verification
            const verified = this.verify(points, coefficients);
            
            // Performance metrics
            const executionTime = Date.now() - startTime;
            
            console.log('\nSOLUTION SUMMARY:');
            console.log(`Points processed: ${points.length}`);
            console.log(`Polynomial degree: ${this.getActualDegree(coefficients)}`);
            console.log(`Roots found: ${roots.length}`);
            console.log(`Verification: ${verified ? 'PASSED' : 'FAILED'}`);
            console.log(`Execution time: ${executionTime}ms`);
            
            return {
                success: true,
                constantC,
                coefficients,
                roots,
                points,
                executionTime,
                verified
            };
            
        } catch (error) {
            console.error('SOLVER ERROR:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Format polynomial for display
     */
    formatPolynomial(coefficients) {
        const terms = [];
        const degree = this.getActualDegree(coefficients);
        
        for (let i = 0; i <= degree; i++) {
            const coeff = coefficients[i];
            if (Math.abs(coeff) < this.precision) continue;
            
            let term = '';
            const absCoeff = Math.abs(coeff);
            const sign = coeff >= 0 ? '+' : '-';
            
            if (i === 0) {
                term = `${coeff.toFixed(6)}`;
            } else if (i === 1) {
                term = `${sign} ${absCoeff.toFixed(6)}x`;
            } else {
                term = `${sign} ${absCoeff.toFixed(6)}x^${i}`;
            }
            
            terms.push(term);
        }
        
        let result = terms.join(' ');
        if (result.startsWith('+ ')) result = result.substring(2);
        return result || '0';
    }
}

// Example usage with error handling
async function main() {
    const solver = new OptimizedLagrangeSolver();
    const result = await solver.solve('input.json');
    
    if (result.success) {
        console.log(`\nSUCCESS! Constant C = ${result.constantC}`);
    } else {
        console.log(`\nFAILED: ${result.error}`);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = OptimizedLagrangeSolver;