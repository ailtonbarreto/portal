document.addEventListener("DOMContentLoaded", () => {
    const url = "https://api-webstore.onrender.com/estoque";
    const section_data = document.querySelector(".section");
    const filterInput = document.getElementById("filterInput");
    let dadosSalvos = [];

    
    async function Load_Data() {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
            }
            const dados = await response.json();
            console.log("Dados carregados:", dados);
            dadosSalvos = dados;
            load_products();
        } catch (error) {
            console.error("Erro ao carregar dados:", error.message);
        }
    }

  
    function agruparPorParent(produtos) {
        const grupos = {};

        produtos.forEach(produto => {
            const chavePai = produto.PARENT || produto.SKU;
            if (!grupos[chavePai]) {
                grupos[chavePai] = [];
            }
            grupos[chavePai].push(produto);
        });

        return grupos;
    }


    function criarCardProduto(parentProduto, produtos) {
        const card = document.createElement("figure");
        card.id = parentProduto.PARENT;
        card.classList.add("card");

    
        const listName = document.createElement("p");
        listName.classList.add("product-name");
        listName.textContent = parentProduto.DESCRICAO_PARENT
        card.appendChild(listName);

        const img = document.createElement("img");
        img.src = parentProduto.IMAGEM
        img.alt = parentProduto.DESCRICAO_PARENT
        card.appendChild(img);

 
        const parentInfo = document.createElement("p");
        parentInfo.classList.add("parent-info");
        parentInfo.textContent = `Parent: ${parentProduto.PARENT}`;
        card.appendChild(parentInfo);

     
        const tamanhosInfo = document.createElement("p");
        tamanhosInfo.classList.add("tamanhos-info");

        let tamanhosTexto = [];
        const variacaoEstoque = {};

        
        produtos.forEach(produto => {
            const variacao = produto.VARIACAO || "UN";
            if (!variacaoEstoque[variacao]) {
                variacaoEstoque[variacao] = 0;
            }
            variacaoEstoque[variacao] += parseInt(produto.ESTOQUE, 10);
        });

    
        for (const [variacao, estoque] of Object.entries(variacaoEstoque)) {
            if (estoque > 0) {
                if (variacao === "UN") {
                    tamanhosTexto.push(`UN: ${estoque}`);
                } else {
                    tamanhosTexto.push(`${variacao}: ${estoque}`);
                }
            }
        }

        if (tamanhosTexto.length > 0) {
            tamanhosInfo.textContent = `${tamanhosTexto.join(" | ")}`;
            card.appendChild(tamanhosInfo);
        }

        return card;
    }

    function displayProducts(produtos) {
        section_data.innerHTML = "";
        const agrupados = agruparPorParent(produtos);

   
        Object.entries(agrupados).forEach(([parentSKU, produtosGrupo]) => {
            const parentProduto = produtosGrupo[0];
            const card = criarCardProduto(parentProduto, produtosGrupo);
            section_data.appendChild(card);
        });
    }

 
    filterInput.addEventListener("input", () => {
        const searchValue = filterInput.value.toLowerCase().trim();

        if (searchValue === "") {
            displayProducts(dadosSalvos);
        } else {
        
            const filteredProducts = dadosSalvos.filter(produto => {
                const skuMatch = produto.SKU && produto.SKU.toLowerCase().includes(searchValue);
                const descriptionMatch = produto.DESCRICAO_PARENT && produto.DESCRICAO_PARENT.toLowerCase().includes(searchValue);
                return skuMatch || descriptionMatch;
            });

            displayProducts(filteredProducts);
        }
    });

   
    async function load_products() {
        if (dadosSalvos.length) {
            displayProducts(dadosSalvos);
        }
    }

    Load_Data();
});
