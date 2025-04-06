document.addEventListener("DOMContentLoaded", () => {
    const url = "https://barretoapps.com.br/estoque";
    const section_data = document.querySelector(".section");
    const filterInput = document.getElementById("filterInput");
    let dadosSalvos = [];

    async function Load_Data() {
        try {
    
            document.getElementById('spinner_estoque').style.display = 'block';
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
            }
            const dados = await response.json();

            dadosSalvos = dados;

            load_products();

        } catch (error) {

            console.error("Erro ao carregar dados:", error.message);

        } finally {
    
            document.getElementById('spinner_estoque').style.display = 'none';
        }
    }
    

    function criarCardProduto(produto) {
        const card = document.createElement("figure");
        card.id = produto.SKU;
        card.classList.add("card");

        const listName = document.createElement("p");
        listName.classList.add("product-name");
        listName.textContent = produto.DESCRICAO_PARENT;
        card.appendChild(listName);

        const img = document.createElement("img");
        img.src = produto.IMAGEM;
        img.alt = produto.DESCRICAO_PARENT;
        card.appendChild(img);

        const skuInfo = document.createElement("p");
        skuInfo.classList.add("sku-info");
        skuInfo.textContent = `SKU: ${produto.SKU}`;
        card.appendChild(skuInfo);

        const estoqueInfo = document.createElement("p");
        estoqueInfo.classList.add("estoque-info");
        estoqueInfo.textContent = `Estoque: ${produto.ESTOQUE}`;
        card.appendChild(estoqueInfo);

        return card;
    }

    function displayProducts(produtos) {
        section_data.innerHTML = "";
        produtos.forEach(produto => {
            const card = criarCardProduto(produto);
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

