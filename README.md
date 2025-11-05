[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# macos-app-blocker

Web-based tool to generate macOS bash scripts that block applications during specific times.

License: MIT — see LICENSE (Copyright 2025 Jacob Farkas)

# macOS App Blocker Script Generator

A web-based tool to generate macOS bash scripts that block applications during specific times or on-demand. Perfect for managing distractions during school days, work hours, or focus time. Features location-based blocking using IP address checking to ensure blocking only occurs at specified locations (like school or work). You can use these scripts on their own or distribute them to computers you manage using any MDM that can pass custom scripts to client devices.

https://nycist.github.io/macos-app-blocker/

## 🚀 Features

### Script Generator (`index.html`)
- **Two Blocking Modes:**
  - **Scheduled Blocking**: Automatically block apps during specific times on selected days
  - **Manual Control**: Generate simple block/restore scripts you could use to block or restore apps on-demand
- **Customizable Options (for Scheduled Blocking):**
  - Choose from common apps or enter a custom app name
  - Set specific time ranges for blocking
  - Select which days of the week to enforce blocking
  - Upload school days file or enter dates manually via calendar
  - Specify IP addresses for location-based blocking (optional)
- **Complete Setup**: Generates all necessary LaunchDaemons, helper scripts, checker daemon, and uninstaller

### School Day Calendar (`calendar.html`)
- Interactive calendar to select school/work days and it generates a text file, `school_days.txt`, with the dates
- Date range selection
- Export in the exact format needed for the scheduled blocking scripts
- Can be uploaded directly to the script generator

### Smart Blocking Logic
- **School Day Check**: Only blocks on dates specified in `school_days.txt`
- **IP Address Check**: Only blocks when device is at specified IP addresses (optional)
- **Time Range Check**: Only blocks during specified hours
- **Dual Verification**: All conditions must be met for blocking to activate
- **Automatic Management**: System checks conditions every 60 seconds and manages blocking automatically

## 📖 How to Use

### Online (GitHub Pages)
Visit: https://nycist.github.io/macos-app-blocker/

### Local Usage
1. Download the HTML files
2. Open `index.html` in your browser
3. Generate your scripts
4. Follow the on-page instructions

## 🛠️ Script Modes

### Scheduled Blocking
1. Select your app, time range, and days
2. **Optional**: Upload your `school_days.txt` file (or use the calendar generator to create one)
3. **Optional**: Enter IP addresses where blocking should occur
4. Generate the full setup script
5. Run the script with `sudo` on your Mac
6. The system will automatically manage blocking based on your conditions

**How it works**: A checker daemon runs every 60 seconds, evaluates all conditions (time, school day, IP address), and loads or unloads the blocking daemon as needed. This ensures blocking works even after sleep/wake cycles or network changes.

### Manual Control
1. Select your app
2. Generate block and restore scripts
3. Run `block_[app].sh` to start blocking the app of your choice
4. Run `restore_[app].sh` to stop blocking and remove all components

## 📋 Requirements

- macOS (tested on macOS 10.14+)
- Administrator/sudo privileges
- Basic terminal/command line knowledge
- Internet connection (for IP checking feature)

## ⚠️ Important Notes

- These scripts require **sudo privileges** to run
- Blocking works by continuously terminating the app process
- The blocked app cannot be opened while blocking is active
- Scripts are generated client-side (no data is sent to any server)
- IP checking requires internet access to determine current public IP
- The system checks conditions every 60 seconds automatically
- Blocking only occurs when ALL conditions are met (time, school day, IP address)

## 🎯 Use Cases

- Parents managing kids' screen time during school hours and only at school
- Students blocking distractions during study time at specific locations
- Professionals enforcing focus periods at the office
- Schools deploying via MDM to ensure apps are blocked only on campus during school hours
- Anyone wanting scheduled or manual app blocking on macOS with location awareness

## 📝 Files Included

- `index.html` - Main script generator interface
- `calendar.html` - School day calendar selector
- `style.css` - Styles for script generator
- `calendar.css` - Styles for calendar
- `script.js` - Script generator functionality
- `calendar.js` - Calendar functionality
- `README.md` - This file

## 🔧 Generated Scripts Include

### Scheduled Blocking Mode:
- **Blocking daemon** (`com.block.[app].plist`) - Continuously terminates the app when loaded
- **Checker daemon** (`com.check.[app].plist`) - Runs every 60 seconds to evaluate conditions
- **Master checker script** (`check_and_manage_[app].sh`) - Contains all blocking logic
- **Uninstaller script** (`uninstall_[app]_blocker.sh`) - Removes all components
- **Configuration files**:
  - `school_days.txt` - List of dates when blocking should occur
  - `school_ips.txt` - List of IP addresses where blocking should occur
- **Log file** (`/var/log/[app]_check.log`) - Records when blocking is enabled/disabled

### Manual Control Mode:
- **Block script** - Creates and loads blocking daemon immediately
- **Restore script** - Removes blocking daemon and all related components

## 🔍 Troubleshooting

### Check if blocking is active
To verify if an app is currently being blocked:
```bash
sudo launchctl list | grep com.block.messages
```
Replace "messages" with your app name. If you see output, blocking is active. No output means blocking is not running.

### Check if the checker daemon is running
To verify the system is monitoring conditions:
```bash
sudo launchctl list | grep com.check.messages
```
This should always show output if the scheduled blocking system is installed.

### View logs (Scheduled Blocking only)
To see when blocking was enabled/disabled and condition checks:
```bash
tail -f /var/log/messages_check.log
```
Replace "messages" with your app name. Logs only appear when blocking state changes.

### Test IP checking manually
To see what IP address the script detects:
```bash
curl checkip.amazonaws.com
```

### Common Issues
- **Blocking not working?** Make sure you ran the setup script with `sudo`
- **System not checking?** Verify checker daemon is loaded: `sudo launchctl list | grep com.check`
- **Wrong blocking times?** Check dates in `/usr/local/etc/school_days.txt` (YYYY-MM-DD format)
- **IP check failing?** Ensure the device has internet access and IP addresses are correctly listed in `/usr/local/etc/school_ips.txt`
- **Blocking at wrong location?** Verify your public IP address matches what's in `school_ips.txt`

### Uninstalling
To completely remove the blocking system:
```bash
sudo /usr/local/bin/uninstall_[appname]_blocker.sh
```
Replace [appname] with your app name (e.g., `uninstall_messages_blocker.sh`).

## 🤝 Contributing

This is a simple static site. Feel free to fork and customize for your needs!

## 📜 License

Free to use and modify. Created by Jacob Farkas with assistance from Claude (Anthropic).

## 🔗 Technical Details

Generated scripts use:
- **macOS LaunchDaemons** for persistent blocking and automated checking
- **Bash scripts** for setup, control, and condition checking
- **File-based verification**: `school_days.txt` for date checking, `school_ips.txt` for location checking
- **AWS checkip service** (`checkip.amazonaws.com`) for public IP detection
- **StartInterval** (60 seconds) for automatic condition monitoring
- **State management** - only logs when blocking state changes

## 🏗️ System Architecture

**Scheduled Blocking Mode:**
1. Checker daemon runs every 60 seconds
2. Master script evaluates all conditions (time, date, IP)
3. If all conditions met → loads blocking daemon
4. If any condition fails → unloads blocking daemon
5. State changes are logged for monitoring

**Manual Control Mode:**
1. Block script loads blocking daemon immediately
2. Restore script unloads blocking daemon and removes all components

---

**Author:** Jacob Farkas  
**Created:** 2025-10-30  
**Last Updated:** 2025-11-04  
**Powered by:** HTML, CSS, JavaScript (vanilla, no frameworks)
