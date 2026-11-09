const app = require('./app');
const config = require('./config/env');
const { connectDatabase } = require('./config/database');
const { markOverdueRentals } = require('./services/rental.service');
const { expireOldDigitalAccess, notifyExpiringDigitalAccess } = require('./services/digital-access.service');

const startServer = async () => {
  await connectDatabase();

  app.listen(config.port, () => {
    console.info(`BookHub API listening on port ${config.port} (${config.environment}).`);
    const refreshRentalStatuses = async () => {
      try {
        await markOverdueRentals();
        await expireOldDigitalAccess();
        await notifyExpiringDigitalAccess();
      } catch (error) {
        console.error(`Rental status refresh failed: ${error.message}`);
      }
    };
    refreshRentalStatuses();
    setInterval(refreshRentalStatuses, 15 * 60 * 1000);
  });
};

startServer();
