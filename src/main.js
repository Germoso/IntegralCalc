document.addEventListener('DOMContentLoaded', async () => {
  const loadingOverlay = document.getElementById('loadingOverlay')
  const loadingIndicator = document.getElementById('loadingIndicator')
  const resultDiv = document.getElementById('result')
  const integrationSection = document.getElementById('integrationSection')
  const derivationSection = document.getElementById('derivationSection')
  const calculatorTitle = document.getElementById('calculatorTitle')

  let selectedType = 'integration' // Set default selected type

  const showLoading = (message) => {
    loadingIndicator.textContent = message
    loadingOverlay.style.display = 'flex'
  }

  const hideLoading = () => {
    loadingOverlay.style.display = 'none'
  }

  const loadPyodideAndPackages = async () => {
    showLoading('Cargando')
    let pyodide = await loadPyodide()
    showLoading('Cargando')
    showLoading('Cargando')
    await pyodide.loadPackage('sympy')
    showLoading('Cargando')
    showLoading('Cargando')
    await pyodide.loadPackage('numpy')
    showLoading('Cargando')
    hideLoading()
    return pyodide
  }

  let pyodide = await loadPyodideAndPackages()

  async function calculate() {
    showLoading('Calculando...')
    await new Promise((resolve) => setTimeout(resolve, 50)) // Allow DOM to update

    if (selectedType === 'integration') {
      const lowerBound = parseFloat(document.getElementById('lowerBound').value)
      const upperBound = parseFloat(document.getElementById('upperBound').value)
      const func = document.getElementById('function').value
      const formattedFunc = formatForLatex(func)
      const numPoints = 1000

      const pythonCode = `
              import sympy as sp
              import numpy as np

              x = sp.symbols('x')
              func = sp.lambdify(x, sp.sympify('${func}'))
              lower_bound = ${lowerBound}
              upper_bound = ${upperBound}

              integral = sp.integrate(sp.sympify('${func}'), (x, lower_bound, upper_bound))

              x_vals = np.linspace(lower_bound, upper_bound, ${numPoints})
              y_vals = func(x_vals)

              if not hasattr(y_vals, 'tolist'):
                  y_vals = np.full_like(x_vals, y_vals)

              integral, x_vals.tolist(), y_vals.tolist()
          `

      try {
        let result = pyodide.runPython(pythonCode)
        const [regularIntegral, x_vals, y_vals] = result.toJs()

        resultDiv.innerHTML = `
                  <p>\\[ \\int_{${lowerBound}}^{${upperBound}} ${formattedFunc} \\, dx = ${regularIntegral} \\]</p>`
        MathJax.typesetPromise([resultDiv])

        Plotly.newPlot(
          'plot',
          [
            {
              x: x_vals,
              y: y_vals,
              mode: 'lines',
              name: 'Function'
            },
            {
              x: [lowerBound, upperBound],
              y: [0, 0],
              mode: 'lines',
              fill: 'tozeroy',
              name: 'Integral'
            }
          ],
          {
            title: 'Funcion e Integral',
            xaxis: { title: 'x' },
            yaxis: { title: 'f(x)' }
          }
        )
      } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error</p>`
        console.error(error)
      } finally {
        hideLoading()
      }
    } else if (selectedType === 'derivation') {
      const func = document.getElementById('functionDeriv').value

      const pythonCode = `
              import sympy as sp
              import numpy as np

              x = sp.symbols('x')
              func = sp.sympify('${func}')
              derivative = sp.diff(func, x)

              x_vals = np.linspace(-10, 10, 1000)
              y_vals = sp.lambdify(x, func)(x_vals)
              dy_vals = sp.lambdify(x, derivative)(x_vals)

              if not hasattr(y_vals, 'tolist'):
                  y_vals = np.full_like(x_vals, y_vals)
              if not hasattr(dy_vals, 'tolist'):
                  dy_vals = np.full_like(x_vals, dy_vals)

              derivative, x_vals.tolist(), y_vals.tolist(), dy_vals.tolist()
          `

      try {
        let result = pyodide.runPython(pythonCode)
        const [derivative, x_vals, y_vals, dy_vals] = result.toJs()
        const formattedFunc = formatForLatex(func)
        const formattedResult = formatForLatex(derivative.toString())

        resultDiv.innerHTML = `<p>\\[ f'(x) = ${formattedResult} \\]</p>`
        MathJax.typesetPromise([resultDiv])

        Plotly.newPlot(
          'plot',
          [
            {
              x: x_vals,
              y: y_vals,
              mode: 'lines',
              name: 'Function'
            },
            {
              x: x_vals,
              y: dy_vals,
              mode: 'lines',
              name: 'Derivative'
            }
          ],
          {
            title: 'Funcion y derivada',
            xaxis: { title: 'x' },
            yaxis: { title: "f(x), f'(x)" }
          }
        )
      } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error</p>`
        console.error(error)
      } finally {
        hideLoading()
      }
    }
  }

  document
    .getElementById('calculateButton')
    .addEventListener('click', calculate)

  function updateSelectedType(newType) {
    selectedType = newType
    resultDiv.innerHTML = '' // Clear the result text
    updateCalculatorTitle(newType) // Update the calculator title
    if (newType === 'integration') {
      integrationSection.style.display = 'block'
      derivationSection.style.display = 'none'
    } else if (newType === 'derivation') {
      integrationSection.style.display = 'none'
      derivationSection.style.display = 'block'
    }
  }

  function updateCalculatorTitle(type) {
    if (type === 'integration') {
      calculatorTitle.textContent = 'Calculadora de Integrales'
    } else if (type === 'derivation') {
      calculatorTitle.textContent = 'Calculadora de Derivadas'
    }
  }

  window.updateSelectedType = updateSelectedType

  function switchToCalculator() {
    openTab(null, 'Calculator')
  }

  window.switchToCalculator = switchToCalculator

  function updateMath(inputId, previewId) {
    const input = document.getElementById(inputId).value
    const formattedInput = formatForLatex(input)
    const preview = document.getElementById(previewId)
    preview.innerHTML = `$$f(x) = ${formattedInput}$$`
    MathJax.typesetPromise([preview])
  }

  window.updateMath = updateMath

  function updateIntegralMath() {
    const lowerBound = document.getElementById('lowerBound').value
    const upperBound = document.getElementById('upperBound').value
    const func = document.getElementById('function').value
    const formattedFunc = formatForLatex(func)
    const preview = document.getElementById('integralPreview')

    preview.innerHTML = `$$\\int_{${lowerBound}}^{${upperBound}} ${formattedFunc} \\, dx$$`
    MathJax.typesetPromise([preview])
  }

  window.updateIntegralMath = updateIntegralMath

  function formatForLatex(input) {
    return input.replace(
      /(\d+|\(.+?\)|\w+)\s*\/\s*(\d+|\(.+?\)|\w+)/g,
      '\\frac{$1}{$2}'
    )
  }

  window.formatForLatex = formatForLatex
})

function openTab(evt, tabName) {
  var i, tabcontent, tabbuttons
  tabcontent = document.getElementsByClassName('tabcontent')
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none'
  }
  tabbuttons = document.getElementsByClassName('tablinks')
  for (i = 0; i < tabbuttons.length; i++) {
    tabbuttons[i].className = tabbuttons[i].className.replace(' active', '')
  }
  document.getElementById(tabName).style.display = 'block'
  if (evt != null) {
    evt.currentTarget.className += ' active'
  }
}
