// Contadores globales para los nombres automáticos
let contadorApoyos = 1;
let contadorDistribuidas = 1;
let contadorPuntuales = 1;

// Cargar datos iniciales al abrir la página
window.onload = function() {
    agregarFilaApoyo("empotrado", 0);
    agregarFilaApoyo("articulado", 10);
    agregarFilaDistribuida(-100, -100, 0, 8);
    agregarFilaPuntual(0, 0, 0); 
};

// --- FUNCIONES PARA TABLAS DINÁMICAS ---

function agregarFilaApoyo(tipo, pos) {
    const tbody = document.querySelector("#tabla-apoyos tbody");
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="col-nombre"><input type="text" value="A${contadorApoyos++}" readonly></td>
        <td>
            <select>
                <option value="empotrado" ${tipo==='empotrado'?'selected':''}>Empotrado</option>
                <option value="articulado" ${tipo==='articulado'?'selected':''}>Articulado</option>
                <option value="movil" ${tipo==='movil'?'selected':''}>Móvil</option>
                <option value="rotula" ${tipo==='rotula'?'selected':''}>Rótula</option>
            </select>
        </td>
        <td><input type="number" value="${pos}" step="any"></td>
        <td><button class="btn-eliminar" onclick="this.closest('tr').remove()">X</button></td>
    `;
    tbody.appendChild(tr);
}

function agregarFilaDistribuida(q1, q2, xo, xf) {
    const tbody = document.querySelector("#tabla-distribuidas tbody");
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="col-nombre"><input type="text" value="D${contadorDistribuidas++}" readonly></td>
        <td><input type="number" value="${q1}" step="any"></td>
        <td><input type="number" value="${q2}" step="any"></td>
        <td><input type="number" value="${xo}" step="any"></td>
        <td><input type="number" value="${xf}" step="any"></td>
        <td><button class="btn-eliminar" onclick="this.closest('tr').remove()">X</button></td>
    `;
    tbody.appendChild(tr);
}

function agregarFilaPuntual(f, m, pos) {
    const tbody = document.querySelector("#tabla-puntuales tbody");
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="col-nombre"><input type="text" value="P${contadorPuntuales++}" readonly></td>
        <td><input type="number" value="${f}" step="any"></td>
        <td><input type="number" value="${m}" step="any"></td>
        <td><input type="number" value="${pos}" step="any"></td>
        <td><button class="btn-eliminar" onclick="this.closest('tr').remove()">X</button></td>
    `;
    tbody.appendChild(tr);
}
    // ... (EL RESTO DE TU LÓGICA MATRICIAL SE MANTIENE EXACTAMENTE IGUAL) ...

// --- LÓGICA DE CÁLCULO ESTRUCTURAL ---

function calcularEstructura() {
    // 1. LEER DATOS DE LA INTERFAZ
    const I = parseFloat(document.getElementById("input-inercia").value);
    const E = parseFloat(document.getElementById("input-elasticidad").value);
    
    let apoyos = [];
    document.querySelectorAll("#tabla-apoyos tbody tr").forEach(row => {
        let nombre = row.cells[0].querySelector("input").value;
        let tipo = row.cells[1].querySelector("select").value;
        let pos = parseFloat(row.cells[2].querySelector("input").value);
        apoyos.push([nombre, tipo, pos]);
    });

    let cargasDistribuidas = [];
    document.querySelectorAll("#tabla-distribuidas tbody tr").forEach(row => {
        let q1 = parseFloat(row.cells[0].querySelector("input").value);
        let q2 = parseFloat(row.cells[1].querySelector("input").value);
        let xo = parseFloat(row.cells[2].querySelector("input").value);
        let xf = parseFloat(row.cells[3].querySelector("input").value);
        cargasDistribuidas.push([q1, q2, xo, xf]);
    });

    let cargasPuntuales = [];
    document.querySelectorAll("#tabla-puntuales tbody tr").forEach(row => {
        let f = parseFloat(row.cells[0].querySelector("input").value);
        let m = parseFloat(row.cells[1].querySelector("input").value);
        let pos = parseFloat(row.cells[2].querySelector("input").value);
        // Evitamos añadir filas de carga [0,0,0] si el usuario las deja vacías
        if(f !== 0 || m !== 0) cargasPuntuales.push([f, m, pos]);
    });

    // --- PROCESAMIENTO MATRICIAL (Basado en tu lógica original) ---
    let posiciones = [];
    apoyos.forEach(a => posiciones.push(a[2]));
    cargasDistribuidas.forEach(c => { posiciones.push(c[2]); posiciones.push(c[3]); });
    cargasPuntuales.forEach(c => posiciones.push(c[2]));

    let nodosUnicos = [...new Set(posiciones)].sort((a, b) => a - b);
    const nE = nodosUnicos.length - 1; 
    const nG = nodosUnicos.length * 2; 

    if (nE < 1) {
        alert("Faltan datos para crear elementos.");
        return;
    }

    let elementos = [];
    let posicionesRotulas = apoyos.filter(a => a[1] === "rotula").map(a => a[2]);

    for (let i = 0; i < nE; i++) {
        let xo = nodosUnicos[i];
        let xf = nodosUnicos[i + 1];
        let L = xf - xo;
        let tipo = "sA";

        if (posicionesRotulas.includes(xo) && posicionesRotulas.includes(xf)) tipo = "dA";
        else if (posicionesRotulas.includes(xo)) tipo = "Ai";
        else if (posicionesRotulas.includes(xf)) tipo = "Ad";

        let q1_eq = 0, q2_eq = 0;
        cargasDistribuidas.forEach(c => {
            if (xo >= c[2] && xf <= c[3]) {
                q1_eq = ecuacionCarga(c[2], c[3], c[0], c[1], xo);
                q2_eq = ecuacionCarga(c[2], c[3], c[0], c[1], xf);
            }
        });

        elementos.push({ L, xo, xf, E, I, tipo, q1: q1_eq, q2: q2_eq });
    }

    function ecuacionCarga(x1, x2, q1, q2, x) {
        if (x1 === x2) return 0;
        return (q1 - q2) / (x1 - x2) * x + (-q1 * x2 + q2 * x1) / (x1 - x2);
    }

    let fuerzas = math.zeros(nG).toArray();
    
    elementos.forEach((el, i) => {
        let req = cargasEquivalentes(el.tipo, el.q1, el.q2, el.L);
        fuerzas[i * 2] += req[0];
        fuerzas[i * 2 + 1] += req[1];
        fuerzas[i * 2 + 2] += req[2];
        fuerzas[i * 2 + 3] += req[3];
    });

    cargasPuntuales.forEach(c => {
        let ubiP = nodosUnicos.indexOf(c[2]);
        if (ubiP !== -1) {
            fuerzas[ubiP * 2] += c[0];
            fuerzas[ubiP * 2 + 1] += c[1];
        }
    });

    function cargasEquivalentes(tipo, q1, q2, l) {
        let v0=0, m0=0, vl=0, ml=0;
        if (tipo === "Ad") {
            v0 = l * (16 * q1 + 9 * q2) / 40;
            m0 = Math.pow(l, 2) * (8 * q1 + 7 * q2) / 120;
            vl = l * (4 * q1 + 11 * q2) / 40;
            ml = 0;
        } else if (tipo === "Ai") {
            v0 = l * (11 * q1 + 4 * q2) / 40;
            m0 = 0;
            vl = l * (9 * q1 + 16 * q2) / 40;
            ml = Math.pow(l, 2) * (-7 * q1 - 8 * q2) / 120;
        } else if (tipo === "sA") {
            v0 = l * (7 * q1 + 3 * q2) / 20;
            m0 = Math.pow(l, 2) * (q1 / 20 + q2 / 30);
            vl = l * (3 * q1 + 7 * q2) / 20;
            ml = Math.pow(l, 2) * (-q1 / 30 - q2 / 20);
        }
        return [v0, m0, vl, ml];
    }

    let matrizGeneral = math.zeros(nG, nG).toArray();

    elementos.forEach((el, i) => {
        let mE = matrizElemental(el.tipo, el.E, el.I, el.L);
        let n = [i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 3];
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                matrizGeneral[n[j]][n[k]] += mE[j][k];
            }
        }
    });

    function matrizElemental(tipo, E, I, l) {
        let m = math.zeros(4, 4).toArray();
        if (tipo === "sA") {
            m = [
                [12*E*I/Math.pow(l,3), 6*E*I/Math.pow(l,2), -12*E*I/Math.pow(l,3), 6*E*I/Math.pow(l,2)],
                [6*E*I/Math.pow(l,2), 4*E*I/l, -6*E*I/Math.pow(l,2), 2*E*I/l],
                [-12*E*I/Math.pow(l,3), -6*E*I/Math.pow(l,2), 12*E*I/Math.pow(l,3), -6*E*I/Math.pow(l,2)],
                [6*E*I/Math.pow(l,2), 2*E*I/l, -6*E*I/Math.pow(l,2), 4*E*I/l]
            ];
        } else if (tipo === "Ai") {
            m = [
                [3*E*I/Math.pow(l,3), 0, -3*E*I/Math.pow(l,3), 3*E*I/Math.pow(l,2)],
                [0, 0, 0, 0],
                [-3*E*I/Math.pow(l,3), 0, 3*E*I/Math.pow(l,3), -3*E*I/Math.pow(l,2)],
                [3*E*I/Math.pow(l,2), 0, -3*E*I/Math.pow(l,2), 3*E*I/l]
            ];
        } else if (tipo === "Ad") {
            m = [
                [3*E*I/Math.pow(l,3), 3*E*I/Math.pow(l,2), -3*E*I/Math.pow(l,3), 0],
                [3*E*I/Math.pow(l,2), 3*E*I/l, -3*E*I/Math.pow(l,2), 0],
                [-3*E*I/Math.pow(l,3), -3*E*I/Math.pow(l,2), 3*E*I/Math.pow(l,3), 0],
                [0, 0, 0, 0]
            ];
        }
        return m;
    }

    let K_mod = math.clone(matrizGeneral);
    let F_mod = math.clone(fuerzas);
    let gdl_restringidos = [];

    apoyos.forEach(a => {
        let nodo = nodosUnicos.indexOf(a[2]);
        if (a[1] === "empotrado") {
            gdl_restringidos.push(nodo * 2);    
            gdl_restringidos.push(nodo * 2 + 1); 
        } else if (a[1] === "articulado" || a[1] === "movil") {
            gdl_restringidos.push(nodo * 2);    
        }
    });

    let penalidad = 1e15;
    gdl_restringidos.forEach(idx => {
        K_mod[idx][idx] *= penalidad;
        F_mod[idx] = 0;
    });

    let U;
    try {
        U = math.lusolve(K_mod, F_mod).map(v => v[0]);
    } catch(e) {
        alert("Error matemático: Estructura inestable o mal definida.");
        return;
    }

    let Fuerzas_internas = math.multiply(matrizGeneral, U);
    let Reacciones = math.subtract(Fuerzas_internas, fuerzas);

    U = U.map(v => Math.abs(v) < 1e-10 ? 0 : v);
    Reacciones = Reacciones.map(v => Math.abs(v) < 1e-10 ? 0 : v);

    // --- IMPRESIÓN ---
    let output = "=== RESULTADOS DEL ANÁLISIS ===\n\n";
    
    output += "DESPLAZAMIENTOS NODALES (U):\n";
    U.forEach((val, idx) => output += `U_${idx + 1}: ${val.toExponential(4)}\n`);
    
    output += "\nREACCIONES:\n";
    Reacciones.forEach((val, idx) => {
        if (gdl_restringidos.includes(idx)) {
            let tipo = idx % 2 === 0 ? "Fuerza en Y (R)" : "Momento (M)";
            // Se calcula a qué posición 'x' corresponde este nodo
            let posicionNodo = nodosUnicos[Math.floor(idx/2)];
            output += `Nodo en x=${posicionNodo} | ${tipo}: ${val.toFixed(2)}\n`;
        }
    });

    const panel = document.getElementById('panel-resultados');
    panel.style.display = 'block';
    panel.innerText = output;
}