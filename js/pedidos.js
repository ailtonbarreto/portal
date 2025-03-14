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
        document.getElementById('spinner').style.display = 'flex';
    
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
        } finally {
            document.getElementById('spinner').style.display = 'none';
        }
    }
    
    function montarGraficoComFiltro() {
        const dataFromLocalStorage = JSON.parse(localStorage.getItem('database'));
        if (!dataFromLocalStorage || !Array.isArray(dataFromLocalStorage)) return;
    
        const anoSelecionado = document.getElementById('filtro_ano').value.trim();
        const mesSelecionado = document.getElementById('filtro_mes').value.trim();
        const tipoAnalise = document.getElementById('filtro_tipo').value;
        
        const nomeRep = name ? name.trim().toLowerCase() : "";
    
        const dadosFiltrados = dataFromLocalStorage.filter(item => 
            item.ano.trim() === anoSelecionado &&
            item.mes.trim() === mesSelecionado &&
            item.REP.trim().toLowerCase() === nomeRep
        );
        
        // Agrupar os dados por PEDIDO
        const dadosAgrupados = dadosFiltrados.reduce((acc, item) => {
            const pedidoExistente = acc.find(p => p.PEDIDO === item.PEDIDO);
            if (pedidoExistente) {
                pedidoExistente.QTD += item.QTD;
                pedidoExistente.VR_UNIT += item.VR_UNIT;
                pedidoExistente.TOTAL += item.VR_UNIT * item.QTD;  // Corrigido para somar o TOTAL
            } else {
                acc.push({
                    PEDIDO: item.PEDIDO,
                    CLIENTE: item.CLIENTE,
                    DESCRICAO: item.DESCRICAO,
                    QTD: item.QTD,
                    VR_UNIT: item.VR_UNIT,
                    STATUS: item.STATUS || "Não Definido", // Verifique se o STATUS existe
                    TOTAL: item.VR_UNIT * item.QTD // Inicializa o TOTAL corretamente
                });
            }
            return acc;
        }, []);
    
        // Atualizar a tabela com os dados agrupados
        atualizarTabelaPedidos(dadosAgrupados);
    }
    
    function atualizarTabelaPedidos(dados) {
        const tabela = document.getElementById('tabela_pedidos');
        if (!tabela) return;

        const tbody = tabela.querySelector('tbody');
        tbody.innerHTML = '';

        if (dados.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" style="text-align: center;">Nenhum pedido encontrado.</td>`;
            tbody.appendChild(row);
            return;
        }

        dados.forEach(pedido => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pedido.PEDIDO}</td>
                <td>${pedido.CLIENTE}</td>
                <td>R$ ${parseFloat(pedido.TOTAL).toLocaleString('pt-BR')}</td>
                <td>${pedido.STATUS}</td>
            `;
            tbody.appendChild(row);
        });
    }

    document.getElementById('filtro_ano')?.addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_mes')?.addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_tipo')?.addEventListener('change', montarGraficoComFiltro);
    
    // Carregar a tabela automaticamente ao carregar a página
    fetchDataAndStore();
});
