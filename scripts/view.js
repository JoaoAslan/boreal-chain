import { getTopCoins, searchListCoins } from './controller.js'
import { factoryObjectCoin } from './model.js'

function resetSearchBar() {
    document.querySelector('.search-bar').addEventListener('click', (e) => {
        e.target.value = '';
    })
}

async function formEvent() {
    const form = document.querySelector('.formulario');
    form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query =  new FormData(form).get('search').trim();
            const coins = query 
            ? await searchListCoins(query) 
            : await getTopCoins();

            if (query) {
                updateTitle(`🔍 Buscando por <i>"${query}"</i>`);
            } else {
                updateTitle('🏆 Top 10 Criptomoeds');
            }
            showNumberResults(coins.length);

            const hasCoins = coins.length > 0 ? true : false;
            if (hasCoins) {
                showTable();
                renderCoins(coins);
            } else {
                showError();
            }
            
    });
}

async function start() {
    resetSearchBar();
    await formEvent();

    // Carrega as primeiras 10 moedas do mercado
    const coins = await getTopCoins();
    renderCoins(coins);
}

function renderCoins(coins) {
    const table = document.querySelector('tbody');
    table.innerHTML = '';
    coins.forEach((coin) => {
        const info = factoryObjectCoin(coin);
        table.appendChild(createCoinLine(info));
    })
}

function showNumberResults(count) {
    document.querySelector('.resultados').innerHTML = `${count} resultado(s)`;
}

function updateTitle(title) {
    document.querySelector('h2.titulo').innerHTML = title;
}

function showError() {
    document.querySelector('.table-container').style.display = 'none';
    document.querySelector('.warning').style.display = 'flex';
}

function showTable() {
    document.querySelector('.table-container').style.display = 'block';
    document.querySelector('.warning').style.display = 'none';
}

function createCoinLine(data) {
    const tr = document.createElement('tr');
    tr.classList.add('coin');

    // Posicao
    const tdPosicao = document.createElement('td');
    tdPosicao.classList.add('posicao');
    tdPosicao.textContent = data['posicao'];

    // Moeda (Img, Nome, Sigla)
    // Imagem
    const img = document.createElement('img');
    img.src = data['img'];

    // Nome + Sigla
    const divTitulo = document.createElement('div');
    divTitulo.classList.add('titulo');

    const spanNome = document.createElement('span');
    const spanSigla = document.createElement('span');
    spanNome.classList.add('nome');
    spanSigla.classList.add('sigla');

    spanNome.textContent = data['nome'];
    spanSigla.textContent = data['sigla'];

    divTitulo.appendChild(spanNome);
    divTitulo.appendChild(spanSigla);

    const divData = document.createElement('div');
    divData.classList.add('data');
    divData.appendChild(img);
    divData.appendChild(divTitulo);
    
    const tdMoeda = document.createElement('td');
    tdMoeda.classList.add('moeda');
    tdMoeda.appendChild(divData);

    // Valor
    const tdValor = document.createElement('td');
    tdValor.classList.add('valor');
    tdValor.textContent = data['valor'];
    
    // Variacao (24h)
    const tdVariacao = document.createElement('td');
    tdVariacao.classList.add('variacao');
    tdVariacao.classList.add(data['cor_variacao']);
    tdVariacao.textContent = data['variacao'];
    
    // Market
    const tdMarket = document.createElement('td');
    tdMarket.classList.add('market');
    tdMarket.textContent = data['market'];

    tr.append(
        tdPosicao,
        tdMoeda,
        tdValor,
        tdVariacao,
        tdMarket,
    );

    return tr;
}

start();