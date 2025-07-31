const moment = require('moment');

const TestScheduler = {
  createSchedule: () => {
    const now = moment();
    return [
      { date: now.clone().add(1, 'day').toDate() },
      { date: now.clone().add(1, 'week').toDate() },
      { date: now.clone().add(2, 'weeks').toDate() },
      { date: now.clone().add(1, 'month').toDate() },
      { date: now.clone().add(2, 'months').toDate() },
      { date: now.clone().add(3, 'months').toDate() },
      { date: now.clone().add(6, 'months').toDate() },
      { date: now.clone().add(1, 'year').toDate() }
    ];
  },

  updateTestSchedule: async (test) => {
    const now = moment();
    test.schedule = test.schedule.map(scheduleItem => {
      if (!scheduleItem.completed && moment(scheduleItem.date).isBefore(now)) {
        scheduleItem.completed = true;
        scheduleItem.score = 0; // Or calculate based on user's performance
      }
      return scheduleItem;
    });
    await test.save();
  }
};

module.exports = TestScheduler;
