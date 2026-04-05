

document.getElementById('FormularioEsfuerzo').addEventListener('submit', function(e) {
    e.preventDefault();
    const sigma_x = parseFloat(document.getElementById("Ex").value);
    const sigma_y = parseFloat(document.getElementById("Ey").value);
    const tau_xy = parseFloat(document.getElementById("Txy").value);
    let theta = parseFloat(document.getElementById("Theta").value);
    const TipoAngulo = document.getElementById("TipoAngulo").value;
    
    if ([sigma_x, sigma_y, tau_xy, theta].some(isNaN)) {
        return alert("Por favor, completa todos los campos con números válidos.");
    }
    
    if (TipoAngulo === "Sexagesimal") { // Debe ser igual al 'value' del HTML
        theta = theta * (Math.PI / 180);
    }

    
    //Esfuerzos respecto a theta
    const sigma_x_ = (sigma_x + sigma_y)/2 + (sigma_x - sigma_y)/2 * Math.cos(2*theta) + tau_xy * Math.sin(2*theta);
    const sigma_y_ = (sigma_x + sigma_y)/2 - (sigma_x - sigma_y)/2 * Math.cos(2*theta) - tau_xy * Math.sin(2*theta);
    const tau_xy_ = -(sigma_x - sigma_y)/2 * Math.sin(2*theta) + tau_xy * Math.cos(2*theta);
    //Esfuerzos principales
    const theta_p = 0.5 * Math.atan(tau_xy/((sigma_x - sigma_y) / 2));
    const sigma_1 = (sigma_x + sigma_y) / 2 + Math.sqrt(Math.pow((sigma_x - sigma_y) / 2, 2) + Math.pow(tau_xy, 2));
    const sigma_2 = (sigma_x + sigma_y) / 2 - Math.sqrt(Math.pow((sigma_x - sigma_y) / 2, 2) + Math.pow(tau_xy, 2));
    
    //Esfuerzo cortante maximo
    const theta_s = 0.5 * Math.atan((-(sigma_x - sigma_y) / 2) / tau_xy);
    const sigma_prom = (sigma_x + sigma_y)/2;
    const tau_max = Math.sqrt(Math.pow((sigma_x - sigma_y) / 2, 2) + Math.pow(tau_xy, 2));

    //RESULTADOS
        //Esfuerzos respecto a theta
    document.getElementById("Exp").innerHTML = `$\\sigma_{x'} = ${sigma_x_.toFixed(4)}$`;
    document.getElementById("Eyp").innerHTML = `$\\sigma_{y'} = ${sigma_y_.toFixed(4)}$`;
    document.getElementById("Txyp").innerHTML = `$\\tau_{xy'} = ${tau_xy_.toFixed(4)}$`;
        //Esfuerzo principales
    document.getElementById("Exm").innerHTML = `$\\sigma_{1} = ${sigma_1.toFixed(4)}$`;
    document.getElementById("Eym").innerHTML = `$\\sigma_{2} = ${sigma_2.toFixed(4)}$`;
    document.getElementById("ThetaP").innerHTML = `$\\theta_{p} = ${theta_p.toFixed(4)}rad$`;
        //Esfuerzo cortante maximo
    document.getElementById("Tmax").innerHTML = `$\\tau_{xy_{máx}} = ${tau_max.toFixed(4)}$`;
    document.getElementById("Eprom").innerHTML = `$\\sigma_{prom} = ${sigma_prom.toFixed(4)}$`;
    document.getElementById("ThetaS").innerHTML = `$\\theta_{s} = ${theta_s.toFixed(4)}$`;
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
});
