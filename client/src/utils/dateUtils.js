// utils/dateUtils.js
function generateFakeDates(realDate) {
    const realDateTime = new Date(realDate);
    
    // Generate 3 fake dates within 365 days before and after the real date but not within 7 days
    const fakeDates = [];
    for (let i = 0; i < 3; i++) {
        let daysOffset = Math.floor(Math.random() * 365) + 7;
        if(Math.floor(Math.random() * 2) === 0) {
            daysOffset *= -1;
        }
        const hoursOffset = Math.floor(Math.random() * 24) - 12; // -12 to +12 hours
        const minutesOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 minutes
        
        const fakeDate = new Date(realDateTime);
        fakeDate.setDate(fakeDate.getDate() + daysOffset);
        fakeDate.setHours(fakeDate.getHours() + hoursOffset);
        fakeDate.setMinutes(fakeDate.getMinutes() + minutesOffset);
        
        fakeDates.push(fakeDate);
    }
    
    return fakeDates;
}
export default generateFakeDates;
