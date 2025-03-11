window.addEventListener("DOMContentLoaded", function () {


    let user = sessionStorage.getItem("currentUser");
    let name = sessionStorage.getItem("name");


    if (user) {
        document.getElementById("nome").innerHTML = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();
    }

    async function getApiUrlFromBase() {
        try {
            console.log("Carregando base.json...");
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
            if (!data || typeof data !== "object") throw new Error("Dados inválidos ou vazios.");

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
        if (!dataFromLocalStorage || !Array.isArray(dataFromLocalStorage)) {
            console.error("Nenhum dado encontrado no localStorage ou os dados não estão no formato esperado!");
            return;
        }

        const anoSelecionado = parseInt(document.getElementById('filtro_ano').value, 10);
        const mesSelecionado = parseInt(document.getElementById('filtro_mes').value, 10);

        const dadosFiltrados = dataFromLocalStorage.filter(item => {
            const mesDoItem = parseInt(item.mes, 10);
            const anoDoItem = parseInt(item.ano, 10);
            return mesDoItem === mesSelecionado && anoDoItem === anoSelecionado && item.REP === name;
        });

    
        calcularIndicadores(dadosFiltrados);

    
        const categoriaMap = dadosFiltrados.reduce((acc, item) => {
            acc[item.CATEGORIA] = (acc[item.CATEGORIA] || 0) + item.QTD;
            return acc;
        }, {});

        const sortedData = Object.entries(categoriaMap)
            .map(([categoria, soma]) => ({ categoria, soma }))
            .sort((a, b) => b.soma - a.soma);

        const categoriasOrdenadas = sortedData.map(item => item.categoria);
        const somasOrdenadas = sortedData.map(item => item.soma);

        const ctxBarras = document.getElementById('barchart');
        if (ctxBarras) {
            const contextBarras = ctxBarras.getContext('2d');
            if (window.myChartBarras) window.myChartBarras.destroy();

            window.myChartBarras = new Chart(contextBarras, {
                type: 'bar',
                data: {
                    labels: categoriasOrdenadas,
                    datasets: [{
                        label: "Quantidade",
                        data: somasOrdenadas,
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
        } else {
            console.error("Canvas para o gráfico de barras não encontrado!");
        }

        // GRAFICO DE LINHA
        const vendasPorDia = dadosFiltrados.reduce((acc, item) => {
            acc[item.dia] = (acc[item.dia] || 0) + item.QTD;
            return acc;
        }, {});

        const dias = Object.keys(vendasPorDia).sort();
        const vendas = dias.map(dia => vendasPorDia[dia]);

        const ctxLinha = document.getElementById('line-chart');
        if (ctxLinha) {
            const contextLinha = ctxLinha.getContext('2d');
            if (window.myChartLinha) window.myChartLinha.destroy();

            window.myChartLinha = new Chart(contextLinha, {
                type: 'line',
                data: {
                    labels: dias,
                    datasets: [{
                        label: "Vendas por Dia",
                        data: vendas,
                        borderColor: '#0DB8E8',
                        backgroundColor: '#0e1218',
                        fill: true,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
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
                                label: context => `Vendas: ${context.raw}`
                            }
                        }
                    }
                }
            });
        } else {
            console.error("Canvas para o gráfico de linha não encontrado!");
        }
    }

    fetchDataAndStore();
    document.getElementById('filtro_mes').addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_ano').addEventListener('change', montarGraficoComFiltro);
});
