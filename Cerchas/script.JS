// Variable global para guardar los resultados del cálculo matricial
// Variables globales
let calculatedForces = null;
let lastReportContent = ""; // NUEVO: Para guardar el reporte

function getBarLetter(index) {
    return String.fromCharCode(65 + index);
}

function formatValue(val) {
    if (isNaN(val) || val === '') return "";
    if (Math.abs(val) < 1e-12) val = 0;
    let parts = Number(val).toFixed(4).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join('.');
}

function resetCalculations() {
    calculatedForces = null;
    const resSec = document.getElementById('results-section');
    if (resSec) resSec.style.display = 'none'; // Oculta el segundo canvas y las tablas
    triggerRedraw();
}

function removeRow(btn) {
    btn.closest('tr').remove();
    updateAllDropdowns();
    resetCalculations();
}

// ================= GESTIÓN DE TABLAS E INPUTS =================

function addNode() {
    const tbody = document.getElementById('nodes-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="node-id" style="font-weight: bold; color: var(--primary-glow);"></td>
        <td><input type="number" class="node-x" step="any" placeholder="0" oninput="resetCalculations()"></td>
        <td><input type="number" class="node-y" step="any" placeholder="0" oninput="resetCalculations()"></td>
        <td><button class="btn-delete" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(row);
    reindexNodes();
}

function reindexNodes() {
    const rows = document.querySelectorAll('#nodes-body tr');
    rows.forEach((row, index) => {
        row.querySelector('.node-id').textContent = index + 1;
    });
    updateAllDropdowns();
    resetCalculations();
}

function addSupport() {
    const tbody = document.getElementById('supports-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><select class="node-select support-node" onchange="resetCalculations()"></select></td>
        <td><input type="checkbox" class="chk-x" onchange="resetCalculations()"></td>
        <td><input type="checkbox" class="chk-y" onchange="resetCalculations()"></td>
        <td><button class="btn-delete" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(row);
    updateAllDropdowns();
}

function addBar() {
    const tbody = document.getElementById('bars-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="bar-id" style="font-weight: bold; color: var(--primary-glow);"></td>
        <td><select class="node-select start-node" onchange="resetCalculations()"></select></td>
        <td><select class="node-select end-node" onchange="resetCalculations()"></select></td>
        <td><input type="number" class="bar-e" step="any" value="1000000" oninput="checkUniformSync(); resetCalculations()"></td>
        <td><input type="number" class="bar-a" step="any" value="0.12" oninput="checkUniformSync(); resetCalculations()"></td>
        <td><button class="btn-delete" onclick="deleteBar(this)">✕</button></td>
    `;
    tbody.appendChild(row);
    reindexBars();
    updateAllDropdowns(); 
    toggleUniformProps();
    resetCalculations();
}

function deleteBar(btn) {
    btn.closest('tr').remove();
    reindexBars();
    resetCalculations();
}

function reindexBars() {
    const rows = document.querySelectorAll('#bars-body tr');
    rows.forEach((row, index) => {
        row.querySelector('.bar-id').textContent = getBarLetter(index);
    });
}

function addPointLoad() {
    const tbody = document.getElementById('point-loads-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><select class="node-select pt-node" onchange="resetCalculations()"></select></td>
        <td><input type="number" class="pt-mag" step="any" min="0" placeholder="0" oninput="if(this.value < 0) this.value = 0; resetCalculations()"></td>
        <td><input type="number" class="pt-ang" step="any" placeholder="0" oninput="resetCalculations()"></td>
        <td><button class="btn-delete" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(row);
    updateAllDropdowns();
}

function addDistLoad() {
    const tbody = document.getElementById('dist-loads-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><select class="bar-select dist-bar" onchange="resetCalculations()"></select></td>
        <td><input type="number" class="dist-q1" step="any" placeholder="0" oninput="resetCalculations()"></td>
        <td><input type="number" class="dist-q2" step="any" placeholder="0" oninput="resetCalculations()"></td>
        <td><button class="btn-delete" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(row);
    updateBarDropdowns();
}

// ================= ACTUALIZAR MENÚS DESPLEGABLES =================

function updateAllDropdowns() {
    const numNodes = document.querySelectorAll('#nodes-body tr').length;
    const selects = document.querySelectorAll('.node-select');
    
    selects.forEach(select => {
        const currentVal = select.value;
        select.innerHTML = '<option value="">- Seleccione -</option>';
        for (let i = 1; i <= numNodes; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${i}`; 
            select.appendChild(opt);
        }
        if (currentVal && currentVal <= numNodes) select.value = currentVal;
    });
    updateBarDropdowns();
}

function updateBarDropdowns() {
    const barRows = document.querySelectorAll('#bars-body tr');
    const selects = document.querySelectorAll('.bar-select');
    
    selects.forEach(select => {
        const currentVal = select.value;
        select.innerHTML = '<option value="">- Seleccione -</option>';
        barRows.forEach((row, index) => {
            const letter = getBarLetter(index);
            const opt = document.createElement('option');
            opt.value = letter;
            opt.textContent = `${letter}`; 
            select.appendChild(opt);
        });
        if (currentVal) select.value = currentVal;
    });
}

// ================= BARRAS UNIFORMES =================

function toggleUniformProps() {
    const isUniform = document.getElementById('uniform-toggle').checked;
    const rows = document.querySelectorAll('#bars-body tr');
    
    rows.forEach((row, index) => {
        const eInput = row.querySelector('.bar-e');
        const aInput = row.querySelector('.bar-a');
        if (index > 0) {
            eInput.disabled = isUniform;
            aInput.disabled = isUniform;
        }
    });
    if (isUniform) syncUniformValues();
}

function syncUniformValues() {
    const firstRow = document.querySelector('#bars-body tr');
    if (!firstRow) return;
    const eVal = firstRow.querySelector('.bar-e').value;
    const aVal = firstRow.querySelector('.bar-a').value;

    document.querySelectorAll('#bars-body tr').forEach((row, index) => {
        if (index > 0) {
            row.querySelector('.bar-e').value = eVal;
            row.querySelector('.bar-a').value = aVal;
        }
    });
}

function checkUniformSync() {
    if (document.getElementById('uniform-toggle').checked) {
        syncUniformValues();
    }
}

// ================= EXTRACCIÓN DE DATOS PARA EL CÁLCULO =================
function getFullModelData() {
    const data = { nodes: [], bars: [], supports: [], pointLoads: [], distLoads: [] };

    document.querySelectorAll('#nodes-body tr').forEach((row, i) => {
        const x = parseFloat(row.querySelector('.node-x').value);
        const y = parseFloat(row.querySelector('.node-y').value);
        if(!isNaN(x) && !isNaN(y)) data.nodes.push({ id: i + 1, x, y });
    });

    document.querySelectorAll('#bars-body tr').forEach((row, i) => {
        const start = parseInt(row.querySelector('.start-node').value);
        const end = parseInt(row.querySelector('.end-node').value);
        const E = parseFloat(row.querySelector('.bar-e').value) || 0;
        const A = parseFloat(row.querySelector('.bar-a').value) || 0;
        if (start && end) {
            data.bars.push({ id: getBarLetter(i), start, end, E, A });
        }
    });

    document.querySelectorAll('#supports-body tr').forEach(row => {
        const node = parseInt(row.querySelector('.support-node').value);
        const rx = row.querySelector('.chk-x').checked;
        const ry = row.querySelector('.chk-y').checked;
        if (node) data.supports.push({ node, rx, ry });
    });

    document.querySelectorAll('#point-loads-body tr').forEach(row => {
        const node = parseInt(row.querySelector('.pt-node').value);
        const mag = parseFloat(row.querySelector('.pt-mag').value) || 0;
        const ang = parseFloat(row.querySelector('.pt-ang').value) || 0;
        if (node) data.pointLoads.push({ node, mag, ang });
    });

    document.querySelectorAll('#dist-loads-body tr').forEach(row => {
        const bar = row.querySelector('.dist-bar').value;
        const q1 = parseFloat(row.querySelector('.dist-q1').value) || 0;
        const q2 = parseFloat(row.querySelector('.dist-q2').value) || 0;
        if (bar) data.distLoads.push({ bar, q1, q2 });
    });

    return data;
}

// ================= MOTOR DE CÁLCULO MATRICIAL =================
function calculateTruss() {
    if (typeof math === 'undefined') {
        alert("La librería matemática no está cargada. Por favor revisa la conexión.");
        return;
    }

    const btn = document.querySelector('.btn-calculate');
    btn.textContent = "CALCULANDO...";

    setTimeout(() => {
        try {
            const data = getFullModelData();
            if(data.nodes.length === 0 || data.bars.length === 0) {
                alert("Agrega al menos nodos y barras válidas para calcular.");
                btn.textContent = "CALCULAR CERCHA";
                return;
            }

            const numNodes = data.nodes.length;
            let K = math.zeros(numNodes * 2, numNodes * 2);
            let F = math.zeros(numNodes * 2, 1);

            const nodeIdx = {};
            data.nodes.forEach((n, i) => nodeIdx[n.id] = i);

            // 1. Matriz de Rigidez Global
            data.bars.forEach(bar => {
                const n1 = data.nodes.find(n => n.id === bar.start);
                const n2 = data.nodes.find(n => n.id === bar.end);
                
                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const L = Math.sqrt(dx*dx + dy*dy);
                if (L === 0) throw new Error(`La barra ${bar.id} tiene longitud 0.`);
                
                const angRad = Math.atan2(dy, dx);
                const c = Math.cos(angRad);
                const s = Math.sin(angRad);
                const EA_L = (bar.E * bar.A) / L;

                bar.L = L; bar.c = c; bar.s = s; bar.EA_L = EA_L;

                const k_local = [
                    [c*c, c*s, -c*c, -c*s],
                    [c*s, s*s, -c*s, -s*s],
                    [-c*c, -c*s, c*c, c*s],
                    [-c*s, -s*s, c*s, s*s]
                ];

                const dofs = [
                    nodeIdx[bar.start]*2, nodeIdx[bar.start]*2+1,
                    nodeIdx[bar.end]*2, nodeIdx[bar.end]*2+1
                ];

                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        const val = K.get([dofs[i], dofs[j]]) + k_local[i][j] * EA_L;
                        K.set([dofs[i], dofs[j]], val);
                    }
                }
            });

            // 2. Fuerzas Externas (Puntuales)
            data.pointLoads.forEach(load => {
                const idx = nodeIdx[load.node];
                if (idx !== undefined) {
                    const angRad = load.ang * Math.PI / 180;
                    const fx = load.mag * Math.cos(angRad);
                    const fy = load.mag * Math.sin(angRad);
                    F.set([idx*2, 0], F.get([idx*2, 0]) + fx);
                    F.set([idx*2+1, 0], F.get([idx*2+1, 0]) + fy);
                }
            });

            // 3. Fuerzas Distribuidas Equivalentes
            data.distLoads.forEach(load => {
                const bar = data.bars.find(b => b.id === load.bar);
                if (bar) {
                    const L = bar.L;
                    const q1 = load.q1;
                    const q2 = load.q2;
                    
                    let f1y, f2y;
                    if (q1 < q2) {
                        f1y = 1/6*(q2-q1)*L + q1*L;
                        f2y = 1/3*(q2-q1)*L + q1*L;
                    } else if (q1 > q2) {
                        f1y = 1/3*(q1-q2)*L + q2*L;
                        f2y = 1/6*(q1-q2)*L + q2*L;
                    } else {
                        f1y = q1*L/2;
                        f2y = q2*L/2;
                    }

                    const Fx1 = -bar.s * f1y;
                    const Fy1 = bar.c * f1y;
                    const Fx2 = -bar.s * f2y;
                    const Fy2 = bar.c * f2y;
                    
                    const idx1 = nodeIdx[bar.start];
                    const idx2 = nodeIdx[bar.end];
                    
                    F.set([idx1*2, 0], F.get([idx1*2, 0]) + Fx1);
                    F.set([idx1*2+1, 0], F.get([idx1*2+1, 0]) + Fy1);
                    F.set([idx2*2, 0], F.get([idx2*2, 0]) + Fx2);
                    F.set([idx2*2+1, 0], F.get([idx2*2+1, 0]) + Fy2);
                }
            });

            // Guardar matrices originales intactas para calcular las reacciones luego
            const K_orig = K.clone();
            const F_orig = F.clone();

            // 4. Condiciones de Borde (Método Exacto de Ceros y Unos)
            data.supports.forEach(sup => {
                const idx = nodeIdx[sup.node];
                if (idx !== undefined) {
                    if (sup.rx) {
                        const row = idx * 2;
                        // Hacer ceros toda la fila
                        for (let j = 0; j < numNodes * 2; j++) { K.set([row, j], 0); }
                        K.set([row, row], 1); // 1 en la diagonal
                        F.set([row, 0], 0);
                    }
                    if (sup.ry) {
                        const row = idx * 2 + 1;
                        for (let j = 0; j < numNodes * 2; j++) { K.set([row, j], 0); }
                        K.set([row, row], 1);
                        F.set([row, 0], 0);
                    }
                }
            });

            // 5. Resolución del Sistema U = K^-1 * F
            let U;
            try {
                U = math.lusolve(K, F);
            } catch (err) {
                // Si la librería falla al resolver, es porque el determinante es 0 (Mecanismo inestable)
                throw new Error("INESTABLE");
            }

            // 6. Extracción de Fuerzas Axiales
            calculatedForces = {};
            data.bars.forEach(bar => {
                const idx1 = nodeIdx[bar.start];
                const idx2 = nodeIdx[bar.end];
                
                const u1 = U.get([idx1*2, 0]);
                const v1 = U.get([idx1*2+1, 0]);
                const u2 = U.get([idx2*2, 0]);
                const v2 = U.get([idx2*2+1, 0]);
                
                const u1_local = bar.c * u1 + bar.s * v1;
                const u2_local = bar.c * u2 + bar.s * v2;
                
                const force = bar.EA_L * (u2_local - u1_local);
                calculatedForces[bar.id] = force;
            });
            // 7. Cálculo de Reacciones (R = K_orig * U - F_orig)
            const F_total = math.multiply(K_orig, U);
            const Reacciones = math.subtract(F_total, F_orig);

            const reactionsTbody = document.getElementById('reactions-body');
            reactionsTbody.innerHTML = '';
            data.supports.forEach(sup => {
                const idx = nodeIdx[sup.node];
                if (idx !== undefined) {
                    let rx = 0, ry = 0;
                    if (sup.rx) rx = Reacciones.get([idx * 2, 0]);
                    if (sup.ry) ry = Reacciones.get([idx * 2 + 1, 0]);
                    
                    if (Math.abs(rx) < 1e-6) rx = 0;
                    if (Math.abs(ry) < 1e-6) ry = 0;

                    reactionsTbody.innerHTML += `
                        <tr>
                            <td style="font-weight: bold; color: var(--primary-glow);">${sup.node}</td>
                            <td>${formatValue(rx)}</td>
                            <td>${formatValue(ry)}</td>
                        </tr>
                    `;
                }
            });

            // 8. Buscar Máximos de Tensión y Compresión
            let maxTension = -Infinity, maxCompression = Infinity;
            let idMaxTension = null, idMaxCompression = null;

            data.bars.forEach(bar => {
                const force = calculatedForces[bar.id];
                if (force > 1e-6 && force > maxTension) { maxTension = force; idMaxTension = bar.id; }
                if (force < -1e-6 && force < maxCompression) { maxCompression = force; idMaxCompression = bar.id; }
            });

            // 9. Llenar tabla de Fuerzas Axiales
            const resultsTbody = document.getElementById('results-body');
            resultsTbody.innerHTML = '';
            
            data.bars.forEach(bar => {
                const force = calculatedForces[bar.id];
                const isNulo = Math.abs(force) < 1e-6;
                let type = isNulo ? "Nulo" : (force > 0 ? "Tracción" : "Compresión");
                
                // Etiquetas visuales para los máximos
                if (bar.id === idMaxTension) type += " ⭐ (MÁX)";
                if (bar.id === idMaxCompression) type += " ⭐ (MÁX)";

                const color = isNulo ? "#94a3b8" : (force > 0 ? "var(--success-green)" : "var(--danger-color)");
                
                resultsTbody.innerHTML += `
                    <tr>
                        <td style="font-weight: bold; color: var(--primary-glow);">${bar.id}</td>
                        <td>${formatValue(Math.abs(force))}</td>
                        <td style="color: ${color}; font-weight: bold;">${type}</td>
                    </tr>
                `;
            });
            

            // 10. Actualizar Contador de Barras
            document.getElementById('total-bars-badge').textContent = `(Total: ${data.bars.length} barras)`;

            // 11. Generar Reporte de Texto Estructurado para la IA
            let report = "REPORTE ESTRUCTURAL DE CERCHA (Análisis Matricial)\n";
            report += "==================================================\n\n";

            report += "1. GEOMETRÍA DE NODOS Y DESPLAZAMIENTOS\n";
            report += "Nodo\tCoord X\tCoord Y\tDesplazamiento X\tDesplazamiento Y\n";
            data.nodes.forEach(n => {
                const idx = nodeIdx[n.id];
                const dx = U.get([idx*2, 0]);
                const dy = U.get([idx*2+1, 0]);
                report += `${n.id}\t${n.x.toFixed(4)}\t${n.y.toFixed(4)}\t${dx.toExponential(4)}\t${dy.toExponential(4)}\n`;
            });
            report += "\n";

            report += "2. DEFINICIÓN DE BARRAS\n";
            report += "Barra\tNodo Ini\tNodo Fin\tLongitud\tÁngulo(rad)\tE\tA\n";
            data.bars.forEach(b => {
                report += `${b.id}\t${b.start}\t${b.end}\t${b.L.toFixed(4)}\t${Math.atan2(b.s, b.c).toFixed(4)}\t${b.E}\t${b.A}\n`;
            });
            report += "\n";

            report += "3. APOYOS Y REACCIONES\n";
            report += "Nodo\tRestricción X\tRestricción Y\tReacción X\tReacción Y\n";
            data.supports.forEach(sup => {
                const idx = nodeIdx[sup.node];
                let rx = 0, ry = 0;
                if (sup.rx) rx = Reacciones.get([idx * 2, 0]);
                if (sup.ry) ry = Reacciones.get([idx * 2 + 1, 0]);
                if (Math.abs(rx) < 1e-6) rx = 0;
                if (Math.abs(ry) < 1e-6) ry = 0;
                report += `${sup.node}\t${sup.rx}\t${sup.ry}\t${rx.toFixed(4)}\t${ry.toFixed(4)}\n`;
            });
            report += "\n";

            report += "4. CARGAS EXTERNAS\n";
            report += "--- PUNTUALES ---\n";
            report += "Nodo\tMagnitud\tÁngulo(grados)\n";
            data.pointLoads.forEach(l => report += `${l.node}\t${l.mag}\t${l.ang}\n`);
            report += "--- DISTRIBUIDAS ---\n";
            report += "Barra\tq1\tq2\n";
            data.distLoads.forEach(l => report += `${l.bar}\t${l.q1}\t${l.q2}\n`);
            report += "\n";

            report += "5. FUERZAS AXIALES INTERNAS\n";
            report += "Barra\tFuerza Axial\tEstado\n";
            data.bars.forEach(bar => {
                const force = calculatedForces[bar.id];
                const isNulo = Math.abs(force) < 1e-6;
                let type = isNulo ? "Nulo" : (force > 0 ? "Traccion" : "Compresion");
                if (bar.id === idMaxTension) type += " (MAXIMA TRACCION)";
                if (bar.id === idMaxCompression) type += " (MAXIMA COMPRESION)";
                // Se guarda internamente usando punto para decimales para evitar confusión en la IA
                report += `${bar.id}\t${Math.abs(force).toFixed(4)}\t${type}\n`;
            });

            lastReportContent = report;
            // Mostrar toda la sección de resultados (Canvas 2 + Tablas)
            document.getElementById('results-section').style.display = 'flex';
            triggerRedraw();
            
            btn.textContent = "CÁLCULO COMPLETADO";
            btn.style.backgroundColor = "var(--primary-purple)"; 
            
            setTimeout(() => {
                btn.textContent = "VOLVER A CALCULAR";
                btn.style.backgroundColor = "transparent";
                btn.style.border = "1px dashed var(--primary-purple)";
                btn.style.color = "var(--primary-glow)";
            }, 3000);

        } catch (err) {
            if (err.message === "INESTABLE" || err.message.toLowerCase().includes("singular")) {
                alert("⚠️ ARMADURA INESTABLE: La estructura no es rígida y colapsaría. Verifica que los apoyos sean suficientes y que los nodos estén bien conectados.");
            } else {
                alert("Error en el cálculo matricial: " + err.message);
            }
            btn.textContent = "CALCULAR CERCHA";
            
            // Si hay error, ocultamos la tabla de resultados
            const resSec = document.getElementById('results-section');
            if (resSec) resSec.style.display = 'none';
        }
    }, 400);
}

// ================= UTILIDAD PARA DIBUJAR FLECHAS =================
function drawArrow(ctx, fromx, fromy, tox, toy, color, headlen = 8) {
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

// ================= MOTOR DE DIBUJO DUAL =================
function triggerRedraw() {
    requestAnimationFrame(() => {
        renderTruss('truss-canvas', false); // Dibuja siempre el modelo geométrico sin fuerzas
        if (calculatedForces) {
            renderTruss('results-canvas', true); // Dibuja el diagrama con fuerzas en el 2do canvas
        }
    });
}

function renderTruss(canvasId, showForces) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const cssWidth = rect.width || 600; 
    const cssHeight = 500; 
    
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    
    const data = getFullModelData();
    
    if (canvasId === 'truss-canvas') {
        const placeholder = document.getElementById('truss-placeholder');
        if (placeholder) {
            if (data.nodes.length > 0) placeholder.style.display = 'none'; 
            else placeholder.style.display = 'block';
        }
    }
    
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    if (data.nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    data.nodes.forEach(n => {
        if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    });

    if (maxX === minX) { minX -= 5; maxX += 5; }
    if (maxY === minY) { minY -= 5; maxY += 5; }

    const padding = 70; 
    const scaleX = (cssWidth - padding * 2) / (maxX - minX);
    const scaleY = (cssHeight - padding * 2) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY); 

    const tx = (x) => padding + (x - minX) * scale + (cssWidth - padding * 2 - (maxX - minX) * scale) / 2;
    const ty = (y) => cssHeight - padding - (y - minY) * scale - (cssHeight - padding * 2 - (maxY - minY) * scale) / 2;

    // 1. Cargas Distribuidas
    data.distLoads.forEach(load => {
        const bar = data.bars.find(b => b.id === load.bar);
        if (bar && (load.q1 !== 0 || load.q2 !== 0)) {
            const n1 = data.nodes.find(n => n.id === bar.start);
            const n2 = data.nodes.find(n => n.id === bar.end);
            if (n1 && n2) {
                const x1 = tx(n1.x), y1 = ty(n1.y);
                const x2 = tx(n2.x), y2 = ty(n2.y);
                const dx = x2 - x1, dy = y2 - y1;
                const len = Math.sqrt(dx*dx + dy*dy);
                const ang = Math.atan2(dy, dx);
                let maxQ = Math.max(Math.abs(load.q1), Math.abs(load.q2));
                let scaleQ = 35 / (maxQ || 1); 
                
                // Lógica de dirección: si es negativo, dibujamos hacia abajo
                const h1 = load.q1 * scaleQ; 
                const h2 = load.q2 * scaleQ;

                ctx.save();
                ctx.translate(x1, y1);
                ctx.rotate(ang);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, h1); 
                ctx.lineTo(len, h2);
                ctx.lineTo(len, 0);
                ctx.fillStyle = 'rgba(167, 139, 250, 0.15)'; 
                ctx.fill();
                ctx.strokeStyle = '#a78bfa';
                ctx.lineWidth = 1;
                ctx.stroke();

                const numArrows = Math.max(3, Math.floor(len / 20));
                for(let i=0; i<=numArrows; i++) {
                    const t = i / numArrows;
                    const lx = len * t;
                    const lh = h1 * (1 - t) + h2 * t;
                    if(lh !== 0) drawArrow(ctx, lx, lh, lx, 0, '#a78bfa', 6);
                }
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px Segoe UI';
                ctx.textAlign = 'center';
                
                const off1 = h1 < 0 ? h1 - 8 : h1 + 12;
                const off2 = h2 < 0 ? h2 - 8 : h2 + 12;
                // SIN unidades, solo el número
                if(load.q1 !== 0) ctx.fillText(formatValue(load.q1), 0, off1);
                if(load.q2 !== 0 && load.q2 !== load.q1) ctx.fillText(formatValue(load.q2), len, off2);
                ctx.restore();
            }
        }
    });

    // 2. Apoyos Diferenciados
    data.supports.forEach(sup => {
        const node = data.nodes.find(n => n.id === sup.node);
        if (node) {
            const x = tx(node.x);
            const y = ty(node.y);
            ctx.fillStyle = '#8b5cf6';
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 12, y + 18);
            ctx.lineTo(x + 12, y + 18);
            ctx.closePath();
            ctx.stroke();

            if (!sup.rx && sup.ry) {
                ctx.beginPath();
                ctx.arc(x - 6, y + 23, 3, 0, Math.PI * 2);
                ctx.arc(x + 6, y + 23, 3, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.moveTo(x - 18, (!sup.rx && sup.ry) ? y + 26 : y + 18);
            ctx.lineTo(x + 18, (!sup.rx && sup.ry) ? y + 26 : y + 18);
            ctx.stroke();
        }
    });

    // 3. Dibujar Barras
    ctx.lineWidth = 3;
    data.bars.forEach(bar => {
        const n1 = data.nodes.find(n => n.id === bar.start);
        const n2 = data.nodes.find(n => n.id === bar.end);
        if (n1 && n2) {
            const x1 = tx(n1.x), y1 = ty(n1.y);
            const x2 = tx(n2.x), y2 = ty(n2.y);
            ctx.beginPath();
            ctx.strokeStyle = '#5e35b1';
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            const dx = x2 - x1;
            const dy = y2 - y1;
            const isDiag = Math.abs(dx) > 1e-3 && Math.abs(dy) > 1e-3;
            let shiftFactor = 0.5; 
            
            if (isDiag) shiftFactor = (dx * dy > 0) ? 0.35 : 0.65;
            const midX = x1 + dx * shiftFactor;
            const midY = y1 + dy * shiftFactor;

            let textoBarra = "";
            if (showForces && calculatedForces && calculatedForces[bar.id] !== undefined) {
                textoBarra = formatValue(calculatedForces[bar.id]);
            } else {
                textoBarra = bar.id;
            }

            ctx.font = 'bold 13px Segoe UI';
            const textWidth = ctx.measureText(textoBarra).width;
            
            ctx.fillStyle = 'rgba(20, 20, 25, 0.9)';
            ctx.fillRect(midX - textWidth/2 - 6, midY - 11, textWidth + 12, 22);

            ctx.fillStyle = (showForces && calculatedForces && calculatedForces[bar.id] !== undefined) ? '#ffffff' : '#a78bfa';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(textoBarra, midX, midY);
        }
    });

    // 4. Nodos (Dibujados ANTES que las cargas puntuales para que no las tapen)
    data.nodes.forEach(n => {
        const cx = tx(n.x);
        const cy = ty(n.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#141419';
        ctx.fill();
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px Segoe UI';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${n.id}`, cx + 8, cy - 8);
    });

    // 5. Cargas Puntuales (Dibujadas al FINAL, por encima de todo)
    data.pointLoads.forEach(load => {
        const node = data.nodes.find(n => n.id === load.node);
        if (node && load.mag !== 0) {
            const nx = tx(node.x);
            const ny = ty(node.y);
            const angRad = -load.ang * Math.PI / 180;
            const arrowLen = 45;
            const startX = nx - arrowLen * Math.cos(angRad);
            const startY = ny - arrowLen * Math.sin(angRad);
            drawArrow(ctx, startX, startY, nx, ny, '#ffffff', 8);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Segoe UI';
            ctx.textAlign = 'center';
            // SIN unidades
            ctx.fillText(formatValue(load.mag), startX, startY - 8);
        }
    });
}

window.onload = () => {
    addNode();
    addNode();
    addBar();
    toggleUniformProps(); 
    triggerRedraw();
};

// ================= IMPORTAR GEOMETRÍA DESDE ARCHIVO .TXT =================
function importarArchivoTxt(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        
        let nodosMap = new Map(); // Para evitar nodos duplicados: "X,Y" -> ID de Nodo
        let barrasData = [];

        // Omitir la primera línea (cabecera: Ángulo, Fin X, etc.)
        for (let i = 1; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;

            let cols = line.split('\t');
            if (cols.length >= 5) {
                let finX = parseFloat(cols[1]);
                let finY = parseFloat(cols[2]);
                let iniX = parseFloat(cols[3]);
                let iniY = parseFloat(cols[4]);

                let keyIni = `${iniX},${iniY}`;
                let keyFin = `${finX},${finY}`;

                if (!nodosMap.has(keyIni)) {
                    nodosMap.set(keyIni, nodosMap.size + 1);
                }
                if (!nodosMap.has(keyFin)) {
                    nodosMap.set(keyFin, nodosMap.size + 1);
                }

                barrasData.push({
                    iniId: nodosMap.get(keyIni),
                    finId: nodosMap.get(keyFin),
                    iniX, iniY, finX, finY
                });
            }
        }

        // 1. Limpiar tablas actuales
        document.getElementById('nodes-body').innerHTML = '';
        document.getElementById('bars-body').innerHTML = '';

        // 2. Rellenar tabla de Nodos dinámicamente
        // Convertimos el mapa a un array ordenado por ID
        let nodosArray = [];
        nodosMap.forEach((id, coords) => {
            let [x, y] = coords.split(',').map(Number);
            nodosArray.push({ id, x, y });
        });
        nodosArray.sort((a, b) => a.id - b.id);

        nodosArray.forEach(n => {
            addNode();
            let rows = document.querySelectorAll('#nodes-body tr');
            let lastRow = rows[rows.length - 1];
            lastRow.querySelector('.node-x').value = n.x;
            lastRow.querySelector('.node-y').value = n.y;
        });

        // 3. Rellenar tabla de Barras dinámicamente
        barrasData.forEach(b => {
            if (b.iniId !== b.finId) {
                addBar();
                let rows = document.querySelectorAll('#bars-body tr');
                let lastRow = rows[rows.length - 1];
                lastRow.querySelector('.start-node').value = b.iniId;
                lastRow.querySelector('.end-node').value = b.finId;
            }
        });

        updateAllDropdowns();
        resetCalculations();
        alert("¡Geometría importada con éxito desde el archivo .txt!");
    };
    reader.readAsText(file);
}

// ================= COPIAR PROMPT PARA IA =================
function copyPrompt(event) {
    const promptText = document.getElementById("prompt-text");
    promptText.select();
    promptText.setSelectionRange(0, 99999); // Compatible con móviles
    
    navigator.clipboard.writeText(promptText.value).then(() => {
        const btn = event.target;
        const originalText = btn.innerHTML;
        
        btn.innerHTML = "✅ ¡Copiado!";
        btn.style.backgroundColor = "var(--primary-purple)";
        btn.style.color = "white";
        btn.style.borderStyle = "solid";
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = "transparent";
            btn.style.color = "var(--primary-glow)";
            btn.style.borderStyle = "dashed";
        }, 2000);
    }).catch(err => {
        alert("No se pudo copiar el texto. Selecciona y copia manualmente.");
    });
}

// ================= DESCARGAR REPORTE PARA IA =================
function downloadReport() {
    if (!lastReportContent) {
        alert("Primero debes calcular la cercha para generar el reporte.");
        return;
    }
    
    // Crear un archivo de texto virtual (Blob)
    const blob = new Blob([lastReportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace invisible y forzar el clic para descargar
    const a = document.createElement('a');
    a.href = url;
    a.download = "Reporte_Estructural_StructuraPro.txt";
    document.body.appendChild(a);
    a.click();
    
    // Limpiar memoria
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ================= EXPORTAR GEOMETRÍA A ARCHIVO .TXT =================
function descargarGeometriaTxt() {
    const data = getFullModelData();
    if (data.nodes.length === 0) {
        alert("No hay nodos ni geometría ingresada para descargar.");
        return;
    }

    // Encabezado estándar requerido por el importador
    let txtContent = "Ángulo\tFin X\tFin Y\tInicial X\tInicial Y\tLongitud\n";

    if (data.bars.length > 0) {
        data.bars.forEach(bar => {
            const n1 = data.nodes.find(n => n.id === bar.start);
            const n2 = data.nodes.find(n => n.id === bar.end);
            if (n1 && n2) {
                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                let angRad = Math.atan2(dy, dx);
                let angDeg = (angRad * 180 / Math.PI + 360) % 360;

                txtContent += `${angDeg.toFixed(4)}\t${n2.x.toFixed(4)}\t${n2.y.toFixed(4)}\t${n1.x.toFixed(4)}\t${n1.y.toFixed(4)}\t${len.toFixed(4)}\n`;
            }
        });
    } else {
        // En caso de que solo existan nodos definidos sin barras
        data.nodes.forEach(n => {
            txtContent += `0.0000\t${n.x.toFixed(4)}\t${n.y.toFixed(4)}\t${n.x.toFixed(4)}\t${n.y.toFixed(4)}\t0.0000\n`;
        });
    }

    // Creación y descarga del archivo .txt
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Geometria_Cercha.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}