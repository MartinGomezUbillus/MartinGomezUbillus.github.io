// Contadores globales para los nombres automáticos
// Contadores globales para los nombres automáticos
let contadorApoyos = 1;
let contadorDistribuidas = 1;
let contadorPuntuales = 1;

// --- NUEVA VARIABLE GLOBAL ---
let tramosGuardadosGlobal = []; 
let longitudVigaGlobal = 0;

// Cargar datos iniciales al abrir la página
window.onload = function() {
    agregarFilaApoyo("empotrado", 0);
    agregarFilaApoyo("articulado", 10);
    agregarFilaDistribuida(-100, -100, 0, 8);
    agregarFilaPuntual(0, 0, 0); 

    // Dibujar estado inicial
    dibujarViga();

    // Configurar evento 'input' en todo el documento para detectar cambios en cualquier tabla en tiempo real
    document.addEventListener('input', dibujarViga);
};

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
        <td><button class="btn-eliminar" onclick="this.closest('tr').remove(); dibujarViga();">X</button></td>
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
        <td><button class="btn-eliminar" onclick="this.closest('tr').remove(); dibujarViga();">X</button></td>
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
        <td><button class="btn-eliminar" onclick="this.closest('tr').remove(); dibujarViga();">X</button></td>
    `;
    tbody.appendChild(tr);
}

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
        let q1 = parseFloat(row.cells[1].querySelector("input").value);
        let q2 = parseFloat(row.cells[2].querySelector("input").value);
        let xo = parseFloat(row.cells[3].querySelector("input").value);
        let xf = parseFloat(row.cells[4].querySelector("input").value);
        cargasDistribuidas.push([q1, q2, xo, xf]);
    });

    let cargasPuntuales = [];
    document.querySelectorAll("#tabla-puntuales tbody tr").forEach(row => {
        let f = parseFloat(row.cells[1].querySelector("input").value);
        let m = parseFloat(row.cells[2].querySelector("input").value);
        let pos = parseFloat(row.cells[3].querySelector("input").value);
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

    // ---// --- IMPRESIÓN ---
    let output = "=== RESULTADOS DEL ANÁLISIS ===\n\n";
    
    output += "DESPLAZAMIENTOS NODALES (U):\n";
    U.forEach((val, idx) => output += `U_${idx + 1}: ${val.toExponential(4)}\n`);
    
    output += "\nREACCIONES:\n";
    Reacciones.forEach((val, idx) => {
        if (gdl_restringidos.includes(idx)) {
            let tipo = idx % 2 === 0 ? "Fuerza en Y (R)" : "Momento (M)";
            let posicionNodo = nodosUnicos[Math.floor(idx/2)];
            output += `Nodo en x=${posicionNodo} | ${tipo}: ${val.toFixed(2)}\n`;
        }
    });

    const panel = document.getElementById('panel-resultados');
    panel.style.display = 'block';
    panel.innerText = output;

    // ==========================================
    // NUEVO CÓDIGO A AGREGAR AQUÍ:
    // ==========================================
    const EI = E * I; // Calculamos la rigidez (E e I ya los leíste al inicio de esta función)
    const longitudTotalViga = nodosUnicos[nodosUnicos.length - 1]; // El último nodo nos da la longitud total
    
    // Ejecutamos la gráfica enviando los elementos, desplazamientos, rigidez y longitud
    procesarYGraficarTramos(elementos, U, EI, longitudTotalViga);
} // <--- Este es el corchete que cierra calcularEstructura()

// --- LÓGICA DE DIBUJO EN CANVAS ---

function dibujarViga() {
    const canvas = document.getElementById('canvas-viga');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Limpiar el canvas en cada actualización
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Recolectar posiciones para definir la longitud total de la viga
    let posiciones = [0]; 
    
    document.querySelectorAll("#tabla-apoyos tbody tr").forEach(row => {
        let pos = parseFloat(row.cells[2].querySelector("input").value) || 0;
        posiciones.push(pos);
    });
    document.querySelectorAll("#tabla-distribuidas tbody tr").forEach(row => {
        // Corrección de índices: xo es 3, xf es 4
        let xo = parseFloat(row.cells[3].querySelector("input").value) || 0; 
        let xf = parseFloat(row.cells[4].querySelector("input").value) || 0; 
        posiciones.push(xo, xf);
    });
    document.querySelectorAll("#tabla-puntuales tbody tr").forEach(row => {
        // Corrección de índice: pos es 3
        let pos = parseFloat(row.cells[3].querySelector("input").value) || 0; 
        posiciones.push(pos);
    });

    let L_max = Math.max(...posiciones);
    if (L_max <= 0) L_max = 10; 

    // Parámetros de dibujo
    const margen = 50;
    const anchoDibujo = canvas.width - (margen * 2);
    const escalaX = anchoDibujo / L_max;
    const yViga = canvas.height / 2;

    // 2. Dibujar la línea de la viga
    ctx.beginPath();
    ctx.moveTo(margen, yViga);
    ctx.lineTo(margen + (L_max * escalaX), yViga);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#2c3e50';
    ctx.stroke();

    // 3. Dibujar Apoyos
    // 3. Dibujar Apoyos
    document.querySelectorAll("#tabla-apoyos tbody tr").forEach(row => {
        let tipo = row.cells[1].querySelector("select").value;
        let pos = parseFloat(row.cells[2].querySelector("input").value) || 0;
        let xCanvas = margen + (pos * escalaX);

        ctx.fillStyle = '#e74c3c';     // Color rojo para los apoyos
        ctx.strokeStyle = '#e74c3c';

        if (tipo === "empotrado") {
            // Empotrado: Rectángulo vertical
            ctx.beginPath();
            ctx.rect(xCanvas - 10, yViga - 20, 20, 40);
            ctx.fill();
        } 
        else if (tipo === "articulado") {
            // Articulado (Fijo): Triángulo apoyado en el suelo
            ctx.beginPath();
            ctx.moveTo(xCanvas, yViga);
            ctx.lineTo(xCanvas - 15, yViga + 20);
            ctx.lineTo(xCanvas + 15, yViga + 20);
            ctx.closePath();
            ctx.fill();
            // Línea de suelo
            ctx.fillRect(xCanvas - 20, yViga + 20, 40, 4);
        } 
        else if (tipo === "movil") {
            // Móvil: Triángulo con rueditas
            ctx.beginPath();
            ctx.moveTo(xCanvas, yViga);
            ctx.lineTo(xCanvas - 15, yViga + 15);
            ctx.lineTo(xCanvas + 15, yViga + 15);
            ctx.closePath();
            ctx.fill();
            // Rueditas (Círculos)
            ctx.beginPath();
            ctx.arc(xCanvas - 7, yViga + 19, 4, 0, Math.PI * 2); // Rueda izquierda
            ctx.arc(xCanvas + 7, yViga + 19, 4, 0, Math.PI * 2); // Rueda derecha
            ctx.fill();
            // Línea de suelo
            ctx.fillRect(xCanvas - 20, yViga + 23, 40, 3);
        } 
        else if (tipo === "rotula") {
            // Rótula: Círculo sobre la misma viga
            ctx.beginPath();
            ctx.arc(xCanvas, yViga, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff'; // Centro blanco para que parezca un pasador hueco
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });

    // 4. Dibujar Cargas Puntuales (Flechas)
    document.querySelectorAll("#tabla-puntuales tbody tr").forEach(row => {
        let fy = parseFloat(row.cells[1].querySelector("input").value) || 0; 
        let m = parseFloat(row.cells[2].querySelector("input").value) || 0; 
        let pos = parseFloat(row.cells[3].querySelector("input").value) || 0; 
        let xCanvas = margen + (pos * escalaX);

        // --- A. Dibujar Fuerza Puntual (Fy) ---
        if (fy !== 0) {
            let direccion = fy < 0 ? 1 : -1; 
            let longitudFlecha = 40;
            
            ctx.beginPath();
            ctx.moveTo(xCanvas, yViga - (longitudFlecha * direccion));
            ctx.lineTo(xCanvas, yViga);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#2980b9'; // Azul para las fuerzas
            ctx.stroke();
            
            // Punta de la flecha de la fuerza
            ctx.beginPath();
            ctx.moveTo(xCanvas, yViga);
            ctx.lineTo(xCanvas - 5, yViga - (10 * direccion));
            ctx.lineTo(xCanvas + 5, yViga - (10 * direccion));
            ctx.fillStyle = '#2980b9';
            ctx.fill();
        }

        // --- B. Dibujar Momento Puntual (M) ---
        if (m !== 0) {
            let r = 22; // Radio del arco del momento (suficiente para envolver la fuerza si ambas existen)
            ctx.beginPath();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#8e44ad'; // Morado para diferenciar los momentos

            if (m > 0) {
                // Momento Positivo (Antihorario)
                // Dibuja un arco sobre la viga (de derecha a izquierda)
                ctx.arc(xCanvas, yViga, r, 0, Math.PI, true);
                ctx.stroke();

                // Punta de la flecha cayendo sobre el lado izquierdo
                ctx.beginPath();
                ctx.moveTo(xCanvas - r, yViga + 2); // Pasa un poquito el eje para verse mejor
                ctx.lineTo(xCanvas - r - 6, yViga - 10);
                ctx.lineTo(xCanvas - r + 6, yViga - 10);
                ctx.fillStyle = '#8e44ad';
                ctx.fill();
            } else {
                // Momento Negativo (Horario)
                // Dibuja un arco sobre la viga (de izquierda a derecha)
                ctx.arc(xCanvas, yViga, r, Math.PI, Math.PI * 2, false);
                ctx.stroke();

                // Punta de la flecha cayendo sobre el lado derecho
                ctx.beginPath();
                ctx.moveTo(xCanvas + r, yViga + 2);
                ctx.lineTo(xCanvas + r - 6, yViga - 10);
                ctx.lineTo(xCanvas + r + 6, yViga - 10);
                ctx.fillStyle = '#8e44ad';
                ctx.fill();
            }
        }
    });
    // 5. Dibujar Cargas Distribuidas
    document.querySelectorAll("#tabla-distribuidas tbody tr").forEach(row => {
        // Corrección de índices: q1 es 1, q2 es 2, xo es 3, xf es 4
        let q1 = parseFloat(row.cells[1].querySelector("input").value) || 0; 
        let q2 = parseFloat(row.cells[2].querySelector("input").value) || 0; 
        let xo = parseFloat(row.cells[3].querySelector("input").value) || 0; 
        let xf = parseFloat(row.cells[4].querySelector("input").value) || 0; 
        
        if ((q1 !== 0 || q2 !== 0) && xf > xo) {
            let xInicio = margen + (xo * escalaX);
            let xFinal = margen + (xf * escalaX);
            let anchoPx = xFinal - xInicio;

            // --- ESCALADO CONTROLADO DE LA CARGA ---
            let factorEscala = 0.4; // Multiplicador para ajustar el tamaño visual
            let maxAlto = 80;       // Límite máximo en píxeles para que no se vea gigante
            let minAlto = 15;       // Límite mínimo para que la carga siga siendo visible

            function calcularAlto(q) {
                if (q === 0) return 0;
                let alto = Math.abs(q) * factorEscala;
                alto = Math.max(minAlto, Math.min(maxAlto, alto));
                // q negativo suele ser gravedad (hacia abajo), por lo que se dibuja arriba de la viga
                return q < 0 ? alto : -alto; 
            }

            let alto1 = calcularAlto(q1);
            let alto2 = calcularAlto(q2);

            ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 2;
            
            // 1. Dibujar el polígono (Trapecio) de la carga
            ctx.beginPath();
            ctx.moveTo(xInicio, yViga);               // Base inicial en la viga
            ctx.lineTo(xInicio, yViga - alto1);       // Altura inicial (q1)
            ctx.lineTo(xFinal, yViga - alto2);        // Altura final (q2)
            ctx.lineTo(xFinal, yViga);                // Base final en la viga
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 2. Dibujar las flechas interiores
            // Calculamos cuántas flechas dibujar (aprox. 1 cada 25 píxeles)
            let numFlechas = Math.floor(anchoPx / 25);
            if (numFlechas < 1) numFlechas = 1; // Asegurar al menos las de los extremos

            for (let i = 0; i <= numFlechas; i++) {
                let fraccion = i / numFlechas;
                let xFlecha = xInicio + (fraccion * anchoPx);
                
                // Interpolar la altura de la flecha actual según su posición en el trapecio
                let altoFlecha = alto1 + fraccion * (alto2 - alto1);
                
                // Interpolar el valor original de q para determinar la dirección
                let qInterpolado = q1 + fraccion * (q2 - q1);
                if (qInterpolado === 0) continue; // Si justo en este punto la carga es 0, no dibujar flecha

                let direccion = qInterpolado < 0 ? 1 : -1; // 1 = punta hacia la viga (abajo)

                // Trazar línea vertical de la flecha
                ctx.beginPath();
                ctx.moveTo(xFlecha, yViga - altoFlecha);
                ctx.lineTo(xFlecha, yViga);
                ctx.strokeStyle = '#1e8449'; // Verde ligeramente más oscuro
                ctx.lineWidth = 1.5;
                ctx.stroke();
                
                // Trazar el triángulo (punta) de la flecha
                ctx.beginPath();
                ctx.moveTo(xFlecha, yViga);
                ctx.lineTo(xFlecha - 4, yViga - (8 * direccion));
                ctx.lineTo(xFlecha + 4, yViga - (8 * direccion));
                ctx.fillStyle = '#1e8449';
                ctx.fill();
            }
        }
    });
}

// --- 1. RESOLUTOR DE MATRICES (Eliminación de Gauss) ---
// Esto reemplaza al "sp.solve" de Python para sistemas 4x4
function resolverSistema4x4(M, R) {
    let n = R.length;
    let matriz = M.map((row, i) => [...row, R[i]]);

    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(matriz[k][i]) > Math.abs(matriz[maxRow][i])) maxRow = k;
        }
        let temp = matriz[i];
        matriz[i] = matriz[maxRow];
        matriz[maxRow] = temp;

        for (let k = i + 1; k < n; k++) {
            let factor = matriz[k][i] / matriz[i][i];
            for (let j = i; j <= n; j++) {
                matriz[k][j] -= factor * matriz[i][j];
            }
        }
    }

    let C = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        C[i] = matriz[i][n] / matriz[i][i];
        for (let k = i - 1; k >= 0; k--) {
            matriz[k][n] -= matriz[k][i] * C[i];
        }
    }
    return C; // Retorna [c1, c2, c3, c4]
}

// --- 2. OBTENER ECUACIONES POR TRAMO (Reemplaza tu def ecuaciones() ) ---
function obtenerEcuacionesTramo(q1, q2, x1, x2, d1, d2, d3, d4, EI) {
    // 1. Constantes de la carga q(x) = A*x + B
    const divisor = (x1 - x2) === 0 ? 1e-10 : (x1 - x2); // Evitar división por cero
    const A = (q1 - q2) / divisor;
    const B = (-q1 * x2 + q2 * x1) / divisor;

    // Funciones P(x) y Q(x) correspondientes a la carga integrada
    const P = (x) => A * Math.pow(x, 5) / 120 + B * Math.pow(x, 4) / 24;
    const Q = (x) => A * Math.pow(x, 4) / 24 + B * Math.pow(x, 3) / 6;

    // 2. Construir matriz M (4x4) basada en las posiciones x1 y x2
    // Fila 1 y 3: Deflexiones en x1 y x2 (multiplicadores de c1, c2, c3, c4)
    // Fila 2 y 4: Pendientes en x1 y x2
    const M = [
        [Math.pow(x1, 3)/6, Math.pow(x1, 2)/2, x1, 1], // d1
        [Math.pow(x1, 2)/2, x1, 1, 0],                 // d2
        [Math.pow(x2, 3)/6, Math.pow(x2, 2)/2, x2, 1], // d3
        [Math.pow(x2, 2)/2, x2, 1, 0]                  // d4
    ];

    // 3. Vector de resultados R (Multiplicamos desplazamientos por EI y restamos carga)
    const R = [
        EI * d1 - P(x1),
        EI * d2 - Q(x1),
        EI * d3 - P(x2),
        EI * d4 - Q(x2)
    ];

    // 4. Resolver para obtener c1, c2, c3, c4
    const constantes = resolverSistema4x4(M, R);
    const c1 = constantes[0];
    const c2 = constantes[1];

    // 5. Limpiar valores muy cercanos a cero (errores de redondeo de punto flotante)
    const limpiar = (val) => Math.abs(val) < 1e-7 ? 0 : val;

    // Retornamos las funciones ejecutables y las cadenas de texto
    return {
        // Estas funciones se usarán para dibujar en el Canvas
        V: (x) => A * Math.pow(x, 2) / 2 + B * x + c1,
        M: (x) => A * Math.pow(x, 3) / 6 + B * Math.pow(x, 2) / 2 + c1 * x + c2,
        
        // Estos textos se imprimirán en el HTML
        textoV: `V(x) = ${limpiar(A/2).toFixed(2)}x² + ${limpiar(B).toFixed(2)}x + ${limpiar(c1).toFixed(2)}`,
        textoM: `M(x) = ${limpiar(A/6).toFixed(2)}x³ + ${limpiar(B/2).toFixed(2)}x² + ${limpiar(c1).toFixed(2)}x + ${limpiar(c2).toFixed(2)}`
    };
}

// --- 4. FUNCIÓN COORDINADORA PRINCIPAL ---
function procesarYGraficarTramos(elementos, U, EI, longitudTotalViga) {
    const divEcs = document.getElementById('contenedor-ecuaciones');
    divEcs.innerHTML = ""; // Limpiar ecuaciones anteriores
    
    let funcionesTramos = [];

    for (let i = 0; i < elementos.length; i++) {
        let q1 = elementos[i].q1; 
        let q2 = elementos[i].q2;
        
        // ¡AQUÍ ESTABA EL ERROR! Las variables en tu objeto se llaman "xo" y "xf"
        let x1 = elementos[i].xo; 
        let x2 = elementos[i].xf; 
        
        // Índices de los desplazamientos
        let d1 = U[i * 2];
        let d2 = U[i * 2 + 1];
        let d3 = U[i * 2 + 2];
        let d4 = U[i * 2 + 3];

        // Ejecutamos nuestra nueva función
        let tramo = obtenerEcuacionesTramo(q1, q2, x1, x2, d1, d2, d3, d4, EI);
        
        // Guardar para graficar luego
        funcionesTramos.push({
            x1: x1,
            x2: x2,
            V: tramo.V,
            M: tramo.M
        });

        // 1. Mostrar las ecuaciones en el HTML
        divEcs.innerHTML += `
            <div class="tramo-info">
                <strong>Tramo ${i + 1} (${x1}m - ${x2}m):</strong><br>
                ${tramo.textoV} <br>
                ${tramo.textoM}
            </div>
        `;
    }

    // ¡AQUÍ FALTABA LLAMAR A LA GRÁFICA!
    // Enviamos los tramos calculados al Canvas
    graficarEnCanvas(funcionesTramos, longitudTotalViga); 

    // --- NUEVO: GUARDAR DATOS Y MOSTRAR PANEL ---
    tramosGuardadosGlobal = funcionesTramos;
    longitudVigaGlobal = longitudTotalViga;
    document.getElementById('panel-consulta-x').style.display = 'block';
    document.getElementById('resultado-consulta-x').innerHTML = "";
}
// --- 3. DIBUJADO EN CANVAS CON AUTO-ESCALA ---
// --- 3. DIBUJADO EN CANVAS CON AUTO-ESCALA Y MARCADORES ---
// --- 3. DIBUJADO EN CANVAS CON AUTO-ESCALA, MARCADORES Y CONVENCIÓN DE SIGNOS ---
function graficarEnCanvas(funcionesTramos, longitudTotalViga) {
    const canvasV = document.getElementById('canvas-cortante');
    const canvasM = document.getElementById('canvas-momento');
    const ctxV = canvasV.getContext('2d');
    const ctxM = canvasM.getContext('2d');

    const width = canvasV.width;
    const height = canvasV.height;
    const centroY = height / 2;
    
    // Márgenes para que el texto y los ejes no se corten
    const padX = 40; 
    const padY = 30; 
    const widthDibujo = width - (padX * 2);

    // 1. Encontrar los valores máximos para escalar
    let maxV = 0;
    let maxM = 0;
    const resolucion = 100; 

    funcionesTramos.forEach(tramo => {
        let paso = (tramo.x2 - tramo.x1) / resolucion;
        if (paso === 0) paso = 1;
        for (let x = tramo.x1; x <= tramo.x2 + 1e-6; x += paso) {
            maxV = Math.max(maxV, Math.abs(tramo.V(x)));
            maxM = Math.max(maxM, Math.abs(tramo.M(x)));
        }
    });

    maxV = maxV === 0 ? 1 : maxV * 1.2; 
    maxM = maxM === 0 ? 1 : maxM * 1.2;

    // 2. Función auxiliar para dibujar un diagrama completo
    function dibujarDiagrama(ctx, maxVal, esMomento) {
        ctx.clearRect(0, 0, width, height);

        // --- A. Dibujar Ejes de Coordenadas ---
        ctx.beginPath();
        ctx.strokeStyle = "#888888"; 
        ctx.lineWidth = 1.5;
        
        // Eje X (Línea neutra)
        ctx.moveTo(padX - 10, centroY);
        ctx.lineTo(width - padX + 20, centroY);
        
        // Eje Y (En x = 0)
        ctx.moveTo(padX, height - 10);
        ctx.lineTo(padX, 10);
        ctx.stroke();

        // Dibujar pequeñas flechas en las puntas de los ejes
        ctx.fillStyle = "#888888";
        // Punta Eje X
        ctx.beginPath(); ctx.moveTo(width - padX + 20, centroY); ctx.lineTo(width - padX + 13, centroY - 4); ctx.lineTo(width - padX + 13, centroY + 4); ctx.fill();
        // Punta Eje Y (Hacia arriba)
        ctx.beginPath(); ctx.moveTo(padX, 10); ctx.lineTo(padX - 4, 17); ctx.lineTo(padX + 4, 17); ctx.fill();

        // Etiquetas de los Ejes
        ctx.font = "italic 12px Arial";
        ctx.textAlign = "right";
        ctx.fillText(esMomento ? "M (Momento)" : "V (Cortante)", padX - 5, 20);
        ctx.textAlign = "left";
        ctx.fillText("x (m)", width - padX + 20, centroY + 15);


        // --- B. Dibujar la Gráfica y Sombrear ---
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = esMomento ? "#e74c3c" : "#2980b9";
        ctx.fillStyle = esMomento ? "rgba(231, 76, 60, 0.2)" : "rgba(41, 128, 185, 0.2)";

        let primerPunto = true;

        // *** FACTOR DE INVERSIÓN (Convención de Momento Flector) ***
        // Si es momento, el factor es -1 para dibujar los positivos abajo. 
        let factorInversion = esMomento ? -1 : 1;

        funcionesTramos.forEach(tramo => {
            let xCanvasInicio = padX + (tramo.x1 / longitudTotalViga) * widthDibujo;
            let xCanvasFin = padX + (tramo.x2 / longitudTotalViga) * widthDibujo;

            for (let px = xCanvasInicio; px <= xCanvasFin; px++) {
                let xReal = ((px - padX) / widthDibujo) * longitudTotalViga;
                let yReal = esMomento ? tramo.M(xReal) : tramo.V(xReal);
                
                // Mapeo de coordenadas aplicando la inversión si corresponde
                let yCanvas = centroY - ((yReal * factorInversion) / maxVal) * (height / 2 - padY);

                if (primerPunto) {
                    ctx.moveTo(px, yCanvas);
                    primerPunto = false;
                } else {
                    ctx.lineTo(px, yCanvas);
                }
            }
        });
        ctx.stroke();

        // Sombrear el área
        ctx.lineTo(padX + widthDibujo, centroY); 
        ctx.lineTo(padX, centroY);     
        ctx.fill();                 


        // --- C. Marcar Puntos Críticos (Nodos) y Valores Numéricos ---
        ctx.fillStyle = "#2c3e50"; 
        ctx.font = "bold 12px Arial";
        
        let nodosImpresos = new Set();

        funcionesTramos.forEach(tramo => {
            let puntosA_Evaluar = [tramo.x1, tramo.x2];
            
            puntosA_Evaluar.forEach(xReal => {
                let yReal = esMomento ? tramo.M(xReal) : tramo.V(xReal);
                let px = padX + (xReal / longitudTotalViga) * widthDibujo;
                
                // Calculamos de nuevo el Y del lienzo con el factor de inversión
                let yCanvas = centroY - ((yReal * factorInversion) / maxVal) * (height / 2 - padY);

                ctx.beginPath();
                ctx.arc(px, yCanvas, 3.5, 0, Math.PI * 2);
                ctx.fill();

                // Limpiar valores como "-0.00" por errores de redondeo
                let valorLimpio = Math.abs(yReal) < 0.001 ? 0 : yReal;
                let texto = valorLimpio.toFixed(2);
                
                let nodoID = `${px.toFixed(1)}_${yCanvas.toFixed(1)}`;
                
                if (!nodosImpresos.has(nodoID)) {
                    ctx.textAlign = "center";
                    
                    // ¿Se dibujó el punto arriba o abajo del eje neutro?
                    let dibujadoHaciaArriba = (yCanvas < centroY);
                    
                    // Si está arriba en el dibujo, el texto va un poco más arriba (-8). 
                    // Si está abajo en el dibujo, el texto va debajo (+16).
                    let offsetY = dibujadoHaciaArriba ? -8 : 16; 
                    
                    if (Math.abs(valorLimpio) === 0 && px === padX) {
                        ctx.textAlign = "left";
                        ctx.fillText(texto, px + 8, centroY - 5);
                    } else {
                        ctx.fillText(texto, px, yCanvas + offsetY);
                    }
                    
                    nodosImpresos.add(nodoID);
                }
            });
        });
    }

    // Ejecutar las funciones de dibujo (false = cortante, true = momento)
    dibujarDiagrama(ctxV, maxV, false); 
    dibujarDiagrama(ctxM, maxM, true);  
}

// --- 5. CONSULTA DE VALORES EN UN PUNTO X ---
function consultarValoresEnX() {
    const xValor = parseFloat(document.getElementById('input-consulta-x').value);
    const divResultado = document.getElementById('resultado-consulta-x');

    // 1. Validar que el valor ingresado tenga sentido
    if (isNaN(xValor) || xValor < 0 || xValor > longitudVigaGlobal) {
        alert(`Por favor, ingresa un valor de x entre 0 y ${longitudVigaGlobal} metros.`);
        return;
    }

    // 2. Buscar a qué tramo pertenece esa "x"
    let tramoEncontrado = null;
    
    // Recorremos los tramos guardados
    for (let i = 0; i < tramosGuardadosGlobal.length; i++) {
        let tramo = tramosGuardadosGlobal[i];
        
        // Verificamos si la x está dentro de este intervalo
        // Usamos un pequeño margen (1e-6) por errores de redondeo de decimales en JS
        if (xValor >= tramo.x1 - 1e-6 && xValor <= tramo.x2 + 1e-6) {
            tramoEncontrado = tramo;
            break; // Si ya lo encontró, detiene la búsqueda
        }
    }

    // 3. Evaluar y mostrar el resultado
    if (tramoEncontrado) {
        let cortanteEnX = tramoEncontrado.V(xValor);
        let momentoEnX = tramoEncontrado.M(xValor);

        // Limpiamos valores que son "casi cero" (-0.000000001)
        if (Math.abs(cortanteEnX) < 1e-5) cortanteEnX = 0;
        if (Math.abs(momentoEnX) < 1e-5) momentoEnX = 0;

        divResultado.innerHTML = `
            Para x = ${xValor.toFixed(2)} m: <br><br>
            <span style="color: #2980b9;">Fuerza Cortante V(x) = ${cortanteEnX.toFixed(2)}</span> <br>
            <span style="color: #e74c3c;">Momento Flector M(x) = ${momentoEnX.toFixed(2)}</span>
        `;
    } else {
        divResultado.innerHTML = `<span style="color: red;">Error: No se encontró un tramo para esa coordenada.</span>`;
    }
}
