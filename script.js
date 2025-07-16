document.addEventListener('DOMContentLoaded', () => {

    // --- SELETTORI ELEMENTI DOM ---
    const screens = { home: document.getElementById('homeScreen'), decision: document.getElementById('decisionScreen') };
    const addTopicBtn = document.getElementById('addTopicBtn');
    const backBtn = document.getElementById('backBtn');
    const shareBtn = document.getElementById('shareBtn');
    const recentTopicsContainer = document.getElementById('recentTopics');
    const topicTitle = document.getElementById('topicTitle');
    const proList = document.getElementById('proList');
    const conList = document.getElementById('conList');
    const proInput = document.getElementById('proInput');
    const proScore = document.getElementById('proScore');
    const addProBtn = document.getElementById('addProBtn');
    const conInput = document.getElementById('conInput');
    const conScore = document.getElementById('conScore');
    const addConBtn = document.getElementById('addConBtn');
    const mobileComparisonView = document.getElementById('mobileComparisonView');
    const proBar = document.getElementById('proBar');
    const conBar = document.getElementById('conBar');

    // --- STATO APPLICAZIONE ---
    let state = {
        topics: JSON.parse(localStorage.getItem('proConTopics')) || [],
        currentTopicId: null,
    };

    // --- FUNZIONI DI BASE ---
    const saveState = () => localStorage.setItem('proConTopics', JSON.stringify(state.topics));
    const navigate = (screenName) => {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    };

    // --- FUNZIONI DI RENDERING ---
    const renderHomeScreen = () => {
        recentTopicsContainer.innerHTML = '';
        if (state.topics.length === 0) {
            recentTopicsContainer.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>Nessuna decisione ancora.<br>Inizia premendo il pulsante '+'!</p></div>`;
            return;
        }

        state.topics.forEach(topic => {
            const card = document.createElement('div');
            card.className = 'topic-card';
            card.dataset.id = topic.id;
            card.innerHTML = `
                <div class="topic-card-content" data-id="${topic.id}">
                    <span class="topic-card-title">${topic.title}</span>
                    <div class="topic-card-summary">
                        <span class="pro"><i class="fas fa-thumbs-up"></i> ${topic.pros.length}</span>
                        <span class="con"><i class="fas fa-thumbs-down"></i> ${topic.cons.length}</span>
                    </div>
                </div>
                <button class="topic-delete-btn" data-id="${topic.id}" aria-label="Elimina lista"><i class="fas fa-trash-alt"></i></button>
            `;
            recentTopicsContainer.prepend(card);
        });
    };

    const renderDecisionScreen = () => {
        const topic = state.topics.find(t => t.id === state.currentTopicId);
        if (!topic) { navigate('home'); return; }

        topicTitle.textContent = topic.title;
        proList.innerHTML = '';
        conList.innerHTML = '';
        topic.pros.forEach(item => addListItemDOM(item, 'pro'));
        topic.cons.forEach(item => addListItemDOM(item, 'con'));
        renderMobileTableView(topic);
        updateChart();
    };

    const addListItemDOM = (item, type) => {
        const list = type === 'pro' ? proList : conList;
        const li = document.createElement('div');
        li.className = `list-item ${type}-item`;
        li.innerHTML = `
            <div class="item-content"><span class="item-text">${item.text}</span></div>
            <span class="item-score">${item.score}</span>
            <button class="delete-item-btn" data-id="${item.id}" data-type="${type}"><i class="fas fa-trash-alt"></i></button>
        `;
        list.prepend(li);
    };

    const renderMobileTableView = (topic) => {
        const maxLength = Math.max(topic.pros.length, topic.cons.length);
        let tableHTML = `<table class="comparison-table"><thead><tr><th class="pro-header"><i class="fas fa-thumbs-up"></i> Pro</th><th class="con-header"><i class="fas fa-thumbs-down"></i> Contro</th></tr></thead><tbody>`;

        if (maxLength === 0) {
            tableHTML += `<tr><td colspan="2" class="placeholder">Nessun elemento.</td></tr>`;
        } else {
            for (let i = 0; i < maxLength; i++) {
                const proItem = topic.pros[i];
                const conItem = topic.cons[i];
                tableHTML += `<tr>`;
                tableHTML += `<td class="pro-cell">${proItem ? `<div class="item-cell-content"><span class="text">${proItem.text}</span><span class="score">${proItem.score}</span><button class="mobile-delete-btn" data-id="${proItem.id}" data-type="pro"><i class="fas fa-times"></i></button></div>` : ''}</td>`;
                tableHTML += `<td class="con-cell">${conItem ? `<div class="item-cell-content"><span class="text">${conItem.text}</span><span class="score">${conItem.score}</span><button class="mobile-delete-btn" data-id="${conItem.id}" data-type="con"><i class="fas fa-times"></i></button></div>` : ''}</td>`;
                tableHTML += `</tr>`;
            }
        }
        tableHTML += `</tbody></table>`;
        mobileComparisonView.innerHTML = tableHTML;
    };

    // --- FUNZIONI DI LOGICA (CRUD) ---
    const addListItem = (type) => {
        const input = type === 'pro' ? proInput : conInput;
        const scoreInput = type === 'pro' ? proScore : conScore;
        if (input.value.trim() === '') return;
        const topic = state.topics.find(t => t.id === state.currentTopicId);
        const newItem = { id: Date.now(), text: input.value.trim(), score: parseInt(scoreInput.value) || 1 };
        topic[type === 'pro' ? 'pros' : 'cons'].push(newItem);
        saveState();
        renderDecisionScreen();
        input.value = '';
        scoreInput.value = '';
        input.focus();
    };

    const deleteListItem = (itemId, type) => {
        Swal.fire({
            title: 'Sei sicuro?',
            text: "Non potrai recuperare questo elemento!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sì, eliminalo!',
            cancelButtonText: 'Annulla'
        }).then((result) => {
            if (result.isConfirmed) {
                const topic = state.topics.find(t => t.id === state.currentTopicId);
                const listType = type === 'pro' ? 'pros' : 'cons';
                topic[listType] = topic[listType].filter(item => item.id !== itemId);
                saveState();
                renderDecisionScreen();
                Swal.fire('Eliminato!', 'L\'elemento è stato rimosso.', 'success');
            }
        });
    };

    const deleteTopic = (topicId) => {
        Swal.fire({
            title: 'Sei sicuro di eliminare questa lista?',
            text: "L'azione è irreversibile!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina tutto!',
            cancelButtonText: 'Annulla'
        }).then((result) => {
            if (result.isConfirmed) {
                state.topics = state.topics.filter(t => t.id !== topicId);
                saveState();
                renderHomeScreen();
                Swal.fire('Eliminata!', 'La lista è stata rimossa con successo.', 'success');
            }
        });
    };

    const updateChart = () => {
        const topic = state.topics.find(t => t.id === state.currentTopicId);
        if (!topic) return;
        const proTotal = topic.pros.reduce((sum, item) => sum + item.score, 0);
        const conTotal = topic.cons.reduce((sum, item) => sum + item.score, 0);
        const totalScore = proTotal + conTotal;
        proBar.style.width = totalScore === 0 ? '50%' : `${(proTotal / totalScore) * 100}%`;
        conBar.style.width = totalScore === 0 ? '50%' : `${(conTotal / totalScore) * 100}%`;
    };

    const shareDecision = () => {
        const topic = state.topics.find(t => t.id === state.currentTopicId);
        if (!navigator.share) {
            Swal.fire('Oops...', 'La condivisione non è supportata su questo browser.', 'error');
            return;
        }

        let shareText = `Decisione: ${topic.title}\n\n`;
        shareText += `👍 PRO:\n`;
        topic.pros.forEach(p => shareText += `- ${p.text} (Peso: ${p.score})\n`);

        shareText += `\n👎 CONTRO:\n`;
        topic.cons.forEach(c => shareText += `- ${c.text} (Peso: ${c.score})\n`);

        navigator.share({
            title: `Decisione: ${topic.title}`,
            text: shareText,
        }).catch(err => console.error("Errore di condivisione:", err));
    };


    // --- EVENT LISTENERS ---
    addTopicBtn.addEventListener('click', async () => {
        const { value: title } = await Swal.fire({
            title: 'Nuova Decisione', input: 'text', inputPlaceholder: 'Es: Comprare una nuova auto?',
            showCancelButton: true, confirmButtonText: 'Crea', cancelButtonText: 'Annulla',
            inputValidator: (value) => !value && 'Devi inserire un argomento!'
        });
        if (title) {
            const newTopic = { id: Date.now(), title: title, pros: [], cons: [] };
            state.topics.push(newTopic);
            saveState();
            state.currentTopicId = newTopic.id;
            renderDecisionScreen();
            navigate('decision');
            renderHomeScreen();
        }
    });

    backBtn.addEventListener('click', () => { renderHomeScreen(); navigate('home'); });
    addProBtn.addEventListener('click', () => addListItem('pro'));
    proInput.addEventListener('keypress', (e) => e.key === 'Enter' && addListItem('pro'));
    addConBtn.addEventListener('click', () => addListItem('con'));
    conInput.addEventListener('keypress', (e) => e.key === 'Enter' && addListItem('con'));
    shareBtn.addEventListener('click', shareDecision);

    // Event Delegation per i pulsanti di eliminazione
    recentTopicsContainer.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.topic-delete-btn');
        if (deleteBtn) {
            e.stopPropagation();
            const topicId = parseInt(deleteBtn.dataset.id);
            deleteTopic(topicId);
            return;
        }
        const cardContent = e.target.closest('.topic-card-content');
        if (cardContent) {
            state.currentTopicId = parseInt(cardContent.dataset.id);
            renderDecisionScreen();
            navigate('decision');
        }
    });

    const decisionScreen = document.getElementById('decisionScreen');
    decisionScreen.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-item-btn, .mobile-delete-btn');
        if (deleteBtn) {
            const itemId = parseInt(deleteBtn.dataset.id);
            const itemType = deleteBtn.dataset.type;
            deleteListItem(itemId, itemType);
        }
    });

    // --- INIZIALIZZAZIONE ---
    renderHomeScreen();
    navigate('home');
});