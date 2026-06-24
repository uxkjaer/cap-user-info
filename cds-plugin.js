const cds = require('@sap/cds');

cds.on('served', async () => {
  const { registerHandlers } = require('./dist/handlers.js');
  for (const srv of cds.services) {
    if (!(srv instanceof cds.ApplicationService)) continue;
    registerHandlers(srv);
  }
});
