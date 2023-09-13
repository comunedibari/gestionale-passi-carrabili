var express = require("express");
const proxy = require("express-request-proxy");
var router = express.Router();

router.all(
  "/tributi",
  proxy({ url: "https://esb1.comune.bari.it/services/VisuraPubblicita" })
);

router.all(
  "/anagrafe",
  proxy({
    url: "https://esb1.comune.bari.it/services/VisuraAnagraficaAreaVasta"
  })
);

router.all(
  "/RicercaCivicoEPPort",
  proxy({ url: "https://esb1.comune.bari.it/SIT_Service" })
);

router.all(
  "/RicercaCivicoEPPort-wsdl",
  proxy({ url: "https://esb1.comune.bari.it/wsdl-RicercaCivicoEPPort" })
);

router.all(
  "/sitRicercaCivico",
  proxy({ url: "https://esb1.comune.bari.it/services/sitRicercaCivico" })
);
router.all(
  "/sitRicercaVariazioniToponomastiche",
  proxy({
    url:
      "https://esb1.comune.bari.it/services/sitRicercaVariazioniToponomastiche"
  })
);
router.all(
  "/sitRicercaVia",
  proxy({ url: "https://esb1.comune.bari.it/services/sitRicercaVia" })
);

module.exports = router;
