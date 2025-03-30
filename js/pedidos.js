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
    

    function montarGraficoComFiltro() {
        const dataFromLocalStorage = JSON.parse(sessionStorage.getItem('database'));
        if (!dataFromLocalStorage || !Array.isArray(dataFromLocalStorage)) return;

        const anoSelecionado = document.getElementById('filtro_ano').value.trim();
        const mesSelecionado = document.getElementById('filtro_mes').value.trim();
        const nomeRep = name ? name.trim().toLowerCase() : "";

        const dadosFiltrados = dataFromLocalStorage.filter(item =>
            (anoSelecionado === '' || item.ano.trim() === anoSelecionado) &&
            (mesSelecionado === '' || item.mes.trim() === mesSelecionado) &&
            item.REP.trim().toLowerCase() === nomeRep
        );

        dadosFiltrados.sort((b, a) => new Date(a.EMISSAO) - new Date(b.EMISSAO));

        const dadosAgrupados = dadosFiltrados.reduce((acc, item) => {
            const pedidoExistente = acc.find(p => p.PEDIDO === item.PEDIDO);
            if (pedidoExistente) {
                pedidoExistente.QTD += item.QTD;
                pedidoExistente.VR_UNIT += item.VR_UNIT;
                pedidoExistente.TOTAL += item.VR_UNIT * item.QTD;
            } else {
                acc.push({
                    PEDIDO: item.PEDIDO,
                    CLIENTE: item.CLIENTE,
                    DESCRICAO: item.DESCRICAO,
                    QTD: item.QTD,
                    VR_UNIT: item.VR_UNIT,
                    STATUS: item.STATUS || "Não Definido",
                    TOTAL: item.VR_UNIT * item.QTD,
                    EMISSAO: item.EMISSAO
                });
            }
            return acc;
        }, []);

        atualizarTabelaPedidos(dadosAgrupados);
    }

    function atualizarTabelaPedidos(dados) {
        const isMobile = window.innerWidth <= 768;
        const tabela = document.getElementById('tabela_pedidos');
        const containerPedidos = isMobile ? document.getElementById('container_cards') : tabela.querySelector('tbody');
    
        if (!containerPedidos) return;
        containerPedidos.innerHTML = '';
    
        if (dados.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" style="text-align: center;">Nenhum pedido encontrado.</td>`;
            containerPedidos.appendChild(row);
            return;
        }
    
        dados.forEach(pedido => {
            if (isMobile) {

                const card = document.createElement('div');
                card.className = 'card-pedido';
                card.innerHTML = `
                    <div class="card-header" style="background-color: ${getStatusColor(pedido.STATUS)};">
                        <h3>${pedido.PEDIDO}</h3>
                        <p>Status: ${pedido.STATUS}</p>
                    </div>
                    <div class="card-body">
                        <p><strong>Cliente:</strong> ${pedido.CLIENTE}</p>
                        <p><strong>Total:</strong> R$ ${parseFloat(pedido.TOTAL).toLocaleString('pt-BR')}</p>
                        <p><strong>Emissão:</strong> ${new Date(pedido.EMISSAO).toLocaleDateString("pt-BR")}</p>
                    </div>
                `;
                card.addEventListener('click', () => abrirPopup(pedido.PEDIDO));
                containerPedidos.appendChild(card);
            } else {

                const row = document.createElement('tr');
                row.style.cursor = "pointer";
                row.addEventListener("click", () => abrirPopup(pedido.PEDIDO));
    
                row.innerHTML = `
                    <td>${pedido.PEDIDO}</td>
                    <td>${pedido.CLIENTE}</td>
                    <td>R$ ${parseFloat(pedido.TOTAL).toLocaleString('pt-BR')}</td>
                    <td>${new Date(pedido.EMISSAO).toLocaleDateString("pt-BR")}</td>
                    <td style="color: ${getStatusColor(pedido.STATUS)}; font-weight: bold">${pedido.STATUS}</td>
                `;
                tabela.querySelector('tbody').appendChild(row);
            }
        });
    }
    
    function getStatusColor(status) {
        switch (status) {
            case "AGUARDANDO APROVAÇÃO": return "#E1FF02";
            case "AGUARDANDO PAGAMENTO": return "#07A2DB";
            case "PLANEJADO": return "#DD02FF";
            case "CANCELADO": return "#FF0206";
            case "CONCLUIDO": return "#54D326";
            default: return "#FFFFFF";
        }
    }
    
    function abrirPopup(pedidoId) {
        let pedidos = JSON.parse(sessionStorage.getItem("database")) || [];
    
  
        let itensPedido = pedidos.filter(p => p.PEDIDO === pedidoId);

        if (itensPedido.length > 0) {
            document.getElementById("popup-id").innerText = itensPedido[0].PEDIDO;
            document.getElementById("popup-data").innerText = new Date(itensPedido[0].EMISSAO).toLocaleDateString("pt-BR");
            document.getElementById("popup-data-entrega").innerText = new Date(itensPedido[0].ENTREGA).toLocaleDateString("pt-BR");
            document.getElementById("popup-cliente").innerText = itensPedido[0].CLIENTE;
            

            let status_ped = document.getElementById("popup-status");
            status_ped.innerText = itensPedido[0].STATUS;
            

            let corStatus = "";
            switch (itensPedido[0].STATUS) {
                case "AGUARDANDO APROVAÇÃO": 
                    corStatus = "#E1FF02"; 
                    break;
                case "AGUARDANDO PAGAMENTO": 
                    corStatus = "#07A2DB"; 
                    break;
                case "PLANEJADO": 
                    corStatus = "#DD02FF"; 
                    break;
                case "CANCELADO": 
                    corStatus = "#FF0206"; 
                    break;
                case "CONCLUIDO": 
                    corStatus = "#54D326"; 
                    break;
                default: 
                    corStatus = "#FFFFFF";
            }
        
            status_ped.style.color = corStatus;
        
        
            const tbody = document.getElementById("popup-itens-body");
            tbody.innerHTML = '';
    
            itensPedido.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.DESCRICAO}</td>
                    <td>${item.QTD}</td>
                    <td>R$ ${parseFloat(item.VR_UNIT).toLocaleString('pt-BR')}</td>
                `;
                tbody.appendChild(row);
            });
    
         
            document.getElementById("popup").style.display = "block";
        } else {
            alert("Pedido não encontrado!");
        }
    }
    


    // ---------------------------------------------------------------------------

    fetchDataAndStore();
    montarGraficoComFiltro();

    document.getElementById('filtro_ano')?.addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_mes')?.addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_tipo')?.addEventListener('change', montarGraficoComFiltro);
});

document.addEventListener("DOMContentLoaded", function () {
    const filtroMes = document.getElementById("filtro_mes");
    const filtroAno = document.getElementById("filtro_ano");

    const mesAtual = String(new Date().getMonth() + 1).padStart(2, "0");
    const anoAtual = String(new Date().getFullYear());

    filtroMes.value = mesAtual;
    filtroAno.value = anoAtual;
});
