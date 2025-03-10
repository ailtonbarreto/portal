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
            // alert("Erro ao carregar a configuração da API.");
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
            console.log(data);
        } catch (error) {
            console.error("Erro ao obter dados do endpoint:", error);
            // alert("Erro ao carregar os dados do endpoint.");
        }
    }

    fetchDataAndStore();


    // -----------------------------------------------------------------------------------

    function montarGraficoComFiltro() {
    
        const dataFromLocalStorage = JSON.parse(localStorage.getItem('database'));
    
  
        if (!dataFromLocalStorage || !Array.isArray(dataFromLocalStorage)) {
            console.error("Nenhum dado encontrado no localStorage ou os dados não estão no formato esperado!");
            return;
        }
    

        const mesSelecionado = document.getElementById('filtro_mes').value;
    
     
        // const dadosFiltrados = dataFromLocalStorage.filter(item => {
        //     const mesDoItem = new Date(item.EMISSAO).getMonth() + 1;
        //     return mesDoItem == mesSelecionado;
            
        // });

        const dadosFiltrados = dataFromLocalStorage.filter(item => {
            const mesDoItem = new Date(item.EMISSAO).getUTCMonth() + 1; // Pegando o mês corretamente (1-12)
            return mesDoItem === mesSelecionado;
        });
        
        
        console.log(mesSelecionado);
        console.log(mesDoItem);

      
        const categoriaMap = dadosFiltrados.reduce((acc, item) => {
    
            if (acc[item.CATEGORIA]) {
                acc[item.CATEGORIA] += item.QTD;
            } else {
                acc[item.CATEGORIA] = item.QTD;
            }
            return acc;
        }, {});
    
        const categorias = Object.keys(categoriaMap);
        const somas = Object.values(categoriaMap);
    
        // Ordenando as categorias e somas da maior para a menor quantidade
        const sortedData = categorias.map((categoria, index) => {
            return { categoria: categoria, soma: somas[index] };
        }).sort((a, b) => b.soma - a.soma);  // Ordena pela soma de forma decrescente
    
        // Recriar as arrays ordenadas de categorias e somas
        const categoriasOrdenadas = sortedData.map(item => item.categoria);
        const somasOrdenadas = sortedData.map(item => item.soma);
    
        // Pegando o contexto do canvas
        const ctx = document.getElementById('meuGrafico').getContext('2d');
    
        // Criando o gráfico de barras
        const myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoriasOrdenadas,
                datasets: [{
                    label: categoriasOrdenadas.categoria,
                    data: somasOrdenadas,
                    backgroundColor: 'rgba(6, 144, 236)',
                    border: 'none',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',  // Muda a orientação das barras para horizontal
                scales: {
                    x: {
                        beginAtZero: true,  // O eixo X (agora horizontal) começa no zero
                        ticks: {
                            display: false,  // Oculta as labels do eixo X (horizontal)
                            color: 'white',  // Cor das labels do eixo X
                        },
                        grid: {
                            display: false  // Esconde as linhas de grid do eixo X
                        }
                    },
                    y: {
                        beginAtZero: true,  // O eixo Y (agora vertical) começa no zero
                        ticks: {
                            display: true,  // As labels do eixo Y são exibidas
                            color: 'white',  // Cor das labels do eixo Y
                        },
                        grid: {
                            display: false  // Esconde as linhas de grid do eixo Y
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false  // Oculta a legenda
                    },
                    datalabels: {
                        display: true,  // Habilita os rótulos de dados
                        color: 'white',  // Cor do texto dos rótulos
                        align: 'end',  // Alinhamento do texto do rótulo
                        font: {
                            weight: 'bold',  // Peso da fonte
                            size: 12  // Tamanho da fonte
                        },
                        formatter: function(value) {
                            return value;  // Exibe o valor da barra como rótulo
                        }
                    }
                }
            }
        });
    }
    
    // Chamando a função para montar o gráfico inicialmente
    montarGraficoComFiltro();
    
    // Evento para atualizar o gráfico quando o mês for alterado
    document.getElementById('mesSelect').addEventListener('change', function() {
        montarGraficoComFiltro();
    });
    

});



