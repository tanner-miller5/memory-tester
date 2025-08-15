// utils/dateUtils.js
function generateFakeDates(realDate) {
    const realDateTime = new Date(realDate);
    const now = new Date();
    
    // Generate 3 fake dates that are all in the past
    const fakeDates = [];
    for (let i = 0; i < 3; i++) {
        // Generate dates between 7 days and 365 days before the real date
        const minDaysBack = 7;
        const maxDaysBack = 365;
        const daysOffset = Math.floor(Math.random() * (maxDaysBack - minDaysBack)) + minDaysBack;
        
        const hoursOffset = Math.floor(Math.random() * 24); // 0 to 24 hours back
        const minutesOffset = Math.floor(Math.random() * 60); // 0 to 60 minutes back
        
        const fakeDate = new Date(realDateTime);
        fakeDate.setDate(fakeDate.getDate() - daysOffset); // Always subtract to go back in time
        fakeDate.setHours(fakeDate.getHours() - hoursOffset);
        fakeDate.setMinutes(fakeDate.getMinutes() - minutesOffset);
        
        // Ensure the fake date is in the past
        if (fakeDate > now) {
            fakeDate.setTime(now.getTime() - (Math.random() * 365 * 24 * 60 * 60 * 1000)); // Random past date within last year
        }
        
        fakeDates.push(fakeDate);
    }
    
    return fakeDates;
}
export default generateFakeDates;
