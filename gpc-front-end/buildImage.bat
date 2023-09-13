echo "Building image..."

call docker build -t cc-harbor.comune.bari.it/citta_connessa/gpc-front-end:1.0.10 .
call docker push cc-harbor.comune.bari.it/citta_connessa/gpc-front-end:1.0.10
