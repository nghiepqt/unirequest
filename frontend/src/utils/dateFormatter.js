export const formatToLocalTime = (dateString) => {
    if (!dateString) return 'N/A';

    // Ensure "Z" is present if it's missing (assuming backend sends UTC but might miss Z)
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
        dateString += 'Z';
    }

    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });
};

export const formatTimeOnly = (dateString) => {
    if (!dateString) return 'N/A';

    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
        dateString += 'Z';
    }

    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });
};
