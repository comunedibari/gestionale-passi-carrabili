module.exports = {
  secret: "supersecret",
  host: process.env.ES_HOST,
  log: process.env.ES_LOG || "error",
  mapping: {

    passicarrabili: {
      index: "gpc_istanze_prod",
      type: "_doc"
    },

    storico_passicarrabili: {
      index: "gpc_istanze_storico_prod",
      type: "_doc"
    },

    //TO DO: In fase di creazione del seguente indice, impostare il seguente settaggio: 
    // PUT http://localhost:9200/gpc_istanze_pregresso_prod/_settings 
    // Body: { "index" : { "max_result_window" : 500000 } }
    pregresso_passicarrabili: {
      index: "gpc_istanze_pregresso_prod",
      type: "_doc"
    },

    scadenziario: {
      index: "gpc_scadenziario_prod",
      type: "_doc"
    },

    gruppi: {
      index: "gpc_groups_prod",
      type: "_doc"
    },

    utenti: {
      index: "gpc_users_prod",
      type: "_doc"
    },

    documenti_passicarrabili: {
      index: "gpc_documenti_istanze_prod",
      type: "_doc"
    },

    templates: {
      index: "gpc_templates_prod",
      type: "_doc"
    },

    configurations: {
      index: "gpc_configurations_prod",
      type: "_doc"
    },

    regolarizzazione: {
      index: "gpc_regolarizzazione_prod",
      type: "_doc"
    },

    segnalazioni: {
      index: "segnalazioni_prod",
      type: "_doc"
    },

    panchine: {
      index: "panchine",
      type: "_doc"
    },

    modelloPanchina: {
      index: "modello_panchina",
      type: "_doc"
    },

    statoPanchina: {
      index: "stato_panchina",
      type: "_doc"
    },

    contestoPanchina: {
      index: "contesto_panchina",
      type: "_doc"
    }
  },
  civico: {
    user: process.env.CIVILARIO_USER,
    pass: process.env.CIVILARIO_PSW,
    timeout : 300,
    baseURL : process.env.CIVILARIO_HOST
  },
  smtp: {
    host: process.env.SMTP_HOST,
    host_pec: process.env.SMTP_HOST_PEC,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    from: process.env.SMTP_FROM,
    auth:
    {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PSW,
    },
    pec: {
      municipio_1: {
        from_pec_m1: process.env.SMTP_FROM_PEC_M1,
        user_pec_m1: process.env.SMTP_USER_PEC_M1,
        pass_pec_m1: process.env.SMTP_PSW_PEC_M1
      },
      municipio_2: {
        from_pec_m2: process.env.SMTP_FROM_PEC_M2,
        user_pec_m2: process.env.SMTP_USER_PEC_M2,
        pass_pec_m2: process.env.SMTP_PSW_PEC_M2
      },
      municipio_3: {
        from_pec_m3: process.env.SMTP_FROM_PEC_M3,
        user_pec_m3: process.env.SMTP_USER_PEC_M3,
        pass_pec_m3: process.env.SMTP_PSW_PEC_M3
      },
      municipio_4: {
        from_pec_m4: process.env.SMTP_FROM_PEC_M4,
        user_pec_m4: process.env.SMTP_USER_PEC_M4,
        pass_pec_m4: process.env.SMTP_PSW_PEC_M4
      },
      municipio_5: {
        from_pec_m5: process.env.SMTP_FROM_PEC_M5,
        user_pec_m5: process.env.SMTP_USER_PEC_M5,
        pass_pec_m5: process.env.SMTP_PSW_PEC_M5
      }
    },
    tlsUnauth: process.env.SMTP_TLS_UNAUTH || false,
    tlsMinVersion: process.env.SMTP_TLS_MIN_VERSION,
    tlsMaxVersion: process.env.SMTP_TLS_MAX_VERSION
  },
  linksCredentials: {
    username: process.env.LINKS_CREDENTIALS_US,
    password: process.env.LINKS_CREDENTIALS_PSW,
  },
  linkDashboardKibana: process.env.LINK_DASHBOARD_KIBANA,
  linkDashboardKibana_M1: process.env.LINK_DASHBOARD_KIBANA_M1,
  linkDashboardKibana_M2: process.env.LINK_DASHBOARD_KIBANA_M2,
  linkDashboardKibana_M3: process.env.LINK_DASHBOARD_KIBANA_M3,
  linkDashboardKibana_M4: process.env.LINK_DASHBOARD_KIBANA_M4,
  linkDashboardKibana_M5: process.env.LINK_DASHBOARD_KIBANA_M5,
  dimensione_totale_allegati_protocollo_kb: process.env.MAX_DIM_ALLEGATI_PROTOCOLLO_KB,
  flag_controllo_allegati: process.env.FLAG_CONTROLLO_ALLEGATI
};