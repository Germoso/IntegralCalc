# Integral and Derivative Calculator

## Overview

This web-based calculator allows users to compute definite integrals and derivatives of mathematical functions. The calculator uses Pyodide, a Python distribution for the browser, to run Python code for symbolic computation.

## Features

- **Definite Integral Calculation**: Computes the definite integral of a user-defined function over a specified interval using both symbolic integration and Monte Carlo approximation.
- **Derivative Calculation**: Computes the derivative of a user-defined function.
- **Interactive Interface**: Users can select between integration and derivation, input functions, and specify integration bounds interactively.

## Requirements

- A modern web browser with JavaScript enabled.

## Usage

1. **Open the Application**: Visit the [GitHub Pages URL](https://nicomilette.github.io/IntegralCalc/) where the application is hosted.
2. **Select Calculation Type**: Choose between "Integration" and "Derivation" using the radio buttons.
3. **Input Function**:
   - For integration, enter the function, lower bound, and upper bound.
   - For derivation, enter the function to differentiate.
4. **Preview**: The entered function and integral bounds will be previewed in LaTeX format.
5. **Calculate**: Click the "Calculate" button to perform the computation. The results will be displayed, showing both the regular integral and Monte Carlo approximation for integration or the derivative for derivation.

## Technical Details

- **Pyodide**: Loads and runs Python code directly in the browser.
- **SymPy**: Performs symbolic mathematics.
- **NumPy**: Handles numerical operations, especially for the Monte Carlo approximation.
- **MathJax**: Renders mathematical notation in LaTeX format.

