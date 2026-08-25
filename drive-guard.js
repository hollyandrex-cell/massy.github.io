/**
 * Verifica lo spazio disponibile su Google Drive prima di procedere al salvataggio.
 * @param {string} accessToken - Il token OAuth valido dell'utente.
 * @param {number} [fileSizeInBytes=0] - Il peso stimato del file/radiografia che si vuole caricare (opzionale).
 * @returns {Promise<Object>} - Ritorna lo stato dello spazio e un flag di sicurezza.
 */
 async function checkDriveStorageQuota(accessToken, fileSizeInBytes = 0) {
    try {
        const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Errore nella verifica dello spazio Drive: ${response.statusText}`);
        }

        const data = await response.json();
        const quota = data.storageQuota;

        const limit = parseInt(quota.limit, 10);       // Spazio totale in byte (es. 15 GB)
        const usage = parseInt(quota.usage, 10);       // Spazio totale occupato in byte (Drive + Foto + Gmail)
        
        // Se per qualche motivo il limite non è definito (es. account illimitati aziendali/education)
        if (isNaN(limit)) {
            return { isSafe: true, message: "Spazio illimitato o non misurabile." };
        }

        const freeSpace = limit - usage;
        const safetyThreshold = 1024 * 1024 * 500; // Soglia di sicurezza minima: 500 MB liberi

        // Controllo 1: Lo spazio libero è sotto la soglia di sicurezza?
        // Controllo 2: Il file che vogliamo caricare è più grande dello spazio libero rimasto?
        const isNearFull = freeSpace < safetyThreshold;
        const willExceed = fileSizeInBytes > 0 && freeSpace < fileSizeInBytes;

        return {
            isSafe: !isNearFull && !willExceed,
            freeSpaceMB: (freeSpace / (1024 * 1024)).toFixed(2),
            totalLimitGB: (limit / (1024 * 1024 * 1024)).toFixed(2),
            isNearFull,
            willExceed
        };

    } catch (error) {
        console.error("Impossibile verificare la quota Drive:", error);
        // In caso di errore di rete, non blocchiamo l'utente ma procediamo con cautela
        return { isSafe: true, error: true };
    }
}

// --- ESEMPIO DI UTILIZZO QUANDO L'UTENTE CLICCA "SALVA SU DRIVE" ---
async function handleDriveSaveClick(accessToken, fileDataSize) {
    // 1. Eseguiamo il controllo silenzioso
    const quotaCheck = await checkDriveStorageQuota(accessToken, fileDataSize);

    if (!quotaCheck.isSafe) {
        // Se lo spazio è critico o il file è troppo grande, mostriamo il popup "Salva-Vita"
        const userWantsToProceed = confirm(
            `⚠️ ATTENZIONE: Il tuo Google Drive sta esaurendo lo spazio!\n\n` +
            `Spazio libero residuo: ${quotaCheck.freeSpaceMB} MB (su ${quotaCheck.totalLimitGB} GB totali).\n\n` +
            `Se saturi completamente lo spazio, i backup automatici del telefono (come WhatsApp o di altre app) potrebbero fallire.\n\n` +
            `Vuoi comunque procedere con il salvataggio qui, oppure preferisci annullare (nessun dato verrà perso) e scegliere il salvataggio locale su file/dispositivo?`
        );

        if (!userWantsToProceed) {
            console.log("L'utente ha scelto di annullare in sicurezza. I dati locali sono salvi!");
            // Qui fermi l'operazione di salvataggio su Drive e reindirizzi alla scelta locale
            return false; 
        }
    }

    // Se è tutto ok o l'utente ha deciso di procedere lo stesso:
    console.label("Procediamo con il salvataggio su Google Drive...");
    return true;
}