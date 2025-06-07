window.addEventListener("DOMContentLoaded", async function () {

    document.getElementById('spinner').style.display = 'flex';

    let user = sessionStorage.getItem("currentUser");
    let name = sessionStorage.getItem("name");
    let imagem = sessionStorage.getItem("img");


    if (user) {
        document.getElementById("nome").innerHTML = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();
        document.getElementById("photo").src = imagem;
    }



    async function fetchDataAndStore() {

        document.querySelector('body').style.display = 'block';

        try {
            const storedData = sessionStorage.getItem('database');

            if (storedData) {
                montarGraficoComFiltro();
                return;
            }

            const apiUrl = `https://api-webstore.onrender.com/array/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Erro ao carregar JSON do endpoint: ${response.statusText}`);

            const data = await response.json();

            sessionStorage.setItem('database', JSON.stringify(data));
            montarGraficoComFiltro();
        } catch (error) {
            console.error("Erro ao obter dados do endpoint:", error);
        } finally {
            document.getElementById('spinner').style.display = 'none';

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
        const chartDom = document.getElementById(idCanvas);
        if (!chartDom) return;

        const tipoAnalise = document.getElementById('filtro_tipo').value;

        const dadosOrdenados = labels.map((label, i) => ({
            label,
            valor: valores[i]
        })).sort((b, a) => b.valor - a.valor);

        const labelsOrdenados = dadosOrdenados.map(item => item.label);
        const valoresOrdenados = dadosOrdenados.map(item => item.valor);

        const myChart = echarts.init(chartDom);

        const option = {

            grid: {
                left: '2%',
                right: '20%',
                top: '10%',
                bottom: '1%',
                containLabel: true
            },

            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                    const value = params[0].value;
                    return tipoAnalise === "valor"
                        ? `Valor: R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : `Quantidade: ${value}`;
                }
            },
            xAxis: { type: 'value', show: false },
            yAxis: {
                type: 'category',
                data: labelsOrdenados,
                axisLabel: { color: '#0F8F8F' }
            },
            series: [{
                type: 'bar',
                data: valoresOrdenados,
                itemStyle: { color: '#0F8F8F' },
                label: {
                    show: true,
                    position: 'right',
                    formatter: function (params) {
                        const value = params.value;
                        return tipoAnalise === "valor"
                            ? `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : `${value}`;
                    },
                    color: '#0F8F8F',
                    fontWeight: 'bold'
                }
            }]
        };

        myChart.setOption(option);
    }


    function criarGraficoLinha(idCanvas, dadosFiltrados, tipoAnalise) {
        const getMetric = item => tipoAnalise === "quantidade" ? item.QTD : item.QTD * item.VR_UNIT;
        const vendasPorDia = dadosFiltrados.reduce((acc, item) => {
            acc[item.dia] = (acc[item.dia] || 0) + getMetric(item);
            return acc;
        }, {});

        const diasOrdenados = Object.keys(vendasPorDia).sort();
        const valoresOrdenados = diasOrdenados.map(dia => vendasPorDia[dia]);

        const chartDom = document.getElementById(idCanvas);
        if (!chartDom) return;

        const myChart = echarts.init(chartDom);

        const option = {

            grid: {
                left: '0%',
                right: '0%',
                top: '1%',
                bottom: '1%',
                containLabel: true
            },

            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const value = params[0].value;
                    return tipoAnalise === "valor"
                        ? `Valor: R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : `Quantidade: ${value}`;
                }
            },
            xAxis: {
                type: 'category',
                data: diasOrdenados,
                axisLabel: { color: '#0F8F8F' }
            },
            yAxis: { type: 'value', show: false },
            series: [{
                data: valoresOrdenados,
                type: 'line',
                areaStyle: {},
                lineStyle: { color: '#0F8F8F' },
                itemStyle: { color: '#0DEDC8' }
            }]
        };

        myChart.setOption(option);
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
        "AGUARDANDO APROVAÇÃO": "#E28C02",
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

        const chartDom = document.getElementById(idCanvas);
        if (!chartDom) return;

        const myChart = echarts.init(chartDom);

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} pedidos ({d}%)'
            },
            legend: {
                show: false,
                top: '5%',
                left: 'center',
                textStyle: { color: '#0F8F8F' }
            },
            series: [{
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 0, borderColor: '#fff', borderWidth: 1 },
                label: { show: false },
                emphasis: { label: { show: false, fontSize: 14 } },
                labelLine: { show: false },
                data: labels.map((label, i) => ({
                    value: valores[i],
                    name: label,
                    itemStyle: { color: cores[i] }
                }))
            }]
        };

        myChart.setOption(option);
    }



    function criarGraficoDispersaoPorCliente(idCanvas, dadosFiltrados, tipoAnalise) {
        const getMetric = item => tipoAnalise === "quantidade" ? item.QTD : item.QTD * item.VR_UNIT;
        const clientes = [...new Set(dadosFiltrados.map(item => item.CLIENTE))];

        const data = clientes.map((cliente, index) => {
            const total = dadosFiltrados.filter(i => i.CLIENTE === cliente)
                .reduce((acc, i) => acc + getMetric(i), 0);
            return {
                name: cliente,
                value: [index + 1, total, Math.sqrt(total) * (tipoAnalise === "quantidade" ? 2.5 : 0.3)]
            };
        });

        const chartDom = document.getElementById(idCanvas);
        if (!chartDom) return;

        const myChart = echarts.init(chartDom);

        const option = {

            grid: {
                left: '1%',
                right: '5%',
                top: '10%',
                bottom: '1%',
                containLabel: true
            },

            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    const cliente = params.name;
                    const total = params.value[1];
                    return tipoAnalise === "valor"
                        ? `${cliente}: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : `${cliente}: ${total}`;
                }
            },
            xAxis: {
                show: true,
                // name: "QTD Itens",
                axisLine: { show: true },
                splitLine: { show: false }
            },
            yAxis: {
                show: false,
                axisLine: { show: true },
                splitLine: { show: false }
            },

            series: [{
                type: 'scatter',
                symbolSize: val => val[2],
                data: data,
                label: {
                    show: false
                },
                itemStyle: {
                    color: () => `hsl(${Math.random() * 360}, 70%, 60%)`
                }
            }]
        };

        myChart.setOption(option);
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
