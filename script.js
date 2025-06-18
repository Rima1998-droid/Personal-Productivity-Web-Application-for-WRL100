document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    generateCalendar(new Date());
    fetchQuote();

    // Task form submission
    document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const taskInput = document.getElementById('task-input');
        const taskCategory = document.getElementById('task-category');
        const taskPriority = document.getElementById('task-priority');
        const taskDate = document.getElementById('task-date');
        const taskText = sanitizeInput(taskInput.value.trim());
        const category = taskCategory.value;
        const priority = taskPriority.value;
        const date = taskDate.value;

        if (taskText && category && priority && date) {
            addTask(taskText, category, priority, date);
            taskInput.value = '';
            taskCategory.value = '';
            taskPriority.value = '';
            taskDate.value = '';
        }
    });

    // Calendar navigation
    let currentDate = new Date();
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar(currentDate);
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar(currentDate);
    });

    // Modal handling
    const modal = document.getElementById('edit-modal');
    const closeModal = document.querySelector('.close');
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
});

// Sanitize input to prevent XSS
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Task management
function addTask(text, category, priority, date) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push({ id: Date.now(), text, category, priority, date });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
    generateCalendar(new Date());
}

function loadTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.priority.toLowerCase()}`;
        li.innerHTML = `
            ${task.text} (${task.category}, ${task.priority}, Due: ${task.date})
            <div>
                <button onclick="editTask(${task.id})">Edit</button>
                <button onclick="deleteTask(${task.id})">Delete</button>
            </div>`;
        taskList.appendChild(li);
    });
}

function editTask(id) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const task = tasks.find(t => t.id === id);
    if (task) {
        document.getElementById('edit-task-input').value = task.text;
        document.getElementById('edit-task-category').value = task.category;
        document.getElementById('edit-task-priority').value = task.priority;
        document.getElementById('edit-task-date').value = task.date;
        document.getElementById('edit-modal').style.display = 'block';
        document.getElementById('edit-task-form').onsubmit = (e) => {
            e.preventDefault();
            const newText = sanitizeInput(document.getElementById('edit-task-input').value.trim());
            const newCategory = document.getElementById('edit-task-category').value;
            const newPriority = document.getElementById('edit-task-priority').value;
            const newDate = document.getElementById('edit-task-date').value;
            if (newText && newCategory && newPriority && newDate) {
                tasks[tasks.findIndex(t => t.id === id)] = {
                    id, text: newText, category: newCategory, priority: newPriority, date: newDate
                };
                localStorage.setItem('tasks', JSON.stringify(tasks));
                loadTasks();
                generateCalendar(new Date());
                document.getElementById('edit-modal').style.display = 'none';
            }
        };
    }
}

function deleteTask(id) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(task => task.id !== id);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
    generateCalendar(new Date());
}

// Calendar generation
function generateCalendar(date) {
    const calendar = document.getElementById('calendar');
    const monthYear = document.getElementById('month-year');
    calendar.innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const div = document.createElement('div');
        div.textContent = day;
        calendar.appendChild(div);
    });

    const year = date.getFullYear();
    const month = date.getMonth();
    monthYear.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;
    const firstDay = new Date(year, month, 1).getDay();
    const monthDays = new Date(year, month + 1, 0).getDate();
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    for (let i = 0; i < firstDay; i++) {
        calendar.appendChild(document.createElement('div'));
    }
    for (let i = 1; i <= monthDays; i++) {
        const div = document.createElement('div');
        div.className = 'day';
        div.textContent = i;
        const taskDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (tasks.some(task => task.date === taskDate)) div.className += ' task-day';
        div.addEventListener('click', () => {
            const tasksOnDate = tasks.filter(task => task.date === taskDate);
            alert(tasksOnDate.length ? `Tasks on ${taskDate}:\n${tasksOnDate.map(t => t.text).join('\n')}` : `No tasks on ${taskDate}`);
        });
        calendar.appendChild(div);
    }
}

// Fetch and cache quote
async function fetchQuote() {
    const cacheKey = 'quoteCache';
    const cache = JSON.parse(localStorage.getItem(cacheKey));
    const now = Date.now();
    if (cache && now - cache.timestamp < 24 * 60 * 60 * 1000) {
        document.getElementById('quote').textContent = cache.content;
        document.getElementById('author').textContent = `- ${cache.author}`;
        return;
    }
    try {
        const response = await fetch('https://api.quotable.io/random');
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify({ content: data.content, author: data.author, timestamp: now }));
        document.getElementById('quote').textContent = data.content;
        document.getElementById('author').textContent = `- ${data.author}`;
    } catch (error) {
        document.getElementById('quote').textContent = 'Failed to load quote.';
        console.error('API Error:', error);
    }
}