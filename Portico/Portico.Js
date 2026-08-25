// ================= UTILIDADES =================
let hasCalculated = false; // Variable global para rastrear el estado del cálculo
let globalResults = null;
function getLetter(index) { return String.fromCharCode(65 + index); }
function removeRow(btn) { 
    btn.closest('tr').remove(); 
    triggerRedraw();
}

// Formato de números: separador de miles con espacio y decimales con punto
function formatValue(val) {
    if (isNaN(val) || val === '') return "";
    if (Math.abs(val) < 1e-12) val = 0; 
    let parts = Number(val).toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join('.');
}

// ================= EVALUADOR MATEMÁTICO EN TIEMPO REAL =================
function handleMathInput(element) {
    let val = element.value.trim();
    if (!val) return;
    try {
        let calc = math.evaluate(val);
        if (calc <= 0) {
            alert("Error: El Área, Inercia y Módulo de Elasticidad deben ser mayores que cero.");
            element.value = "";
            return;
        }
        element.value = Number(calc.toFixed(8)).toString(); 
        if (element.classList.contains('prop-a')) syncProps('a');
        if (element.classList.contains('prop-i')) syncProps('i');
        if (element.classList.contains('prop-e')) syncProps('e');
        triggerRedraw();
    } catch (error) {
        alert("Expresión inválida. Usa operadores matemáticos correctos (+, -, *, /, ^).");
        element.value = "";
    }
}

// ================= GESTIÓN DE TABLAS =================
function addNode() {
    const tbody = document.getElementById('nodes-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="node-id" style="font-weight: bold; color: var(--primary-glow);"></td>
        <td><input type="number" class="node-x" step="0.01" placeholder="0.00"></td>
        <td><input type="number" class="node-y" step="0.01" placeholder="0.00"></td>
        <td><button class="btn-delete" onclick="deleteNode(this)" title="Eliminar Nodo">✕</button></td>
    `;
    tbody.appendChild(row);
    reindexNodes();
}

function deleteNode(btn) {
    removeRow(btn);
    reindexNodes();
}

function reindexNodes() {
    const rows = document.querySelectorAll('#nodes-body tr');
    rows.forEach((row, index) => {
        row.querySelector('.node-id').textContent = index + 1;
    });
    updateNodeDropdowns(); 
    triggerRedraw();
}

function addBar() {
    const barsTbody = document.getElementById('bars-body');
    const propsTbody = document.getElementById('props-body');
    
    const barRow = document.createElement('tr');
    barRow.innerHTML = `
        <td class="bar-id" style="font-weight: bold; color: var(--primary-glow);"></td>
        <td><select class="node-select start-node"></select></td>
        <td><select class="node-select end-node"></select></td>
        <td><input type="checkbox" class="support-check hinge-start" title="Agregar Rótula al inicio"></td>
        <td><input type="checkbox" class="support-check hinge-end" title="Agregar Rótula al final"></td>
        <td><button class="btn-delete" onclick="deleteBar(this)" title="Eliminar Barra">✕</button></td>
    `;
    barsTbody.appendChild(barRow);

    const propRow = document.createElement('tr');
    propRow.innerHTML = `
        <td class="bar-id-prop" style="font-weight: bold; color: var(--primary-glow);"></td>
        <td><input type="text" class="prop-a" value="0.01" placeholder="Ej: 0.1*0.1" onchange="handleMathInput(this)"></td>
        <td><input type="text" class="prop-i" value="0.0001" placeholder="Ej: (0.1*0.1^3)/12" onchange="handleMathInput(this)"></td>
        <td><input type="text" class="prop-e" value="200000" placeholder="Ej: 2*10^5" onchange="handleMathInput(this)"></td>
    `;
    propsTbody.appendChild(propRow);

    reindexBars();
    updateNodeDropdowns(); 
    toggleUniformProps(); 
}

function deleteBar(btn) {
    const rowIndex = btn.closest('tr').rowIndex - 1; 
    document.getElementById('bars-body').deleteRow(rowIndex);
    document.getElementById('props-body').deleteRow(rowIndex);
    reindexBars();
    triggerRedraw();
}

function reindexBars() {
    const barRows = document.querySelectorAll('#bars-body tr');
    const propRows = document.querySelectorAll('#props-body tr');
    
    barRows.forEach((row, index) => {
        const letter = getLetter(index);
        row.querySelector('.bar-id').textContent = letter;
        propRows[index].querySelector('.bar-id-prop').textContent = letter;
    });
    updateBarDropdowns();
    triggerRedraw();
}

function toggleUniformProps() {
    const isUniform = document.getElementById('uniform-toggle').checked;
    const propRows = document.querySelectorAll('#props-body tr');
    if(propRows.length === 0) return;

    propRows.forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        if (index === 0) {
            inputs.forEach(inp => inp.disabled = false);
        } else {
            inputs.forEach(inp => inp.disabled = isUniform);
        }
    });
    if (isUniform) { syncProps('a'); syncProps('i'); syncProps('e'); }
}

function syncProps(type) {
    const isUniform = document.getElementById('uniform-toggle').checked;
    if (!isUniform) return;
    const inputs = document.querySelectorAll(`.prop-${type}`);
    if(inputs.length === 0) return;
    const firstValue = inputs[0].value;
    for(let i = 1; i < inputs.length; i++) {
        inputs[i].value = firstValue;
    }
}

// Busca la función addSupport() y modifica la parte del <select class="support-type">
function addSupport() {
    const tbody = document.getElementById('supports-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><select class="node-select support-node"></select></td>
        <td>
            <select class="support-type" onchange="handleSupportType(this)">
                <option value="fijo">Fijo</option>
                <option value="movil">Móvil (Rodillo)</option> <!-- NUEVA OPCIÓN -->
                <option value="empotrado">Empotrado</option>
                <option value="personalizado">Personalizado</option>
            </select>
        </td>
        <td><input type="checkbox" class="support-check chk-x" checked disabled></td>
        <td><input type="checkbox" class="support-check chk-y" checked disabled></td>
        <td><input type="checkbox" class="support-check chk-g" disabled></td>
        <td><button class="btn-delete" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(row);
    updateNodeDropdowns();
}

function handleSupportType(selectElement) {
    const row = selectElement.closest('tr');
    const type = selectElement.value;
    const chkX = row.querySelector('.chk-x');
    const chkY = row.querySelector('.chk-y');
    const chkG = row.querySelector('.chk-g');

    if (type === "empotrado") {
        chkX.checked = true; chkY.checked = true; chkG.checked = true;
        chkX.disabled = true; chkY.disabled = true; chkG.disabled = true;
    } else if (type === "fijo") {
        chkX.checked = true; chkY.checked = true; chkG.checked = false;
        chkX.disabled = true; chkY.disabled = true; chkG.disabled = true;
    } else if (type === "movil") { // NUEVA LÓGICA PARA MÓVIL
        chkX.checked = false; chkY.checked = true; chkG.checked = false;
        chkX.disabled = true; chkY.disabled = true; chkG.disabled = true;
    } else {
        chkX.disabled = false; chkY.disabled = false; chkG.disabled = false;
    }
    triggerRedraw();
}

function addDistLoad() {
    const tbody = document.getElementById('dist-loads-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><select class="bar-select dist-bar"></select></td>
        <td><input type="number" class="dist-q1" step="0.01" placeholder="0.00"></td>
        <td><input type="number" class="dist-q2" step="0.01" placeholder="0.00"></td>
        <td><button class="btn-delete" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(row);
    updateBarDropdowns();
}

function addPointLoad() {
    const tbody = document.getElementById('point-loads-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><select class="node-select pt-node"></select></td>
        <td><input type="number" class="pt-mag" step="0.01" min="0" placeholder="0.00" oninput="if(this.value < 0) this.value = 0;"></td>
        <td><input type="number" class="pt-ang" step="0.1" placeholder="0.0 (G. Sexagesimales)"></td>
        <td><button class="btn-delete" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(row);
    updateNodeDropdowns();
}

function addMoment() {
    const tbody = document.getElementById('moments-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><select class="node-select mom-node"></select></td>
        <td><input type="number" class="mom-mag" step="0.01" placeholder="0.00"></td>
        <td><button class="btn-delete" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(row);
    updateNodeDropdowns();
}

function updateNodeDropdowns() {
    const numNodes = document.querySelectorAll('#nodes-body tr').length;
    const selects = document.querySelectorAll('.node-select');
    
    selects.forEach(select => {
        const currentVal = select.value;
        // Texto por defecto más corto para evitar que desborde
        select.innerHTML = '<option value="">- Sel -</option>'; 
        for(let i = 1; i <= numNodes; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            // Aquí definimos que muestre N1, N2, etc. en lugar de Nodo 1, Nodo 2
            opt.textContent = `N${i}`; 
            select.appendChild(opt);
        }
        if(currentVal && currentVal <= numNodes) select.value = currentVal;
    });
    triggerRedraw();
}

function updateBarDropdowns() {
    const numBars = document.querySelectorAll('#bars-body tr').length;
    const selects = document.querySelectorAll('.bar-select');
    
    selects.forEach(select => {
        const currentVal = select.value;
        select.innerHTML = '<option value="">- Seleccione -</option>';
        for(let i = 0; i < numBars; i++) {
            const letter = getLetter(i);
            const opt = document.createElement('option');
            opt.value = letter;
            opt.textContent = `${letter}`;
            select.appendChild(opt);
        }
        if(currentVal) select.value = currentVal;
    });
    triggerRedraw();
}

// ================= MOTOR DE DIBUJO (CANVAS) =================
function getModelData() {
    const nodes = [];
    document.querySelectorAll('#nodes-body tr').forEach((row, i) => {
        const x = parseFloat(row.querySelector('.node-x').value) || 0;
        const y = parseFloat(row.querySelector('.node-y').value) || 0;
        nodes.push({ id: i + 1, x, y });
    });

    const bars = [];
    document.querySelectorAll('#bars-body tr').forEach((row, i) => {
        const start = parseInt(row.querySelector('.start-node').value);
        const end = parseInt(row.querySelector('.end-node').value);
        const hingeStart = row.querySelector('.hinge-start').checked; // NUEVO
        const hingeEnd = row.querySelector('.hinge-end').checked;     // NUEVO
        if (start && end) bars.push({ id: getLetter(i), start, end, hingeStart, hingeEnd });
    });

    return { nodes, bars };
}

function drawArrowHead(ctx, x, y, angle, color, size = 8) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

function drawArrow(ctx, fromx, fromy, tox, toy, color, headlen = 8) {
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
    drawArrowHead(ctx, tox, toy, angle, color, headlen);
}

function drawModel() {
    const canvas = document.getElementById('portico-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const data = getModelData();
    const placeholder = document.getElementById('portico-placeholder');
    if (data.nodes.length > 0) { placeholder.style.display = 'none'; } else { placeholder.style.display = 'block'; }
    ctx.clearRect(0, 0, width, height);
    if (data.nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    data.nodes.forEach(n => {
        if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    });

    if (maxX === minX) { minX -= 5; maxX += 5; }
    if (maxY === minY) { minY -= 5; maxY += 5; }

    const padding = 70; 
    const scaleX = (width - padding * 2) / (maxX - minX);
    const scaleY = (height - padding * 2) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY); 

    const tx = (x) => padding + (x - minX) * scale + (width - padding * 2 - (maxX - minX) * scale) / 2;
    const ty = (y) => height - padding - (y - minY) * scale - (height - padding * 2 - (maxY - minY) * scale) / 2;

    document.querySelectorAll('#supports-body tr').forEach(row => {
        const nodeId = parseInt(row.querySelector('.support-node').value);
        const type = row.querySelector('.support-type').value;
        const node = data.nodes.find(n => n.id === nodeId);
        
        if (node) {
            const x = tx(node.x);
            const y = ty(node.y);
            ctx.fillStyle = '#10b981';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;

            if (type === 'fijo' || type === 'personalizado') {
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y + 20); ctx.lineTo(x + 12, y + 20); ctx.closePath(); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x - 18, y + 20); ctx.lineTo(x + 18, y + 20); ctx.stroke();
            } else if (type === 'movil') {
                // NUEVO: Dibujo del apoyo móvil (triángulo con rodillos)
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 14); ctx.lineTo(x + 10, y + 14); ctx.closePath(); ctx.stroke();
                // Dibujar 2 rueditas
                ctx.beginPath(); ctx.arc(x - 5, y + 17, 3, 0, 2 * Math.PI); ctx.stroke();
                ctx.beginPath(); ctx.arc(x + 5, y + 17, 3, 0, 2 * Math.PI); ctx.stroke();
                // Línea de base
                ctx.beginPath(); ctx.moveTo(x - 15, y + 20); ctx.lineTo(x + 15, y + 20); ctx.stroke();
            } else if (type === 'empotrado') {
                ctx.beginPath(); ctx.moveTo(x - 15, y); ctx.lineTo(x + 15, y); ctx.stroke();
                for(let i = -15; i <= 15; i+=5) {
                    ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i - 5, y + 10); ctx.stroke();
                }
            }
        }
    });

    let maxQ = 0;
    document.querySelectorAll('#dist-loads-body tr').forEach(row => {
        const q1 = Math.abs(parseFloat(row.querySelector('.dist-q1').value) || 0);
        const q2 = Math.abs(parseFloat(row.querySelector('.dist-q2').value) || 0);
        if (q1 > maxQ) maxQ = q1;
        if (q2 > maxQ) maxQ = q2;
    });
    const maxVisualHeight = 45;

    document.querySelectorAll('#dist-loads-body tr').forEach(row => {
        const barId = row.querySelector('.dist-bar').value;
        const q1 = parseFloat(row.querySelector('.dist-q1').value);
        const q2 = parseFloat(row.querySelector('.dist-q2').value);
        const bar = data.bars.find(b => b.id === barId);

        if (bar && (!isNaN(q1) || !isNaN(q2))) {
            const n1 = data.nodes.find(n => n.id === bar.start);
            const n2 = data.nodes.find(n => n.id === bar.end);
            if (n1 && n2) {
                const x1 = tx(n1.x), y1 = ty(n1.y);
                const x2 = tx(n2.x), y2 = ty(n2.y);
                const dx = x2 - x1, dy = y2 - y1;
                const length = Math.sqrt(dx*dx + dy*dy);
                const angle = Math.atan2(dy, dx);
                
                const h1 = maxQ === 0 ? 0 : (Math.abs(q1) / maxQ) * maxVisualHeight * (q1 < 0 ? -1 : 1);
                const h2 = maxQ === 0 ? 0 : (Math.abs(q2) / maxQ) * maxVisualHeight * (q2 < 0 ? -1 : 1);

                ctx.save();
                ctx.translate(x1, y1);
                ctx.rotate(angle);
                
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, h1); ctx.lineTo(length, h2); ctx.lineTo(length, 0);
                ctx.fillStyle = 'rgba(14, 165, 233, 0.15)'; 
                ctx.fill();
                ctx.strokeStyle = '#0ea5e9';
                ctx.lineWidth = 1;
                ctx.stroke();

                const numArrows = Math.max(3, Math.floor(length / 25));
                for(let i = 0; i <= numArrows; i++) {
                    const t = i / numArrows;
                    const h = h1 * (1 - t) + h2 * t;
                    const lx = length * t;
                    if (q1 < 0 || q2 < 0) { drawArrow(ctx, lx, h, lx, 0, '#0ea5e9', 7); } 
                    else { drawArrow(ctx, lx, 0, lx, h, '#0ea5e9', 7); }
                }
                
                ctx.fillStyle = '#0ea5e9';
                ctx.font = 'bold 11px Segoe UI';
                ctx.textAlign = 'center';
                ctx.fillText(formatValue(q1) + ' N/m', 0, h1 + (q1 < 0 ? -8 : 15));
                if (q2 !== q1) { ctx.fillText(formatValue(q2) + ' N/m', length, h2 + (q2 < 0 ? -8 : 15)); }
                ctx.restore();
            }
        }
    });

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#8b5cf6'; 
    data.bars.forEach(bar => {
        const n1 = data.nodes.find(n => n.id === bar.start);
        const n2 = data.nodes.find(n => n.id === bar.end);
        if (n1 && n2) {
            ctx.beginPath();
            ctx.moveTo(tx(n1.x), ty(n1.y));
            ctx.lineTo(tx(n2.x), ty(n2.y));
            ctx.stroke();
            const midX = (tx(n1.x) + tx(n2.x)) / 2;
            const midY = (ty(n1.y) + ty(n2.y)) / 2;
            
            ctx.beginPath();
            ctx.arc(midX, midY, 11, 0, 2 * Math.PI);
            ctx.fillStyle = '#141419'; 
            ctx.fill();
            
            ctx.fillStyle = '#a78bfa'; 
            ctx.font = 'bold 13px Segoe UI';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bar.id, midX, midY + 1);

            // DIBUJO DE RÓTULAS VISUALES
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 2;
            if (bar.hingeStart) {
                const angle = Math.atan2(ty(n2.y) - ty(n1.y), tx(n2.x) - tx(n1.x));
                const hx = tx(n1.x) + 12 * Math.cos(angle);
                const hy = ty(n1.y) + 12 * Math.sin(angle);
                ctx.beginPath(); ctx.arc(hx, hy, 4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
            }
            if (bar.hingeEnd) {
                const angle = Math.atan2(ty(n1.y) - ty(n2.y), tx(n1.x) - tx(n2.x));
                const hx = tx(n2.x) + 12 * Math.cos(angle);
                const hy = ty(n2.y) + 12 * Math.sin(angle);
                ctx.beginPath(); ctx.arc(hx, hy, 4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
            }
        }
    });

    data.nodes.forEach(n => {
        const cx = tx(n.x);
        const cy = ty(n.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI); 
        ctx.fillStyle = '#f8fafc'; 
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#8b5cf6';
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px Segoe UI';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText("N" + n.id, cx + 6, cy - 6);
    });

    document.querySelectorAll('#point-loads-body tr').forEach(row => {
        const nodeId = parseInt(row.querySelector('.pt-node').value);
        const mag = row.querySelector('.pt-mag').value;
        const angDeg = parseFloat(row.querySelector('.pt-ang').value) || 0;
        const node = data.nodes.find(n => n.id === nodeId);
        if (node && mag) {
            const x = tx(node.x);
            const y = ty(node.y);
            const angRad = -angDeg * Math.PI / 180; 
            const length = 45;
            const startX = x - length * Math.cos(angRad);
            const startY = y - length * Math.sin(angRad); 
            drawArrow(ctx, startX, startY, x, y, '#ef4444', 9);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 12px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText(formatValue(mag) + ' N', startX, startY - 8);
        }
    });

    document.querySelectorAll('#moments-body tr').forEach(row => {
        const nodeId = parseInt(row.querySelector('.mom-node').value);
        const mag = parseFloat(row.querySelector('.mom-mag').value);
        const node = data.nodes.find(n => n.id === nodeId);
        if (node && !isNaN(mag)) {
            const x = tx(node.x);
            const y = ty(node.y);
            const isPositive = mag >= 0;
            
            ctx.beginPath();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            
            if (isPositive) {
                ctx.arc(x, y, 22, -0.2 * Math.PI, -0.8 * Math.PI, true);
                ctx.stroke();
                const endX = x + 22 * Math.cos(-0.8 * Math.PI);
                const endY = y + 22 * Math.sin(-0.8 * Math.PI);
                drawArrowHead(ctx, endX, endY, -0.8 * Math.PI - Math.PI / 2, '#f59e0b', 8);
            } else {
                ctx.arc(x, y, 22, -0.8 * Math.PI, -0.2 * Math.PI, false);
                ctx.stroke();
                const endX = x + 22 * Math.cos(-0.2 * Math.PI);
                const endY = y + 22 * Math.sin(-0.2 * Math.PI);
                drawArrowHead(ctx, endX, endY, -0.2 * Math.PI + Math.PI / 2, '#f59e0b', 8);
            }
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 12px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText(formatValue(mag) + ' N·m', x, y - 28);
        }
    });
}

function triggerRedraw() {
    requestAnimationFrame(drawModel);
    
    // Cambiar estado del botón si los datos cambian después de calcular
    if (hasCalculated) {
        const btn = document.querySelector('.btn-calculate');
        btn.textContent = "VOLVER A CALCULAR";
        btn.style.backgroundColor = "#f59e0b"; // Naranja para advertir modificación
        btn.style.opacity = "1";
    }
}

// ================= SIMULACIÓN Y MOTOR DE CÁLCULO MATRICIAL =================
function getSimulationData() {
    const data = getModelData(); 
    
    // 1. Propiedades
    const propRows = document.querySelectorAll('#props-body tr');
    data.bars.forEach((bar, i) => {
        bar.A = math.evaluate(propRows[i].querySelector('.prop-a').value) || 0;
        bar.I = math.evaluate(propRows[i].querySelector('.prop-i').value) || 0;
        let rawE = math.evaluate(propRows[i].querySelector('.prop-e').value) || 0;
        bar.E = rawE * 1e6; 
    });

    // 2. Cargas Distribuidas (Formato de cálculo + formato legible para el Asistente IA)
    data.distLoads = {};
    data.cargas_distribuidas_info = []; 
    document.querySelectorAll('#dist-loads-body tr').forEach(row => {
        const barId = row.querySelector('.dist-bar').value;
        const q1 = parseFloat(row.querySelector('.dist-q1').value) || 0;
        const q2 = parseFloat(row.querySelector('.dist-q2').value) || 0;
        if(barId) {
            data.distLoads[barId] = { q1, q2 };
            data.cargas_distribuidas_info.push({ barra: barId, q1, q2 });
        }
    });

    // 3. DATOS NUEVOS PARA QUE EL ASISTENTE IA VEA TODO EL CONTEXTO:
    data.apoyos = [];
    document.querySelectorAll('#supports-body tr').forEach(row => {
        const node = parseInt(row.querySelector('.support-node').value);
        const rx = row.querySelector('.chk-x').checked ? "Fijo" : "Libre";
        const ry = row.querySelector('.chk-y').checked ? "Fijo" : "Libre";
        const rm = row.querySelector('.chk-g').checked ? "Fijo" : "Libre";
        if(node) data.apoyos.push({nodo: node, restriccion_X: rx, restriccion_Y: ry, restriccion_Momento: rm});
    });

    data.cargas_puntuales = [];
    document.querySelectorAll('#point-loads-body tr').forEach(row => {
        const node = parseInt(row.querySelector('.pt-node').value);
        const mag = parseFloat(row.querySelector('.pt-mag').value) || 0;
        const ang = parseFloat(row.querySelector('.pt-ang').value) || 0;
        if(node) data.cargas_puntuales.push({nodo: node, magnitud_N: mag, angulo_grados: ang});
    });

    data.momentos_concentrados = [];
    document.querySelectorAll('#moments-body tr').forEach(row => {
        const node = parseInt(row.querySelector('.mom-node').value);
        const mag = parseFloat(row.querySelector('.mom-mag').value) || 0;
        if(node) data.momentos_concentrados.push({nodo: node, magnitud_Nm: mag});
    });

    // Recolectar reacciones calculadas de forma limpia para la IA
    let reaccionesLimpias = [];
    const reaccionesRows = document.querySelectorAll('#reactions-body tr');
    reaccionesRows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if(cols.length >= 4) {
            reaccionesLimpias.push({
                nodo: cols[0].textContent.trim(),
                fuerza_X: cols[1].textContent.trim(),
                fuerza_Y: cols[2].textContent.trim(),
                momento: cols[3].textContent.trim()
            });
        }
    });

    data.resultados_reacciones_oficiales = reaccionesLimpias;

    return data;
}

function calculate() {
    const calculateBtn = document.querySelector('.btn-calculate');
    calculateBtn.textContent = "CALCULANDO...";
    calculateBtn.style.backgroundColor = "var(--primary-purple)";

    if (typeof math === 'undefined') { alert("math.js no está cargado."); return; }

    setTimeout(() => {
        const data = getSimulationData();
        const numNodes = data.nodes.length;
        const totalDOF = numNodes * 3;

        let K_global = math.zeros(totalDOF, totalDOF);
        let F_global = math.zeros(totalDOF, 1);

        const nodeIdx = {};
        data.nodes.forEach((n, i) => { nodeIdx[n.id] = i; });

        data.bars.forEach(bar => {
            const n1 = data.nodes.find(n => n.id === bar.start);
            const n2 = data.nodes.find(n => n.id === bar.end);
            
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const L = Math.sqrt(dx*dx + dy*dy);
            const angRad = Math.atan2(dy, dx);
            const c = Math.cos(angRad);
            const s = Math.sin(angRad);
            
            bar.L = L; bar.angRad = angRad;

            const EA_L = (bar.E * bar.A) / L;
            const EI12_L3 = (12 * bar.E * bar.I) / Math.pow(L, 3);
            const EI6_L2 = (6 * bar.E * bar.I) / Math.pow(L, 2);
            const EI4_L = (4 * bar.E * bar.I) / L;
            const EI2_L = (2 * bar.E * bar.I) / L;

            let k_local = [
                [EA_L, 0, 0, -EA_L, 0, 0],
                [0, EI12_L3, EI6_L2, 0, -EI12_L3, EI6_L2],
                [0, EI6_L2, EI4_L, 0, -EI6_L2, EI2_L],
                [-EA_L, 0, 0, EA_L, 0, 0],
                [0, -EI12_L3, -EI6_L2, 0, EI12_L3, -EI6_L2],
                [0, EI6_L2, EI2_L, 0, -EI6_L2, EI4_L]
            ];

            // 1. PRE-CALCULAR FUERZAS EQUIVALENTES (Para condensarlas junto a la matriz)
            let f_local = [[0],[0],[0],[0],[0],[0]];
            if (data.distLoads[bar.id]) {
                const q1 = data.distLoads[bar.id].q1;
                const q2 = data.distLoads[bar.id].q2;
                f_local = [
                    [0],
                    [(q1*L/2) + ((q2-q1)*3*L/20)],
                    [(q1*L*L/12) + ((q2-q1)*L*L/30)],
                    [0],
                    [(q1*L/2) + ((q2-q1)*7*L/20)],
                    [-(q1*L*L/12) - ((q2-q1)*L*L/20)]
                ];
            }

            // 2. CONDENSACIÓN ESTÁTICA PARA RÓTULAS
            let releasedDofs = [];
            if (bar.hingeStart) releasedDofs.push(2); // Giro inicial (índice 2)
            if (bar.hingeEnd) releasedDofs.push(5);   // Giro final (índice 5)

            releasedDofs.forEach(r => {
                const k_rr = k_local[r][r];
                // Modificar matriz de rigidez
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 6; j++) {
                        if (i !== r && j !== r) k_local[i][j] -= (k_local[i][r] * k_local[r][j]) / k_rr;
                    }
                }
                // Modificar vector de fuerzas
                for (let i = 0; i < 6; i++) {
                    if (i !== r) f_local[i][0] -= (k_local[i][r] * f_local[r][0]) / k_rr;
                }
                // Limpiar fila y columna liberada (Momentos = 0)
                for (let i = 0; i < 6; i++) { k_local[i][r] = 0; k_local[r][i] = 0; }
                f_local[r][0] = 0;
            });

            // 3. TRANSFORMACIÓN Y ENSAMBLAJE
            const T = [
                [c, s, 0, 0, 0, 0], [-s, c, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0],
                [0, 0, 0, c, s, 0], [0, 0, 0, -s, c, 0], [0, 0, 0, 0, 0, 1]
            ];
            
            bar.T = T;
            const Tt = math.transpose(T);
            const K_elem = math.multiply(math.multiply(Tt, k_local), T);
            bar.K_global_elem = K_elem;

            const dofs = [
                nodeIdx[bar.start]*3, nodeIdx[bar.start]*3+1, nodeIdx[bar.start]*3+2,
                nodeIdx[bar.end]*3, nodeIdx[bar.end]*3+1, nodeIdx[bar.end]*3+2
            ];
            bar.dofs = dofs;

            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 6; j++) {
                    const current = K_global.get([dofs[i], dofs[j]]);
                    K_global.set([dofs[i], dofs[j]], current + K_elem[i][j]);
                }
            }

            // Ensamblar vector de fuerzas transformado
            const f_global = math.multiply(Tt, f_local);
            bar.F_equiv = f_global;
            for (let i = 0; i < 6; i++) {
                const currentF = F_global.get([dofs[i], 0]);
                F_global.set([dofs[i], 0], currentF + f_global[i][0]);
            }
        });

        document.querySelectorAll('#point-loads-body tr').forEach(row => {
            const node = parseInt(row.querySelector('.pt-node').value);
            const mag = parseFloat(row.querySelector('.pt-mag').value) || 0;
            const ang = parseFloat(row.querySelector('.pt-ang').value) || 0;
            if(node) {
                const angRad = ang * Math.PI / 180;
                F_global.set([nodeIdx[node]*3, 0], F_global.get([nodeIdx[node]*3, 0]) + mag * Math.cos(angRad));
                F_global.set([nodeIdx[node]*3+1, 0], F_global.get([nodeIdx[node]*3+1, 0]) + mag * Math.sin(angRad));
            }
        });

        document.querySelectorAll('#moments-body tr').forEach(row => {
            const node = parseInt(row.querySelector('.mom-node').value);
            const mag = parseFloat(row.querySelector('.mom-mag').value) || 0;
            if(node) {
                F_global.set([nodeIdx[node]*3+2, 0], F_global.get([nodeIdx[node]*3+2, 0]) + mag);
            }
        });

        const K_global_orig = math.clone(K_global);
        const F_global_orig = math.clone(F_global);

        const penalty = 1e15;
        document.querySelectorAll('#supports-body tr').forEach(row => {
            const node = parseInt(row.querySelector('.support-node').value);
            const rx = row.querySelector('.chk-x').checked;
            const ry = row.querySelector('.chk-y').checked;
            const rm = row.querySelector('.chk-g').checked;
            if(node) {
                const baseIdx = nodeIdx[node]*3;
                if(rx) { K_global.set([baseIdx, baseIdx], K_global.get([baseIdx, baseIdx]) * penalty); F_global.set([baseIdx, 0], 0); }
                if(ry) { K_global.set([baseIdx+1, baseIdx+1], K_global.get([baseIdx+1, baseIdx+1]) * penalty); F_global.set([baseIdx+1, 0], 0); }
                if(rm) { K_global.set([baseIdx+2, baseIdx+2], K_global.get([baseIdx+2, baseIdx+2]) * penalty); F_global.set([baseIdx+2, 0], 0); }
            }
        });

        
        // AISLAMIENTO DE GRADOS DE LIBERTAD DESCONECTADOS
        for (let i = 0; i < totalDOF; i++) {
            if (Math.abs(K_global.get([i, i])) < 1e-12) {
                K_global.set([i, i], 1); // Restricción ficticia para aislar el nodo sin afectar la matriz
                F_global.set([i, 0], 0);
            }
        }

        let U;
        try {
            U = math.lusolve(K_global, F_global);
        } catch (error) {
            alert("⚠️ ESTRUCTURA INESTABLE: El sistema es un mecanismo o le faltan apoyos. Revisa las rótulas y restricciones.");
            const calculateBtn = document.querySelector('.btn-calculate');
            calculateBtn.textContent = "CALCULAR ESTRUCTURA";
            calculateBtn.style.backgroundColor = "var(--primary-purple)";
            return; // Detiene el cálculo para evitar diagramas erróneos
        }

        const F_reacciones = math.subtract(math.multiply(K_global_orig, U), F_global_orig);

        renderReactions(nodeIdx, F_reacciones);

        document.getElementById('reactions-section').style.display = 'block';
        document.getElementById('results-section').style.display = 'block';
        
        drawDiagrams(data, U);
        renderDetailedResults(data, K_global, F_global, U);

        // Guardar resultados globales para que la IA los pueda leer
        globalResults = {
            matriz_rigidez_global: K_global.toArray(),
            desplazamientos_nodales: U.toArray(),
            reacciones: F_reacciones.toArray()
        };

        hasCalculated = true; // Activar rastreador de cálculo
        calculateBtn.textContent = "CÁLCULO COMPLETADO";
        calculateBtn.style.backgroundColor = "#10b981"; 
        calculateBtn.style.opacity = "1";

    }, 500);
}

function renderReactions(nodeIdx, F_reacciones) {
    const tbody = document.getElementById('reactions-body');
    tbody.innerHTML = ''; 
    document.querySelectorAll('#supports-body tr').forEach(row => {
        const node = parseInt(row.querySelector('.support-node').value);
        if (node) {
            const idx = nodeIdx[node] * 3;
            let rx = F_reacciones.get([idx, 0]);
            let ry = F_reacciones.get([idx+1, 0]);
            let rm = F_reacciones.get([idx+2, 0]);
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight:bold; color:var(--primary-glow)">Nodo ${node}</td>
                    <td>${formatValue(rx)}</td>
                    <td>${formatValue(ry)}</td>
                    <td>${formatValue(rm)}</td>
                </tr>
            `;
        }
    });
}

function drawDiagrams(data, U) {
    const diagramas = [
        { id: 'axial-canvas', type: 'N', color: '#ef4444' },
        { id: 'cortante-canvas', type: 'V', color: '#0ea5e9' },
        { id: 'flector-canvas', type: 'M', color: '#10b981' },
        { id: 'deformada-canvas', type: 'D', color: '#f59e0b' }
    ];

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    data.nodes.forEach(n => {
        if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    });

    if (maxX === minX) { minX -= 5; maxX += 5; }
    if (maxY === minY) { minY -= 5; maxY += 5; }

    diagramas.forEach(diag => {
        const canvas = document.getElementById(diag.id);
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        
        const padding = 50; 
        const scaleX = (width - padding * 2) / (maxX - minX);
        const scaleY = (height - padding * 2) / (maxY - minY);
        const scale = Math.min(scaleX, scaleY); 

        const tx = (x) => padding + (x - minX) * scale + (width - padding * 2 - (maxX - minX) * scale) / 2;
        const ty = (y) => height - padding - (y - minY) * scale - (height - padding * 2 - (maxY - minY) * scale) / 2;

        // --- INICIO CÓDIGO NUEVO: DIBUJAR MARCAS DE NODOS Y COORDENADAS COMO REFERENCIA DE FONDO ---
        data.nodes.forEach(n => {
            const cx = tx(n.x);
            const cy = ty(n.y);
            
            // Dibujar punto central del nodo (pequeño y sutil)
            ctx.beginPath();
            ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#475569';
            ctx.fill();

            // Dibujar texto de referencia
            ctx.save();
            ctx.font = '10px Segoe UI';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            const text = `N${n.id}(${n.x}, ${n.y})`;
            const textWidth = ctx.measureText(text).width;
            
            // Fondo semitransparente oscuro para que no colapse visualmente con el diagrama
            ctx.fillStyle = 'rgba(10, 10, 12, 0.65)';
            ctx.fillRect(cx + 4, cy - 14, textWidth + 4, 14);
            
            // Color apagado para mantener jerarquía visual (es solo referencia, no dato principal)
            ctx.fillStyle = '#64748b'; 
            ctx.fillText(text, cx + 6, cy - 3);
            ctx.restore();
        });

        let maxAbsVal = 0;
        const barPlots = [];

        data.bars.forEach(bar => {
            const n1 = data.nodes.find(n => n.id === bar.start);
            const n2 = data.nodes.find(n => n.id === bar.end);
            
            const u_global = bar.dofs.map(idx => [U.get([idx, 0])]);
            const u_local = math.multiply(bar.T, u_global);

            let u1 = u_local[0][0]; let d1 = u_local[1][0]; let th1 = u_local[2][0];
            let u2 = u_local[3][0]; let d3 = u_local[4][0]; let th2 = u_local[5][0];

            const L = bar.L;
            const EI = bar.E * bar.I;
            const EA = bar.E * bar.A;
            const q1 = data.distLoads[bar.id] ? data.distLoads[bar.id].q1 : 0;
            const q2 = data.distLoads[bar.id] ? data.distLoads[bar.id].q2 : 0;

            // RECUPERACIÓN DE ROTACIÓN INTERNA DE LA BARRA (Para que el M(x)=0 encaje perfecto)
            // RECUPERACIÓN MATEMÁTICA EXACTA DE ROTACIÓN INTERNA DE LA BARRA
            if (bar.hingeStart || bar.hingeEnd) {
                const EI6_L2 = (6 * EI) / Math.pow(L, 2);
                const EI4_L = (4 * EI) / L;
                const EI2_L = (2 * EI) / L;
                
                // Coeficientes exactos de la matriz de rigidez local para rotaciones
                const k21 = EI6_L2, k22 = EI4_L, k24 = -EI6_L2, k25 = EI2_L;
                const k51 = EI6_L2, k52 = EI2_L, k54 = -EI6_L2, k55 = EI4_L;
                
                let f2 = 0, f5 = 0;
                if (data.distLoads[bar.id]) {
                    f2 = (q1*L*L/12) + ((q2-q1)*L*L/30);
                    f5 = -(q1*L*L/12) - ((q2-q1)*L*L/20);
                }

                if (bar.hingeStart && !bar.hingeEnd) {
                    // Rótula al inicio (M1 = 0)
                    th1 = (f2 - (k21*d1 + k24*d3 + k25*th2)) / k22;
                } else if (!bar.hingeStart && bar.hingeEnd) {
                    // Rótula al final (M2 = 0)
                    th2 = (f5 - (k51*d1 + k52*th1 + k54*d3)) / k55;
                } else if (bar.hingeStart && bar.hingeEnd) {
                    // Doble rótula (Sistema 2x2: M1 = 0 y M2 = 0)
                    const rhs1 = f2 - (k21*d1 + k24*d3);
                    const rhs2 = f5 - (k51*d1 + k54*d3);
                    const det = k22*k55 - k25*k52; 
                    th1 = (rhs1*k55 - rhs2*k25) / det;
                    th2 = (k22*rhs2 - k52*rhs1) / det;
                }
            }

            const c1 = (12 * EI / Math.pow(L, 3)) * (d1 - d3) + (6 * EI / Math.pow(L, 2)) * (th1 + th2) - (q1 * L / 2) - ((q2 - q1) * 3 * L / 20);
            const c2 = -(6 * EI / Math.pow(L, 2)) * (d1 - d3) - (4 * EI / L) * th1 - (2 * EI / L) * th2 + (q1 * Math.pow(L, 2) / 12) + ((q2 - q1) * Math.pow(L, 2) / 30);
            const N_const = (EA / L) * (u2 - u1);

            const pts = [];
            for (let i = 0; i <= 20; i++) {
                const x_local = (i / 20) * L;
                let val = 0;
                let u_val = 0; // NUEVO: Variable para la deformación axial local

                if (diag.type === 'N') val = N_const;
                if (diag.type === 'V') val = ((q2 - q1) / (2 * L)) * Math.pow(x_local, 2) + q1 * x_local + c1;
                if (diag.type === 'M') val = ((q2 - q1) / (6 * L)) * Math.pow(x_local, 3) + (q1 / 2) * Math.pow(x_local, 2) + c1 * x_local + c2;
                if (diag.type === 'D') {
                    // Deformación transversal v(x)
                    val = (1/EI) * ( ((q2-q1)/(120*L))*Math.pow(x_local,5) + (q1/24)*Math.pow(x_local,4) + (c1/6)*Math.pow(x_local,3) + (c2/2)*Math.pow(x_local,2) ) + th1*x_local + d1;
                    
                    // NUEVO: Deformación axial u(x) - Interpolación lineal
                    u_val = u1 + (x_local / L) * (u2 - u1);
                    
                    // Actualizamos maxAbsVal considerando el desplazamiento vectorial total
                    const totalDisp = Math.sqrt(Math.pow(val, 2) + Math.pow(u_val, 2));
                    if (totalDisp > maxAbsVal) maxAbsVal = totalDisp;
                } else {
                    if (Math.abs(val) > maxAbsVal) maxAbsVal = Math.abs(val);
                }

                pts.push({ x_local, val, u_val });
            }
            barPlots.push({ bar, n1, n2, pts });
        });

        // ====================================================
        // LÓGICA DE ESCALA EN NOTACIÓN CIENTÍFICA (SOLO DEFORMADA)
        // ====================================================
        let expD = 0;
        let factorD = 1;
        if (diag.type === 'D') {
            if (maxAbsVal > 0 && maxAbsVal < 0.1) {
                expD = Math.floor(Math.log10(maxAbsVal)); 
                factorD = Math.pow(10, -expD);
            }
            
            // Inyectar el subtítulo dinámico con el exponente
            const defCanvas = document.getElementById('deformada-canvas');
            if (defCanvas && defCanvas.previousElementSibling) {
                let textTitle = expD !== 0 ? `Deformada <span style="font-size: 0.85em; font-weight: normal; color: var(--primary-glow);">(x 10<sup>${expD}</sup> m)</span>` : `Deformada`;
                defCanvas.previousElementSibling.innerHTML = textTitle;
            }
        }

        const visualAmp = maxAbsVal === 0 ? 0 : 35 / maxAbsVal;

        barPlots.forEach(bp => {
            const { bar, n1, n2, pts } = bp;

            // 1. Calcular los puntos de renderizado primero
            let localMaxAbs = -1;
            let localMaxIdx = -1;

            const renderPoints = pts.map((pt, idx) => {
                if (Math.abs(pt.val) > localMaxAbs) {
                    localMaxAbs = Math.abs(pt.val);
                    localMaxIdx = idx;
                }

                // Coordenada original sin deformar
                const mX = n1.x + pt.x_local * Math.cos(bar.angRad);
                const mY = n1.y + pt.x_local * Math.sin(bar.angRad);
                const px = tx(mX);
                const py = ty(mY);

                let finalPx = px;
                let finalPy = py;

                if (diag.type === 'D') {
                    // Transformación de desplazamientos locales (u, v) a globales (X, Y)
                    const u_disp = pt.u_val * visualAmp;
                    const v_disp = pt.val * visualAmp;

                    const dispX = u_disp * Math.cos(bar.angRad) - v_disp * Math.sin(bar.angRad);
                    const dispY = u_disp * Math.sin(bar.angRad) + v_disp * Math.cos(bar.angRad);

                    finalPx = px + dispX;
                    finalPy = py - dispY;
                } else {
                    // Mantenemos la lógica perpendicular para Diagramas de N, V, M
                    let visualVal = pt.val;
                    if (diag.type === 'M') { visualVal = -pt.val; } 

                    const perpX = -visualVal * visualAmp * Math.sin(bar.angRad);
                    const perpY = visualVal * visualAmp * Math.cos(bar.angRad); 
                    
                    finalPx = px + perpX;
                    finalPy = py - perpY;
                }

                return { finalPx, finalPy, px, py, val: pt.val };
            });
            
            // 2. DIBUJAR EL DIAGRAMA (Sombreado y bordes, omitiendo la línea base)
            ctx.beginPath();
            ctx.fillStyle = diag.color + '40'; 

            if (diag.type === 'D') {
                // --- LÓGICA SOLO PARA LA DEFORMADA ---
                ctx.strokeStyle = diag.color;
                ctx.lineWidth = 2;
                ctx.moveTo(renderPoints[0].finalPx, renderPoints[0].finalPy);
                for (let i = 1; i < renderPoints.length; i++) {
                    ctx.lineTo(renderPoints[i].finalPx, renderPoints[i].finalPy);
                }
                ctx.stroke(); 
            } else {
                // --- LÓGICA PARA DIAGRAMAS M, V, N ---
                // a) Figura sombreada: path cerrado para aplicar el relleno (fill)
                ctx.moveTo(renderPoints[0].px, renderPoints[0].py);
                ctx.lineTo(renderPoints[0].finalPx, renderPoints[0].finalPy);
                for (let i = 1; i < renderPoints.length; i++) {
                    ctx.lineTo(renderPoints[i].finalPx, renderPoints[i].finalPy);
                }
                ctx.lineTo(renderPoints[renderPoints.length - 1].px, renderPoints[renderPoints.length - 1].py);
                ctx.closePath();
                ctx.fill(); 

                // b) Borde del diagrama: nuevo path para el contorno (stroke) SIN la línea base
                ctx.beginPath();
                ctx.strokeStyle = diag.color;
                ctx.lineWidth = 2;
                ctx.moveTo(renderPoints[0].px, renderPoints[0].py);
                ctx.lineTo(renderPoints[0].finalPx, renderPoints[0].finalPy);
                for (let i = 1; i < renderPoints.length; i++) {
                    ctx.lineTo(renderPoints[i].finalPx, renderPoints[i].finalPy);
                }
                ctx.lineTo(renderPoints[renderPoints.length - 1].px, renderPoints[renderPoints.length - 1].py);
                ctx.stroke(); 
            }

            // 3. DIBUJAR LA LÍNEA PUNTEADA (Al final para que resalte perfectamente)
            ctx.beginPath();
            ctx.strokeStyle = '#475569'; 
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]); 
            ctx.moveTo(tx(n1.x), ty(n1.y));
            ctx.lineTo(tx(n2.x), ty(n2.y));
            ctx.stroke();
            ctx.setLineDash([]); 

            // 4. ETIQUETAS Y TEXTOS
            ctx.save();
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const drawLabel = (rp) => {
                if(Math.abs(rp.val) < 1e-12) return;

                let dx = rp.finalPx - rp.px;
                let dy = rp.finalPy - rp.py;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                let txtPx = rp.finalPx;
                let txtPy = rp.finalPy;

                if (dist > 0.1) {
                    txtPx += (dx / dist) * 12; 
                    txtPy += (dy / dist) * 12;
                } else {
                    txtPx -= Math.sin(bar.angRad) * 12;
                    txtPy -= Math.cos(bar.angRad) * 12;
                }

                // Aplicar el factor de multiplicación solo al texto si es de deformación
                let textVal = rp.val;
                if (diag.type === 'D') { textVal = rp.val * factorD; }

                const text = formatValue(textVal); 
                const textWidth = ctx.measureText(text).width;
                
                ctx.fillStyle = 'rgba(10, 10, 12, 0.75)'; 
                ctx.fillRect(txtPx - textWidth/2 - 3, txtPy - 7, textWidth + 6, 14);

                ctx.fillStyle = '#ffffff'; 
                ctx.fillText(text, txtPx, txtPy);
            };

            drawLabel(renderPoints[0]);
            drawLabel(renderPoints[renderPoints.length - 1]);

            if (localMaxIdx > 3 && localMaxIdx < renderPoints.length - 4) {
                drawLabel(renderPoints[localMaxIdx]);
            }

            ctx.restore();
        });
    });
}

window.onload = () => {
    addNode();
    addNode();
    addSupport();
    addBar();
    document.querySelector('.input-panel').addEventListener('input', triggerRedraw);
    document.querySelector('.input-panel').addEventListener('change', triggerRedraw);
};

// ================= RESULTADOS MATRICIALES DETALLADOS =================
function toggleDetails() {
    const container = document.getElementById('detailed-results');
    const btn = document.getElementById('btn-toggle-details');
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.textContent = 'Ocultar resultados ▲';
    } else {
        container.style.display = 'none';
        btn.textContent = 'Mostrar más resultados ▼';
    }
}

function matrixToHTML(matrixArray) {
    let html = '<div class="matrix-wrapper"><div class="matrix-container"><table class="matrix-table">';
    for(let i=0; i<matrixArray.length; i++) {
        html += '<tr>';
        for(let j=0; j<matrixArray[i].length; j++) {
            let val = Number(matrixArray[i][j]);
            if (Math.abs(val) < 1e-12) val = 0; 
            let display = (Math.abs(val) > 1e6 || (Math.abs(val) > 0 && Math.abs(val) < 1e-4)) 
                ? val.toExponential(3).replace('.', ',') 
                : formatValue(val);
            html += `<td>${display}</td>`;
        }
        html += '</tr>';
    }
    html += '</table></div></div>';
    return html;
}

function formatPolyStr(terms) {
    let str = "";
    terms.forEach((t, i) => {
        if (Math.abs(t.coeff) < 1e-12) return;
        let sign = t.coeff >= 0 ? "+" : "-";
        let c = formatValue(Math.abs(t.coeff));
        let varStr = t.power === 0 ? "" : (t.power === 1 ? "x" : `x^${t.power}`);
        if (i === 0 && t.coeff >= 0) sign = ""; 
        str += ` ${sign} ${c}${varStr}`;
    });
    return str.trim() || "0";
}

function renderDetailedResults(data, K_global, F_global, U) {
    const container = document.getElementById('detailed-results');
    let html = '';

    html += '<h3>Operación del Sistema Global</h3>';
    html += '<p>El sistema se resuelve evaluando la ecuación matricial global <b>[K] · {U} = {F}</b>. A continuación se presentan las matrices ensambladas (aplicando penalización en los grados de libertad restringidos por apoyos).</p>';
    
    html += '<p><b>Matriz de Rigidez Global Ensamblada [K]</b></p>';
    html += matrixToHTML(K_global.toArray());

    html += '<p><b>Vector de Fuerzas Globales {F}</b></p>';
    html += matrixToHTML(F_global.toArray());

    html += '<p><b>Solución: Vector de Desplazamientos Nodales {U}</b></p>';
    html += matrixToHTML(U.toArray());

    html += '<h3>Resultados y Ecuaciones por Barra</h3>';
    data.bars.forEach(bar => {
        html += `<p style="color: var(--primary-purple); font-weight: bold; margin-top: 1.5rem;">--- Barra ${bar.id} ---</p>`;
        
        html += `<p><b>Matriz de Rigidez Elemental Global</b> (K = T^T · k_local · T):</p>`;
        html += matrixToHTML(bar.K_global_elem);

        html += `<p><b>Fuerzas Equivalentes Nodales</b> (Efecto de cargas distribuidas):</p>`;
        html += bar.F_equiv ? matrixToHTML(bar.F_equiv) : matrixToHTML([[0],[0],[0],[0],[0],[0]]);

        const L = bar.L;
        const EI = bar.E * bar.I;
        const EA = bar.E * bar.A;
        const q1 = data.distLoads[bar.id] ? data.distLoads[bar.id].q1 : 0;
        const q2 = data.distLoads[bar.id] ? data.distLoads[bar.id].q2 : 0;

        const u_global = bar.dofs.map(idx => [U.get([idx, 0])]);
        const u_local = math.multiply(bar.T, u_global);

        let u1 = u_local[0][0]; let d1 = u_local[1][0]; let th1 = u_local[2][0];
        let u2 = u_local[3][0]; let d3 = u_local[4][0]; let th2 = u_local[5][0];

        // RECUPERACIÓN MATEMÁTICA EXACTA DE ROTACIÓN INTERNA DE LA BARRA
        if (bar.hingeStart || bar.hingeEnd) {
            const EI6_L2 = (6 * EI) / Math.pow(L, 2);
            const EI4_L = (4 * EI) / L;
            const EI2_L = (2 * EI) / L;
            
            const k21 = EI6_L2, k22 = EI4_L, k24 = -EI6_L2, k25 = EI2_L;
            const k51 = EI6_L2, k52 = EI2_L, k54 = -EI6_L2, k55 = EI4_L;
            
            let f2 = 0, f5 = 0;
            if (data.distLoads[bar.id]) {
                f2 = (q1*L*L/12) + ((q2-q1)*L*L/30);
                f5 = -(q1*L*L/12) - ((q2-q1)*L*L/20);
            }

            if (bar.hingeStart && !bar.hingeEnd) {
                th1 = (f2 - (k21*d1 + k24*d3 + k25*th2)) / k22;
            } else if (!bar.hingeStart && bar.hingeEnd) {
                th2 = (f5 - (k51*d1 + k52*th1 + k54*d3)) / k55;
            } else if (bar.hingeStart && bar.hingeEnd) {
                const rhs1 = f2 - (k21*d1 + k24*d3);
                const rhs2 = f5 - (k51*d1 + k54*d3);
                const det = k22*k55 - k25*k52; 
                th1 = (rhs1*k55 - rhs2*k25) / det;
                th2 = (k22*rhs2 - k52*rhs1) / det;
            }
        }

        const c1 = (12 * EI / Math.pow(L, 3)) * (d1 - d3) + (6 * EI / Math.pow(L, 2)) * (th1 + th2) - (q1 * L / 2) - ((q2 - q1) * 3 * L / 20);
        const c2 = -(6 * EI / Math.pow(L, 2)) * (d1 - d3) - (4 * EI / L) * th1 - (2 * EI / L) * th2 + (q1 * Math.pow(L, 2) / 12) + ((q2 - q1) * Math.pow(L, 2) / 30);
        const N_const = (EA / L) * (u2 - u1);
        const slope_u = (u2 - u1) / L;
        
        let u_str = formatPolyStr([{coeff: slope_u, power: 1}, {coeff: u1, power: 0}]);
        let v_str = `(1/EI) * [ ${formatPolyStr([{coeff: (q2-q1)/(120*L), power: 5}, {coeff: q1/24, power: 4}, {coeff: c1/6, power: 3}, {coeff: c2/2, power: 2}])} ]`;
        
        if (Math.abs(th1) > 1e-12) v_str += ` ${th1 >= 0 ? '+' : '-'} ${formatValue(Math.abs(th1))}x`;
        if (Math.abs(d1) > 1e-12) v_str += ` ${d1 >= 0 ? '+' : '-'} ${formatValue(Math.abs(d1))}`;

        // SOLUCIÓN AL DUPLICADO: Un solo bloque de caja consolidado
        html += `<p><b>Ecuaciones paramétricas (Fuerzas y Deformaciones)</b> (donde 'x' ∈ [0, ${formatValue(L)}] m):</p>`;
        html += `<div class="equation-box">`;
        html += `<span><b>N(x) =</b> ${formatPolyStr([{coeff: N_const, power: 0}])} N</span>`;
        html += `<span><b>V(x) =</b> ${formatPolyStr([{coeff: (q2-q1)/(2*L), power: 2}, {coeff: q1, power: 1}, {coeff: c1, power: 0}])} N</span>`;
        html += `<span><b>M(x) =</b> ${formatPolyStr([{coeff: (q2-q1)/(6*L), power: 3}, {coeff: q1/2, power: 2}, {coeff: c1, power: 1}, {coeff: c2, power: 0}])} N·m</span>`;
        html += `<span style="color: var(--primary-glow);"><b>u(x) [Axial] =</b> ${u_str} m</span>`;
        html += `<span style="color: var(--primary-glow);"><b>v(x) [Flexión] =</b> ${v_str} m</span>`;
        html += `</div>`;
    });

    container.innerHTML = html;
}



// ================= IMPORTACIÓN AUTOMÁTICA (COMPATIBLE CON JSON Y TXT) =================

function parseTxtConfig(rawText) {
    let trimmed = rawText.trim();
    if (trimmed.startsWith('```json')) trimmed = trimmed.substring(7);
    if (trimmed.startsWith('```')) trimmed = trimmed.substring(3);
    if (trimmed.endsWith('```')) trimmed = trimmed.substring(0, trimmed.length - 3);
    trimmed = trimmed.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            return JSON.parse(trimmed);
        } catch (e) {}
    }

    const data = {
        nodos: [],
        apoyos: [],
        barras: [],
        propiedades: [],
        cargas_distribuidas: [],
        fuerzas_puntuales: [],
        momentos: []
    };

    let currentSection = '';
    const lines = trimmed.split('\n');

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('[') && line.endsWith(']')) {
            currentSection = line.substring(1, line.length - 1).toUpperCase();
            continue;
        }

        const parts = line.split(',').map(p => p.trim());

        if (currentSection === 'NODOS' && parts.length >= 2) {
            data.nodos.push({ x: parseFloat(parts[0]) || 0, y: parseFloat(parts[1]) || 0 });
        } else if (currentSection === 'APOYOS' && parts.length >= 5) {
            data.apoyos.push({
                nodo: parseInt(parts[0]) || 1,
                tipo: parts[1],
                rx: parts[2] === 'true' || parts[2] === 'on',
                ry: parts[3] === 'true' || parts[3] === 'on',
                rg: parts[4] === 'true' || parts[4] === 'on'
            });
        } else if (currentSection === 'BARRAS') {
            if (parts.length >= 7) {
                // Nuevo formato con rótulas
                data.barras.push({
                    start: parseInt(parts[0]) || 1,
                    end: parseInt(parts[1]) || 1,
                    hingeStart: parts[2] === 'true',
                    hingeEnd: parts[3] === 'true'
                });
                data.propiedades.push({
                    A: parts[4],
                    I: parts[5],
                    E: parts[6]
                });
            } else if (parts.length >= 5) {
                // Formato antiguo (sin rótulas)
                data.barras.push({
                    start: parseInt(parts[0]) || 1,
                    end: parseInt(parts[1]) || 1,
                    hingeStart: false,
                    hingeEnd: false
                });
                data.propiedades.push({
                    A: parts[2],
                    I: parts[3],
                    E: parts[4]
                });
            }
        } else if (currentSection === 'CARGAS_DISTRIBUIDAS' && parts.length >= 3) {
            data.cargas_distribuidas.push({
                barra: parts[0],
                q1: parseFloat(parts[1]) || 0,
                q2: parseFloat(parts[2]) || 0
            });
        } else if (currentSection === 'FUERZAS_PUNTUALES' && parts.length >= 3) {
            data.fuerzas_puntuales.push({
                nodo: parseInt(parts[0]) || 1,
                mag: parseFloat(parts[1]) || 0,
                ang: parseFloat(parts[2]) || 0
            });
        } else if (currentSection === 'MOMENTOS' && parts.length >= 2) {
            data.momentos.push({
                nodo: parseInt(parts[0]) || 1,
                mag: parseFloat(parts[1]) || 0
            });
        }
    }

    return data;
}

function importDataFromTXT(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const rawText = e.target.result;
            const data = parseTxtConfig(rawText);
            populateImportedData(data);
            alert("¡Datos del pórtico escaneados y cargados exitosamente!");
        } catch (error) {
            alert("Error al escanear el archivo. Asegúrate de que la estructura sea correcta.");
            console.error("Detalle del error:", error);
        }
        event.target.value = ""; // Limpiar input
    };
    reader.readAsText(file);
}

function populateImportedData(data) {
    const uniformToggle = document.getElementById('uniform-toggle');
    if (uniformToggle) {
        uniformToggle.checked = false;
        toggleUniformProps();
    }

    document.getElementById('nodes-body').innerHTML = '';
    document.getElementById('supports-body').innerHTML = '';
    document.getElementById('bars-body').innerHTML = '';
    document.getElementById('props-body').innerHTML = '';
    document.getElementById('dist-loads-body').innerHTML = '';
    document.getElementById('point-loads-body').innerHTML = '';
    document.getElementById('moments-body').innerHTML = '';

    (data.nodos || []).forEach(n => {
        addNode();
        const rows = document.querySelectorAll('#nodes-body tr');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.node-x').value = n.x;
        lastRow.querySelector('.node-y').value = n.y;
    });

    updateNodeDropdowns();

    (data.apoyos || []).forEach(s => {
        addSupport();
        const rows = document.querySelectorAll('#supports-body tr');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.support-node').value = s.nodo;
        lastRow.querySelector('.support-type').value = s.tipo;
        handleSupportType(lastRow.querySelector('.support-type'));
        
        if (s.tipo === 'personalizado') {
            lastRow.querySelector('.chk-x').checked = s.rx !== false;
            lastRow.querySelector('.chk-y').checked = s.ry !== false;
            lastRow.querySelector('.chk-g').checked = s.rg !== false;
        }
    });

    (data.barras || []).forEach((b, index) => {
        addBar();
        const barRows = document.querySelectorAll('#bars-body tr');
        const propRows = document.querySelectorAll('#props-body tr');
        
        const lastBarRow = barRows[barRows.length - 1];
        lastBarRow.querySelector('.start-node').value = b.start;
        lastBarRow.querySelector('.end-node').value = b.end;

        // ASIGNAR ESTADO DE RÓTULAS EN CADA BARRA
        lastBarRow.querySelector('.hinge-start').checked = (b.hingeStart === true || b.hingeStart === 'true');
        lastBarRow.querySelector('.hinge-end').checked = (b.hingeEnd === true || b.hingeEnd === 'true');

        if (data.propiedades && data.propiedades[index]) {
            const p = data.propiedades[index];
            const lastPropRow = propRows[propRows.length - 1];
            lastPropRow.querySelector('.prop-a').value = p.A !== undefined ? p.A : "0.01";
            lastPropRow.querySelector('.prop-i').value = p.I !== undefined ? p.I : "0.0001";
            lastPropRow.querySelector('.prop-e').value = p.E !== undefined ? p.E : "200000";
        }
    });

    updateBarDropdowns();

    (data.cargas_distribuidas || []).forEach(c => {
        addDistLoad();
        const rows = document.querySelectorAll('#dist-loads-body tr');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.dist-bar').value = c.barra;
        lastRow.querySelector('.dist-q1').value = c.q1;
        lastRow.querySelector('.dist-q2').value = c.q2;
    });

    (data.fuerzas_puntuales || []).forEach(f => {
        addPointLoad();
        const rows = document.querySelectorAll('#point-loads-body tr');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.pt-node').value = f.nodo;
        lastRow.querySelector('.pt-mag').value = f.mag;
        lastRow.querySelector('.pt-ang').value = f.ang;
    });

    (data.momentos || []).forEach(m => {
        addMoment();
        const rows = document.querySelectorAll('#moments-body tr');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.mom-node').value = m.nodo;
        lastRow.querySelector('.mom-mag').value = m.mag;
    });

    document.querySelectorAll('.prop-a, .prop-i, .prop-e').forEach(inp => {
        if (inp.value) handleMathInput(inp);
    });
    
    triggerRedraw();
}

// ================= FUNCIÓN PARA COPIAR EL PROMPT =================
function copyPrompt() {
    const promptText = document.getElementById('ia-prompt-text').innerText;
    const copyBtn = document.getElementById('btn-copy-prompt');

    // Usamos el API del portapapeles (Clipboard API)
    navigator.clipboard.writeText(promptText).then(() => {
        // Feedback visual: Cambiamos el botón a verde temporalmente
        const originalText = copyBtn.innerHTML;
        const originalBg = copyBtn.style.background;
        
        copyBtn.innerHTML = "✅ ¡Copiado!";
        copyBtn.style.background = "#28a745"; // Color verde éxito

        // Regresar el botón a su estado normal después de 2 segundos
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = originalBg;
        }, 2000);
    }).catch(err => {
        console.error('Error al intentar copiar al portapapeles: ', err);
        alert('Hubo un problema al copiar el texto. Puedes seleccionarlo y copiarlo manualmente.');
    });
}

function exportDataToTXT() {
    let content = "";

    function addSection(title, rows, fields) {
        content += `[${title}]\n`;
        rows.forEach(row => {
            const data = fields.map(f => {
                const el = row.querySelector(f);
                if (!el) return "";
                if (el.type === 'checkbox') {
                    return el.checked ? "true" : "false";
                }
                return el.value !== undefined ? el.value : "";
            });
            content += data.join(",") + "\n";
        });
        content += "\n";
    }

    // 1. Nodos
    addSection("NODOS", document.querySelectorAll('#nodes-body tr'), ['.node-x', '.node-y']);
    
    // 2. Apoyos
    addSection("APOYOS", document.querySelectorAll('#supports-body tr'), ['.support-node', '.support-type', '.chk-x', '.chk-y', '.chk-g']);
    
    // 3. Barras y Propiedades (Incluye rótulas inicio y fin)
    content += "[BARRAS]\n";
    const barRows = document.querySelectorAll('#bars-body tr');
    const propRows = document.querySelectorAll('#props-body tr');
    barRows.forEach((row, i) => {
        const start = row.querySelector('.start-node').value;
        const end = row.querySelector('.end-node').value;
        const hingeStart = row.querySelector('.hinge-start').checked ? "true" : "false";
        const hingeEnd = row.querySelector('.hinge-end').checked ? "true" : "false";
        const propA = propRows[i]?.querySelector('.prop-a').value || "0";
        const propI = propRows[i]?.querySelector('.prop-i').value || "0";
        const propE = propRows[i]?.querySelector('.prop-e').value || "0";
        content += `${start},${end},${hingeStart},${hingeEnd},${propA},${propI},${propE}\n`;
    });
    content += "\n";

    // 4. Cargas
    addSection("CARGAS_DISTRIBUIDAS", document.querySelectorAll('#dist-loads-body tr'), ['.dist-bar', '.dist-q1', '.dist-q2']);
    addSection("FUERZAS_PUNTUALES", document.querySelectorAll('#point-loads-body tr'), ['.pt-node', '.pt-mag', '.pt-ang']);
    addSection("MOMENTOS", document.querySelectorAll('#moments-body tr'), ['.mom-node', '.mom-mag']);

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'configuracion_portico.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

