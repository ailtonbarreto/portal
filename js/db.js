window.addEventListener("DOMContentLoaded", async function () {
    let user = sessionStorage.getItem("currentUser");
    let name = sessionStorage.getItem("name");
    let imagem = sessionStorage.getItem("img");

    if (user) {
        document.getElementById("nome").innerHTML = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();
        document.getElementById("photo").src = imagem;
    }

    async function getApiUrlFromBase() {
        try {
            const response = await fetch('./js/base.json');
            if (!response.ok) throw new Error(`Erro ao carregar base.json: ${response.statusText}`);

            const data = await response.json();
            if (!data.url) throw new Error("URL da API não encontrada em base.json.");

            return data.url;
        } catch (error) {
            console.error("Erro ao obter URL da API:", error);
            return null;
        }
    }

    async function fetchDataAndStore() {
        try {
            const apiUrl = await getApiUrlFromBase();
            if (!apiUrl) return;

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Erro ao carregar JSON do endpoint: ${response.statusText}`);

            const data = await response.json();
            localStorage.setItem('database', JSON.stringify(data));
            montarGraficoComFiltro();
        } catch (error) {
            console.error("Erro ao obter dados do endpoint:", error);
        }
    }

    function calcularIndicadores(dadosFiltrados) {
        const totalVendido = dadosFiltrados.reduce((acc, item) => acc + (item.QTD * item.VR_UNIT), 0).toFixed(2);
        const totalPedidos = dadosFiltrados.length;
        const totalClientes = new Set(dadosFiltrados.map(item => item.CLIENTE)).size;
        const ticketMedio = (totalVendido / totalPedidos).toFixed(2);

        document.getElementById('valor_vendido').innerHTML = `R$ ${parseFloat(totalVendido).toLocaleString('pt-BR')}`;
        document.getElementById('qtd_pedidos').innerHTML = totalPedidos;
        document.getElementById('qtd_clientes').innerHTML = totalClientes;
        document.getElementById('ticket_medio').innerHTML = `R$ ${parseFloat(ticketMedio).toLocaleString('pt-BR')}`;
    }

    function montarGraficoComFiltro() {
        const dataFromLocalStorage = JSON.parse(localStorage.getItem('database'));
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
    
        // Criar gráfico de pizza de status dos pedidos
        criarGraficoPizzaDeStatus('pizza-chart', dadosFiltrados);
    
        // Criar gráfico de dispersão por cliente
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

        window[idCanvas] = new Chart(context, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: labelDataset,
                    data: valores,
                    borderColor: '#0DB8E8',
                    backgroundColor: '#0e1218',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: { color: 'white' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: 'white' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: context => `Quantidade: ${context.raw}`
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
                    borderColor: '#0DB8E8',
                    backgroundColor: 'rgba(13, 184, 232, 0.2)',
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { grid: { display: false }, ticks: { color: 'white' } },
                    y: { grid: { display: false }, ticks: { color: 'white' } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: context => `Valor: ${context.raw}`
                        }
                    }
                }
            }
        });
    }

    // Função para contar os status dos pedidos
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
    
    function criarGraficoPizzaDeStatus(idCanvas, dadosFiltrados) {
        const statusCount = contarStatus(dadosFiltrados);
        const labels = Object.keys(statusCount);
        const valores = Object.values(statusCount);
    
        const ctx = document.getElementById('pizza-chart');
    
        if (!ctx) {
            console.error(`Canvas ${idCanvas} não encontrado!`);
            return;
        }
    
        const context = ctx.getContext('2d');
    
        if (window[idCanvas] instanceof Chart) {
            window[idCanvas].destroy();
        }
    
        window[idCanvas] = new Chart(context, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: valores,
                    backgroundColor: ['#00FF1E', '#DD1111', '#11CFDD', '#FF5733', '#8E44AD'],
                    border: 'none',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, // Responsivo
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
                            boxWidth: 20, // Ajusta o tamanho da caixa de legenda
                            padding: 10 // Ajusta o espaçamento entre as legendas
                        }
                    }
                }
            }
        });
    }
    

    function criarGraficoDispersaoPorCliente(idCanvas, dadosFiltrados, tipoAnalise) {
        const getMetric = item => tipoAnalise === "quantidade" ? item.QTD : item.QTD * item.VR_UNIT;
    
        // Preparando os dados para o gráfico de dispersão
        const clientes = [...new Set(dadosFiltrados.map(item => item.CLIENTE))];
        const vendasPorCliente = clientes.map(cliente => {
            const vendasCliente = dadosFiltrados.filter(item => item.CLIENTE === cliente);
            const totalVendas = vendasCliente.reduce((acc, item) => acc + getMetric(item), 0);
            return {
                cliente,
                totalVendas
            };
        });
    
        const labels = vendasPorCliente.map(item => item.cliente);
        const valores = vendasPorCliente.map(item => item.totalVendas);
    
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
            type: 'scatter',
            data: {
                labels: labels,
                datasets: [{
                    label: `Vendas por Cliente (${tipoAnalise})`,
                    data: valores.map((valor, index) => ({
                        x: index + 1,
                        y: valor
                    })),
                    backgroundColor: '#0DB8E8',
                    borderColor: '#0DB8E8',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { grid: { display: false }, ticks: { color: 'white' } },
                    y: { grid: { display: false }, ticks: { color: 'white' } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: (context) => {
                                const index = context.dataIndex;
                                const cliente = labels[index];
                                const totalVendas = valores[index];
                                return `${cliente}: R$ ${totalVendas.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    

    // Inicia a busca e armazenamento dos dados
    await fetchDataAndStore();

    // Adiciona os eventos de filtro
    document.getElementById('filtro_mes').addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_ano').addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_tipo').addEventListener('change', montarGraficoComFiltro);
});
