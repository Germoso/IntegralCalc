document.addEventListener("DOMContentLoaded", async () => {
    console.log("Pyodide test script loaded");

    const loadingOverlay = document.getElementById("loadingOverlay");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const resultDiv = document.getElementById("result");
    const integrationSection = document.getElementById("integrationSection");
    const derivationSection = document.getElementById("derivationSection");
    const radioButtons = document.getElementsByName("calcType");

    const showLoading = (message) => {
        loadingIndicator.textContent = message;
        loadingOverlay.style.display = "flex";
    };

    const hideLoading = () => {
        loadingOverlay.style.display = "none";
    };

    const loadPyodideAndPackages = async () => {
        showLoading("Loading...");
        let pyodide = await loadPyodide();
        await pyodide.loadPackage("sympy");
        await pyodide.loadPackage("numpy");
        hideLoading();
        return pyodide;
    };

    let pyodide = await loadPyodideAndPackages();

    // Function to run the Python code
    async function calculate() {
        showLoading("Calculating...");
        await new Promise(resolve => setTimeout(resolve, 0)); // Allow DOM to update
        const selectedType = document.querySelector('input[name="calcType"]:checked').value;

        if (selectedType === "integration") {
            const lowerBound = parseFloat(document.getElementById("lowerBound").value);
            const upperBound = parseFloat(document.getElementById("upperBound").value);
            const func = document.getElementById("function").value;
            const numPoints = 999999;  // Adjusting to a reasonable number of points
            const numSimulations = 10;  // Number of Monte Carlo simulations

            const pythonCode = `
import sympy as sp
import numpy as np

# Define the variables
x = sp.symbols('x')

# Parse the function
func = sp.lambdify(x, sp.sympify('${func}'))

# Define the bounds
lower_bound = ${lowerBound}
upper_bound = ${upperBound}

# Regular Integration
integral = sp.integrate(sp.sympify('${func}'), (x, lower_bound, upper_bound))

# Monte Carlo Integration
num_points = ${numPoints}
num_simulations = ${numSimulations}
mc_results = []
for _ in range(num_simulations):
    x_random = np.random.uniform(lower_bound, upper_bound, num_points)
    y_random = func(x_random)
    area_monte_carlo = (upper_bound - lower_bound) * np.mean(y_random)
    mc_results.append(area_monte_carlo)

# Take the average of the Monte Carlo results
average_mc_integral = np.mean(mc_results)

integral, average_mc_integral
            `;

            // Run the Python code
            try {
                let result = pyodide.runPython(pythonCode);
                const [regularIntegral, averageMonteCarloIntegral] = result.toJs();
                resultDiv.innerHTML = `<p>Result: ${regularIntegral}</p>
                                       <p>Approximation: ${averageMonteCarloIntegral}</p>`;
            } catch (error) {
                resultDiv.innerHTML = `Error: ${error.message}`;
            } finally {
                hideLoading();
            }
        } else if (selectedType === "derivation") {
            const func = document.getElementById("functionDeriv").value;

            const pythonCode = `
import sympy as sp

# Define the variables
x = sp.symbols('x')

# Parse the function
func = sp.sympify('${func}')

# Differentiate the function
derivative = sp.diff(func, x)

derivative
            `;

            // Run the Python code
            try {
                let result = pyodide.runPython(pythonCode);
                resultDiv.innerHTML = `<p>f'(x) = ${result}</p>`;
            } catch (error) {
                resultDiv.innerHTML = `Error: ${error.message}`;
            } finally {
                hideLoading();
            }
        }
    }

    // Add event listener to the button
    document.getElementById("calculateButton").addEventListener("click", calculate);

    // Add event listeners to radio buttons to toggle input sections and clear results
    radioButtons.forEach(radio => {
        radio.addEventListener("change", (event) => {
            resultDiv.innerHTML = ''; // Clear the result text
            if (event.target.value === "integration") {
                integrationSection.style.display = "block";
                derivationSection.style.display = "none";
            } else if (event.target.value === "derivation") {
                integrationSection.style.display = "none";
                derivationSection.style.display = "block";
            }
        });
    });
});
