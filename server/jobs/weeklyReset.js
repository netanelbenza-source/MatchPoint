const cron = require('node-cron');
const { resetWeeklyCounters } = require('../repositories/matchmakerRepo');

function startWeeklyReset() {
  // Sunday at 00:00, server local time.
  cron.schedule('0 0 * * 0', async () => {
    try {
      await resetWeeklyCounters();
    } catch (error) {
      console.error('Weekly matchmaker reset failed', error);
    }
  });
}

module.exports = {
  startWeeklyReset,
};
