const selectedDates = new Set();

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getStartDay(year, month) {
    return new Date(year, month, 1).getDay();
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function generateMonthsInRange(startYear, startMonth, endYear, endMonth) {
    const months = [];
    let currentYear = startYear;
    let currentMonth = startMonth;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        months.push({
            name: monthNames[currentMonth],
            year: currentYear,
            month: currentMonth,
            days: getDaysInMonth(currentYear, currentMonth),
            startDay: getStartDay(currentYear, currentMonth)
        });

        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }

    return months;
}

function createCalendar(months) {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    months.forEach((month) => {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month';
        
        const monthName = document.createElement('div');
        monthName.className = 'month-name';
        monthName.textContent = `${month.name} ${month.year}`;
        monthDiv.appendChild(monthName);

        const daysHeader = document.createElement('div');
        daysHeader.className = 'days-header';
        dayLabels.forEach(label => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'day-label';
            dayLabel.textContent = label;
            daysHeader.appendChild(dayLabel);
        });
        monthDiv.appendChild(daysHeader);

        const daysGrid = document.createElement('div');
        daysGrid.className = 'days-grid';

        // Add empty cells for days before month starts
        for (let i = 0; i < month.startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            daysGrid.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= month.days; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day';
            dayDiv.textContent = day;
            
            const dayOfWeek = (month.startDay + day - 1) % 7;
            if (dayOfWeek === 0) {
                dayDiv.classList.add('sunday', 'disabled'); // block Sundays
                dayDiv.title = 'Sundays cannot be selected';
            } else if (dayOfWeek === 6) {
                dayDiv.classList.add('saturday', 'disabled'); // block Saturdays
                dayDiv.title = 'Saturdays cannot be selected';
            }

            const dateStr = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayDiv.dataset.date = dateStr;

            // Check if this date was previously selected (but don't render weekends as selected)
            if (selectedDates.has(dateStr) && !dayDiv.classList.contains('disabled')) {
                dayDiv.classList.add('selected');
            }

            dayDiv.addEventListener('click', function() {
                toggleDate(this);
            });

            daysGrid.appendChild(dayDiv);
        }

        monthDiv.appendChild(daysGrid);
        calendar.appendChild(monthDiv);
    });
}

function toggleDate(element) {
    const date = element.dataset.date;

    // Block weekends (Saturdays and Sundays) from being selected
    if (element.classList.contains('disabled')) {
        // Optionally provide a subtle feedback instead of selecting
        // For now we silently ignore clicks on weekends.
        return;
    }
    
    if (selectedDates.has(date)) {
        selectedDates.delete(date);
        element.classList.remove('selected');
    } else {
        selectedDates.add(date);
        element.classList.add('selected');
    }
    
    updateCounter();
}

function updateCounter() {
    document.getElementById('selectedCount').textContent = selectedDates.size;
}

function clearAll() {
    selectedDates.clear();
    document.querySelectorAll('.day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    updateCounter();
}

function selectAll() {
    // Skip weekends (disabled days) when selecting all
    document.querySelectorAll('.day:not(.empty):not(.disabled)').forEach(day => {
        const date = day.dataset.date;
        selectedDates.add(date);
        day.classList.add('selected');
    });
    updateCounter();
}

function applyDateRange() {
    const startMonth = parseInt(document.getElementById('startMonth').value);
    const startYear = parseInt(document.getElementById('startYear').value);
    const endMonth = parseInt(document.getElementById('endMonth').value);
    const endYear = parseInt(document.getElementById('endYear').value);

    // Validate date range
    if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
        alert('Start date must be before or equal to end date');
        return;
    }

    const months = generateMonthsInRange(startYear, startMonth, endYear, endMonth);
    createCalendar(months);
}

function generateFile() {
    if (selectedDates.size === 0) {
        alert('Please select at least one date before generating.');
        return;
    }

    // Sort dates chronologically
    const sortedDates = Array.from(selectedDates).sort();
    
    // Filter out any weekends just in case (defensive)
    const filteredDates = sortedDates.filter(dateStr => {
        const d = new Date(dateStr);
        const day = d.getDay();
        return day !== 0 && day !== 6;
    });

    if (filteredDates.length === 0) {
        alert('No valid (non-weekend) dates selected to generate.');
        return;
    }
    
    // Group dates by month
    const datesByMonth = {};
    filteredDates.forEach(dateStr => {
        const [year, month, day] = dateStr.split('-');
        const monthKey = `${year}-${month}`;
        
        if (!datesByMonth[monthKey]) {
            datesByMonth[monthKey] = [];
        }
        datesByMonth[monthKey].push(dateStr);
    });
    
    // Create formatted content
    const contentParts = [
        '# School Days',
        '# Format: YYYY-MM-DD (one date per line)',
        '# Lines starting with # are comments and will be ignored',
        '#'
    ];
    Object.keys(datesByMonth).sort().forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthName = monthNames[parseInt(month) - 1];
        
        contentParts.push(`# ${monthName} ${year}`);
        datesByMonth[monthKey].forEach(date => {
            contentParts.push(date);
        });
        contentParts.push('#');
    });
    
    const content = contentParts.join('\n');
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'school_days.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize calendar with default range (current month/year - June 2026)
// Set start to today's date
const today = new Date();
document.getElementById('startMonth').value = today.getMonth(); // Current month (0-11)
document.getElementById('startYear').value = today.getFullYear(); // Current year

// Set end to June 2026
document.getElementById('endMonth').value = 5; // June (0-indexed)
document.getElementById('endYear').value = 2026;

applyDateRange();
