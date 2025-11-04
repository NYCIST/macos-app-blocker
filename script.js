const appSelect = document.getElementById('appName');
const customAppGroup = document.getElementById('customAppGroup');
const useTimeRangeSelect = document.getElementById('useTimeRange');
const timeRangeFields = document.getElementById('timeRangeFields');
const form = document.getElementById('scriptForm');

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

    // Convert time to cron format
    const [startHour, startMinute] = startTime.split(':');
    const [endHour, endMinute] = endTime.split(':');

    // Create lowercase and safe versions of app name
    const appNameLower = appName.toLowerCase().replace(/\s+/g, '');
    const appNameSafe = appName.replace(/\s+/g, '');

    // Process IP addresses
    const ipAddresses = schoolIps.split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);

    // Build script using string concatenation to avoid template literal issues
    let script = '#!/bin/bash\n';
    script += '# Setup script for blocking ' + appName + ' app on school days only\n';
    script += '# Author: Jacob Farkas\n';
    script += '# Created with assistance from Claude (Anthropic)\n';
    script += '# Date: 2025-10-30\n';
    script += '\n\n';
    script += '# Create the LaunchDaemon plist\n';
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
    script += '# Create scripts directory\n';
    script += 'mkdir -p /usr/local/bin\n';
    script += '\n';
    script += '# Create the school day checker script\n';
    script += 'cat > /usr/local/bin/check_school_day.sh << \'EOF\'\n';
    script += '#!/bin/bash\n';
    script += '# School Day Checker Script\n';
    script += '# Returns 0 (success) if today is a school day\n';
    script += '# Returns 1 (failure) if today is not a school day\n';
    script += 'SCHOOL_DAYS_FILE="/usr/local/etc/school_days.txt"\n';
    script += 'TODAY=$(date +%Y-%m-%d)\n';
    script += '# Check if school days file exists\n';
    script += 'if [ ! -f "$SCHOOL_DAYS_FILE" ]; then\n';
    script += '    echo "$(date \'+%Y-%m-%d %H:%M:%S\') - Warning: $SCHOOL_DAYS_FILE not found. Not blocking."\n';
    script += '    exit 1\n';
    script += 'fi\n';
    script += '# Check if today is in the school days file\n';
    script += 'if grep -q "^${TODAY}$" "$SCHOOL_DAYS_FILE"; then\n';
    script += '    echo "$(date \'+%Y-%m-%d %H:%M:%S\') - Today ($TODAY) is a school day - proceeding with ' + appName + ' block"\n';
    script += '    exit 0  # Zero exit = school day, will block\n';
    script += 'else\n';
    script += '    echo "$(date \'+%Y-%m-%d %H:%M:%S\') - Today ($TODAY) is NOT a school day - skipping ' + appName + ' block"\n';
    script += '    exit 1  # Non-zero exit = not a school day, will NOT block\n';
    script += 'fi\n';
    script += 'EOF\n';
    script += '\n';
    script += '# Create the IP checker script\n';
    script += 'cat > /usr/local/bin/check_ip.sh << \'EOF\'\n';
    script += '#!/bin/bash\n';
    script += '# IP Checker Script\n';
    script += '# Returns 0 (success) if current IP matches school IPs\n';
    script += '# Returns 1 (failure) if IP does not match\n';
    script += 'SCHOOL_IPS_FILE="/usr/local/etc/school_ips.txt"\n';
    script += 'CURRENT_IP=$(curl -s --max-time 5 checkip.amazonaws.com)\n';
    script += '# Check if we got an IP\n';
    script += 'if [ -z "$CURRENT_IP" ]; then\n';
    script += '    echo "$(date \'+%Y-%m-%d %H:%M:%S\') - Warning: Could not determine current IP. Not blocking."\n';
    script += '    exit 1\n';
    script += 'fi\n';
    script += '# Trim any whitespace\n';
    script += 'CURRENT_IP=$(echo "$CURRENT_IP" | tr -d \'[:space:]\')\n';
    script += '# Check if school IPs file exists\n';
    script += 'if [ ! -f "$SCHOOL_IPS_FILE" ]; then\n';
    script += '    echo "$(date \'+%Y-%m-%d %H:%M:%S\') - Warning: $SCHOOL_IPS_FILE not found. Not blocking."\n';
    script += '    exit 1\n';
    script += 'fi\n';
    script += 'echo "$(date \'+%Y-%m-%d %H:%M:%S\') - Current IP: $CURRENT_IP"\n';
    script += '# Check if current IP is in the school IPs file\n';
    script += 'if grep -q "^${CURRENT_IP}$" "$SCHOOL_IPS_FILE"; then\n';
    script += '    echo "$(date \'+%Y-%m-%d %H:%M:%S\') - IP match found - AT SCHOOL - proceeding with ' + appName + ' block"\n';
    script += '    exit 0  # Zero exit = at school, will block\n';
    script += 'else\n';
    script += '    echo "$(date \'+%Y-%m-%d %H:%M:%S\') - IP not in school list - OUT OF SCHOOL - skipping ' + appName + ' block"\n';
    script += '    exit 1  # Non-zero exit = not at school, will NOT block\n';
    script += 'fi\n';
    script += 'EOF\n';
    script += '\n';
    script += '# Create ' + appName + ' block script\n';
    script += 'cat > /usr/local/bin/block_' + appNameLower + '.sh << \'EOF\'\n';
    script += '#!/bin/bash\n';
    script += 'launchctl load /Library/LaunchDaemons/com.block.' + appNameLower + '.plist\n';
    script += 'echo "$(date \'+%Y-%m-%d %H:%M:%S\') - ' + appName + ' blocking ENABLED"\n';
    script += 'EOF\n';
    script += '\n';
    script += '# Create ' + appName + ' restore script\n';
    script += 'cat > /usr/local/bin/restore_' + appNameLower + '.sh << \'EOF\'\n';
    script += '#!/bin/bash\n';
    script += 'if [ -f /Library/LaunchDaemons/com.block.' + appNameLower + '.plist ]; then\n';
    script += '    launchctl unload /Library/LaunchDaemons/com.block.' + appNameLower + '.plist 2>/dev/null\n';
    script += '    echo "$(date \'+%Y-%m-%d %H:%M:%S\') - ' + appName + ' blocking DISABLED"\n';
    script += 'fi\n';
    script += 'EOF\n';
    script += '\n';
    script += '# Make scripts executable\n';
    script += 'chmod +x /usr/local/bin/check_school_day.sh\n';
    script += 'chmod +x /usr/local/bin/check_ip.sh\n';
    script += 'chmod +x /usr/local/bin/block_' + appNameLower + '.sh\n';
    script += 'chmod +x /usr/local/bin/restore_' + appNameLower + '.sh\n';
    script += '\n';
    script += '# Create the school days directory and file\n';
    script += 'mkdir -p /usr/local/etc\n';
    script += '\n';
    script += '# Create school_days.txt if it doesn\'t exist\n';
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
    script += '\n';
    script += '# Create school_ips.txt with provided IPs or template\n';
    
    if (ipAddresses.length > 0) {
        // User provided IPs - create file with those IPs
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
        // No IPs provided - create template file
        script += 'if [ ! -f /usr/local/etc/school_ips.txt ]; then\n';
        script += '    cat > /usr/local/etc/school_ips.txt << \'SCHOOLIPS\'\n';
        script += '# School IP Addresses\n';
        script += '# Format: One IP address per line\n';
        script += '# Lines starting with # are comments and will be ignored\n';
        script += '# Example:\n';
        script += '# nnn.nn.nnn.nn\n';
        script += '\n';
        script += 'SCHOOLIPS\n';
        script += '    echo "Created school IPs file at /usr/local/etc/school_ips.txt"\n';
        script += 'fi\n';
    }
    
    script += '\n';
    script += '# Add cron jobs - Block at ' + startTime + ', Restore at ' + endTime + ' on SCHOOL DAYS and AT SCHOOL IPs only\n';
    script += '# Both school day and IP checks happen in cron using && operator\n';
    script += '(crontab -l 2>/dev/null | grep -v "block_' + appNameLower + '\\|restore_' + appNameLower + '"; cat << \'CRON\'\n';
    script += startMinute + ' ' + startHour + ' * * ' + daysOfWeek + ' ( /usr/local/bin/check_school_day.sh && /usr/local/bin/check_ip.sh && /usr/local/bin/block_' + appNameLower + '.sh ) >> /var/log/' + appNameLower + '_block.log 2>&1\n';
    script += endMinute + ' ' + endHour + ' * * ' + daysOfWeek + ' /usr/local/bin/restore_' + appNameLower + '.sh >> /var/log/' + appNameLower + '_block.log 2>&1\n';
    script += 'CRON\n';
    script += ') | crontab -\n';
    script += '\n';
    script += 'echo ""\n';
    script += 'echo "=========================================="\n';
    script += 'echo "Setup complete!"\n';
    script += 'echo "=========================================="\n';
    script += 'echo ""\n';
    script += 'echo "' + appName + ' will be blocked on school days from ' + startTime + '-' + endTime + ' when at school IP"\n';
    script += 'echo "School days file: /usr/local/etc/school_days.txt"\n';
    script += 'echo "School IPs file: /usr/local/etc/school_ips.txt"\n';
    
    if (ipAddresses.length > 0) {
        script += 'echo "IP addresses configured: ' + ipAddresses.length + '"\n';
    } else {
        script += 'echo "NOTE: No IP addresses provided - you must manually add IPs to /usr/local/etc/school_ips.txt"\n';
    }
    
    script += 'echo "Log file: /var/log/' + appNameLower + '_block.log"\n';
    script += 'echo ""\n';
    script += 'echo "Cron jobs installed:"\n';
    script += 'crontab -l | grep ' + appNameLower + '\n';
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
    blockScript += '# Date: 2025-10-30\n';
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

    // Generate restore script
    let restoreScript = '#!/bin/bash\n';
    restoreScript += '# Restore script for ' + appName + '\n';
    restoreScript += '# Author: Jacob Farkas\n';
    restoreScript += '# Created with assistance from Claude (Anthropic)\n';
    restoreScript += '# Date: 2025-10-30\n';
    restoreScript += '\n';
    restoreScript += '# Unload and remove the launch daemon\n';
    restoreScript += 'if [ -f /Library/LaunchDaemons/com.block.' + appNameLower + '.plist ]; then\n';
    restoreScript += '    sudo launchctl unload /Library/LaunchDaemons/com.block.' + appNameLower + '.plist 2>/dev/null\n';
    restoreScript += '    sudo rm /Library/LaunchDaemons/com.block.' + appNameLower + '.plist\n';
    restoreScript += '    echo "' + appName + ' blocking disabled and plist removed"\n';
    restoreScript += 'else\n';
    restoreScript += '    echo "No blocking configuration found for ' + appName + '"\n';
    restoreScript += 'fi\n';
    restoreScript += '\n';
    restoreScript += '# Remove any cron jobs related to this app\n';
    restoreScript += 'if crontab -l 2>/dev/null | grep -q "block_' + appNameLower + '\\|restore_' + appNameLower + '"; then\n';
    restoreScript += '    crontab -l 2>/dev/null | grep -v "block_' + appNameLower + '\\|restore_' + appNameLower + '" | crontab -\n';
    restoreScript += '    echo "Removed cron jobs for ' + appName + '"\n';
    restoreScript += 'fi\n';

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
