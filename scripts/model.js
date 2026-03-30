export function factoryObjectCoin(data) {

    const posicao = data['market_cap_rank'];
    const img = data['image'];
    const nome = data['name'];
    const sigla = data['symbol'].toUpperCase();
    const valor = formatValue(data['current_price']);

    const simbolo = data['price_change_percentage_24h'] > 0 ? '+' : '-'
    const variacao = `${simbolo}${Math.abs(data['price_change_percentage_24h']).toFixed(2)}%`;
    const cor_variacao = simbolo == '+' ? 'plus' : 'minor';

    const market = formatMarketCap(data['market_cap']);

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

function formatValue(valor) {
    if (!valor) return 'N/A';

    return `R$ ${valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatMarketCap(valor) {
    if (!valor) return 'N/A';
    
    if (valor >= 1_000_000_000_000) {
        return `R$${(valor / 1_000_000_000_000).toFixed(2)}T`;
    } else if (valor >= 1_000_000_000) {
        return `R$${(valor / 1_000_000_000).toFixed(2)}B`
    } else if (valor >= 1_000_000) {
        return `R$${(valor / 1_000_000).toFixed(2)}M`
    } else if (valor >= 1_000) {
        return `R$${(valor / 1_000).toFixed(2)}k`
    }
    return `R$${valor.toString()}`;
}