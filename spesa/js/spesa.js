document.addEventListener('DOMContentLoaded', () => {
    const inputProdotto = document.getElementById('prodotto');
    const inputQuantita = document.getElementById('quantita');
    const btnAggiungi = document.getElementById('btnAggiungi');
    const listaSpesa = document.getElementById('listaSpesa');
    const btnInviaWhatsApp = document.getElementById('btnInviaWhatsApp');
    const btnSvuota = document.getElementById('btnSvuota');

    // Carica la lista dal LocalStorage all'avvio
    let lista = JSON.parse(localStorage.getItem('hollyRexSpesa')) || [];
    renderizzaLista();

    // Funzione per aggiungere item
    function aggiungiItem() {
        const prodotto = inputProdotto.value.trim();
        const quantita = inputQuantita.value.trim();

        if (prodotto === '') return alert('Tesoro, scrivi almeno il nome del prodotto! ');

        lista.push({ prodotto, quantita: quantita || '-' });
        salvaEAggiorna();
        
        // Pulisci i campi
        inputProdotto.value = '';
        inputQuantita.value = '';
        inputProdotto.focus();
    }

    // Funzione per eliminare item
    function eliminaItem(index) {
        lista.splice(index, 1);
        salvaEAggiorna();
    }

    // Salva nel browser e ridisegna
    function salvaEAggiorna() {
        localStorage.setItem('hollyRexSpesa', JSON.stringify(lista));
        renderizzaLista();
    }

    // Disegna la lista a schermo
    function renderizzaLista() {
        listaSpesa.innerHTML = '';
        lista.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    <strong>${item.prodotto}</strong> 
                    <span class="qty">(${item.quantita})</span>
                </span>
                <button class="btn-delete" onclick="eliminaItem(${index})">×</button>
            `;
            listaSpesa.appendChild(li);
        });
    }

    // Funzione per inviare via WhatsApp
    function inviaWhatsApp() {
        if (lista.length === 0) return alert('La lista è vuota, tesoro! Aggiungi qualcosa prima di inviare.');

        let testo = "* LISTA DELLA SPESA HOLLY & REX*\n\n";
        lista.forEach((item, i) => {
            testo += `${i + 1}. ${item.prodotto} (${item.quantita})\n`;
        });

       // Usiamo <3 che WhatsApp converte automaticamente in ❤️, oppure un cuore bianco sicuro
       testo += "Fatta con amore digitale da Ling"; 

        // NUMERO DI TELEFONO (con prefisso 39, senza spazi o +)
        const numeroLing = "393288763218"; 
        
        // Crea l'URL di WhatsApp
        const url = `https://wa.me/${numeroLing}?text=${encodeURIComponent(testo)}`;
        
        // 👇 APRE WHATSAPP WEB O L'APP (questa era la riga mancante!)
        window.open(url, '_blank'); 
    }

    // Event Listeners
    btnAggiungi.addEventListener('click', aggiungiItem);
    
    // Permetti di aggiungere premendo INVIO
    inputQuantita.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') aggiungiItem();
    });

    btnInviaWhatsApp.addEventListener('click', inviaWhatsApp);

    btnSvuota.addEventListener('click', () => {
        if (confirm('Sei sicuro di voler svuotare tutta la lista, tesoro? ️')) {
            lista = [];
            salvaEAggiorna();
        }
    });

    // Rendi la funzione eliminaItem globale per l'onclick nell'HTML
    window.eliminaItem = eliminaItem;
});