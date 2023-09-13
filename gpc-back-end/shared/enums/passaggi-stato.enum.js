const PassaggiStatoEnum = {
    'Bozza': 'La bozza della pratica è stata inserita nel sistema',
    'BozzaToInserita': 'La pratica è stata acquisita e protocollata',
    'ProrogaToVerificaFormale': 'La pratica è stata automaticamente presa in carico per la relativa istruttoria',
    'StoricoToConcessioneValida': 'La pratica è stata inserita nel sistema dallo storico nello stato "Concessione valida"',
    'ConcessioneValidaToArchiviata': 'La concessione originaria è stata archiviata',
    'ConcessioneValidaToRevocata': 'La concessione è stata revocata',
    'NecessariaIntegrazioneToVerificaFormale': 'La pratica è stata integrata dall\'istante',
    'PreavvisoDiniegoToVerificaFormale': 'La pratica è stata integrata dall\'istante in risposta al preavviso del diniego',
    'RichiestaLavoriToVerificaFormale': 'L\'istante ha risposto relativamente all\'inizio dei lavori e la pratica può essere istruita',
    'AttesaFineLavoriToVerificaFormale': 'L\'istante ha ultimato i lavori per evitare la revoca e l\'istruttoria può essere completata',
    'AttesaDiPagamentoToAttesaDiPagamento': 'L\'istante ha eseguito il pagamento della marca da bollo',
}

module.exports = { PassaggiStatoEnum };