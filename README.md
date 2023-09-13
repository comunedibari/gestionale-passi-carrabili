# Introduzione 
Lo scopo di questa applicazione è la gestione delle procedure amministrative di concessione dei passi carrabili e processi correlati. 

## Licenza
Il software è rilasciato con licenza aperta ai sensi dell'art. 69 comma 1 del Codice dell’[Amministrazione Digitale](https://www.agid.gov.it/it/design-servizi/riuso-open-source/linee-guida-acquisizione-riuso-software-pa) con una licenza [AGPL-3.0 or later](https://spdx.org/licenses/AGPL-3.0-or-later.html)

# Informazioni Progetto

In coerenza con la programmazione nazionale/regionale in ambito di "Città e comunità intelligenti" e in linea con gli obiettivi dell'Agenda Digitale dell'amministrazione comunale, l'applicazione "Gestionale Passi Carrabili" è una delle soluzioni prodotte nell'ambito del progetto "Città Connessa: Sistema Informativo per il controllo degli oggetti" (cod. progetto BA 1.1.1.d – CUP J91J17000130007) a valere su risorse di finanziamento PON METRO 2014-2020 – Asse 1 "Agenda Digitale".

L'applicazione "Gestionale Passi Carrabili" è un verticale per la gestione dei rilasci dei passi carrabili ed i processi secondari al rilascio che utilizza il civilario comunale, realizzato nell’ambito dello stesso progetto. Esso presenta una serie di funzionalità in grado di digitalizzare l'intero processo di concessione con l'aggiunta di servizi di supporto come ad esempio la ricerca delle istanze con diversi filtri ed un sistema di scadenziario.

Il gestionale coopera con il servizio di protocollazione dell'Ente e con un'app mobile (il cui codice sorgente e documentazione sono qui disponibili) che, tra l'altro, è in grado di leggere sensori IoT (tag RFID passivi) per la verifica sul territorio dello stato delle concessioni.
Inoltre, il gestionale è anche in grado di comunicare con il portale EGOV (per l'erogazione di servizi al cittadino) che consente di avviare nuove richieste di concessione nonché registrare pratiche ad istanza di parte su concessioni già rilasciate.

![alt-text](https://github.com/comunedibari/gestionale-passi-carrabili/blob/main/screenshot/home-page.png)

# Funzionalità del gestionale

Il gestionale passi carrabili consente:
1.	la gestione completa: dall'inserimento dell'istanza fino al rilascio della concessione (o eventuale rigetto),
2.	l'avvio e conclusione dei processi di secondo grado ad istanza di parte (rinnovo, rinuncia, proroga, regolarizzazione per furto/deterioramento, trasferimento di titolarità) e ad istanza d'ufficio (rettifica, decadenza e revoca),
3.	la gestione di un'istanza inserita dal portale EGOV per i servizi al cittadino,
4.	la visualizzazione di dashboard di statistiche sulle concessioni rilasciate e sulle pratiche in corso,
5. 	il censimento di concessioni rilasciate precedentemente all'utilizzo del software con le funzionalità di "Storico" e "Bonifica",
6. 	la visualizzazione e gestione delle segnalazioni inviate dalla Polizia Locale che utilizza l'app mobile durante le verifiche sul territorio. 

# Informazioni architetturali

Si tratta di una applicazione web basata su tre livelli "logici" (front-end, back-end e database) i quali sono realizzati sfruttando i principali framework di riferimento per lo sviluppo quali Angular, Node.JS e Java (per l'implementazione "server-side"), Elasticsearch (per l'archiviazione dei dati) e di una mobile app nativa Android.

# Organizzazione del repository

Il repository è organizzato per componenti logiche. Sono state utilizzate varie tecnologie per sviluppare le parti delle soluzioni perciò ogni cartella è organizzata al suo interno in accordo alla tecnologia usata per svilupparla.

- **Documentazione** *(Documentazione dell'applicativo)*
 - **console-iotbigdata** *(Mobile App)*
 - **gpc-front-end** *(Modulo Front-end)*
 - **gpc-back-end** *(Modulo Back-end)*
 - **gpc-jobs** *(Modulo di gestione scadenziario)*
 - **gpc-stat** *(Dashboard Kibana)*
 - **gpc-db-mappings** *(Mapping del DB)*
 - **gpc-helm** *(Helm Charts per l'installazione)*
 - **middleware-protocolli** *(Modulo per la gestione del protocollo)*
 - **screenshot** *(Screenshot dell'applicativo)*

# Elenco dipendenze

- Node.js v10.7
- PostgreSQL v10
- Elasticsearch v7.16.3
- Kibana v7.16.3
- Angular v11.2.1
- PrimeNG v11.4.3
- Leaflet v1.7.1

Per la documentazione di dettaglio si rimanda alla cartella di [Documentazione](https://github.com/comunedibari/gestionale-passi-carrabili/tree/main/Documentazione).
