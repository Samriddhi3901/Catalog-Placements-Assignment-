# Lagrange Interpolation Solver

A JavaScript implementation for polynomial reconstruction using Lagrange interpolation to extract the constant term from encoded data points.

## Requirements

- Node.js (version 12+)

## Installation

1. Save the code as `lagrange_solver.js`
2. Create your input JSON file
3. Run: `node lagrange_solver.js`

## Input Format

Create `input.json` with this structure:

```json
{
  "keys": {
    "n": 4,
    "k": 3
  },
  "1": {
    "base": "10",
    "value": "4"
  },
  "2": {
    "base": "2", 
    "value": "111"
  },
  "3": {
    "base": "10",
    "value": "12"
  },
  "4": {
    "base": "16",
    "value": "13"
  }
}
```

- Point IDs (1, 2, 3, 4) become x-coordinates
- Values are decoded from specified bases (2-36)
- Results in points: (1,4), (2,7), (3,12), (4,19)

## Usage

### Basic Usage
```bash
node lagrange_solver.js
```

### Custom Input File
Modify the filename in the code or use programmatically:

```javascript
const Solver = require('./lagrange_solver.js');
const solver = new Solver();
solver.solve('your_file.json').then(result => {
  console.log('Constant C:', result.constantC);
});
```

## Output

The solver will display:
```
CONSTANT C = [your answer]
```

Plus verification that the polynomial passes through all input points.

## What It Does

1. **Reads JSON** - Loads encoded data points
2. **Decodes values** - Converts from various bases to decimal
3. **Applies Lagrange interpolation** - Reconstructs the polynomial
4. **Extracts constant C** - Returns the coefficient of x⁰
5. **Finds roots** - Calculates where f(x) = 0

## Supported Bases

- Binary (base 2): "1101"
- Octal (base 8): "755" 
- Decimal (base 10): "123"
- Hexadecimal (base 16): "FF"
- Any base 2-36

## Error Handling

- Invalid JSON format
- Invalid base values
- Missing or malformed data points
- Numerical precision issues

## Example

Input points (1,4), (2,7), (3,12), (4,19) produce polynomial:
```
f(x) = 1 + 0x + 1.5x² + 0.5x³
```
Therefore: **CONSTANT C = 1**
