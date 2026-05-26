/**
 * Serviços de Integração com a API de Futebol
 * Gerencia a comunicação assíncrona, cabeçalhos de segurança, idempotência e tratamento de erros de rate limit.
 */
const ApiService = {
    // Configurações básicas
    baseUrl: window.location.origin, // Como o frontend é servido na mesma porta, usamos a origem atual
    
    // Armazenamento local da Chave de API ativa
    getApiKey() {
        return localStorage.getItem('football_api_key') || '';
    },
    
    setApiKey(key) {
        localStorage.setItem('football_api_key', key);
        // Despachar evento para atualizar componentes
        window.dispatchEvent(new CustomEvent('apiKeyChanged', { detail: key }));
    },
    
    removeApiKey() {
        localStorage.removeItem('football_api_key');
        window.dispatchEvent(new CustomEvent('apiKeyChanged', { detail: '' }));
    },

    // Auxiliar para gerar UUID v4 para a Chave de Idempotência
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // Callback para escutar atualizações do Rate Limit na interface
    onRateLimitUpdate: null,
    
    // Callback para escutar quando o Rate Limit é excedido (429)
    onRateLimitExceeded: null,

    /**
     * Realiza uma chamada HTTP para a API
     * @param {string} endpoint - O caminho da rota (ex: '/league', '/player/1')
     * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
     * @param {object|null} body - Dados para envio no corpo
     * @returns {Promise<any>} - Resposta da API tratada
     */
    async request(endpoint, method = 'GET', body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        
        // Montar cabeçalhos padrão
        const headers = new Headers({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });
        
        // Injetar API Key se presente (e se a rota for um recurso de dados)
        const apiKey = this.getApiKey();
        if (apiKey) {
            headers.append('X-API-Key', apiKey);
        }
        
        // Injetar Chave de Idempotência para POST (exceto criação de chaves)
        if (method.toUpperCase() === 'POST' && !endpoint.startsWith('/api/keys')) {
            const idempotencyKey = this.generateUUID();
            headers.append('X-Idempotency-Key', idempotencyKey);
        }
        
        const options = {
            method: method.toUpperCase(),
            headers: headers
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        let response;
        try {
            response = await fetch(url, options);
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
        
        // Ler e propagar os dados do Rate Limit dos cabeçalhos de resposta
        const limit = response.headers.get('X-Rate-Limit-Limit');
        const remaining = response.headers.get('X-Rate-Limit-Remaining');
        const reset = response.headers.get('X-Rate-Limit-Reset');
        
        if (limit !== null && remaining !== null && reset !== null) {
            if (typeof this.onRateLimitUpdate === 'function') {
                this.onRateLimitUpdate({
                    limit: parseInt(limit, 10),
                    remaining: parseInt(remaining, 10),
                    reset: parseInt(reset, 10)
                });
            }
        }
        
        // Tratar erros de Rate Limit (429)
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || '60';
            if (typeof this.onRateLimitExceeded === 'function') {
                this.onRateLimitExceeded(parseInt(retryAfter, 10));
            }
            throw new Error('Limite de requisições excedido. Por favor, aguarde.');
        }
        
        // Tratar outros status de erro
        if (!response.ok) {
            let errorMessage = `Erro na requisição (Status: ${response.status})`;
            try {
                const errorData = await response.json();
                // Suporta ProblemDetail e JSONs customizados de erro
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
                // Se não for JSON, mantém o padrão
            }
            
            // Se for 401, notifica que a chave pode estar errada/ausente
            if (response.status === 401) {
                throw new Error(`Não autorizado: ${errorMessage}`);
            }
            
            throw new Error(errorMessage);
        }
        
        // Para respostas 204 (No Content), retorna nulo
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    },

    // Serviços específicos de Ligas
    async getLeagues(page = 0, size = 10, sort = 'name,asc') {
        const query = `page=${page}&size=${size}&sort=${sort}`;
        return await this.request(`/league?${query}`);
    },

    async searchLeagues(name) {
        return await this.request(`/league/search?name=${encodeURIComponent(name)}`);
    },
    
    async getLeague(id) {
        return await this.request(`/league/${id}`);
    },
    
    async createLeague(leagueData) {
        return await this.request('/league', 'POST', leagueData);
    },
    
    async updateLeague(id, leagueData) {
        return await this.request(`/league/${id}`, 'PUT', leagueData);
    },
    
    async deleteLeague(id) {
        return await this.request(`/league/${id}`, 'DELETE');
    },

    // Serviços específicos de Times
    async getTeams(page = 0, size = 10, sort = 'name,asc') {
        const query = `page=${page}&size=${size}&sort=${sort}`;
        return await this.request(`/team?${query}`);
    },

    async searchTeams(name) {
        return await this.request(`/team/search?name=${encodeURIComponent(name)}`);
    },
    
    async getTeam(id) {
        return await this.request(`/team/${id}`);
    },
    
    async createTeam(teamData) {
        return await this.request('/team', 'POST', teamData);
    },
    
    async updateTeam(id, teamData) {
        return await this.request(`/team/${id}`, 'PUT', teamData);
    },
    
    async deleteTeam(id) {
        return await this.request(`/team/${id}`, 'DELETE');
    },

    // Serviços específicos de Jogadores
    async getPlayers(page = 0, size = 10, sort = 'name,asc') {
        const query = `page=${page}&size=${size}&sort=${sort}`;
        return await this.request(`/player?${query}`);
    },

    async searchPlayers(name) {
        return await this.request(`/player/search?name=${encodeURIComponent(name)}`);
    },
    
    async getPlayer(id) {
        return await this.request(`/player/${id}`);
    },
    
    async createPlayer(playerData) {
        return await this.request('/player', 'POST', playerData);
    },
    
    async updatePlayer(id, playerData) {
        return await this.request(`/player/${id}`, 'PUT', playerData);
    },
    
    async deletePlayer(id) {
        return await this.request(`/player/${id}`, 'DELETE');
    },

    // Serviços específicos de Estádios
    async getStadiums(page = 0, size = 10, sort = 'name,asc') {
        const query = `page=${page}&size=${size}&sort=${sort}`;
        return await this.request(`/stadium?${query}`);
    },

    async searchStadiums(name) {
        return await this.request(`/stadium/search?name=${encodeURIComponent(name)}`);
    },
    
    async getStadium(id) {
        return await this.request(`/stadium/${id}`);
    },
    
    async createStadium(stadiumData) {
        return await this.request('/stadium', 'POST', stadiumData);
    },
    
    async updateStadium(id, stadiumData) {
        return await this.request(`/stadium/${id}`, 'PUT', stadiumData);
    },
    
    async deleteStadium(id) {
        return await this.request(`/stadium/${id}`, 'DELETE');
    },

    // Serviços específicos de Partidas
    async getMatches(page = 0, size = 10, sort = 'matchDate,asc') {
        const query = `page=${page}&size=${size}&sort=${sort}`;
        return await this.request(`/match?${query}`);
    },
    
    async getMatch(id) {
        return await this.request(`/match/${id}`);
    },
    
    async createMatch(matchData) {
        return await this.request('/match', 'POST', matchData);
    },
    
    async updateMatch(id, matchData) {
        return await this.request(`/match/${id}`, 'PUT', matchData);
    },
    
    async deleteMatch(id) {
        return await this.request(`/match/${id}`, 'DELETE');
    },

    // Serviços específicos de API Keys
    async getApiKeys() {
        return await this.request('/api/keys');
    },
    
    async generateApiKey(owner, role = 'WRITE') {
        // endpoint expõe POST /api/keys com query params owner e role
        const url = `/api/keys?owner=${encodeURIComponent(owner)}&role=${encodeURIComponent(role)}`;
        return await this.request(url, 'POST');
    }
};
