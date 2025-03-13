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
    
        atualizarTabelaPedidos(dadosFiltrados);
    }
    

    function atualizarTabelaPedidos(dados) {
        const tabela = document.getElementById('tabela_pedidos');
        if (!tabela) return;

        const tbody = tabela.querySelector('tbody');
        tbody.innerHTML = '';

        if (dados.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" style="text-align: center;">Nenhum pedido encontrado.</td>`;
            tbody.appendChild(row);
            return;
        }

        dados.forEach(pedido => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pedido.PEDIDO}</td>
                <td>${pedido.CLIENTE}</td>
                <td>${pedido.DESCRICAO}</td>
                <td>${pedido.QTD}</td>
                <td>${pedido.VR_UNIT}</td>

            `;
            tbody.appendChild(row);
        });
    }

    document.getElementById('filtro_ano')?.addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_mes')?.addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_tipo')?.addEventListener('change', montarGraficoComFiltro);
});
