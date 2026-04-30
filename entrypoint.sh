#!/bin/bash
set -e

# Detecta qué servicio ejecutar basado en la variable de entorno SERVICE_TYPE
if [ "$SERVICE_TYPE" = "worker" ]; then
  echo "🧵 Iniciando WORKER service..."
  exec node server/worker-service.js
else
  echo "🌐 Iniciando API service..."
  exec node server/api.js
fi
