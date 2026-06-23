// ========================================================
// CONSOLE DI BILANCIO - HOLLY AND REX CREW SYSTEM
// ========================================================

// Funzione per il "rimprovero" di Dj Aura
function controlloBackupIntelligente() {
    const ultimoBackup = localStorage.getItem('ultima_data_backup');
    const oggi = new Date();
    
    // Se non c'è backup o è passato più di una settimana
    if (!ultimoBackup || (oggi - new Date(ultimoBackup)) / (1000 * 60 * 60 * 24) > 7) {
        feedbackCrewEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; color:#fbbf24;">
                <img src="img/avatar_aura.png" style="width:40px; height:40px; border-radius:50%; border:2px solid #fbbf24;">
                <span><strong>Dj Aura:</strong> "Massy... e il backup? Sono giorni che non proteggiamo i flussi! Fallo subito, non farmi preoccupare."</span>
            </div>
        `;
    }
}

// Funzione feedback standard con avatar
function aggiornaFeedback(messaggio) {
    feedbackCrewEl.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <img src="img/avatar_aura.png" style="width:40px; height:40px; border-radius:50%;">
            <span>${messaggio}</span>
        </div>
    `;
}

let movimenti = JSON.parse(localStorage.getItem('crew_bilancio_data')) || 
                JSON.parse(localStorage.getItem('movimenti')) || [];

const form = document.getElementById('form-movimento');
const registroMovimenti = document.getElementById('registro-movimenti');
const totaleEntrateEl = document.getElementById('totale-entrate');
const totaleUsciteEl = document.getElementById('totale-uscite');
const saldoTotaleEl = document.getElementById('saldo-totale');
const trendMeseEl = document.getElementById('trend-mese');
const feedbackCrewEl = document.getElementById('feedback-crew');

function calcolaStatisticheMensili() {
    if (!trendMeseEl || !feedbackCrewEl) return;

    const oggi = new Date();
    const meseCorrente = oggi.getMonth();
    const annoCorrente = oggi.getFullYear();

    let mesePrecedente = meseCorrente - 1;
    let annoPrecedente = annoCorrente;
    if (mesePrecedente < 0) {
        mesePrecedente = 11;
        annoPrecedente = annoCorrente - 1;
    }

    let usciteMeseCorrente = 0;
    let usciteMesePrecedente = 0;

    movimenti.forEach(m => {
        if (m.tipo === 'uscita' && m.data) {
            const dataMov = new Date(m.data);
            if (dataMov.getMonth() === meseCorrente && dataMov.getFullYear() === annoCorrente) {
                usciteMeseCorrente += m.importo;
            } else if (dataMov.getMonth() === mesePrecedente && dataMov.getFullYear() === annoPrecedente) {
                usciteMesePrecedente += m.importo;
            }
        }
    });

    if (usciteMesePrecedente === 0) {
        trendMeseEl.textContent = "In attesa di dati storici...";
        trendMeseEl.style.color = '#94a3b8';
        aggiornaFeedback("🌙 Dj Luna: 'Iniziamo a raccogliere i dati storici, la rotta è tracciata!'");
    } else {
        const differenzaPercentuale = ((usciteMeseCorrente - usciteMesePrecedente) / usciteMesePrecedente) * 100;
        
        if (differenzaPercentuale > 0) {
            trendMeseEl.textContent = `+${differenzaPercentuale.toFixed(1)}% rispetto al mese scorso`;
            trendMeseEl.style.color = '#f87171';
            aggiornaFeedback("🔥 Dj Nova: 'Ehi capo, i costi di produzione stanno salendo! Freniamo i campionatori!'");
        } else if (differenzaPercentuale < 0) {
            trendMeseEl.textContent = `${differenzaPercentuale.toFixed(1)}% rispetto al mese scorso`;
            trendMeseEl.style.color = '#34d399';
            aggiornaFeedback("✨ Dj Aura: 'Che risparmio fantastico, Massy! Ottima gestione della regia familiare.'");
        } else {
            trendMeseEl.textContent = "Spese stabili rispetto al mese scorso";
            trendMeseEl.style.color = '#60a5fa';
            aggiornaFeedback("灵 Dj Ling: 'Flussi stabili. Perfetto equilibrio matematico nei sistemi.'");
        }
    }
}

function aggiornaConsole() {
    if (!registroMovimenti) return;
    
    registroMovimenti.innerHTML = '';
    let entrate = 0;
    let uscite = 0;

    movimenti.forEach((movimento, index) => {
        const riga = document.createElement('tr');
        const imp = parseFloat(movimento.importo) || 0;
        
        if (movimento.tipo === 'entrata') {
            entrate += imp;
        } else {
            uscite += imp;
        }

        const coloreValore = movimento.tipo === 'entrata' ? 'style="color: #34d399; font-weight: bold;"' : 'style="color: #f87171; font-weight: bold;"';
        const segno = movimento.tipo === 'entrata' ? '+' : '-';

        riga.innerHTML = `
            <td>${movimento.categoria}</td>
            <td>${movimento.descrizione}</td>
            <td ${coloreValore}>${segno} ${imp.toFixed(2)} €</td>
            <td><button class="btn-cancella" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" onclick="rimuoviFlusso(${index})">❌</button></td>
        `;
        
        registroMovimenti.appendChild(riga);
    });

    const saldo = entrate - uscite;

    if (totaleEntrateEl) totaleEntrateEl.textContent = `${entrate.toFixed(2)} €`;
    if (totaleUsciteEl) totaleUsciteEl.textContent = `${uscite.toFixed(2)} €`;
    if (saldoTotaleEl) {
        saldoTotaleEl.textContent = `${saldo.toFixed(2)} €`;
        saldoTotaleEl.style.color = saldo >= 0 ? '#60a5fa' : '#f87171';
    }

    calcolaStatisticheMensili();
    localStorage.setItem('crew_bilancio_data', JSON.stringify(movimenti));
}

if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const tipo = document.getElementById('tipo').value;
        const categoriaSelect = document.getElementById('categoria');
        
        if (!categoriaSelect) {
            alert("Errore del sistema: Menu categoria non trovato!");
            return;
        }

        const categoriaTesto = categoriaSelect.options[categoriaSelect.selectedIndex].text;
        const importo = parseFloat(document.getElementById('importo').value) || 0;
        const descrizione = document.getElementById('descrizione').value;

        const nuovoMovimento = {
            tipo: tipo,
            categoria: categoriaTesto,
            importo: importo,
            descrizione: descrizione,
            data: new Date().toISOString()
        };

        movimenti.push(nuovoMovimento);
        form.reset();
        aggiornaConsole();
    });
}

window.rimuoviFlusso = function(index) {
    movimenti.splice(index, 1);
    aggiornaConsole();
};

const btnExport = document.getElementById('btn-export');
if (btnExport) {
    btnExport.addEventListener('click', function() {
        if (movimenti.length === 0) {
            alert("Non ci sono movimenti registrati da salvare!");
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(movimenti, null, 2));
        const downloadAnchor = document.createElement('a');
        const oggi = new Date().toISOString().slice(0, 10);
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `backup_bilancio_crew_${oggi}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        
        // Registra la data del backup fatto
        localStorage.setItem('ultima_data_backup', new Date().toISOString());
        alert("Backup effettuato! Sistemi al sicuro.");
    });
}

const btnImportTrigger = document.getElementById('btn-import-trigger');
const fileImport = document.getElementById('file-import');

if (btnImportTrigger && fileImport) {
    btnImportTrigger.addEventListener('click', function() {
        fileImport.click();
    });

    fileImport.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const datiCaricati = JSON.parse(evt.target.result);
                if (Array.isArray(datiCaricati)) {
                    if (confirm(`Stai per caricare ${datiCaricati.length} movimenti. Sovrascrivere i dati attuali?`)) {
                        movimenti = datiCaricati;
                        aggiornaConsole();
                        alert("Sistemi ripristinati con successo! ✨");
                    }
                } else {
                    alert("File di backup non valido.");
                }
            } catch (err) {
                alert("Errore di caricamento.");
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
}

// Avvio finale
aggiornaConsole();
controlloBackupIntelligente();