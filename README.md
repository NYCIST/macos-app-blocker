# macOS App Blocker Script Generator

A web-based tool to generate macOS bash scripts that block applications during specific times or on-demand. Perfect for managing distractions during school days, work hours, or focus time. Features location-based blocking using IP address checking to ensure blocking only occurs at specified locations (like school or work). You can use these scripts on their own or distribute them to computers you manage using any MDM that can pass custom scripts to client devices.

https://nycist.github.io/macos-app-blocker/

## 🚀 Features

### Script Generator (`index.html`)
- **Two Blocking Modes:**
  - **Scheduled Blocking**: Automatically block apps during specific times on selected days (managed by cron)
  - **Manual Control**: Generate simple block/restore scripts you could use to block or restore apps on-demand
- **Customizable Options (for Scheduled Blocking):**
  - Choose from common apps or enter a custom app name
  - Set specific time ranges for blocking
  - Select which days of the week to enforce blocking
  - Upload school days file or enter dates manually via calendar
  - Specify IP addresses for location-based blocking (optional)
- **Complete Setup**: Generates all necessary LaunchDaemons, helper scripts, cron configurations, and checker scripts

### School Day Calendar (`calendar.html`)
- Interactive calendar to select school/work days and it generates a text file, `school_days.txt`, with the dates
- Date range selection
- Export in the exact format needed for the scheduled blocking scripts
- Can be uploaded directly to the script generator

### Smart Blocking Logic
- **School Day Check**: Only blocks on dates specified in `school_days.txt`
- **IP Address Check**: Only blocks when device is at specified IP addresses (optional)
- **Dual Verification**: Both conditions must be met for blocking to activate (when both are configured)

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
6. If you didn't upload a school days file, manually add dates to `/usr/local/etc/school_days.txt`
7. If you didn't provide IP addresses, manually add them to `/usr/local/etc/school_ips.txt`
8. The app will be blocked automatically when all conditions are met

### Manual Control
1. Select your app
2. Generate block and restore scripts
3. Run `block_[app].sh` to start blocking the app of your choice
4. Run `restore_[app].sh` to stop blocking and removal of cron jobs and LaunchDaemons

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
- Blocking only occurs when BOTH school day and IP checks pass (if both are configured)

## 🎯 Use Cases

- Parents managing kids' screen time during school hours and only at school
- Students blocking distractions during study time at specific locations
- Professionals enforcing focus periods at the office
- Schools deploying via MDM to ensure apps are blocked only on campus
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

- LaunchDaemon plist file for app blocking
- `check_school_day.sh` - Validates today is a school day
- `check_ip.sh` - Validates device is at approved IP address
- `block_[app].sh` - Loads the blocking daemon
- `restore_[app].sh` - Unloads the blocking daemon
- Cron jobs for scheduled execution
- Log files at `/var/log/[app]_block.log`

## 🔍 Troubleshooting

### Check if blocking is active
To verify if an app is currently being blocked:
```bash
sudo launchctl list | grep com.block.messages
```
Replace "messages" with your app name. If you see output, blocking is active. No output means blocking is not running.

### View logs (Scheduled Blocking only)
To see when blocking was enabled/disabled, school day checks, and IP checks:
```bash
cat /var/log/messages_block.log
```
Replace "messages" with your app name if you used a different app.

### Test IP checking manually
To see what IP address the script detects:
```bash
curl checkip.amazonaws.com
```

### Common Issues
- **Blocking not working?** Make sure you ran the setup script with `sudo`
- **Cron jobs not running?** Check that dates are properly formatted in `/usr/local/etc/school_days.txt` (YYYY-MM-DD format)
- **App still opens?** Verify the LaunchDaemon is loaded with the command above
- **IP check failing?** Ensure the device has internet access and IP addresses are correctly listed in `/usr/local/etc/school_ips.txt`
- **Blocking at wrong location?** Verify your public IP address matches what's in `school_ips.txt`

## 🤝 Contributing

This is a simple static site. Feel free to fork and customize for your needs!

## 📜 License

Free to use and modify. Created by Jacob Farkas with assistance from Claude (Anthropic).

## 🔗 Related

Generated scripts use:
- macOS LaunchDaemons for persistent blocking
- Cron jobs for scheduled execution
- Bash scripts for setup and control
- File-based date verification (`school_days.txt`)
- IP-based location verification (`school_ips.txt`)
- AWS's checkip.amazonaws.com for IP detection

---

**Author:** Jacob Farkas  
**Created:** 2025-10-30  
**Last Updated:** 2025-11-04  
**Powered by:** HTML, CSS, JavaScript (vanilla, no frameworks)
