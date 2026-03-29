class Form {
    constructor(settings) {
        this.form = document.querySelector(settings.form);
        this.input = document.querySelector(settings.input);
        this.button = document.querySelector(settings.button);
    }

    init(api) {
        this.resetSearchBar();

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query =  new FormData(this.form).get('search').trim();
            const coins = query 
            ? await api.searchListCoins(query) 
            : await api.getTopCoins();

            Main.renderCoins(api, coins);
        });
    }

    resetSearchBar() {
        this.input.addEventListener('click', (e) => {
            e.target.value = '';
        })
    }
}

class Coin {
    constructor(info) {
        this.info = info;
    }

    createCoinLine() {
        const tr = document.createElement('tr');
        tr.classList.add('coin');

        // Posicao
        const tdPosicao = document.createElement('td');
        tdPosicao.classList.add('posicao');
        tdPosicao.textContent = this.info['posicao'];

        // Moeda (Img, Nome, Sigla)
        // Imagem
        const img = document.createElement('img');
        img.src = this.info['img'];

        // Nome + Sigla
        const divTitulo = document.createElement('div');
        divTitulo.classList.add('titulo');

        const spanNome = document.createElement('span');
        const spanSigla = document.createElement('span');
        spanNome.classList.add('nome');
        spanSigla.classList.add('sigla');

        spanNome.textContent = this.info['nome'];
        spanSigla.textContent = this.info['sigla'];

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
        tdValor.textContent = this.info['valor'];
        
        // Variacao (24h)
        const tdVariacao = document.createElement('td');
        tdVariacao.classList.add('variacao');
        tdVariacao.classList.add(this.info['cor_variacao']);
        tdVariacao.textContent = this.info['variacao'];
        
        // Market
        const tdMarket = document.createElement('td');
        tdMarket.classList.add('market');
        tdMarket.textContent = this.info['market'];

        tr.append(
            tdPosicao,
            tdMoeda,
            tdValor,
            tdVariacao,
            tdMarket,
        );

        return tr;
    }
}

class Api {

    async getData(url, options) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                console.log(`Sucess: ${response.status}`);
            } else {
                console.log(`Failed: ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            console.error(`Erro ao realizar o FETCH em ${url}: ${err}`);
        }
    }

    async getTopCoins() {
        const cached = Cache.getCache('top10');
        if (cached) return cached;

        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&category=layer-1&price_change_percentage=24h&per_page=10&order=market_cap_desc`;
        const options = {method: 'GET', headers: {'x-cg-demo-api-key': 'CG-jNJAg3Vr7hbtcSmZxsGuiVTd'}};
        const results = await this.getData(url, options);

        Cache.createCache('top10', results);
        return results;
    }

    async fetchSearchCoins(query) {
        const url = `https://api.coingecko.com/api/v3/search?query=${query}`;
        const options = {method: 'GET', headers: {'x-cg-demo-api-key': 'CG-jNJAg3Vr7hbtcSmZxsGuiVTd'}};
        const results = await this.getData(url, options);
        return results; 
    }
    
    async getCoinsByIds(ids) {
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=${ids}&price_change_percentage=24h`
        const options = {method: 'GET', headers: {'x-cg-demo-api-key': 'CG-jNJAg3Vr7hbtcSmZxsGuiVTd'}};
        const results = await this.getData(url, options);

        return results;
    }

    factoryObjectCoin(data) {

        const posicao = data['market_cap_rank'];
        const img = data['image'];
        const nome = data['name'];
        const sigla = data['symbol'].toUpperCase();
        const valor = this.formatValue(data['current_price']);

        const simbolo = data['price_change_percentage_24h'] > 0 ? '+' : '-'
        const variacao = `${simbolo}${Math.abs(data['price_change_percentage_24h']).toFixed(2)}%`;
        const cor_variacao = simbolo == '+' ? 'plus' : 'minor';

        const market = this.formatMarketCap(data['market_cap']);

        return {
            posicao,
            img,
            nome,
            sigla,
            valor,
            variacao,
            cor_variacao,
            market
        }
    }

    formatValue(valor) {
        return `R$ ${valor.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    formatMarketCap(valor) {
        if (valor >= 1_000_000_000_000) {
            return `${(valor / 1_000_000_000_000).toFixed(2)}T`;
        } else if (valor >= 1_000_000_000) {
            return `${(valor / 1_000_000_000).toFixed(2)}B`
        } else if (valor >= 1_000_000) {
            return `${(valor / 1_000_000).toFixed(2)}M`
        } else if (valor >= 1_000) {
            return `${(valor / 1_000).toFixed(2)}k`
        }
        return valor.toString();
    }

    async searchListCoins(query) {
        const cachedCoins = [];
        const notCachedCoins = [];
        
        const searchCoins = await this.fetchSearchCoins(query);
        
        if (!searchCoins) return null;
        const coinIds = searchCoins["coins"].map((coin) => coin.id );
        coinIds.forEach((id) => {
            this.typeCacheByCoin(id, cachedCoins, notCachedCoins);
        });
        
        const newCoins = await this.storeInCacheNewCoins(notCachedCoins);
        const results = cachedCoins.concat(newCoins);
        return results;
    }

    typeCacheByCoin(id, cachedCoins, notCachedCoins) {
        const cached = Cache.getCache(`coin_${id}`);
        if (cached) {
            cachedCoins.push(cached);
        } else {
            notCachedCoins.push(id);
        }
    }

    async storeInCacheNewCoins(notCachedCoins) {
        const stringNotCachedCoinsIds = notCachedCoins.join(',');
        const newCoins = notCachedCoins.length > 0 ? await this.getCoinsByIds(stringNotCachedCoinsIds) : [];
        newCoins.forEach((coin) => {
            Cache.createCache(`coin_${coin['id']}`, coin);
        });

        return newCoins;
    }
}

class Cache {
    static CACHE_PREFIX = 'crypto_';
    static CACHE_TTL = 60 * 60 * 1000; // 60 minutos em ms

    static createCache(key, data) {
        const entry = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(entry));
    }

    static getCache(key) {
        const raw = localStorage.getItem(this.CACHE_PREFIX + key);
        if (!raw) return null;

        const entry = JSON.parse(raw);
        const isExpired = Date.now() - entry.timestamp > this.CACHE_TTL;

        if (isExpired) {
            localStorage.removeItem(this.CACHE_PREFIX + key);
            return null;
        }

        return entry.data;
    }
}

class Main {
    static async init() {
        const settings = {
            form: '.formulario',
            input: '.search-bar',
            button: '.button-buscar'
        }
        const form = new Form(settings);
        const api = new Api();

        form.init(api);

        const coins = await api.getTopCoins();
        Main.renderCoins(api, coins);
    }

    static renderCoins(api, coins) {
        const table = document.querySelector('tbody');
        table.innerHTML = '';
        coins.forEach((coin) => {
            const info = api.factoryObjectCoin(coin);
            table.appendChild(new Coin(info).createCoinLine());
        })
    }
}

Main.init();