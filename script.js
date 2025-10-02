// Robot data
let robots = [{
        id: 'robot-maid',
        name: 'maid',
        battery: 67,
        status: 'online',
        position: {
            x: 8,
            y: 12
        },
        goal: {
            x: 15,
            y: 18
        },
        speed: 0.9,
        heading: 65,
        eta: 280,
        currentTask: 'Cleaning living room area',
        taskHistory: [{
                id: 'task-maid-001',
                task: 'Prepare food orders',
                timestamp: new Date(Date.now() - 2400000),
                status: 'completed'
            },
            {
                id: 'task-maid-002',
                task: 'Clean dining area',
                timestamp: new Date(Date.now() - 1800000),
                status: 'completed'
            },
            {
                id: 'task-maid-003',
                task: 'Working in food restaurant',
                timestamp: new Date(Date.now() - 600000),
                status: 'in-progress'
            },
        ]
    },
    {
        id: 'robot-milo',
        name: 'milo',
        battery: 89,
        status: 'online',
        position: {
            x: 22,
            y: 8
        },
        goal: {
            x: 18,
            y: 14
        },
        speed: 1.1,
        heading: 225,
        eta: 150,
        currentTask: 'Working in warehouse',
        taskHistory: [{
                id: 'task-milo-001',
                task: 'Inventory management',
                timestamp: new Date(Date.now() - 1800000),
                status: 'completed'
            },
            {
                id: 'task-milo-002',
                task: 'Package sorting',
                timestamp: new Date(Date.now() - 900000),
                status: 'completed'
            },
            {
                id: 'task-milo-003',
                task: 'Working in warehouse',
                timestamp: new Date(Date.now() - 300000),
                status: 'in-progress'
            },
        ]
    }
];

let notifications = [{
        id: 'notif-001',
        type: 'info',
        message: 'milo started package delivery task',
        timestamp: new Date(Date.now() - 300000),
        robotId: 'robot-milo'
    },
    {
        id: 'notif-002',
        type: 'success',
        message: 'maid completed kitchen cleaning',
        timestamp: new Date(Date.now() - 600000),
        robotId: 'robot-maid'
    },
    {
        id: 'notif-003',
        type: 'warning',
        message: 'maid battery level moderate (67%)',
        timestamp: new Date(Date.now() - 900000),
        robotId: 'robot-maid'
    },
    {
        id: 'notif-004',
        type: 'success',
        message: 'milo navigation checkpoint reached',
        timestamp: new Date(Date.now() - 1200000),
        robotId: 'robot-milo'
    }
];

let currentSort = 'name';
let currentFilter = 'all';
let selectedRobot = null;
let isNotificationDropdownOpen = false;
let isGoalPanelOpen = false;

// Utility functions
function getBatteryColor(percentage) {
    if (percentage >= 80) return 'battery-high';
    if (percentage >= 40) return 'battery-medium';
    return 'battery-low';
}

function getBatteryIcon(percentage) {
    if (percentage >= 80) return '🔋';
    if (percentage >= 40) return '🔋';
    return '🪫';
}

function getStatusConfig(status) {
    const configs = {
        online: {
            class: 'status-online',
            icon: '🟢',
            label: 'Online'
        },
        offline: {
            class: 'status-offline',
            icon: '⚫',
            label: 'Offline'
        },
        error: {
            class: 'status-error',
            icon: '⚠️',
            label: 'Error'
        },
        maintenance: {
            class: 'status-maintenance',
            icon: '🔧',
            label: 'Maintenance'
        }
    };
    return configs[status] || configs.offline;
}

function formatETA(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatHeading(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

function formatTimestamp(timestamp) {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTaskTimestamp(timestamp) {
    return timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Create minimap
function createMiniMap(position, goal, size = 'small') {
    const gridSize = 30;
    const positionX = (position.x / gridSize) * 100;
    const positionY = (position.y / gridSize) * 100;
    const goalX = (goal.x / gridSize) * 100;
    const goalY = (goal.y / gridSize) * 100;

    const minimap = document.createElement('div');
    minimap.className = size === 'large' ? 'modal-minimap' : 'minimap';

    // Grid lines
    const grid = document.createElement('div');
    grid.className = 'minimap-grid';

    for (let i = 1; i < 4; i++) {
        const vLine = document.createElement('div');
        vLine.className = 'minimap-grid-line vertical';
        vLine.style.left = `${i * 25}%`;
        grid.appendChild(vLine);

        const hLine = document.createElement('div');
        hLine.className = 'minimap-grid-line horizontal';
        hLine.style.top = `${i * 25}%`;
        grid.appendChild(hLine);
    }
    minimap.appendChild(grid);

    // Robot position
    const robot = document.createElement('div');
    robot.className = 'minimap-robot';
    robot.style.left = `${positionX}%`;
    robot.style.top = `${positionY}%`;
    minimap.appendChild(robot);

    // Goal position
    const goalEl = document.createElement('div');
    goalEl.className = 'minimap-goal';
    goalEl.style.left = `${goalX}%`;
    goalEl.style.top = `${goalY}%`;
    minimap.appendChild(goalEl);

    // Path line
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.className = 'minimap-path';
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', `${positionX}%`);
    line.setAttribute('y1', `${positionY}%`);
    line.setAttribute('x2', `${goalX}%`);
    line.setAttribute('y2', `${goalY}%`);
    line.setAttribute('stroke', '#60a5fa');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '2,2');
    line.setAttribute('opacity', '0.6');

    svg.appendChild(line);
    minimap.appendChild(svg);

    return minimap;
}

// Create battery indicator
function createBatteryIndicator(percentage, size = 'normal') {
    const container = document.createElement('div');
    container.className = 'battery-indicator';

    const icon = document.createElement('span');
    icon.className = `battery-icon ${getBatteryColor(percentage)}`;
    icon.textContent = getBatteryIcon(percentage);

    const barContainer = document.createElement('div');
    barContainer.className = 'battery-bar-container';

    const bar = document.createElement('div');
    bar.className = 'battery-bar';

    const fill = document.createElement('div');
    fill.className = `battery-fill ${getBatteryColor(percentage)}`;
    fill.style.width = `${percentage}%`;
    fill.style.backgroundColor = percentage >= 80 ? '#4ade80' : percentage >= 40 ? '#fbbf24' : '#f87171';

    const text = document.createElement('span');
    text.className = `battery-percentage ${getBatteryColor(percentage)}`;
    text.textContent = `${Math.round(percentage)}%`;

    bar.appendChild(fill);
    barContainer.appendChild(bar);
    barContainer.appendChild(text);
    container.appendChild(icon);
    container.appendChild(barContainer);

    return container;
}

// Create status badge
function createStatusBadge(status) {
    const config = getStatusConfig(status);
    const badge = document.createElement('div');
    badge.className = `status-badge ${config.class}`;
    badge.innerHTML = `${config.icon} ${config.label}`;
    return badge;
}

// Create robot card
function createRobotCard(robot) {
    const card = document.createElement('div');
    card.className = 'robot-card';
    card.onclick = () => openModal(robot);

    const header = document.createElement('div');
    header.className = 'robot-card-header';

    const nameSection = document.createElement('div');
    nameSection.className = 'robot-name-section';

    const name = document.createElement('h3');
    name.className = 'robot-name';
    name.textContent = robot.name;

    const statusBadge = createStatusBadge(robot.status);

    const expandBtn = document.createElement('button');
    expandBtn.className = 'expand-btn';
    expandBtn.textContent = '›';

    nameSection.appendChild(name);
    nameSection.appendChild(statusBadge);
    header.appendChild(nameSection);
    header.appendChild(expandBtn);

    const battery = createBatteryIndicator(robot.battery);

    const content = document.createElement('div');
    content.className = 'card-content';

    const minimap = createMiniMap(robot.position, robot.goal);

    const stats = document.createElement('div');
    stats.className = 'stats';

    const etaStat = document.createElement('div');
    etaStat.className = 'stat-item';
    etaStat.innerHTML = `
        <span class="stat-icon">⏱️</span>
        <span class="stat-text">ETA: ${formatETA(robot.eta)}</span>
    `;

    stats.appendChild(etaStat);
    content.appendChild(minimap);
    content.appendChild(stats);

    const taskSection = document.createElement('div');
    taskSection.className = 'current-task-section';

    const taskLabel = document.createElement('p');
    taskLabel.className = 'current-task-label';
    taskLabel.textContent = 'Current Task:';

    const taskText = document.createElement('p');
    taskText.className = 'current-task-text';
    taskText.textContent = robot.currentTask;

    taskSection.appendChild(taskLabel);
    taskSection.appendChild(taskText);

    const controls = document.createElement('div');
    controls.className = 'robot-controls';

    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'control-btn pause-btn';
    pauseBtn.innerHTML = '⏸️ Pause';
    pauseBtn.disabled = robot.status !== 'online';
    pauseBtn.onclick = (e) => {
        e.stopPropagation();
        pauseRobot(robot.id);
    };

    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'control-btn resume-btn';
    resumeBtn.innerHTML = '▶️ Resume';
    resumeBtn.disabled = robot.status !== 'online';
    resumeBtn.onclick = (e) => {
        e.stopPropagation();
        resumeRobot(robot.id);
    };

    const stopBtn = document.createElement('button');
    stopBtn.className = 'control-btn stop-btn';
    stopBtn.innerHTML = '⏹️ E-Stop';
    stopBtn.onclick = (e) => {
        e.stopPropagation();
        emergencyStop(robot.id);
    };

    controls.appendChild(pauseBtn);
    controls.appendChild(resumeBtn);
    controls.appendChild(stopBtn);

    card.appendChild(header);
    card.appendChild(battery);
    card.appendChild(content);
    card.appendChild(taskSection);
    card.appendChild(controls);

    return card;
}

// Create notification item
function createNotificationItem(notification) {
    const item = document.createElement('div');
    item.className = `notification-item notification-${notification.type}`;

    const iconMap = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };

    item.innerHTML = `
        <div class="notification-icon ${notification.type}">${iconMap[notification.type]}</div>
        <div class="notification-content">
            <p class="notification-message">${notification.message}</p>
            <p class="notification-time">${formatTimestamp(notification.timestamp)}</p>
        </div>
        <button class="notification-dismiss" onclick="dismissNotification('${notification.id}')">✕</button>
    `;

    return item;
}

// Robot control functions
function pauseRobot(robotId) {
    const robot = robots.find(r => r.id === robotId);
    if (robot) {
        robot.status = 'offline';
        robot.speed = 0;

        addNotification({
            id: `notif-${Date.now()}`,
            type: 'info',
            message: `Robot ${robot.name} has been paused`,
            timestamp: new Date(),
            robotId
        });

        renderRobots();
    }
}

function resumeRobot(robotId) {
    const robot = robots.find(r => r.id === robotId);
    if (robot) {
        robot.status = 'online';
        robot.speed = 1.2;

        addNotification({
            id: `notif-${Date.now()}`,
            type: 'success',
            message: `Robot ${robot.name} has been resumed`,
            timestamp: new Date(),
            robotId
        });

        renderRobots();
    }
}

function emergencyStop(robotId) {
    const robot = robots.find(r => r.id === robotId);
    if (robot) {
        robot.status = 'error';
        robot.speed = 0;

        addNotification({
            id: `notif-${Date.now()}`,
            type: 'error',
            message: `Emergency stop activated for ${robot.name}`,
            timestamp: new Date(),
            robotId
        });

        renderRobots();
    }
}

// Notification functions
function addNotification(notification) {
    notifications.unshift(notification);
    renderNotifications();
}

function dismissNotification(notificationId) {
    notifications = notifications.filter(n => n.id !== notificationId);
    renderNotifications();
}

function clearAllNotifications() {
    notifications = [];
    renderNotifications();
}

// Modal functions
function openModal(robot) {
    selectedRobot = robot;
    const modal = document.getElementById('robot-modal');

    // Update modal content
    document.getElementById('modal-robot-name').textContent = robot.name;

    const statusBadge = document.getElementById('modal-status-badge');
    statusBadge.innerHTML = '';
    statusBadge.appendChild(createStatusBadge(robot.status));

    const batteryContainer = document.getElementById('modal-battery');
    batteryContainer.innerHTML = '';
    batteryContainer.appendChild(createBatteryIndicator(robot.battery));

    const statsContainer = document.getElementById('modal-stats');
    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-icon">⏱️</span>
            <span class="stat-text">ETA: ${formatETA(robot.eta)}</span>
        </div>
    `;

    const minimapContainer = document.getElementById('modal-minimap');
    minimapContainer.innerHTML = '';
    minimapContainer.appendChild(createMiniMap(robot.position, robot.goal, 'large'));

    const positionInfo = document.getElementById('modal-position');
    positionInfo.innerHTML = `
        <div class="stat-item">
            <span class="stat-icon">📍</span>
            <span class="stat-text">Position: (${robot.position.x}, ${robot.position.y})</span>
        </div>
        <div class="stat-item">
            <span class="stat-icon">🎯</span>
            <span class="stat-text">Goal: (${robot.goal.x}, ${robot.goal.y})</span>
        </div>
    `;

    document.getElementById('modal-current-task').textContent = robot.currentTask;

    const taskHistory = document.getElementById('modal-task-history');
    taskHistory.innerHTML = '';
    robot.taskHistory.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-history-item';

        const statusClass = `task-status-${task.status}`;

        taskItem.innerHTML = `
            <div class="task-history-content">
                <p class="task-history-task">${task.task}</p>
                <p class="task-history-time">${formatTaskTimestamp(task.timestamp)}</p>
            </div>
            <div class="task-history-status ${statusClass}">${task.status}</div>
        `;

        taskHistory.appendChild(taskItem);
    });

    // Update control buttons
    const pauseBtn = document.getElementById('modal-pause-btn');
    const resumeBtn = document.getElementById('modal-resume-btn');
    const stopBtn = document.getElementById('modal-stop-btn');

    pauseBtn.disabled = robot.status !== 'online';
    resumeBtn.disabled = robot.status !== 'online';

    pauseBtn.onclick = () => pauseRobot(robot.id);
    resumeBtn.onclick = () => resumeRobot(robot.id);
    stopBtn.onclick = () => emergencyStop(robot.id);

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('robot-modal').style.display = 'none';
    selectedRobot = null;
}

// Set Goal Panel functions
function openGoalPanel() {
    const panel = document.getElementById('set-goal-panel');
    panel.style.display = 'flex';
    isGoalPanelOpen = true;
}

function closeGoalPanel() {
    const panel = document.getElementById('set-goal-panel');
    panel.style.display = 'none';
    isGoalPanelOpen = false;

    // Reset form
    document.getElementById('robot-select').value = '';
    document.getElementById('goal-x').value = '';
    document.getElementById('goal-y').value = '';
    document.getElementById('goal-task').value = '';
}

function setRobotGoal() {
    const robotId = document.getElementById('robot-select').value;
    const goalX = parseInt(document.getElementById('goal-x').value);
    const goalY = parseInt(document.getElementById('goal-y').value);
    const taskDescription = document.getElementById('goal-task').value;

    if (!robotId || isNaN(goalX) || isNaN(goalY) || !taskDescription) {
        alert('Please fill in all fields');
        return;
    }

    if (goalX < 0 || goalX > 30 || goalY < 0 || goalY > 30) {
        alert('Coordinates must be between 0 and 30');
        return;
    }

    const robot = robots.find(r => r.id === robotId);
    if (robot) {
        robot.goal = {
            x: goalX,
            y: goalY
        };
        robot.currentTask = taskDescription;
        robot.eta = Math.floor(Math.random() * 300) + 60; // Random ETA between 1-5 minutes

        // Add to task history
        const newTask = {
            id: `task-${Date.now()}`,
            task: taskDescription,
            timestamp: new Date(),
            status: 'in-progress'
        };
        robot.taskHistory.unshift(newTask);

        // Add notification
        addNotification({
            id: `notif-${Date.now()}`,
            type: 'info',
            message: `New goal set for ${robot.name}: ${taskDescription}`,
            timestamp: new Date(),
            robotId
        });

        renderRobots();
        closeGoalPanel();
    }
}

// Filter and sort functions
function getFilteredAndSortedRobots() {
    let filteredRobots = robots;

    // Apply filter
    if (currentFilter !== 'all') {
        filteredRobots = filteredRobots.filter(robot => robot.status === currentFilter);
    }

    // Apply sort
    filteredRobots.sort((a, b) => {
        switch (currentSort) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'battery':
                return b.battery - a.battery;
            case 'status':
                return a.status.localeCompare(b.status);
            default:
                return 0;
        }
    });

    return filteredRobots;
}

// Render functions
function renderRobots() {
    const grid = document.getElementById('robot-grid');
    const noRobots = document.getElementById('no-robots');
    const filteredRobots = getFilteredAndSortedRobots();

    grid.innerHTML = '';

    if (filteredRobots.length === 0) {
        grid.style.display = 'none';
        noRobots.style.display = 'block';
    } else {
        grid.style.display = 'grid';
        noRobots.style.display = 'none';

        filteredRobots.forEach(robot => {
            grid.appendChild(createRobotCard(robot));
        });
    }
}

function renderNotifications() {
    const container = document.getElementById('notifications-container');
    const countElement = document.getElementById('notification-count');
    const clearAllBtn = document.getElementById('clear-all-notifications');

    countElement.textContent = `${notifications.length} notifications`;

    // Enable/disable clear all button based on notification count
    if (clearAllBtn) {
        clearAllBtn.disabled = notifications.length === 0;
    }

    if (notifications.length === 0) {
        container.innerHTML = '<p class="no-notifications">No notifications</p>';
    } else {
        container.innerHTML = '';
        notifications.forEach(notification => {
            container.appendChild(createNotificationItem(notification));
        });
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Notification dropdown toggle
    document.querySelector('.notification-count').addEventListener('click', function(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('notification-dropdown');

        if (isNotificationDropdownOpen) {
            dropdown.style.display = 'none';
            isNotificationDropdownOpen = false;
        } else {
            // Position dropdown relative to notification count
            const rect = this.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + 8}px`;
            dropdown.style.right = `${window.innerWidth - rect.right}px`;
            dropdown.style.display = 'block';
            isNotificationDropdownOpen = true;
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (isNotificationDropdownOpen && !e.target.closest('.notification-dropdown') && !e.target.closest('.notification-count')) {
            document.getElementById('notification-dropdown').style.display = 'none';
            isNotificationDropdownOpen = false;
        }
    });

    // Filter and sort controls
    document.getElementById('filter-select').addEventListener('change', function(e) {
        currentFilter = e.target.value;
        renderRobots();
    });

    document.getElementById('sort-select').addEventListener('change', function(e) {
        currentSort = e.target.value;
        renderRobots();
    });

    // Set Goal Panel controls
    document.getElementById('set-goal-btn').addEventListener('click', openGoalPanel);
    document.getElementById('close-goal-panel').addEventListener('click', closeGoalPanel);
    document.getElementById('cancel-goal').addEventListener('click', closeGoalPanel);
    document.getElementById('set-goal').addEventListener('click', setRobotGoal);

    // Close goal panel when clicking outside
    document.getElementById('set-goal-panel').addEventListener('click', function(e) {
        if (e.target === this) {
            closeGoalPanel();
        }
    });

    // Modal controls
    document.getElementById('close-modal').addEventListener('click', closeModal);

    // Close modal when clicking outside
    document.getElementById('robot-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Clear all notifications
    document.getElementById('clear-all-notifications').addEventListener('click', clearAllNotifications);

    // Initial render
    renderRobots();
    renderNotifications();

    // Simulate real-time updates
    setInterval(() => {
        robots.forEach(robot => {
            // Simulate battery drain
            robot.battery = Math.max(0, robot.battery - (Math.random() * 0.5));

            // Simulate position updates for online robots
            if (robot.status === 'online') {
                robot.position.x = Math.max(0, Math.min(30, robot.position.x + (Math.random() - 0.5) * 0.5));
                robot.position.y = Math.max(0, Math.min(30, robot.position.y + (Math.random() - 0.5) * 0.5));
                robot.eta = Math.max(0, robot.eta - 1);
            }
        });

        renderRobots();
        renderNotifications();

        // Update modal if open
        if (selectedRobot) {
            const updatedRobot = robots.find(r => r.id === selectedRobot.id);
            if (updatedRobot) {
                openModal(updatedRobot);
            }
        }
    }, 3000);
});
