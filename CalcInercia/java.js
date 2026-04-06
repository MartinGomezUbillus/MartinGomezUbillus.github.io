const CONVERSIONES = {
    "mm": { "cm": 0.1, "m": 0.001, "ft": 0.00328084, "in": 0.03937008 },
    "cm": { "mm": 10, "m": 0.01, "ft": 0.0328084, "in": 0.393701 },
    "m": { "mm": 1000, "cm": 100, "ft": 3.28084, "in": 39.3701 },
    "ft": { "mm": 304.8, "cm": 30.48, "m": 0.3048, "in": 12 },
    "in": { "mm": 25.4, "cm": 2.54, "m": 0.0254, "ft": 1 / 12 }
};

function formatearIngenieria(num) {
    let formateado = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    }).format(num);
    return formateado.replace(/,/g, '\\ ');
}

function formatearCientifica(num) {
    if (num === 0) return "0";
    let [mantisa, exponente] = num.toExponential(4).split('e');
    exponente = exponente.replace('+', '');
    return `${mantisa} \\times 10^{${exponente}}`;
}

// Función para imprimir en el HTML (ahorra muchas líneas)
function mostrarEnPantalla(id, label, valor, unidad, potencia = "") {
    const p = document.getElementById(id);
    if (p) {
        p.innerHTML = `\\( ${label} = ${formatearIngenieria(valor)} \\text{ ${unidad} }${potencia} = ${formatearCientifica(valor)} \\text{ ${unidad} }${potencia} \\)`;
    }
}


document.getElementById('form_uno').addEventListener('submit', function(e) {
    e.preventDefault();
    const uIn = document.getElementById("unidades").value;
    const uOut = document.getElementById("resultado").value;
    const k = (uIn === uOut) ? 1 : (CONVERSIONES[uIn][uOut] || 1);

    const a = parseFloat(document.getElementById('a_1').value) * k;
    const b = parseFloat(document.getElementById('b_1').value) * k;
    const c = parseFloat(document.getElementById('c_1').value) * k;

    if ([a, b, c].some(isNaN)) return alert("Valores inválidos");

    // Fórmulas
    const y = (2 * a + b) / 2;
    const x = c / 2;
    const Ix = (c * Math.pow(2 * a + b, 3)) / 12 - (c - a) * Math.pow(b, 3) / 12;
    const Iy = (2 * (a * Math.pow(c, 3)) / 12 + b * Math.pow(a, 3) / 12);
    const A = 2 * a * c + a * b;

    // Mostrar (Usando nuestra función simplificadora)
    mostrarEnPantalla('resultado-y', '\\tilde{y}', y, uOut);
    mostrarEnPantalla('resultado-x', '\\tilde{x}', x, uOut);
    mostrarEnPantalla('resultado-Ix', '\\overline{I}_{x\'}', Ix, uOut, "^4");
    mostrarEnPantalla('resultado-Iy', '\\overline{I}_{y\'}', Iy, uOut, "^4");
    mostrarEnPantalla('resultado-A', 'A', A, uOut, "^2");

    MathJax.typeset();
});
document.getElementById('form_dos').addEventListener('submit', function(e) {
    e.preventDefault();
    const uIn = document.getElementById("unidades_dos").value;
    const uOut = document.getElementById("resultado_dos").value;
    const k = (uIn === uOut) ? 1 : (CONVERSIONES[uIn][uOut] || 1);

    const a = parseFloat(document.getElementById('a_2').value) * k;
    const b = parseFloat(document.getElementById('b_2').value) * k;
    const c = parseFloat(document.getElementById('c_2').value) * k;
    const d = parseFloat(document.getElementById('d_2').value) * k;

    if ([a, b, c, d].some(isNaN)) return alert("Valores inválidos");

    // Fórmulas Viga T
    const A = d * a + b * c;
    const y = (a * d * (b + a / 2) + c * Math.pow(b, 2) / 2) / A;
    const x = d / 2;
    const Ix = (Math.pow(a, 4) * Math.pow(d, 2) + 4 * Math.pow(a, 3) * b * c * d + 6 * Math.pow(a, 2) * Math.pow(b, 2) * c * d + 4 * a * Math.pow(b, 3) * c * d + Math.pow(b, 4) * Math.pow(c, 2)) / (12 * (a * d + b * c));
    const Iy = b * Math.pow(a, 3) / 12 + a * Math.pow(d, 3) / 12;

    // Mostrar
    mostrarEnPantalla('resultado-y_dos', '\\tilde{y}', y, uOut);
    mostrarEnPantalla('resultado-x_dos', '\\tilde{x}', x, uOut);
    mostrarEnPantalla('resultado-Ix_dos', '\\overline{I}_{x\'}', Ix, uOut, "^4");
    mostrarEnPantalla('resultado-Iy_dos', '\\overline{I}_{y\'}', Iy, uOut, "^4");
    mostrarEnPantalla('resultado-A_dos', 'A', A, uOut, "^2");

    MathJax.typeset();
});
document.getElementById('form_tres').addEventListener('submit', function(e) {
    e.preventDefault();
    const uIn = document.getElementById("unidades_tres").value;
    const uOut = document.getElementById("resultado_tres").value;
    const k = (uIn === uOut) ? 1 : (CONVERSIONES[uIn][uOut] || 1);

    const h1 = parseFloat(document.getElementById('h_1').value) * k;
    const h2 = parseFloat(document.getElementById('h_2').value) * k;
    const h3 = parseFloat(document.getElementById('h_3').value) * k;
    const b1 = parseFloat(document.getElementById('b_11').value) * k;
    const b2 = parseFloat(document.getElementById('b_22').value) * k;
    const b3 = parseFloat(document.getElementById('b_3').value) * k;

    if ([h1, h2, h3, b1,b2,b3].some(isNaN)) return alert("Valores inválidos de la seccion H personalizada.");

    // Fórmulas Viga T
    const A = b1*h1 + b2*h2 + b3*h3;
    const y = (b1 * h1 * (h1 / 2 + h2 + h3) + b2 * h2 * (h2 / 2 + h3) + b3 * Math.pow(h3, 2) / 2) / A;
    const x = b3 / 2;
    const Ix = (b1 * Math.pow(h1, 3) / 12) 
    + (b1 * h1 * (-(h1 / 2) - h2 - h3 + ((b1 * h1 * (h1 / 2 + h2 + h3)) + (b2 * h2 * (h2 / 2 + h3)) + (b3 * Math.pow(h3, 2) / 2)) / (b1 * h1 + b2 * h2 + b3 * h3)) ** 2)
    + (b2 * Math.pow(h2, 3) / 12)
    + (b2 * h2 * (-(h2 / 2) - h3 + ((b1 * h1 * (h1 / 2 + h2 + h3)) + (b2 * h2 * (h2 / 2 + h3)) + (b3 * Math.pow(h3, 2) / 2)) / (b1 * h1 + b2 * h2 + b3 * h3)) ** 2)
    + (b3 * Math.pow(h3, 3) / 12)
    + (b3 * h3 * (-(h3 / 2) + ((b1 * h1 * (h1 / 2 + h2 + h3)) + (b2 * h2 * (h2 / 2 + h3)) + (b3 * Math.pow(h3, 2) / 2)) / (b1 * h1 + b2 * h2 + b3 * h3)) ** 2);
    const Iy = 2;

    // Mostrar
    mostrarEnPantalla('resultado-y_tres', '\\tilde{y}', y, uOut);
    mostrarEnPantalla('resultado-x_tres', '\\tilde{x}', x, uOut);
    mostrarEnPantalla('resultado-Ix_tres', '\\overline{I}_{x\'}', Ix, uOut, "^4");
    mostrarEnPantalla('resultado-Iy_tres', '\\overline{I}_{y\'}', Iy, uOut, "^4");
    mostrarEnPantalla('resultado-A_tres', 'A', A, uOut, "^2");

    MathJax.typeset();

    if (window.MathJax) {
        MathJax.typeset();
    }
});


document.getElementById('unidades').addEventListener('change', function() {
    // Obtener el valor seleccionado en el <select>
    const selectedUnit = this.value;

    // Actualizar el texto de las unidades al costado de cada input
    document.getElementById('unit_a').textContent = selectedUnit;
    document.getElementById('unit_b').textContent = selectedUnit;
    document.getElementById('unit_c').textContent = selectedUnit;
    //Las unidades se copien en resultadoss
    document.getElementById('resultado').value = selectedUnit;
});
document.getElementById('unidades_dos').addEventListener('change', function() {
    // Obtener el valor seleccionado en el <select>
    const selectedUnit = this.value;

    // Actualizar el texto de las unidades al costado de cada input
    document.getElementById('unit_a_dos').textContent = selectedUnit;
    document.getElementById('unit_b_dos').textContent = selectedUnit;
    document.getElementById('unit_c_dos').textContent = selectedUnit;
    document.getElementById('unit_d_dos').textContent = selectedUnit;
    //Las unidades se copien en resultadoss
    document.getElementById('resultado_dos').value = selectedUnit;
});
document.getElementById('unidades_tres').addEventListener('change', function() {
    // Obtener el valor seleccionado en el <select>
    const selectedUnit = this.value;

    // Actualizar el texto de las unidades al costado de cada input
    document.getElementById('unit_h1_tres').textContent = selectedUnit;
    document.getElementById('unit_h2_tres').textContent = selectedUnit;
    document.getElementById('unit_h3_tres').textContent = selectedUnit;
    document.getElementById('unit_b1_tres').textContent = selectedUnit;
    document.getElementById('unit_b2_tres').textContent = selectedUnit;
    document.getElementById('unit_b3_tres').textContent = selectedUnit;
    //Las unidades se copien en resultadoss
    document.getElementById('resultado_tres').value = selectedUnit;
});


window.onload = function() {
    document.getElementById('unidades').selectedIndex = -1; // Vaciar el campo "Unidades"
    document.getElementById('resultado').selectedIndex = -1; // Vaciar el campo "Resultado"
    document.getElementById('unidades_dos').selectedIndex = -1; // Vaciar el campo "Unidades"
    document.getElementById('resultado_dos').selectedIndex = -1; // Vaciar el campo "Resultado"
    document.getElementById('unidades_tres').selectedIndex = -1; // Vaciar el campo "Unidades"
    document.getElementById('resultado_tres').selectedIndex = -1; // Vaciar el campo "Resultado"
}

