interface Orders
{
    id: number,
    store: number,
    status: OrderStatus
    week: Date,

}

enum OrderStatus
{
    COMPLETED,
    CURRENT,
    PENDING,
    CANCELLED,
}


function getWeekNumber(date: Date): number
{
    // Copy date to avoid modifying the original
    const currentDate = new Date(date.getTime());

    // Set the date to the nearest Thursday: current date + 4 - current day number
    const dayNumber = (currentDate.getDay() + 6) % 7;
    currentDate.setDate(currentDate.getDate() - dayNumber + 3);

    // Get the first Thursday of the year
    const firstThursday = new Date(currentDate.getFullYear(), 0, 4);

    // Calculate the number of days between the current date and the first Thursday
    const daysDifference = (currentDate.getTime() - firstThursday.getTime()) / (24 * 60 * 60 * 1000);

    // Calculate the week number
    return Math.round((daysDifference + 3) / 7);
}