document.addEventListener("DOMContentLoaded", async () => {
    const loadingOverlay = document.getElementById("loadingOverlay");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const resultDiv = document.getElementById("result");
    const integrationSection = document.getElementById("integrationSection");
    const derivationSection = document.getElementById("derivationSection");
    const calculatorTitle = document.getElementById("calculatorTitle");

    let selectedType = "integration"; // Set default selected type

    const showLoading = (message) => {
        loadingIndicator.textContent = message;
        loadingOverlay.style.display = "flex";
    };

    const hideLoading = () => {
        loadingOverlay.style.display = "none";
    };

    const loadPyodideAndPackages = async () => {
        showLoading("Loading Python");
        let pyodide = await loadPyodide();
        showLoading("Loaded Python");
        showLoading("Loading sympy");
        await pyodide.loadPackage("sympy");
        showLoading("Loaded sympy");
        showLoading("Loading numpy");
        await pyodide.loadPackage("numpy");
        showLoading("Loaded numpy");
        hideLoading();
        return pyodide;
    };

    let pyodide = await loadPyodideAndPackages();

    async function calculate() {
        showLoading("Calculating...");
        await new Promise(resolve => setTimeout(resolve, 50)); // Allow DOM to update

        if (selectedType === "integration") {
            const lowerBound = parseFloat(document.getElementById("lowerBound").value);
            const upperBound = parseFloat(document.getElementById("upperBound").value);
            const func = document.getElementById("function").value;
            const formattedFunc = formatForLatex(func);
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

            try {
                let result = pyodide.runPython(pythonCode);
                const [regularIntegral, averageMonteCarloIntegral] = result.toJs();
                resultDiv.innerHTML = `
                    <p>\\[ ${formatForLatex(regularIntegral.toString())} \\]</p>
                    <p>\\[ ${formatForLatex(averageMonteCarloIntegral.toString())} \\]</p>`;
                MathJax.typesetPromise([resultDiv]);
            } catch (error) {
                resultDiv.innerHTML = `<p style="color: red;">Error</p>`;
                console.error(error);
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

            try {
                let result = pyodide.runPython(pythonCode);
                const formattedFunc = formatForLatex(func);
                const formattedResult = formatForLatex(result.toString());
                resultDiv.innerHTML = `<p>\\[ f'(x) = ${formattedResult} \\]</p>`;
                MathJax.typesetPromise([resultDiv]);
            } catch (error) {
                resultDiv.innerHTML = `<p style="color: red;">Error</p>`;
                console.error(error);
            } finally {
                hideLoading();
            }
        }
    }

    document.getElementById("calculateButton").addEventListener("click", calculate);

    function updateSelectedType(newType) {
        selectedType = newType;
        resultDiv.innerHTML = ''; // Clear the result text
        updateCalculatorTitle(newType); // Update the calculator title
        if (newType === "integration") {
            integrationSection.style.display = "block";
            derivationSection.style.display = "none";
        } else if (newType === "derivation") {
            integrationSection.style.display = "none";
            derivationSection.style.display = "block";
        }
    }

    function updateCalculatorTitle(type) {
        if (type === "integration") {
            calculatorTitle.textContent = "Integral Calculator";
        } else if (type === "derivation") {
            calculatorTitle.textContent = "Derivative Calculator";
        }
    }

    window.updateSelectedType = updateSelectedType;

    function switchToCalculator() {
        openTab(null, 'Calculator');
    }

    window.switchToCalculator = switchToCalculator;

    function updateMath(inputId, previewId) {
        const input = document.getElementById(inputId).value;
        const formattedInput = formatForLatex(input);
        const preview = document.getElementById(previewId);
        preview.innerHTML = `$$f(x) = ${formattedInput}$$`;
        MathJax.typesetPromise([preview]);
    }

    window.updateMath = updateMath;

    function updateIntegralMath() {
        const lowerBound = document.getElementById("lowerBound").value;
        const upperBound = document.getElementById("upperBound").value;
        const func = document.getElementById("function").value;
        const formattedFunc = formatForLatex(func);
        const preview = document.getElementById("integralPreview");

        preview.innerHTML = `$$\\int_{${lowerBound}}^{${upperBound}} ${formattedFunc} \\, dx$$`;
        MathJax.typesetPromise([preview]);
    }

    window.updateIntegralMath = updateIntegralMath;

    function formatForLatex(input) {
        return input.replace(/(\d+|\(.+?\)|\w+)\s*\/\s*(\d+|\(.+?\)|\w+)/g, '\\frac{$1}{$2}');
    }

    window.formatForLatex = formatForLatex;
});

function openTab(evt, tabName) {
    var i, tabcontent, tabbuttons;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tabbuttons = document.getElementsByClassName("tab-button");
    for (i = 0; i < tabbuttons.length; i++) {
        tabbuttons[i].className = tabbuttons[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    if (evt) {
        evt.currentTarget.className += " active";
    } else {
        document.querySelector(`.tab-button[onclick="openTab(event, '${tabName}')"]`).className += " active";
    }
}
