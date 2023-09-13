var formatter = require("./formatter.js");

const templateDocumentiSchema = [
    {
      id: "templateDeterminaConcessionePermanente",
      label: "Determina di concessione permanente",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaConcessioneTemporanea",
      label: "Determina di concessione temporanea",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaDecadenza",
      label: "Determina di decadenza",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRegolarizzazioneFurto",
      label: "Determina di regolarizzazione furto/deterioramento",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
        id: "templateDeterminaRettifica",
        label: "Determina di rettifica",
        last_modification: {
          username: "admin",
          utente: "Admin  Admin",
          data_operazione: formatter.formatDateTime()
        },
        blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRevoca",
      label: "Determina di revoca",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRigetto",
      label: "Determina di rigetto",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRinnovo",
      label: "Determina di rinnovo",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaProroga",
      label: "Determina di proroga",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRinuncia",
      label: "Determina di rinuncia",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaTrasferimentoTitolarita",
      label: "Determina di trasferimento titolarità",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateRelazioneServizio",
      label: "Relazione di servizio",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateIstruttoriaUrbanistica",
      label: "Istruttoria urbanistica",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateIstruttoriaUTD",
      label: "Istruttoria UTD",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateInserimentoPratica",
      label: "Template inserimento pratica",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateProtocolloPratica",
      label: "Template protocollazione pratica",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    //Template per esenti Bollo e CUP
    {
      id: "templateDeterminaConcessionePermanenteEsenteBollo",
      label: "Determina di concessione permanente (Esente Bollo)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaConcessionePermanenteEsenteCUP",
      label: "Determina di concessione permanente (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaConcessionePermanenteEsenteBolloCUP",
      label: "Determina di concessione permanente (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaConcessioneTemporaneaEsenteBollo",
      label: "Determina di concessione temporanea (Esente Bollo)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaConcessioneTemporaneaEsenteCUP",
      label: "Determina di concessione temporanea (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaConcessioneTemporaneaEsenteBolloCUP",
      label: "Determina di concessione temporanea (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaDecadenzaEsenteBollo",
      label: "Determina di decadenza (Esente Bollo)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaDecadenzaEsenteCUP",
      label: "Determina di decadenza (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaDecadenzaEsenteBolloCUP",
      label: "Determina di decadenza (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRegolarizzazioneFurtoEsenteBollo",
      label: "Determina di regolarizzazione furto/deterioramento (Esente Bollo)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRegolarizzazioneFurtoEsenteCUP",
      label: "Determina di regolarizzazione furto/deterioramento (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRegolarizzazioneFurtoEsenteBolloCUP",
      label: "Determina di regolarizzazione furto/deterioramento (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
        id: "templateDeterminaRettificaEsenteBollo",
        label: "Determina di rettifica (Esente Bollo)",
        last_modification: {
          username: "admin",
          utente: "Admin  Admin",
          data_operazione: formatter.formatDateTime()
        },
        blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRettificaEsenteCUP",
      label: "Determina di rettifica (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRettificaEsenteBolloCUP",
      label: "Determina di rettifica (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRevocaEsenteBollo",
      label: "Determina di revoca (Esente Bollo)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRevocaEsenteCUP",
      label: "Determina di revoca (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRevocaEsenteBolloCUP",
      label: "Determina di revoca (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRigettoEsenteBollo",
      label: "Determina di rigetto (Esente Bollo)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRigettoEsenteCUP",
      label: "Determina di rigetto (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRigettoEsenteBolloCUP",
      label: "Determina di rigetto (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRinnovoEsenteBollo",
      label: "Determina di rinnovo (Esente Bollo)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRinnovoEsenteCUP",
      label: "Determina di rinnovo (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRinnovoEsenteBolloCUP",
      label: "Determina di rinnovo (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaProrogaEsenteBollo",
      label: "Determina di proroga (Esente Bollo)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaProrogaEsenteCUP",
      label: "Determina di proroga (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaProrogaEsenteBolloCUP",
      label: "Determina di proroga (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRinunciaEsenteBollo",
      label: "Determina di rinuncia (Esente Bollo)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRinunciaEsenteCUP",
      label: "Determina di rinuncia (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaRinunciaEsenteBolloCUP",
      label: "Determina di rinuncia (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaTrasferimentoTitolaritaEsenteBollo",
      label: "Determina di trasferimento titolarità (Esente Bollo)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaTrasferimentoTitolaritaEsenteCUP",
      label: "Determina di trasferimento titolarità (Esente CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    },
    {
      id: "templateDeterminaTrasferimentoTitolaritaEsenteBolloCUP",
      label: "Determina di trasferimento titolarità (Esente Bollo e CUP)",
      last_modification: {
        username: "admin",
        utente: "Admin  Admin",
        data_operazione: formatter.formatDateTime()
      },
      blob: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
    }
];

module.exports = { templateDocumentiSchema };