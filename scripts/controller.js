import { createCache, getCache } from './cache.js';

async function fetchAPI(url, options) {
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

export async function getTopCoins() {
    const cached = getCache('top10');
    if (cached) return cached;

    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&category=layer-1&price_change_percentage=24h&per_page=10&order=market_cap_desc`;
    const options = {method: 'GET', headers: {'x-cg-demo-api-key': 'CG-jNJAg3Vr7hbtcSmZxsGuiVTd'}};
    const results = await fetchAPI(url, options);

    createCache('top10', results);
    return results;
}

export async function getCoinsByQuery(query) {
    const url = `https://api.coingecko.com/api/v3/search?query=${query}`;
    const options = {method: 'GET', headers: {'x-cg-demo-api-key': 'CG-jNJAg3Vr7hbtcSmZxsGuiVTd'}};
    const results = await fetchAPI(url, options);

    return results; 
}

export async function getCoinsByIds(ids) {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=${ids}&price_change_percentage=24h`
    const options = {method: 'GET', headers: {'x-cg-demo-api-key': 'CG-jNJAg3Vr7hbtcSmZxsGuiVTd'}};
    const results = await fetchAPI(url, options);
    return results;
}

export async function searchListCoins(query) {
    const cachedCoins = [];
    const notCachedCoins = [];
    
    const searchCoins = await getCoinsByQuery(query);
    
    if (!searchCoins) return null;
    const coinIds = searchCoins["coins"].map((coin) => coin.id );
    coinIds.forEach((id) => {
        typeCacheByCoin(id, cachedCoins, notCachedCoins);
    });
    
    const newCoins = await storeInCacheNewCoins(notCachedCoins);
    const results = cachedCoins.concat(newCoins);
    return results;
}

export async function storeInCacheNewCoins(notCachedCoins) {
    const stringNotCachedCoinsIds = notCachedCoins.join(',');
    const newCoins = notCachedCoins.length > 0 ? await getCoinsByIds(stringNotCachedCoinsIds) : [];
    newCoins.forEach((coin) => {
        createCache(`coin_${coin['id']}`, coin);
    });

    return newCoins;
}

function typeCacheByCoin(id, cachedCoins, notCachedCoins) {
    const cached = getCache(`coin_${id}`);
    if (cached) {
        cachedCoins.push(cached);
    } else {
        notCachedCoins.push(id);
    }
}