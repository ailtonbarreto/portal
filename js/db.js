window.addEventListener("DOMContentLoaded", function () {
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
            console.log("Dados armazenados com sucesso:", data);
        } catch (error) {
            console.error("Erro ao obter dados do endpoint:", error);
        }
    }

    function montarGraficoComFiltro() {
        const dataFromLocalStorage = JSON.parse(localStorage.getItem('database'));
        if (!dataFromLocalStorage || !Array.isArray(dataFromLocalStorage)) {
            console.error("Nenhum dado encontrado no localStorage ou formato inválido!");
            return;
        }

        const mesSelecionado = parseInt(document.getElementById('filtro_mes').value, 10);
        const dadosFiltrados = dataFromLocalStorage.filter(item => {
            const mesDoItem = new Date(item.EMISSAO).getUTCMonth() + 1;
            return mesDoItem === mesSelecionado;
        });

        const categoriaMap = dadosFiltrados.reduce((acc, item) => {
            acc[item.CATEGORIA] = (acc[item.CATEGORIA] || 0) + item.QTD;
            return acc;
        }, {});

        const sortedData = Object.entries(categoriaMap)
            .map(([categoria, soma]) => ({ categoria, soma }))
            .sort((a, b) => b.soma - a.soma);

        const categoriasOrdenadas = sortedData.map(item => item.categoria);
        const somasOrdenadas = sortedData.map(item => item.soma);

        const ctx = document.getElementById('meuGrafico').getContext('2d');
        if (window.myChart) window.myChart.destroy();
        
        window.myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoriasOrdenadas,
                datasets: [{
                    label: "Quantidade",
                    data: somasOrdenadas,
                    backgroundColor: 'rgba(6, 144, 236)',
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

    fetchDataAndStore().then(() => montarGraficoComFiltro());
    document.getElementById('filtro_mes').addEventListener('change', montarGraficoComFiltro);
});