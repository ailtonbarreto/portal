window.addEventListener("DOMContentLoaded", async function () {
    let user = sessionStorage.getItem("currentUser");
    let name = sessionStorage.getItem("name");
    let imagem = sessionStorage.getItem("img");

    if (user) {
        document.getElementById("nome").innerHTML = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();
        document.getElementById("photo").src = imagem;
    }

    // async function fetchDataAndStore() {
    //     document.getElementById('spinner').style.display = 'flex';

    //     try {

    //         const apiUrl = `https://api-webstore.onrender.com/array/${name}`;

    //         const response = await fetch(apiUrl);
    //         if (!response.ok) throw new Error(`Erro ao carregar JSON do endpoint: ${response.statusText}`);

    //         const data = await response.json();
    //         sessionStorage.setItem('database', JSON.stringify(data));

  
    //         montarGraficoComFiltro();
    //     } catch (error) {
    //         console.error("Erro ao obter dados do endpoint:", error);
    //     } finally {
    //         document.getElementById('spinner').style.display = 'none';
    //     }
    // }

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
                    TOTAL: item.VR_UNIT * item.QTD
                });
            }
            return acc;
        }, []);

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
    
            let corStatus = "";
            switch (pedido.STATUS) {
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
    
            row.innerHTML = `
                <td style="color: ${corStatus};font-weight: bold">${pedido.PEDIDO}</td>
                <td style="color: ${corStatus};font-weight: bold">${pedido.CLIENTE}</td>
                <td style="color: ${corStatus};font-weight: bold">R$ ${parseFloat(pedido.TOTAL).toLocaleString('pt-BR')}</td>
                <td style="color: ${corStatus};font-weight: bold">${pedido.STATUS}</td>
            `;
    
            tbody.appendChild(row);
        });
    }
    

    fetchDataAndStore();
    montarGraficoComFiltro();

    document.getElementById('filtro_ano')?.addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_mes')?.addEventListener('change', montarGraficoComFiltro);
    document.getElementById('filtro_tipo')?.addEventListener('change', montarGraficoComFiltro);
});
