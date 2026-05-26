/**
 * Football Manager App - Controlador Front-End (SPA)
 * Orquestra as interações de UI, formulários modais, paginação e integração dinâmica de dados.
 */

// Estado Global do Frontend
const AppState = {
    currentTab: 'dashboard',
    
    // Controle de paginação para cada entidade
    pagination: {
        leagues: { page: 0, size: 5, totalPages: 0 },
        teams: { page: 0, size: 5, totalPages: 0 },
        players: { page: 0, size: 5, totalPages: 0 },
        stadiums: { page: 0, size: 5, totalPages: 0 },
        matches: { page: 0, size: 5, totalPages: 0 }
    },
    
    // Listas auxiliares em cache para preencher dropdowns (select)
    cache: {
        leagues: [],
        stadiums: [],
        teams: []
    }
};

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initRateLimitHandlers();
    initApiKeyHandlers();
    initCRUDHandlers();
    
    // Configura o link dinâmico do Swagger para silenciar avisos de validação estática
    const swaggerLink = document.getElementById('swagger-link');
    if (swaggerLink) {
        swaggerLink.href = ApiService.baseUrl + '/swagger-ui.html';
    }
    
    // Carregar informações iniciais
    updateActiveKeyUI();
    loadDashboardStats();
});

// ==========================================
// 1. GERENCIAMENTO DE NAVEGAÇÃO / SPA
// ==========================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover ativo de todas as abas e adicionar na atual
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Alternar seção visível
            const tabName = item.getAttribute('data-tab');
            AppState.currentTab = tabName;
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.getElementById(`section-${tabName}`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Atualizar título da página no header
            const pageTitles = {
                dashboard: 'Dashboard Geral',
                leagues: 'Gerenciamento de Ligas',
                teams: 'Gerenciamento de Times',
                players: 'Gerenciamento de Jogadores',
                stadiums: 'Gerenciamento de Estádios',
                matches: 'Gerenciamento de Partidas',
                apikeys: 'Configurações de Acesso & API Keys'
            };
            document.getElementById('current-page-title').innerText = pageTitles[tabName] || 'Football API';
            
            // Recarregar os dados da aba selecionada
            loadTabContent(tabName);
        });
    });
}

function loadTabContent(tabName) {
    // Se não houver chave de API e a aba não for chaves de API ou dashboard, avisa o usuário
    const hasKey = ApiService.getApiKey();
    if (!hasKey && tabName !== 'dashboard' && tabName !== 'apikeys') {
        showToast('Para acessar ou modificar dados, configure ou selecione uma Chave de API ativa.', 'warning');
    }

    switch(tabName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'leagues':
            loadLeagues();
            break;
        case 'teams':
            loadTeams();
            break;
        case 'players':
            loadPlayers();
            break;
        case 'stadiums':
            loadStadiums();
            break;
        case 'matches':
            loadMatches();
            break;
        case 'apikeys':
            loadApiKeys();
            break;
    }
}

// ==========================================
// 2. GERENCIAMENTO DE RATE LIMITS
// ==========================================
function initRateLimitHandlers() {
    // Monitor de cabeçalhos de Rate Limit em tempo real
    ApiService.onRateLimitUpdate = (data) => {
        const rateRemaining = document.getElementById('rate-remaining');
        const rateLimitVal = document.getElementById('rate-limit-val');
        const rateResetMetric = document.getElementById('rate-reset-metric');
        const rateResetVal = document.getElementById('rate-reset-val');
        
        rateRemaining.innerText = data.remaining;
        rateLimitVal.innerText = data.limit;
        
        // Mudar cor do status para atenção se as chamadas estiverem acabando
        const metricCard = document.getElementById('rate-limit-metric');
        if (data.remaining <= 3) {
            metricCard.classList.add('warning');
        } else {
            metricCard.classList.remove('warning');
        }
        
        // Exibir e atualizar o tempo restante para redefinição
        if (data.remaining < data.limit) {
            rateResetMetric.style.display = 'flex';
            rateResetVal.innerText = data.reset;
        } else {
            rateResetMetric.style.display = 'none';
        }
    };
    
    // Tratamento de estouro de requisições (Status 429)
    ApiService.onRateLimitExceeded = (retryAfter) => {
        const overlay = document.getElementById('rate-limit-overlay');
        const timerVal = document.getElementById('rate-limit-timer-val');
        
        overlay.classList.add('active');
        let timeLeft = retryAfter || 60;
        timerVal.innerText = timeLeft < 10 ? `0${timeLeft}` : timeLeft;
        
        const countdown = setInterval(() => {
            timeLeft--;
            timerVal.innerText = timeLeft < 10 ? `0${timeLeft}` : timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(countdown);
                overlay.classList.remove('active');
                showToast('Chave de API reativada. Você já pode realizar novas chamadas!', 'success');
            }
        }, 1000);
    };
}

// ==========================================
// 3. GERENCIAMENTO DE API KEYS
// ==========================================
function initApiKeyHandlers() {
    // Formulário de geração de chaves
    const formGenerate = document.getElementById('form-generate-key');
    if (formGenerate) {
        formGenerate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const owner = document.getElementById('key-owner').value;
            const role = document.getElementById('key-role').value;
            
            try {
                const newKey = await ApiService.generateApiKey(owner, role);
                showToast(`Chave criada com sucesso para ${newKey.owner}!`, 'success');
                document.getElementById('key-owner').value = '';
                loadApiKeys();
            } catch (err) {
                showToast(`Falha ao gerar chave: ${err.message}`, 'error');
            }
        });
    }
    
    // Botão de desconectar chave ativa
    document.getElementById('btn-clear-key').addEventListener('click', () => {
        ApiService.removeApiKey();
        showToast('Chave de API desconectada com sucesso.', 'info');
        loadDashboardStats();
    });
    
    // Escutar alterações de chave
    window.addEventListener('apiKeyChanged', () => {
        updateActiveKeyUI();
    });
}

function updateActiveKeyUI() {
    const key = ApiService.getApiKey();
    const activeKeyDisplay = document.getElementById('active-key-display');
    const keyRoleBadge = document.getElementById('key-role-badge');
    
    if (key) {
        activeKeyDisplay.innerText = key;
        
        // Decodificar o papel da chave se for possível listar
        // Como o H2 é temporário, podemos salvar em cookies ou deduzir
        const savedRole = localStorage.getItem('football_api_role') || 'WRITE';
        keyRoleBadge.innerText = savedRole;
        
        // Customizar cores do badge
        keyRoleBadge.className = 'key-status-badge';
        if (savedRole === 'ADMIN') keyRoleBadge.classList.add('badge-role-admin');
        else if (savedRole === 'READ') keyRoleBadge.classList.add('badge-role-read');
        else keyRoleBadge.classList.add('badge-role-write');
        
    } else {
        activeKeyDisplay.innerText = 'Sem chave ativa...';
        keyRoleBadge.innerText = 'NENHUMA';
        keyRoleBadge.className = 'key-status-badge';
    }
}

async function loadApiKeys() {
    const container = document.getElementById('keys-list-container');
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Consultando chaves registradas...</div>';
    
    try {
        const keys = await ApiService.getApiKeys();
        
        if (!keys || keys.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem; background: rgba(0,0,0,0.1); border-radius: 12px;">Nenhuma chave registrada no banco de dados. Utilize o formulário acima para gerar a sua chave inicial de testes!</div>';
            return;
        }
        
        container.innerHTML = '';
        keys.forEach(k => {
            const roleClass = k.role.toUpperCase() === 'ADMIN' ? 'role-admin' : (k.role.toUpperCase() === 'READ' ? 'role-read' : 'role-write');
            const card = document.createElement('div');
            card.className = `api-key-card ${roleClass}`;
            card.innerHTML = `
                <div class="api-key-header">
                    <span class="api-key-owner"><i class="fa-solid fa-user-circle"></i> ${k.owner}</span>
                    <span class="badge badge-role-${k.role.toLowerCase()}">${k.role}</span>
                </div>
                <div class="api-key-box">
                    <span class="api-key-string" title="${k.key}">${k.key}</span>
                    <button class="btn-copy" onclick="copyToClipboard('${k.key}', this)" title="Copiar chave"><i class="fa-regular fa-copy"></i></button>
                </div>
                <div class="api-key-footer">
                    <span class="api-key-status"><span class="dot"></span> ${k.active ? 'Ativa' : 'Inativa'}</span>
                    <button class="btn btn-primary btn-icon" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="activateKey('${k.key}', '${k.role}')">
                        <i class="fa-solid fa-plug"></i> Usar esta Chave
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (err) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 2rem;">Falha ao obter chaves: ${err.message}</div>`;
    }
}

function activateKey(key, role) {
    ApiService.setApiKey(key);
    localStorage.setItem('football_api_role', role);
    updateActiveKeyUI();
    showToast('Chave de API ativa configurada com sucesso!', 'success');
    
    // Recarrega informações
    loadDashboardStats();
}

function copyToClipboard(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
        const icon = btnElement.querySelector('i');
        icon.className = 'fa-solid fa-check text-primary';
        showToast('Chave copiada para a área de transferência!', 'success');
        
        setTimeout(() => {
            icon.className = 'fa-regular fa-copy';
        }, 2000);
    }).catch(() => {
        showToast('Não foi possível copiar automaticamente.', 'error');
    });
}

// ==========================================
// 4. CARREGAMENTO DO DASHBOARD
// ==========================================
async function loadDashboardStats() {
    const countLeagues = document.getElementById('dash-count-leagues');
    const countTeams = document.getElementById('dash-count-teams');
    const countPlayers = document.getElementById('dash-count-players');
    const countStadiums = document.getElementById('dash-count-stadiums');
    
    countLeagues.innerText = '...';
    countTeams.innerText = '...';
    countPlayers.innerText = '...';
    countStadiums.innerText = '...';
    
    const hasKey = ApiService.getApiKey();
    if (!hasKey) {
        const warningTxt = 'Requer Chave';
        countLeagues.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${warningTxt}</span>`;
        countTeams.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${warningTxt}</span>`;
        countPlayers.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${warningTxt}</span>`;
        countStadiums.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${warningTxt}</span>`;
        return;
    }
    
    // Fazer requisições paralelas para pegar os totais
    try {
        const [leaguesRes, teamsRes, playersRes, stadiumsRes] = await Promise.all([
            ApiService.getLeagues(0, 1).catch(() => null),
            ApiService.getTeams(0, 1).catch(() => null),
            ApiService.getPlayers(0, 1).catch(() => null),
            ApiService.getStadiums(0, 1).catch(() => null)
        ]);
        
        // Pega do HATEOAS / PagedModel o totalElements se a resposta for bem-sucedida
        countLeagues.innerText = leaguesRes?.page?.totalElements !== undefined ? leaguesRes.page.totalElements : 0;
        countTeams.innerText = teamsRes?.page?.totalElements !== undefined ? teamsRes.page.totalElements : 0;
        countPlayers.innerText = playersRes?.page?.totalElements !== undefined ? playersRes.page.totalElements : 0;
        countStadiums.innerText = stadiumsRes?.page?.totalElements !== undefined ? stadiumsRes.page.totalElements : 0;
        
    } catch (err) {
        console.error('Falha ao atualizar dashboard', err);
        const errTxt = 'Erro';
        countLeagues.innerHTML = `<span style="font-size: 0.8rem; color: var(--danger);">${errTxt}</span>`;
        countTeams.innerHTML = `<span style="font-size: 0.8rem; color: var(--danger);">${errTxt}</span>`;
        countPlayers.innerHTML = `<span style="font-size: 0.8rem; color: var(--danger);">${errTxt}</span>`;
        countStadiums.innerHTML = `<span style="font-size: 0.8rem; color: var(--danger);">${errTxt}</span>`;
    }
}

// ==========================================
// 5. TOAST / NOTIFICAÇÕES FLUTUANTES
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Escolher ícone apropriado
    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    else if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';
    else if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';
    
    toast.innerHTML = `
        <i class="${iconClass} toast-icon"></i>
        <div class="toast-content">${message}</div>
        <i class="fa-solid fa-xmark toast-close"></i>
    `;
    
    container.appendChild(toast);
    
    // Fechar ao clicar no "X"
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto-destruição após 4 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1) reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ==========================================
// 6. CRUD HANDLERS E MODAIS
// ==========================================
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
    }
}

function initCRUDHandlers() {
    // ---------------- LIGAS ----------------
    document.getElementById('btn-add-league').addEventListener('click', () => {
        document.getElementById('form-league').reset();
        document.getElementById('league-id').value = '';
        document.getElementById('modal-league-title').innerText = 'Cadastrar Nova Liga';
        openModal('modal-league');
    });
    
    document.getElementById('form-league').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('league-id').value;
        const data = {
            name: document.getElementById('league-name').value,
            country: document.getElementById('league-country').value,
            level: parseInt(document.getElementById('league-level').value, 10)
        };
        
        try {
            if (id) {
                await ApiService.updateLeague(id, data);
                showToast('Liga atualizada com sucesso!', 'success');
            } else {
                await ApiService.createLeague(data);
                showToast('Liga cadastrada com sucesso!', 'success');
            }
            closeModal('modal-league');
            loadLeagues();
        } catch (err) {
            showToast(`Falha ao salvar liga: ${err.message}`, 'error');
        }
    });
    
    // Paginação Ligas
    document.getElementById('btn-leagues-prev').addEventListener('click', () => {
        if (AppState.pagination.leagues.page > 0) {
            AppState.pagination.leagues.page--;
            loadLeagues();
        }
    });
    document.getElementById('btn-leagues-next').addEventListener('click', () => {
        if (AppState.pagination.leagues.page < AppState.pagination.leagues.totalPages - 1) {
            AppState.pagination.leagues.page++;
            loadLeagues();
        }
    });
    
    // Busca instantânea Ligas
    let leagueSearchTimeout;
    document.getElementById('search-league-input').addEventListener('input', (e) => {
        clearTimeout(leagueSearchTimeout);
        leagueSearchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query) {
                searchLeagues(query);
            } else {
                loadLeagues();
            }
        }, 400);
    });

    // ---------------- TIMES ----------------
    document.getElementById('btn-add-team').addEventListener('click', () => {
        document.getElementById('form-team').reset();
        document.getElementById('team-id').value = '';
        document.getElementById('modal-team-title').innerText = 'Cadastrar Novo Time';
        openModal('modal-team');
    });
    
    document.getElementById('form-team').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('team-id').value;
        
        const data = {
            name: document.getElementById('team-name').value,
            city: document.getElementById('team-city').value,
            coach: document.getElementById('team-coach').value
        };
        
        try {
            if (id) {
                await ApiService.updateTeam(id, data);
                showToast('Time atualizado com sucesso!', 'success');
            } else {
                await ApiService.createTeam(data);
                showToast('Time cadastrado com sucesso!', 'success');
            }
            closeModal('modal-team');
            loadTeams();
        } catch (err) {
            showToast(`Falha ao salvar time: ${err.message}`, 'error');
        }
    });
    
    // Paginação Times
    document.getElementById('btn-teams-prev').addEventListener('click', () => {
        if (AppState.pagination.teams.page > 0) {
            AppState.pagination.teams.page--;
            loadTeams();
        }
    });
    document.getElementById('btn-teams-next').addEventListener('click', () => {
        if (AppState.pagination.teams.page < AppState.pagination.teams.totalPages - 1) {
            AppState.pagination.teams.page++;
            loadTeams();
        }
    });
    
    // Busca instantânea Times
    let teamSearchTimeout;
    document.getElementById('search-team-input').addEventListener('input', (e) => {
        clearTimeout(teamSearchTimeout);
        teamSearchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query) {
                searchTeams(query);
            } else {
                loadTeams();
            }
        }, 400);
    });

    // ---------------- JOGADORES ----------------
    document.getElementById('btn-add-player').addEventListener('click', async () => {
        document.getElementById('form-player').reset();
        document.getElementById('player-id').value = '';
        document.getElementById('modal-player-title').innerText = 'Cadastrar Novo Jogador';
        
        await populateTeamsDropdown('player-team');
        openModal('modal-player');
    });
    
    document.getElementById('form-player').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('player-id').value;
        const teamId = document.getElementById('player-team').value;
        
        const data = {
            name: document.getElementById('player-name').value,
            position: document.getElementById('player-position').value,
            age: parseInt(document.getElementById('player-age').value, 10),
            team: { id: parseInt(teamId, 10) }
        };
        
        try {
            if (id) {
                await ApiService.updatePlayer(id, data);
                showToast('Jogador atualizado com sucesso!', 'success');
            } else {
                await ApiService.createPlayer(data);
                showToast('Jogador cadastrado com sucesso!', 'success');
            }
            closeModal('modal-player');
            loadPlayers();
        } catch (err) {
            showToast(`Falha ao salvar jogador: ${err.message}`, 'error');
        }
    });
    
    // Paginação Jogadores
    document.getElementById('btn-players-prev').addEventListener('click', () => {
        if (AppState.pagination.players.page > 0) {
            AppState.pagination.players.page--;
            loadPlayers();
        }
    });
    document.getElementById('btn-players-next').addEventListener('click', () => {
        if (AppState.pagination.players.page < AppState.pagination.players.totalPages - 1) {
            AppState.pagination.players.page++;
            loadPlayers();
        }
    });
    
    // Busca instantânea Jogadores
    let playerSearchTimeout;
    document.getElementById('search-player-input').addEventListener('input', (e) => {
        clearTimeout(playerSearchTimeout);
        playerSearchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query) {
                searchPlayers(query);
            } else {
                loadPlayers();
            }
        }, 400);
    });

    // ---------------- ESTÁDIOS ----------------
    document.getElementById('btn-add-stadium').addEventListener('click', () => {
        document.getElementById('form-stadium').reset();
        document.getElementById('stadium-id').value = '';
        document.getElementById('modal-stadium-title').innerText = 'Cadastrar Novo Estádio';
        openModal('modal-stadium');
    });
    
    document.getElementById('form-stadium').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('stadium-id').value;
        const data = {
            name: document.getElementById('stadium-name').value,
            capacity: parseInt(document.getElementById('stadium-capacity').value, 10),
            city: document.getElementById('stadium-city').value,
            type: document.getElementById('stadium-type').value
        };
        
        try {
            if (id) {
                await ApiService.updateStadium(id, data);
                showToast('Estádio atualizado com sucesso!', 'success');
            } else {
                await ApiService.createStadium(data);
                showToast('Estádio cadastrado com sucesso!', 'success');
            }
            closeModal('modal-stadium');
            loadStadiums();
        } catch (err) {
            showToast(`Falha ao salvar estádio: ${err.message}`, 'error');
        }
    });
    
    // Paginação Estádios
    document.getElementById('btn-stadiums-prev').addEventListener('click', () => {
        if (AppState.pagination.stadiums.page > 0) {
            AppState.pagination.stadiums.page--;
            loadStadiums();
        }
    });
    document.getElementById('btn-stadiums-next').addEventListener('click', () => {
        if (AppState.pagination.stadiums.page < AppState.pagination.stadiums.totalPages - 1) {
            AppState.pagination.stadiums.page++;
            loadStadiums();
        }
    });
    
    // Busca instantânea Estádios
    let stadiumSearchTimeout;
    document.getElementById('search-stadium-input').addEventListener('input', (e) => {
        clearTimeout(stadiumSearchTimeout);
        stadiumSearchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query) {
                searchStadiums(query);
            } else {
                loadStadiums();
            }
        }, 400);
    });

    // ---------------- PARTIDAS ----------------
    document.getElementById('btn-add-match').addEventListener('click', async () => {
        document.getElementById('form-match').reset();
        document.getElementById('match-id').value = '';
        document.getElementById('modal-match-title').innerText = 'Agendar Nova Partida';
        
        // Define data/hora padrão para agora
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('match-date').value = now.toISOString().slice(0, 16);
        
        await Promise.all([
            populateTeamsDropdown('match-home-team'),
            populateTeamsDropdown('match-away-team'),
            populateStadiumsDropdown('match-stadium')
        ]);
        
        openModal('modal-match');
    });
    
    document.getElementById('form-match').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('match-id').value;
        const homeId = document.getElementById('match-home-team').value;
        const awayId = document.getElementById('match-away-team').value;
        const stadiumId = document.getElementById('match-stadium').value;
        
        if (homeId === awayId) {
            showToast('O time mandante não pode ser idêntico ao time visitante!', 'warning');
            return;
        }
        
        const data = {
            homeTeam: { id: parseInt(homeId, 10) },
            awayTeam: { id: parseInt(awayId, 10) },
            homeTeamGoals: parseInt(document.getElementById('match-home-goals').value, 10),
            awayTeamGoals: parseInt(document.getElementById('match-away-goals').value, 10),
            stadium: { id: parseInt(stadiumId, 10) },
            matchDate: new Date(document.getElementById('match-date').value).toISOString(),
            status: document.getElementById('match-status').value
        };
        
        try {
            if (id) {
                await ApiService.updateMatch(id, data);
                showToast('Partida atualizada com sucesso!', 'success');
            } else {
                await ApiService.createMatch(data);
                showToast('Partida agendada com sucesso!', 'success');
            }
            closeModal('modal-match');
            loadMatches();
        } catch (err) {
            showToast(`Falha ao salvar partida: ${err.message}`, 'error');
        }
    });
    
    // Paginação Partidas
    document.getElementById('btn-matches-prev').addEventListener('click', () => {
        if (AppState.pagination.matches.page > 0) {
            AppState.pagination.matches.page--;
            loadMatches();
        }
    });
    document.getElementById('btn-matches-next').addEventListener('click', () => {
        if (AppState.pagination.matches.page < AppState.pagination.matches.totalPages - 1) {
            AppState.pagination.matches.page++;
            loadMatches();
        }
    });
}

// ==========================================
// 7. MÉTODOS DE BUSCA E CARREGAMENTO DE TABELAS (AJAX)
// ==========================================

// LIGAS
async function loadLeagues() {
    const tbody = document.getElementById('leagues-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Consultando ligas...</td></tr>';
    
    try {
        const pagObj = AppState.pagination.leagues;
        const res = await ApiService.getLeagues(pagObj.page, pagObj.size);
        const data = res?._embedded?.leagueList || [];
        
        pagObj.totalPages = res?.page?.totalPages || 0;
        document.getElementById('leagues-page-info').innerText = `Mostrando liga ${data.length > 0 ? pagObj.page * pagObj.size + 1 : 0}-${pagObj.page * pagObj.size + data.length} de ${res?.page?.totalElements || 0}`;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhuma liga encontrada.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${l.id}</strong></td>
                <td>${l.name}</td>
                <td><i class="fa-solid fa-earth-americas text-primary" style="margin-right: 0.35rem;"></i> ${l.country}</td>
                <td>Nível ${l.level}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-secondary btn-icon" onclick="editLeague(${l.id})" title="Editar liga"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-icon" onclick="deleteLeague(${l.id})" title="Excluir liga"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Erro: ${err.message}</td></tr>`;
    }
}

async function searchLeagues(name) {
    const tbody = document.getElementById('leagues-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Filtrando ligas...</td></tr>';
    
    try {
        const data = await ApiService.searchLeagues(name) || [];
        document.getElementById('leagues-page-info').innerText = `Busca encontrou ${data.length} liga(s)`;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhuma liga correspondente encontrada.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(item => {
            const l = item.content || item;
            trHTML(l, tbody);
        });
        
        function trHTML(l, container) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${l.id}</strong></td>
                <td>${l.name}</td>
                <td><i class="fa-solid fa-earth-americas text-primary" style="margin-right: 0.35rem;"></i> ${l.country}</td>
                <td>Nível ${l.level}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-secondary btn-icon" onclick="editLeague(${l.id})" title="Editar liga"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-icon" onclick="deleteLeague(${l.id})" title="Excluir liga"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            container.appendChild(tr);
        }
        
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Erro: ${err.message}</td></tr>`;
    }
}

async function editLeague(id) {
    try {
        const l = await ApiService.getLeague(id);
        document.getElementById('league-id').value = l.id;
        document.getElementById('league-name').value = l.name;
        document.getElementById('league-country').value = l.country;
        document.getElementById('league-level').value = l.level;
        
        document.getElementById('modal-league-title').innerText = `Editar Liga #${l.id}`;
        openModal('modal-league');
    } catch (err) {
        showToast(`Erro ao carregar liga: ${err.message}`, 'error');
    }
}

async function deleteLeague(id) {
    if (confirm(`Tem certeza absoluta que deseja remover permanentemente a Liga #${id}?`)) {
        try {
            await ApiService.deleteLeague(id);
            showToast('Liga removida com sucesso!', 'success');
            loadLeagues();
        } catch (err) {
            showToast(`Falha ao excluir liga: ${err.message}`, 'error');
        }
    }
}

// TIMES
async function loadTeams() {
    const tbody = document.getElementById('teams-table-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Consultando clubes...</td></tr>';
    
    try {
        const pagObj = AppState.pagination.teams;
        const res = await ApiService.getTeams(pagObj.page, pagObj.size);
        const data = res?._embedded?.teamList || [];
        
        pagObj.totalPages = res?.page?.totalPages || 0;
        document.getElementById('teams-page-info').innerText = `Mostrando time ${data.length > 0 ? pagObj.page * pagObj.size + 1 : 0}-${pagObj.page * pagObj.size + data.length} de ${res?.page?.totalElements || 0}`;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Nenhum clube encontrado.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${t.id}</strong></td>
                <td>
                    <div class="avatar-info">
                        <div class="avatar-placeholder">${t.name.charAt(0)}</div>
                        <span>${t.name}</span>
                    </div>
                </td>
                <td>${t.city}</td>
                <td><i class="fa-solid fa-user-tie text-secondary" style="margin-right: 0.35rem;"></i> ${t.coach || 'Sem treinador'}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-secondary btn-icon" onclick="editTeam(${t.id})" title="Editar clube"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-icon" onclick="deleteTeam(${t.id})" title="Excluir clube"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Erro: ${err.message}</td></tr>`;
    }
}

async function searchTeams(name) {
    const tbody = document.getElementById('teams-table-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Filtrando clubes...</td></tr>';
    
    try {
        const data = await ApiService.searchTeams(name) || [];
        document.getElementById('teams-page-info').innerText = `Busca encontrou ${data.length} time(s)`;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Nenhum clube correspondente encontrado.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(item => {
            const t = item.content || item;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${t.id}</strong></td>
                <td>
                    <div class="avatar-info">
                        <div class="avatar-placeholder">${t.name.charAt(0)}</div>
                        <span>${t.name}</span>
                    </div>
                </td>
                <td>${t.city}</td>
                <td><i class="fa-solid fa-user-tie text-secondary" style="margin-right: 0.35rem;"></i> ${t.coach || 'Sem treinador'}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-secondary btn-icon" onclick="editTeam(${t.id})" title="Editar clube"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-icon" onclick="deleteTeam(${t.id})" title="Excluir clube"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Erro: ${err.message}</td></tr>`;
    }
}

async function editTeam(id) {
    try {
        const t = await ApiService.getTeam(id);
        
        document.getElementById('team-id').value = t.id;
        document.getElementById('team-name').value = t.name;
        document.getElementById('team-city').value = t.city;
        document.getElementById('team-coach').value = t.coach || '';
        
        document.getElementById('modal-team-title').innerText = `Editar Clube #${t.id}`;
        openModal('modal-team');
    } catch (err) {
        showToast(`Erro ao carregar time: ${err.message}`, 'error');
    }
}

async function deleteTeam(id) {
    if (confirm(`Tem certeza que deseja remover o clube #${id}? Todos os jogadores associados poderão ficar sem time.`)) {
        try {
            await ApiService.deleteTeam(id);
            showToast('Clube excluído com sucesso!', 'success');
            loadTeams();
        } catch (err) {
            showToast(`Falha ao excluir time: ${err.message}`, 'error');
        }
    }
}

// JOGADORES
async function loadPlayers() {
    const tbody = document.getElementById('players-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Consultando elenco...</td></tr>';
    
    try {
        const pagObj = AppState.pagination.players;
        const res = await ApiService.getPlayers(pagObj.page, pagObj.size);
        const data = res?._embedded?.playerList || [];
        
        pagObj.totalPages = res?.page?.totalPages || 0;
        document.getElementById('players-page-info').innerText = `Mostrando jogador ${data.length > 0 ? pagObj.page * pagObj.size + 1 : 0}-${pagObj.page * pagObj.size + data.length} de ${res?.page?.totalElements || 0}`;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum atleta encontrado.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${p.id}</strong></td>
                <td>
                    <div class="avatar-info">
                        <div class="avatar-placeholder" style="background: linear-gradient(135deg, var(--warning) 0%, var(--danger) 100%)">${p.name.charAt(0)}</div>
                        <span>${p.name}</span>
                    </div>
                </td>
                <td><span class="badge badge-role-write">${translatePosition(p.position)}</span></td>
                <td>${p.age} anos</td>
                <td><strong class="text-primary">${p.team?.name || 'Livre no mercado'}</strong></td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-secondary btn-icon" onclick="editPlayer(${p.id})" title="Editar atleta"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-icon" onclick="deletePlayer(${p.id})" title="Remover atleta"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Erro: ${err.message}</td></tr>`;
    }
}

async function searchPlayers(name) {
    const tbody = document.getElementById('players-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Filtrando atletas...</td></tr>';
    
    try {
        const data = await ApiService.searchPlayers(name) || [];
        document.getElementById('players-page-info').innerText = `Busca encontrou ${data.length} jogador(es)`;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum jogador correspondente encontrado.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(item => {
            const p = item.content || item;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${p.id}</strong></td>
                <td>
                    <div class="avatar-info">
                        <div class="avatar-placeholder" style="background: linear-gradient(135deg, var(--warning) 0%, var(--danger) 100%)">${p.name.charAt(0)}</div>
                        <span>${p.name}</span>
                    </div>
                </td>
                <td><span class="badge badge-role-write">${translatePosition(p.position)}</span></td>
                <td>${p.age} anos</td>
                <td><strong class="text-primary">${p.team?.name || 'Livre no mercado'}</strong></td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-secondary btn-icon" onclick="editPlayer(${p.id})" title="Editar atleta"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-icon" onclick="deletePlayer(${p.id})" title="Remover atleta"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Erro: ${err.message}</td></tr>`;
    }
}

async function editPlayer(id) {
    try {
        const p = await ApiService.getPlayer(id);
        
        await populateTeamsDropdown('player-team');
        
        document.getElementById('player-id').value = p.id;
        document.getElementById('player-name').value = p.name;
        document.getElementById('player-position').value = p.position;
        document.getElementById('player-age').value = p.age;
        document.getElementById('player-team').value = p.team?.id || '';
        
        document.getElementById('modal-player-title').innerText = `Editar Atleta #${p.id}`;
        openModal('modal-player');
    } catch (err) {
        showToast(`Erro ao carregar jogador: ${err.message}`, 'error');
    }
}

async function deletePlayer(id) {
    if (confirm(`Deseja demitir permanentemente o jogador #${id}?`)) {
        try {
            await ApiService.deletePlayer(id);
            showToast('Jogador desligado do clube com sucesso!', 'success');
            loadPlayers();
        } catch (err) {
            showToast(`Falha ao excluir jogador: ${err.message}`, 'error');
        }
    }
}

function translatePosition(pos) {
    const mapping = {
        GOALKEEPER: 'Goleiro',
        DEFENDER: 'Defensor',
        MIDFIELDER: 'Meio-campista',
        FORWARD: 'Atacante'
    };
    return mapping[pos] || pos;
}

// ESTÁDIOS
async function loadStadiums() {
    const tbody = document.getElementById('stadiums-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Consultando praças esportivas...</td></tr>';
    
    try {
        const pagObj = AppState.pagination.stadiums;
        const res = await ApiService.getStadiums(pagObj.page, pagObj.size);
        const data = res?._embedded?.stadiumList || [];
        
        pagObj.totalPages = res?.page?.totalPages || 0;
        document.getElementById('stadiums-page-info').innerText = `Mostrando estádio ${data.length > 0 ? pagObj.page * pagObj.size + 1 : 0}-${pagObj.page * pagObj.size + data.length} de ${res?.page?.totalElements || 0}`;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum estádio cadastrado.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${s.id}</strong></td>
                <td><i class="fa-solid fa-hotel text-primary" style="margin-right: 0.35rem;"></i> ${s.name}</td>
                <td>${s.capacity.toLocaleString()} torcedores</td>
                <td>${s.city}</td>
                <td>${s.type}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-secondary btn-icon" onclick="editStadium(${s.id})" title="Editar estádio"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-icon" onclick="deleteStadium(${s.id})" title="Excluir estádio"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Erro: ${err.message}</td></tr>`;
    }
}

async function searchStadiums(name) {
    const tbody = document.getElementById('stadiums-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Filtrando praças esportivas...</td></tr>';
    
    try {
        const data = await ApiService.searchStadiums(name) || [];
        document.getElementById('stadiums-page-info').innerText = `Busca encontrou ${data.length} estádio(s)`;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum estádio correspondente encontrado.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(item => {
            const s = item.content || item;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${s.id}</strong></td>
                <td><i class="fa-solid fa-hotel text-primary" style="margin-right: 0.35rem;"></i> ${s.name}</td>
                <td>${s.capacity.toLocaleString()} torcedores</td>
                <td>${s.city}</td>
                <td>${s.type}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-secondary btn-icon" onclick="editStadium(${s.id})" title="Editar estádio"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-icon" onclick="deleteStadium(${s.id})" title="Excluir estádio"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Erro: ${err.message}</td></tr>`;
    }
}

async function editStadium(id) {
    try {
        const s = await ApiService.getStadium(id);
        document.getElementById('stadium-id').value = s.id;
        document.getElementById('stadium-name').value = s.name;
        document.getElementById('stadium-capacity').value = s.capacity;
        document.getElementById('stadium-city').value = s.city;
        document.getElementById('stadium-type').value = s.type;
        
        document.getElementById('modal-stadium-title').innerText = `Editar Estádio #${s.id}`;
        openModal('modal-stadium');
    } catch (err) {
        showToast(`Erro ao carregar estádio: ${err.message}`, 'error');
    }
}

async function deleteStadium(id) {
    if (confirm(`Deseja realmente remover o estádio #${id}?`)) {
        try {
            await ApiService.deleteStadium(id);
            showToast('Estádio excluído com sucesso!', 'success');
            loadStadiums();
        } catch (err) {
            showToast(`Falha ao excluir estádio: ${err.message}`, 'error');
        }
    }
}

// PARTIDAS
async function loadMatches() {
    const tbody = document.getElementById('matches-table-body');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Consultando rodada...</td></tr>';
    
    try {
        const pagObj = AppState.pagination.matches;
        const res = await ApiService.getMatches(pagObj.page, pagObj.size);
        const data = res?._embedded?.matchList || [];
        
        pagObj.totalPages = res?.page?.totalPages || 0;
        document.getElementById('matches-page-info').innerText = `Mostrando partida ${data.length > 0 ? pagObj.page * pagObj.size + 1 : 0}-${pagObj.page * pagObj.size + data.length} de ${res?.page?.totalElements || 0}`;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Nenhum jogo agendado.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(m => {
            const tr = document.createElement('tr');
            
            // Formatador de data e hora local
            const dateFormatted = new Date(m.matchDate).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Placar estilizado
            let scoreDisplay = `<span style="font-weight: 700; font-size: 1.1rem; padding: 0.2rem 0.5rem; background: rgba(0,0,0,0.4); border-radius: 6px;">${m.homeTeamGoals} - ${m.awayTeamGoals}</span>`;
            if (m.status === 'SCHEDULED') {
                scoreDisplay = `<span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 600;">VS</span>`;
            }
            
            // Badge de status
            const statusClass = m.status === 'LIVE' ? 'badge-match-live' : (m.status === 'FINISHED' ? 'badge-match-finished' : 'badge-match-scheduled');
            const statusText = m.status === 'LIVE' ? 'AO VIVO' : (m.status === 'FINISHED' ? 'CONCLUÍDO' : 'AGENDADO');
            
            tr.innerHTML = `
                <td><strong>#${m.id}</strong></td>
                <td><span style="font-weight: 500;">${m.homeTeam?.name}</span></td>
                <td style="text-align: center;">${scoreDisplay}</td>
                <td><span style="font-weight: 500;">${m.awayTeam?.name}</span></td>
                <td><i class="fa-solid fa-landmark text-secondary" style="margin-right: 0.35rem;"></i> ${m.stadium?.name}</td>
                <td>${dateFormatted}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-secondary btn-icon" onclick="editMatch(${m.id})" title="Editar partida"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-icon" onclick="deleteMatch(${m.id})" title="Excluir partida"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger);">Erro: ${err.message}</td></tr>`;
    }
}

async function editMatch(id) {
    try {
        const m = await ApiService.getMatch(id);
        
        await Promise.all([
            populateTeamsDropdown('match-home-team'),
            populateTeamsDropdown('match-away-team'),
            populateStadiumsDropdown('match-stadium')
        ]);
        
        document.getElementById('match-id').value = m.id;
        document.getElementById('match-home-team').value = m.homeTeam?.id || '';
        document.getElementById('match-away-team').value = m.awayTeam?.id || '';
        document.getElementById('match-home-goals').value = m.homeTeamGoals;
        document.getElementById('match-away-goals').value = m.awayTeamGoals;
        document.getElementById('match-stadium').value = m.stadium?.id || '';
        document.getElementById('match-status').value = m.status;
        
        // Conversão de data para datetime-local
        const dateObj = new Date(m.matchDate);
        dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
        document.getElementById('match-date').value = dateObj.toISOString().slice(0, 16);
        
        document.getElementById('modal-match-title').innerText = `Editar Partida #${m.id}`;
        openModal('modal-match');
    } catch (err) {
        showToast(`Erro ao carregar partida: ${err.message}`, 'error');
    }
}

async function deleteMatch(id) {
    if (confirm(`Deseja excluir a Partida #${id}?`)) {
        try {
            await ApiService.deleteMatch(id);
            showToast('Partida cancelada e removida com sucesso!', 'success');
            loadMatches();
        } catch (err) {
            showToast(`Falha ao excluir partida: ${err.message}`, 'error');
        }
    }
}

// ==========================================
// 8. AUXILIARES: DROP-DOWNS DINÂMICOS
// ==========================================

async function populateLeaguesDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Buscando ligas disponíveis...</option>';
    
    try {
        // Pega uma lista de 50 ligas para garantir que todas apareçam
        const res = await ApiService.getLeagues(0, 50);
        const data = res?._embedded?.leagueList || [];
        AppState.cache.leagues = data;
        
        if (data.length === 0) {
            select.innerHTML = '<option value="">Nenhuma liga disponível. Cadastre uma primeiro!</option>';
            return;
        }
        
        select.innerHTML = '<option value="" disabled selected>Escolha a liga...</option>';
        data.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = `${l.name} (${l.country})`;
            select.appendChild(opt);
        });
    } catch (err) {
        select.innerHTML = '<option value="">Erro ao obter ligas...</option>';
    }
}

async function populateStadiumsDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Buscando estádios disponíveis...</option>';
    
    try {
        const res = await ApiService.getStadiums(0, 50);
        const data = res?._embedded?.stadiumList || [];
        AppState.cache.stadiums = data;
        
        if (data.length === 0) {
            select.innerHTML = '<option value="">Nenhum estádio disponível. Cadastre um primeiro!</option>';
            return;
        }
        
        select.innerHTML = '<option value="" disabled selected>Escolha o estádio...</option>';
        data.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.innerText = `${s.name} (${s.city} - ${s.capacity.toLocaleString()} cap.)`;
            select.appendChild(opt);
        });
    } catch (err) {
        select.innerHTML = '<option value="">Erro ao obter estádios...</option>';
    }
}

async function populateTeamsDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Buscando times disponíveis...</option>';
    
    try {
        const res = await ApiService.getTeams(0, 50);
        const data = res?._embedded?.teamList || [];
        AppState.cache.teams = data;
        
        if (data.length === 0) {
            select.innerHTML = '<option value="">Nenhum time disponível. Cadastre um primeiro!</option>';
            return;
        }
        
        select.innerHTML = '<option value="" disabled selected>Escolha o time...</option>';
        data.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.innerText = `${t.name} (${t.city})`;
            select.appendChild(opt);
        });
    } catch (err) {
        select.innerHTML = '<option value="">Erro ao obter times...</option>';
    }
}
