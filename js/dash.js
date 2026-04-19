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
        const modoVendas = document.getElementById('filtro_vendas_tipo')?.value || 'total';

        const dadosFiltrados = dataFromLocalStorage.filter(item =>
            parseInt(item.mes, 10) === mesSelecionado &&
            parseInt(item.ano, 10) === anoSelecionado &&
            item.REP === name
        );

        calcularIndicadores(dadosFiltrados);
        atualizarGraficos(dadosFiltrados, tipoAnalise, modoVendas);

        criarGraficoPizzaDeStatus('pizza-chart', dadosFiltrados);

        criarGraficoDispersaoPorCliente('scatter-chart', dadosFiltrados, tipoAnalise);
    }


    function atualizarGraficos(dadosFiltrados, tipoAnalise, modoVendas) {
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
        criarGraficoLinha('line-chart', dadosFiltrados, tipoAnalise, modoVendas);
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
                axisLabel: { color: '#ffffff' }
            },
            series: [{
                type: 'bar',
                data: valoresOrdenados,
                itemStyle: { color: '#b6b6b6' },
                label: {
                    show: true,
                    position: 'right',
                    formatter: function (params) {
                        const value = params.value;
                        return tipoAnalise === "valor"
                            ? `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : `${value}`;
                    },
                    color: '#ffffff',
                    fontWeight: 'bold'
                }
            }]
        };

        myChart.setOption(option);


    }


    function criarGraficoLinha(idCanvas, dadosFiltrados, tipoAnalise, modoVendas = 'total') {
        const getMetric = item => tipoAnalise === "quantidade" ? item.QTD : item.QTD * item.VR_UNIT;
        const vendasPorDia = dadosFiltrados.reduce((acc, item) => {
            acc[item.dia] = (acc[item.dia] || 0) + getMetric(item);
            return acc;
        }, {});

        const diasOrdenados = Object.keys(vendasPorDia).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        const valoresOrdenados = diasOrdenados.map(dia => vendasPorDia[dia]);
        const valoresAcumulados = valoresOrdenados.reduce((acc, valor, index) => {
            if (index === 0) return [valor];
            acc.push(valor + acc[index - 1]);
            return acc;
        }, []);

        const seriesData = modoVendas === 'acumulado' ? valoresAcumulados : valoresOrdenados;
        const labelPrefix = modoVendas === 'acumulado' ? 'Acumulado' : 'Total';

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
                        ? `${labelPrefix}: R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : `${labelPrefix}: ${value}`;
                }
            },
            xAxis: {
                type: 'category',
                data: diasOrdenados,
                axisLabel: { color: '#ffffff' }
            },
            yAxis: { type: 'value', show: false },
            series: [{
                data: seriesData,
                type: 'line',
                areaStyle: {},
                lineStyle: { color: '#b6b6b6' },
                itemStyle: { color: '#b6b6b6' },
                symbol: 'none',
                showSymbol: false
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
        "CANCELADO": "#fa0206",
        "CONCLUIDO": "#04cc7c",
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
                textStyle: { color: '#04090e' }
            },
            series: [{
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 0, borderColor: '#000000', borderWidth: 1 },
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

        const data = clientes.map(cliente => {
            const total = dadosFiltrados.filter(i => i.CLIENTE === cliente)
                .reduce((acc, i) => acc + getMetric(i), 0);
            return { cliente, total };
        }).sort((a, b) => b.total - a.total);

        let tableHTML = '<div style="overflow-y: scroll; height: 32vh; text-align: center;"><table style="width: 100%; table-layout: fixed; border-collapse: collapse;"><thead style="position: sticky; top: 0; background-color: none; z-index: 1;"><tr><th style="width: 50%; border: none; padding: 12px; background-color: #252525; color: white; text-align: center; font-weight: bold;">Cliente</th><th style="width: 50%; border: none; padding: 12px; background-color: #252525; color: white; text-align: center; font-weight: bold;">Total</th></tr></thead><tbody>';

        data.forEach((item, index) => {
            const formattedTotal = tipoAnalise === "valor"
                ? `R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : item.total;
            const rowStyle = index % 2 === 0 ? 'background-color: none;' : '';
            tableHTML += `<tr style="${rowStyle}"><td style="width: 50%; border: none; padding: 12px; color: #ffffff;">${item.cliente}</td><td style="width: 50%; border: none; padding: 12px; color: #ffffff">${formattedTotal}</td></tr>`;
        });

        tableHTML += '</tbody></table></div>';

        document.getElementById(idCanvas).innerHTML = tableHTML;
    }


    await fetchDataAndStore();

    document.getElementById('filtro_mes').addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_ano').addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_tipo').addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_vendas_tipo')?.addEventListener('change', montarGraficoComFiltro);
});

document.addEventListener("DOMContentLoaded", function () {
    const filtroMes = document.getElementById("filtro_mes");
    const filtroAno = document.getElementById("filtro_ano");

    const mesAtual = String(new Date().getMonth() + 1).padStart(2, "0");
    const anoAtual = String(new Date().getFullYear());

    filtroMes.value = mesAtual;
    filtroAno.value = anoAtual;
});
