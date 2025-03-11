window.addEventListener("load", function () {
    configurarFormularioLogin();

    function configurarFormularioLogin() {
        const loginForm = document.getElementById("loginForm");
        
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const username = document.getElementById("input-user").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!username || !password) {
                exibirAlerta("Usuário e senha são obrigatórios!");
                return;
            }

            await validarCredenciais(username, password);
        });
    }

    async function obterCredenciaisJSON() {
        try {
            const response = await fetch("./js/credenciais.json");
            if (!response.ok) throw new Error("Erro ao carregar arquivo de credenciais.");

            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("Formato inválido do JSON.");

            return data;
        } catch (error) {
            console.error("Erro:", error);
            exibirAlerta("Erro ao carregar credenciais.");
            return [];
        }
    }

    async function validarCredenciais(username, password) {
        const usuarios = await obterCredenciaisJSON();
        const user = usuarios.find(u => u.usuario === username && u.senha === password);

        if (user) {
            realizarLogin(user);
        } else {
            exibirAlerta("Usuário ou senha incorretos!");
        }
    }

    function exibirAlerta(mensagem) {
        const alert = document.getElementById("alert");
        alert.innerText = mensagem;
        alert.style.display = "block";
    }

    function realizarLogin(userData) {
        sessionStorage.setItem("logon", "1");
        sessionStorage.setItem("currentUser", userData.apelido);
        sessionStorage.setItem("name", userData.usuario);

        atualizarInterface(userData);
    }

    function atualizarInterface(userData) {
        const iframe = document.getElementById("iframe");
        iframe.src = userData.link;
        document.getElementById("container-login").classList.add("desapear");
        document.getElementById("logged-message").innerHTML = `Logado como ${userData.nickname}`;
    }
});

function Exit() {
    sessionStorage.removeItem("logon");
    sessionStorage.removeItem("currentUser");
    
    document.getElementById("container-login").classList.remove("desapear");
    document.getElementById("iframe").src = "";
    document.getElementById("logged-message").innerHTML = "";
    window.location.reload();
}