export const formatDate = (date) => `${new Date(date)
    .toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    })?.replaceAll(' PM', 'pm')?.replaceAll(' AM', 'am')}`