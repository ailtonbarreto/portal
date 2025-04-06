window.addEventListener("DOMContentLoaded", async function () {
    let user = sessionStorage.getItem("currentUser");
    let name = sessionStorage.getItem("name");
    let imagem = sessionStorage.getItem("img");

    if (user) {
        document.getElementById("nome").innerHTML = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();
        document.getElementById("photo").src = imagem;
    }

    
    async function fetchDataAndStore() {
        document.getElementById('spinner').style.display = 'flex';
        // document.getElementById('body').style.display = 'none';


        try {
            const storedData = sessionStorage.getItem('database');

            if (storedData) {
                montarGraficoComFiltro();
                return;
            }

            const apiUrl = `https://barretoapps.com.br/array/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Erro ao carregar JSON do endpoint: ${response.statusText}`);

            const data = await response.json();

            sessionStorage.setItem('database', JSON.stringify(data));
            montarGraficoComFiltro();
        } catch (error) {
            console.error("Erro ao obter dados do endpoint:", error);
        } finally {
            document.getElementById('spinner').style.display = 'none';
            // document.getElementById('body').style.display = 'block';
        }
    }
    
    

    function calcularIndicadores(dadosFiltrados) {
        
        const totalVendido = dadosFiltrados.reduce((acc, item) => acc + (item.QTD * item.VR_UNIT), 0).toFixed(2);
    
        const pedidosUnicos = new Set(dadosFiltrados.map(item => item.PEDIDO));
        const totalPedidos = pedidosUnicos.size;
       
        const totalClientes = new Set(dadosFiltrados.map(item => item.CLIENTE)).size;
      
        const ticketMedio = (totalVendido / totalPedidos).toFixed(2);
    
        document.getElementById('valor_vendido').innerHTML = `R$ ${parseFloat(totalVendido).toLocaleString('pt-BR')}`;
        document.getElementById('qtd_pedidos').innerHTML = totalPedidos;
        document.getElementById('qtd_clientes').innerHTML = totalClientes;
        document.getElementById('ticket_medio').innerHTML = `R$ ${parseFloat(ticketMedio).toLocaleString('pt-BR')}`;
    }
    

    function montarGraficoComFiltro() {
        const dataFromLocalStorage = JSON.parse(sessionStorage.getItem('database'));
        if (!dataFromLocalStorage || !Array.isArray(dataFromLocalStorage)) return;
    
        const anoSelecionado = parseInt(document.getElementById('filtro_ano').value, 10);
        const mesSelecionado = parseInt(document.getElementById('filtro_mes').value, 10);
        const tipoAnalise = document.getElementById('filtro_tipo').value;
    
        const dadosFiltrados = dataFromLocalStorage.filter(item =>
            parseInt(item.mes, 10) === mesSelecionado &&
            parseInt(item.ano, 10) === anoSelecionado &&
            item.REP === name
        );
    
        calcularIndicadores(dadosFiltrados);
        atualizarGraficos(dadosFiltrados, tipoAnalise);
    
       
        criarGraficoPizzaDeStatus('pizza-chart', dadosFiltrados);
    
        criarGraficoDispersaoPorCliente('scatter-chart', dadosFiltrados, tipoAnalise);
    }
    

    function atualizarGraficos(dadosFiltrados, tipoAnalise) {
        const getMetric = item => tipoAnalise === "quantidade" ? item.QTD : item.QTD * item.VR_UNIT;

        const categoriaMap = dadosFiltrados.reduce((acc, item) => {
            acc[item.CATEGORIA] = (acc[item.CATEGORIA] || 0) + getMetric(item);
            return acc;
        }, {});

        const sortedData = Object.entries(categoriaMap)
            .map(([categoria, soma]) => ({ categoria, soma }))
            .sort((a, b) => b.soma - a.soma);

        const categoriasOrdenadas = sortedData.map(item => item.categoria);
        const valoresOrdenados = sortedData.map(item => item.soma);

        criarGraficoBarras('barchart', categoriasOrdenadas, valoresOrdenados, tipoAnalise);
        criarGraficoLinha('line-chart', dadosFiltrados, tipoAnalise);
    }

    function criarGraficoBarras(idCanvas, labels, valores, labelDataset) {
        const ctx = document.getElementById(idCanvas);

        if (!ctx) {
            console.error(`Canvas ${idCanvas} não encontrado!`);
            return;
        }

        const context = ctx.getContext('2d');

        if (window[idCanvas] instanceof Chart) {
            window[idCanvas].destroy();
        }

        const cores = ['#1EC1B4', '#33F1FF', '#33C2FF', '#C469D7'];

        window[idCanvas] = new Chart(context, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: labelDataset,
                    data: valores,
                    borderColor: 'transparent',
                    // backgroundColor: valores.map((_, i) => cores[i % cores.length]),
                    backgroundColor: '#0F8F8F',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        display: false,
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: { color: '#0F8F8F' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#0F8F8F' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: context => {
                                let value = context.raw;
                                let tipoAnalise = document.getElementById('filtro_tipo').value;
                                
                                if (tipoAnalise === "valor") {
                                    return `Valor: R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                } else {
                                    return `Quantidade: ${value}`;
                                }
                            }
                        }
                    }
                }
            }
            
        });
    }

    function criarGraficoLinha(idCanvas, dadosFiltrados, tipoAnalise) {
        const getMetric = item => tipoAnalise === "quantidade" ? item.QTD : item.QTD * item.VR_UNIT;

        const vendasPorDia = dadosFiltrados.reduce((acc, item) => {
            acc[item.dia] = (acc[item.dia] || 0) + getMetric(item);
            return acc;
        }, {});

        const diasOrdenados = Object.keys(vendasPorDia).sort();
        const valoresOrdenados = diasOrdenados.map(dia => vendasPorDia[dia]);

        const ctx = document.getElementById(idCanvas);

        if (!ctx) {
            console.error(`Canvas ${idCanvas} não encontrado!`);
            return;
        }

        const context = ctx.getContext('2d');

        if (window[idCanvas] instanceof Chart) {
            window[idCanvas].destroy();
        }

        window[idCanvas] = new Chart(context, {
            type: 'line',
            data: {
                labels: diasOrdenados,
                datasets: [{
                    label: `Vendas por Dia (${tipoAnalise})`,
                    data: valoresOrdenados,
                    borderColor: '#0F8F8F',
                    backgroundColor: '#0DEDC8',
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#0F8F8F' } },
                    y: { display: false },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: context => {
                                let value = context.raw;
                                let tipoAnalise = document.getElementById('filtro_tipo').value;
                                
                                if (tipoAnalise === "valor") {
                                    return `Valor: R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                } else {
                                    return `Quantidade: ${value}`;
                                }
                            }
                        }
                    }
                }
            }
            
        });
    }

    function contarStatus(dadosFiltrados) {
        const statusCount = {};
        const pedidosContados = new Set();
    
        dadosFiltrados.forEach(pedido => {
            const status = pedido.STATUS;
            const pedidoId = pedido.PEDIDO;
    
            if (pedidosContados.has(pedidoId)) {
                return;
            }
    
            if (statusCount[status]) {
                statusCount[status] += 1;
            } else {
                statusCount[status] = 1;
            }
    
            pedidosContados.add(pedidoId);
        });
    
        return statusCount;
    }

    const coresPorStatus = {
        "AGUARDANDO APROVAÇÃO": "#EEFF6C",
        "AGUARDANDO PAGAMENTO": "#0B81AC",
        "PLANEJADO": "#C063CE",
        "CANCELADO": "#F56C6F",
        "CONCLUIDO": "#46E0A3",
    };
    
    function criarGraficoPizzaDeStatus(idCanvas, dadosFiltrados) {
        const statusCount = contarStatus(dadosFiltrados);
        const labels = Object.keys(statusCount);
        const valores = Object.values(statusCount);
    
        const cores = labels.map(status => coresPorStatus[status] || "#CCCCCC");
    
        const ctx = document.getElementById(idCanvas);
    
        if (!ctx) {
            console.error(`Canvas ${idCanvas} não encontrado!`);
            return;
        }
    
        const context = ctx.getContext('2d');
    
        if (window[idCanvas] instanceof Chart) {
            window[idCanvas].destroy();
        }
    
        window[idCanvas] = new Chart(context, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: valores,
                    backgroundColor: cores,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw} pedidos`;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 20,
                            padding: 10,
                            color: '#0F8F8F'
                        }
                    }
                }
            }
        });
    }
    
    function criarGraficoDispersaoPorCliente(idCanvas, dadosFiltrados, tipoAnalise) {
        const getMetric = item => tipoAnalise === "quantidade" ? item.QTD : item.QTD * item.VR_UNIT;
    
        const clientes = [...new Set(dadosFiltrados.map(item => item.CLIENTE))];
        const vendasPorCliente = clientes.map(cliente => {
            const vendasCliente = dadosFiltrados.filter(item => item.CLIENTE === cliente);
            const totalVendas = vendasCliente.reduce((acc, item) => acc + getMetric(item), 0);
            return {
                cliente,
                totalVendas
            };
        });
    
        const ctx = document.getElementById(idCanvas);
    
        if (!ctx) {
            console.error(`Canvas ${idCanvas} não encontrado!`);
            return;
        }
    
        const context = ctx.getContext('2d');
    
        if (window[idCanvas] instanceof Chart) {
            window[idCanvas].destroy();
        }
    
        window[idCanvas] = new Chart(context, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: `Vendas por Cliente (${tipoAnalise})`,
                    data: vendasPorCliente.map((item, index) => ({
                        x: index + 1,
                        y: item.totalVendas,
                        r: Math.sqrt(item.totalVendas) * (tipoAnalise === "quantidade" ? 2.5 : 0.3)
                    })),
                    backgroundColor: vendasPorCliente.map(() => 
                        `hsl(${Math.random() * 360}, 70%, 60%)`
                    ),
                    borderColor: 'transparent',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        display: false,
                        grid: { display: false }, 
                        ticks: { color: 'white' },
                        title: { display: true, text: 'Clientes', color: 'white' }
                    },
                    y: { 
                        grid: { display: false }, 
                        ticks: { display: false },
                        title: { display: false, text: 'Total de Vendas', color: 'white' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: (context) => {
                                const index = context.dataIndex;
                                const cliente = vendasPorCliente[index].cliente;
                                const totalVendas = vendasPorCliente[index].totalVendas;
                                let tipoAnalise = document.getElementById('filtro_tipo').value;
    
                                if (tipoAnalise === "valor") {
                                    return `${cliente}: R$ ${totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                } else {
                                    return `${cliente}: ${totalVendas}`;
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    
    
    await fetchDataAndStore();

    document.getElementById('filtro_mes').addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_ano').addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_tipo').addEventListener('change', montarGraficoComFiltro);
});

document.addEventListener("DOMContentLoaded", function () {
    const filtroMes = document.getElementById("filtro_mes");
    const filtroAno = document.getElementById("filtro_ano");

    const mesAtual = String(new Date().getMonth() + 1).padStart(2, "0");
    const anoAtual = String(new Date().getFullYear());

    filtroMes.value = mesAtual;
    filtroAno.value = anoAtual;
});
