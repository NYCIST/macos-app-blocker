const appSelect = document.getElementById('appName');
const customAppGroup = document.getElementById('customAppGroup');
const useTimeRangeSelect = document.getElementById('useTimeRange');
const timeRangeFields = document.getElementById('timeRangeFields');
const form = document.getElementById('scriptForm');
const fileUploadArea = document.getElementById('fileUploadArea');
const schoolDaysFileInput = document.getElementById('schoolDaysFile');
const fileInfo = document.getElementById('fileInfo');

let uploadedSchoolDaysContent = '';

// Show/hide custom app input
appSelect.addEventListener('change', function() {
    if (this.value === 'Custom') {
        customAppGroup.style.display = 'block';
        document.getElementById('customAppName').required = true;
    } else {
        customAppGroup.style.display = 'none';
        document.getElementById('customAppName').required = false;
    }
});

// Show/hide time range fields
useTimeRangeSelect.addEventListener('change', function() {
    if (this.value === 'yes') {
        timeRangeFields.style.display = 'block';
        document.getElementById('startTime').required = true;
        document.getElementById('endTime').required = true;
        document.getElementById('daysOfWeek').required = true;
    } else {
        timeRangeFields.style.display = 'none';
        document.getElementById('startTime').required = false;
        document.getElementById('endTime').required = false;
        document.getElementById('daysOfWeek').required = false;
    }
});

// File upload handling
fileUploadArea.addEventListener('click', function() {
    schoolDaysFileInput.click();
});

fileUploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.add('drag-over');
});

fileUploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.remove('drag-over');
});

fileUploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

schoolDaysFileInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

function handleFileUpload(file) {
    if (!file.name.endsWith('.txt')) {
        alert('Please upload a .txt file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedSchoolDaysContent = e.target.result;
        const lineCount = uploadedSchoolDaysContent.split('\n').filter(line => {
            line = line.trim();
            return line.length > 0 && !line.startsWith('#');
        }).length;
        
        fileInfo.textContent = `✓ ${file.name} uploaded (${lineCount} dates found)`;
        fileInfo.classList.add('show');
    };
    reader.readAsText(file);
}

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const useTimeRange = document.getElementById('useTimeRange').value;
    if (useTimeRange === 'yes') {
        generateFullScript();
    } else {
        generateManualScripts();
    }
});

function generateFullScript() {
    let appName = document.getElementById('appName').value;
    
    if (appName === 'Custom') {
        appName = document.getElementById('customAppName').value.trim();
        if (!appName) {
            alert('Please enter a custom app name');
            return;
        }
    }

    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const daysOfWeek = document.getElementById('daysOfWeek').value;
    const schoolIps = document.getElementById('schoolIps').value.trim();

    // Convert time to 24-hour format for comparison
    const [startHour, startMinute] = startTime.split(':');
    const [endHour, endMinute] = endTime.split(':');

    // Create lowercase and safe versions of app name
    const appNameLower = appName.toLowerCase().replace(/\s+/g, '');
    const appNameSafe = appName.replace(/\s+/g, '');

    // Process IP addresses
    const ipAddresses = schoolIps.split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);

    // Process school days from uploaded file
    const schoolDays = uploadedSchoolDaysContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    // Build script using string concatenation to avoid template literal issues
    let script = '#!/bin/bash\n';
    script += '# Setup script for blocking ' + appName + ' app on school days only\n';
    script += '# Author: Jacob Farkas\n';
    script += '# Created with assistance from Claude (Anthropic)\n';
    script += '# Date: ' + new Date().toISOString().split('T')[0] + '\n';
    script += '# Uses LaunchDaemon checker that runs every minute (no cron jobs)\n';
    script += '\n\n';
    
    // ===== SECTION 1: CREATE BLOCKING DAEMON (UNCHANGED) =====
    script += '# Create the blocking LaunchDaemon plist\n';
    script += '# This daemon kills the app continuously when loaded\n';
    script += 'cat > /Library/LaunchDaemons/com.block.' + appNameLower + '.plist << \'EOF\'\n';
    script += '<?xml version="1.0" encoding="UTF-8"?>\n';
    script += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';
    script += '<plist version="1.0">\n';
    script += '<dict>\n';
    script += '    <key>Label</key>\n';
    script += '    <string>com.block.' + appNameLower + '</string>\n';
    script += '    <key>ProgramArguments</key>\n';
    script += '    <array>\n';
    script += '        <string>/bin/bash</string>\n';
    script += '        <string>-c</string>\n';
    script += '        <string>while true; do killall ' + appNameSafe + ' 2>/dev/null; sleep 1; done</string>\n';
    script += '    </array>\n';
    script += '    <key>RunAtLoad</key>\n';
    script += '    <true/>\n';
    script += '    <key>KeepAlive</key>\n';
    script += '    <true/>\n';
    script += '</dict>\n';
    script += '</plist>\n';
    script += 'EOF\n';
    script += '\n';
    script += '# Set proper permissions\n';
    script += 'chmod 644 /Library/LaunchDaemons/com.block.' + appNameLower + '.plist\n';
    script += 'chown root:wheel /Library/LaunchDaemons/com.block.' + appNameLower + '.plist\n';
    script += '\n';
    
    // ===== SECTION 2: CREATE CHECKER DAEMON (NEW!) =====
    script += '# Create the checker LaunchDaemon plist\n';
    script += '# This daemon runs the master checker script every 60 seconds\n';
    script += 'cat > /Library/LaunchDaemons/com.check.' + appNameLower + '.plist << \'EOF\'\n';
    script += '<?xml version="1.0" encoding="UTF-8"?>\n';
    script += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';
    script += '<plist version="1.0">\n';
    script += '<dict>\n';
    script += '    <key>Label</key>\n';
    script += '    <string>com.check.' + appNameLower + '</string>\n';
    script += '    <key>ProgramArguments</key>\n';
    script += '    <array>\n';
    script += '        <string>/usr/local/bin/check_and_manage_' + appNameLower + '.sh</string>\n';
    script += '    </array>\n';
    script += '    <key>StartInterval</key>\n';
    script += '    <integer>60</integer>\n';
    script += '    <key>RunAtLoad</key>\n';
    script += '    <true/>\n';
    script += '    <key>StandardOutPath</key>\n';
    script += '    <string>/var/log/' + appNameLower + '_check.log</string>\n';
    script += '    <key>StandardErrorPath</key>\n';
    script += '    <string>/var/log/' + appNameLower + '_check.log</string>\n';
    script += '</dict>\n';
    script += '</plist>\n';
    script += 'EOF\n';
    script += '\n';
    script += '# Set proper permissions\n';
    script += 'chmod 644 /Library/LaunchDaemons/com.check.' + appNameLower + '.plist\n';
    script += 'chown root:wheel /Library/LaunchDaemons/com.check.' + appNameLower + '.plist\n';
    script += '\n';
    
    script += '# Create scripts directory\n';
    script += 'mkdir -p /usr/local/bin\n';
    script += '\n';
    
    // ===== SECTION 3: CREATE MASTER CHECKER SCRIPT (NEW! - THE BRAIN) =====
    script += '# Create the master checker script\n';
    script += '# This script contains ALL the logic and runs every minute\n';
    script += 'cat > /usr/local/bin/check_and_manage_' + appNameLower + '.sh << \'EOF\'\n';
    script += '#!/bin/bash\n';
    script += '\n';
    script += '# Configuration\n';
    script += 'SCHOOL_DAYS_FILE="/usr/local/etc/school_days.txt"\n';
    script += 'SCHOOL_IPS_FILE="/usr/local/etc/school_ips.txt"\n';
    script += 'BLOCKER_LABEL="com.block.' + appNameLower + '"\n';
    script += 'START_TIME="' + startTime + '"\n';
    script += 'END_TIME="' + endTime + '"\n';
    script += '\n';
    script += '# Get current date and time\n';
    script += 'TODAY=$(date +%Y-%m-%d)\n';
    script += 'CURRENT_TIME=$(date +%H:%M)\n';
    script += '\n';
    script += '# Function to check if blocker is currently loaded\n';
    script += 'is_blocker_loaded() {\n';
    script += '    launchctl list | grep -q "^[0-9]*\\s*0\\s*${BLOCKER_LABEL}$"\n';
    script += '    return $?\n';
    script += '}\n';
    script += '\n';
    script += '# Function to load blocker\n';
    script += 'load_blocker() {\n';
    script += '    launchctl load /Library/LaunchDaemons/${BLOCKER_LABEL}.plist 2>/dev/null\n';
    script += '    echo "$(date \'+%Y-%m-%d %H:%M:%S\') - BLOCKING ENABLED: ' + appName + '"\n';
    script += '}\n';
    script += '\n';
    script += '# Function to unload blocker\n';
    script += 'unload_blocker() {\n';
    script += '    launchctl unload /Library/LaunchDaemons/${BLOCKER_LABEL}.plist 2>/dev/null\n';
    script += '    echo "$(date \'+%Y-%m-%d %H:%M:%S\') - BLOCKING DISABLED: ' + appName + '"\n';
    script += '}\n';
    script += '\n';
    script += '# Check 1: Is it within blocking hours?\n';
    script += 'if [[ "$CURRENT_TIME" < "$START_TIME" ]] || [[ "$CURRENT_TIME" > "$END_TIME" ]]; then\n';
    script += '    # Outside blocking hours\n';
    script += '    if is_blocker_loaded; then\n';
    script += '        unload_blocker\n';
    script += '    fi\n';
    script += '    exit 0\n';
    script += 'fi\n';
    script += '\n';
    script += '# Check 2: Is it a school day?\n';
    script += 'if [ ! -f "$SCHOOL_DAYS_FILE" ]; then\n';
    script += '    # No school days file - unload if loaded\n';
    script += '    if is_blocker_loaded; then\n';
    script += '        unload_blocker\n';
    script += '    fi\n';
    script += '    exit 0\n';
    script += 'fi\n';
    script += '\n';
    script += 'if ! grep -q "^${TODAY}$" "$SCHOOL_DAYS_FILE"; then\n';
    script += '    # Not a school day\n';
    script += '    if is_blocker_loaded; then\n';
    script += '        unload_blocker\n';
    script += '    fi\n';
    script += '    exit 0\n';
    script += 'fi\n';
    script += '\n';
    script += '# Check 3: Are we at school IP?\n';
    script += 'if [ ! -f "$SCHOOL_IPS_FILE" ]; then\n';
    script += '    # No IPs file - unload if loaded\n';
    script += '    if is_blocker_loaded; then\n';
    script += '        unload_blocker\n';
    script += '    fi\n';
    script += '    exit 0\n';
    script += 'fi\n';
    script += '\n';
    script += 'CURRENT_IP=$(curl -s --max-time 5 checkip.amazonaws.com 2>/dev/null | tr -d \'[:space:]\')\n';
    script += '\n';
    script += 'if [ -z "$CURRENT_IP" ]; then\n';
    script += '    # Cannot determine IP - unload if loaded\n';
    script += '    if is_blocker_loaded; then\n';
    script += '        unload_blocker\n';
    script += '    fi\n';
    script += '    exit 0\n';
    script += 'fi\n';
    script += '\n';
    script += 'if ! grep -q "^${CURRENT_IP}$" "$SCHOOL_IPS_FILE"; then\n';
    script += '    # Not at school IP\n';
    script += '    if is_blocker_loaded; then\n';
    script += '        unload_blocker\n';
    script += '    fi\n';
    script += '    exit 0\n';
    script += 'fi\n';
    script += '\n';
    script += '# All conditions met - ensure blocker is loaded\n';
    script += 'if ! is_blocker_loaded; then\n';
    script += '    load_blocker\n';
    script += 'fi\n';
    script += 'EOF\n';
    script += '\n';
    script += '# Make checker script executable\n';
    script += 'chmod +x /usr/local/bin/check_and_manage_' + appNameLower + '.sh\n';
    script += '\n';
    
    // ===== SECTION 4: CREATE DATA FILES =====
    script += '# Create the school days directory and file\n';
    script += 'mkdir -p /usr/local/etc\n';
    script += '\n';
    script += '# Create school_days.txt with uploaded content or template\n';
    
    if (schoolDays.length > 0) {
        script += 'cat > /usr/local/etc/school_days.txt << \'SCHOOLDAYS\'\n';
        for (let i = 0; i < schoolDays.length; i++) {
            script += schoolDays[i] + '\n';
        }
        script += 'SCHOOLDAYS\n';
        const dateCount = schoolDays.filter(line => !line.startsWith('#') && line.length > 0).length;
        script += 'echo "Created school days file at /usr/local/etc/school_days.txt with ' + dateCount + ' date(s)"\n';
    } else {
        script += 'if [ ! -f /usr/local/etc/school_days.txt ]; then\n';
        script += '    cat > /usr/local/etc/school_days.txt << \'SCHOOLDAYS\'\n';
        script += '# School Days\n';
        script += '# Format: YYYY-MM-DD (one date per line)\n';
        script += '# Lines starting with # are comments and will be ignored\n';
        script += '# Example:\n';
        script += '# 2025-01-06\n';
        script += '# 2025-01-07\n';
        script += '\n';
        script += 'SCHOOLDAYS\n';
        script += '    echo "Created school days file at /usr/local/etc/school_days.txt"\n';
        script += 'fi\n';
    }
    
    script += '\n';
    script += '# Create school_ips.txt with provided IPs or template\n';
    
    if (ipAddresses.length > 0) {
        script += 'cat > /usr/local/etc/school_ips.txt << \'SCHOOLIPS\'\n';
        script += '# School IP Addresses\n';
        script += '# Format: One IP address per line\n';
        script += '# Lines starting with # are comments and will be ignored\n';
        script += '# These IPs were provided during script generation:\n';
        script += '\n';
        for (let i = 0; i < ipAddresses.length; i++) {
            script += ipAddresses[i] + '\n';
        }
        script += 'SCHOOLIPS\n';
        script += 'echo "Created school IPs file at /usr/local/etc/school_ips.txt with ' + ipAddresses.length + ' IP address(es)"\n';
    } else {
        script += 'if [ ! -f /usr/local/etc/school_ips.txt ]; then\n';
        script += '    cat > /usr/local/etc/school_ips.txt << \'SCHOOLIPS\'\n';
        script += '# School IP Addresses\n';
        script += '# Format: One IP address per line\n';
        script += '# Lines starting with # are comments and will be ignored\n';
        script += '# Add your school/work IP addresses below:\n';
        script += '\n';
        script += 'SCHOOLIPS\n';
        script += '    echo "Created school IPs file at /usr/local/etc/school_ips.txt"\n';
        script += 'fi\n';
    }
    
    script += '\n';
    
    // ===== SECTION 5: CREATE UNINSTALLER SCRIPT (NEW!) =====
    script += '# Create uninstaller script\n';
    script += 'cat > /usr/local/bin/uninstall_' + appNameLower + '_blocker.sh << \'EOF\'\n';
    script += '#!/bin/bash\n';
    script += '# Uninstaller script for ' + appName + ' blocker\n';
    script += '# Author: Jacob Farkas\n';
    script += '# Created with assistance from Claude (Anthropic)\n';
    script += '\n';
    script += 'echo "Uninstalling ' + appName + ' blocker..."\n';
    script += 'echo ""\n';
    script += '\n';
    script += '# Unload and remove checker daemon\n';
    script += 'if [ -f /Library/LaunchDaemons/com.check.' + appNameLower + '.plist ]; then\n';
    script += '    launchctl unload /Library/LaunchDaemons/com.check.' + appNameLower + '.plist 2>/dev/null\n';
    script += '    rm /Library/LaunchDaemons/com.check.' + appNameLower + '.plist\n';
    script += '    echo "✓ Removed checker daemon"\n';
    script += 'fi\n';
    script += '\n';
    script += '# Unload and remove blocking daemon\n';
    script += 'if [ -f /Library/LaunchDaemons/com.block.' + appNameLower + '.plist ]; then\n';
    script += '    launchctl unload /Library/LaunchDaemons/com.block.' + appNameLower + '.plist 2>/dev/null\n';
    script += '    rm /Library/LaunchDaemons/com.block.' + appNameLower + '.plist\n';
    script += '    echo "✓ Removed blocking daemon"\n';
    script += 'fi\n';
    script += '\n';
    script += '# Remove checker script\n';
    script += 'if [ -f /usr/local/bin/check_and_manage_' + appNameLower + '.sh ]; then\n';
    script += '    rm /usr/local/bin/check_and_manage_' + appNameLower + '.sh\n';
    script += '    echo "✓ Removed checker script"\n';
    script += 'fi\n';
    script += '\n';
    script += '# Optional: Remove data files (uncomment to remove)\n';
    script += '# if [ -f /usr/local/etc/school_days.txt ]; then\n';
    script += '#     rm /usr/local/etc/school_days.txt\n';
    script += '#     echo "✓ Removed school days file"\n';
    script += '# fi\n';
    script += '#\n';
    script += '# if [ -f /usr/local/etc/school_ips.txt ]; then\n';
    script += '#     rm /usr/local/etc/school_ips.txt\n';
    script += '#     echo "✓ Removed school IPs file"\n';
    script += '# fi\n';
    script += '\n';
    script += '# Optional: Remove log file (uncomment to remove)\n';
    script += '# if [ -f /var/log/' + appNameLower + '_check.log ]; then\n';
    script += '#     rm /var/log/' + appNameLower + '_check.log\n';
    script += '#     echo "✓ Removed log file"\n';
    script += '# fi\n';
    script += '\n';
    script += 'echo ""\n';
    script += 'echo "Uninstall complete!"\n';
    script += 'echo ""\n';
    script += 'echo "Note: school_days.txt, school_ips.txt, and log files were preserved."\n';
    script += 'echo "To remove them, uncomment the relevant sections in this script and run again."\n';
    script += 'EOF\n';
    script += '\n';
    script += '# Make uninstaller executable\n';
    script += 'chmod +x /usr/local/bin/uninstall_' + appNameLower + '_blocker.sh\n';
    script += '\n';
    
    // ===== SECTION 6: LOAD THE CHECKER DAEMON =====
    script += '# Load the checker daemon (which will manage the blocker)\n';
    script += 'launchctl load /Library/LaunchDaemons/com.check.' + appNameLower + '.plist\n';
    script += '\n';
    
    // ===== SECTION 7: FINAL OUTPUT =====
    script += 'echo ""\n';
    script += 'echo "=========================================="\n';
    script += 'echo "Setup complete!"\n';
    script += 'echo "=========================================="\n';
    script += 'echo ""\n';
    script += 'echo "' + appName + ' will be blocked on school days from ' + startTime + ' to ' + endTime + ' when at school IP"\n';
    script += 'echo "Checker runs every 60 seconds to manage blocking automatically"\n';
    script += 'echo ""\n';
    script += 'echo "Files created:"\n';
    script += 'echo "  - Blocking daemon: /Library/LaunchDaemons/com.block.' + appNameLower + '.plist"\n';
    script += 'echo "  - Checker daemon: /Library/LaunchDaemons/com.check.' + appNameLower + '.plist"\n';
    script += 'echo "  - Master script: /usr/local/bin/check_and_manage_' + appNameLower + '.sh"\n';
    script += 'echo "  - School days: /usr/local/etc/school_days.txt"\n';
    
    if (schoolDays.length > 0) {
        const dateCount = schoolDays.filter(line => !line.startsWith('#') && line.length > 0).length;
        script += 'echo "    (' + dateCount + ' dates configured)"\n';
    } else {
        script += 'echo "    (You must add dates manually)"\n';
    }
    
    script += 'echo "  - School IPs: /usr/local/etc/school_ips.txt"\n';
    
    if (ipAddresses.length > 0) {
        script += 'echo "    (' + ipAddresses.length + ' IP(s) configured)"\n';
    } else {
        script += 'echo "    (You must add IPs manually)"\n';
    }
    
    script += 'echo "  - Log file: /var/log/' + appNameLower + '_check.log"\n';
    script += 'echo "  - Uninstaller: /usr/local/bin/uninstall_' + appNameLower + '_blocker.sh"\n';
    script += 'echo ""\n';
    script += 'echo "Commands:"\n';
    script += 'echo "  Check status: sudo launchctl list | grep ' + appNameLower + '"\n';
    script += 'echo "  View logs: tail -f /var/log/' + appNameLower + '_check.log"\n';
    script += 'echo "  Uninstall: sudo /usr/local/bin/uninstall_' + appNameLower + '_blocker.sh"\n';
    script += 'echo ""\n';

    // Display the script
    document.getElementById('scriptOutput').textContent = script;
    document.getElementById('outputSection').classList.add('show');
    
    // Scroll to output
    document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function generateManualScripts() {
    let appName = document.getElementById('appName').value;
    
    if (appName === 'Custom') {
        appName = document.getElementById('customAppName').value.trim();
        if (!appName) {
            alert('Please enter a custom app name');
            return;
        }
    }

    const appNameLower = appName.toLowerCase().replace(/\s+/g, '');
    const appNameSafe = appName.replace(/\s+/g, '');

    // Generate block script
    let blockScript = '#!/bin/bash\n';
    blockScript += '# Block script for ' + appName + '\n';
    blockScript += '# Author: Jacob Farkas\n';
    blockScript += '# Created with assistance from Claude (Anthropic)\n';
    blockScript += '# Date: ' + new Date().toISOString().split('T')[0] + '\n';
    blockScript += '\n';
    blockScript += '# Create a launch daemon to kill ' + appName + '\n';
    blockScript += 'sudo tee /Library/LaunchDaemons/com.block.' + appNameLower + '.plist > /dev/null <<EOF\n';
    blockScript += '<?xml version="1.0" encoding="UTF-8"?>\n';
    blockScript += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';
    blockScript += '<plist version="1.0">\n';
    blockScript += '<dict>\n';
    blockScript += '    <key>Label</key>\n';
    blockScript += '    <string>com.block.' + appNameLower + '</string>\n';
    blockScript += '    <key>ProgramArguments</key>\n';
    blockScript += '    <array>\n';
    blockScript += '        <string>/bin/bash</string>\n';
    blockScript += '        <string>-c</string>\n';
    blockScript += '        <string>while true; do killall ' + appNameSafe + ' 2>/dev/null; sleep 1; done</string>\n';
    blockScript += '    </array>\n';
    blockScript += '    <key>RunAtLoad</key>\n';
    blockScript += '    <true/>\n';
    blockScript += '    <key>KeepAlive</key>\n';
    blockScript += '    <true/>\n';
    blockScript += '</dict>\n';
    blockScript += '</plist>\n';
    blockScript += 'EOF\n';
    blockScript += 'sudo launchctl load /Library/LaunchDaemons/com.block.' + appNameLower + '.plist\n';
    blockScript += 'echo "' + appName + ' blocking enabled"\n';

    // Generate restore script - UPDATED to remove checker daemon too
    let restoreScript = '#!/bin/bash\n';
    restoreScript += '# Restore script for ' + appName + '\n';
    restoreScript += '# Author: Jacob Farkas\n';
    restoreScript += '# Created with assistance from Claude (Anthropic)\n';
    restoreScript += '# Date: ' + new Date().toISOString().split('T')[0] + '\n';
    restoreScript += '\n';
    restoreScript += '# Unload and remove the blocking daemon\n';
    restoreScript += 'if [ -f /Library/LaunchDaemons/com.block.' + appNameLower + '.plist ]; then\n';
    restoreScript += '    sudo launchctl unload /Library/LaunchDaemons/com.block.' + appNameLower + '.plist 2>/dev/null\n';
    restoreScript += '    sudo rm /Library/LaunchDaemons/com.block.' + appNameLower + '.plist\n';
    restoreScript += '    echo "' + appName + ' blocking disabled and plist removed"\n';
    restoreScript += 'else\n';
    restoreScript += '    echo "No blocking daemon found for ' + appName + '"\n';
    restoreScript += 'fi\n';
    restoreScript += '\n';
    restoreScript += '# Unload and remove the checker daemon (if exists)\n';
    restoreScript += 'if [ -f /Library/LaunchDaemons/com.check.' + appNameLower + '.plist ]; then\n';
    restoreScript += '    sudo launchctl unload /Library/LaunchDaemons/com.check.' + appNameLower + '.plist 2>/dev/null\n';
    restoreScript += '    sudo rm /Library/LaunchDaemons/com.check.' + appNameLower + '.plist\n';
    restoreScript += '    echo "Checker daemon removed"\n';
    restoreScript += 'fi\n';
    restoreScript += '\n';
    restoreScript += '# Remove the checker script\n';
    restoreScript += 'if [ -f /usr/local/bin/check_and_manage_' + appNameLower + '.sh ]; then\n';
    restoreScript += '    sudo rm /usr/local/bin/check_and_manage_' + appNameLower + '.sh\n';
    restoreScript += '    echo "Checker script removed"\n';
    restoreScript += 'fi\n';
    restoreScript += '\n';
    restoreScript += 'echo "Cleanup complete for ' + appName + '"\n';

    // Display the scripts with download buttons
    const outputSection = document.getElementById('outputSection');
    outputSection.innerHTML = `
        <div class="output-header">
            <h3>Block Script</h3>
            <button class="btn-copy" onclick="copyToClipboard('blockScript')">Copy to Clipboard</button>
        </div>
        <div class="script-output" id="blockScript">${escapeHtml(blockScript)}</div>
        <div style="margin: 15px 0; text-align: center;">
            <button class="btn-generate" onclick="downloadIndividualScript('block', '${appNameLower}')" style="display: inline-block; width: auto; padding: 12px 30px;">
                Download Block Script
            </button>
        </div>
        
        <div class="output-header" style="margin-top: 30px;">
            <h3>Restore Script</h3>
            <button class="btn-copy" onclick="copyToClipboard('restoreScript')">Copy to Clipboard</button>
        </div>
        <div class="script-output" id="restoreScript">${escapeHtml(restoreScript)}</div>
        <div style="margin: 15px 0; text-align: center;">
            <button class="btn-generate" onclick="downloadIndividualScript('restore', '${appNameLower}')" style="display: inline-block; width: auto; padding: 12px 30px;">
                Download Restore Script
            </button>
        </div>
    `;
    
    outputSection.classList.add('show');
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    });
}

function downloadIndividualScript(scriptType, appNameLower) {
    const elementId = scriptType + 'Script';
    const scriptText = document.getElementById(elementId).textContent;
    const filename = scriptType + '_' + appNameLower + '.sh';
    
    const blob = new Blob([scriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyScript() {
    const scriptText = document.getElementById('scriptOutput').textContent;
    navigator.clipboard.writeText(scriptText).then(() => {
        const btn = document.querySelector('.btn-copy');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    });
}

function downloadScript() {
    const scriptText = document.getElementById('scriptOutput').textContent;
    const appName = document.getElementById('appName').value === 'Custom' 
        ? document.getElementById('customAppName').value 
        : document.getElementById('appName').value;
    const filename = appName.toLowerCase().replace(/\s+/g, '_') + '_blocker.sh';
    
    const blob = new Blob([scriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function resetForm() {
    document.getElementById('scriptForm').reset();
    document.getElementById('outputSection').classList.remove('show');
    document.getElementById('outputSection').innerHTML = '<div class="output-header"><h3>Generated Script</h3><button class="btn-copy" onclick="copyScript()">Copy to Clipboard</button></div><div class="script-output" id="scriptOutput"></div><div style="margin-top: 15px; text-align: center;"><button class="btn-generate" onclick="downloadScript()" style="display: inline-block; width: auto; padding: 12px 30px;">Download Script</button></div>';
    customAppGroup.style.display = 'none';
    timeRangeFields.style.display = 'none';
    uploadedSchoolDaysContent = '';
    fileInfo.classList.remove('show');
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const toggle = document.getElementById(sectionId.replace('Section', 'Toggle'));
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        toggle.textContent = '−';
    } else {
        section.style.display = 'none';
        toggle.textContent = '+';
    }
}
