# macOS App Blocker Script Generator

A web-based tool to generate macOS bash scripts that block applications during specific times or on-demand. Perfect for managing distractions during school days, work hours, or focus time.

https://nycist.github.io/macos-app-blocker/

## 🚀 Features

### Script Generator (`index.html`)
- **Two Blocking Modes:**
  - **Scheduled Blocking**: Automatically block apps during specific times on selected days using cron jobs
  - **Manual Control**: Generate simple block/restore scripts to run on-demand
- **Customizable Options (for Scheduled Blocking):**
  - Choose from common apps or enter a custom app name
  - Set specific time ranges for blocking
  - Select which days of the week to enforce blocking
- **Complete Setup**: Generates all necessary LaunchDaemons, helper scripts, and cron configurations

### School Day Calendar (`calendar.html`)
- Interactive calendar to select school/work days
- Date range selection (2025-2035)
- Generates formatted `school_days.txt` file
- Click individual days or use "Select All" for bulk selection
- Export in the exact format needed for the scheduled blocking scripts

## 📖 How to Use

### Online (GitHub Pages)
Visit: `https://yourusername.github.io/macos-app-blocker/`

### Local Usage
1. Download the HTML files
2. Open `index.html` in your browser
3. Generate your scripts
4. Follow the on-page instructions

## 🛠️ Script Modes

### Scheduled Blocking
1. Select your app, time range, and days
2. Generate the full setup script
3. Add school/work days by copying the `school_days.txt` file to `/usr/local/etc/school_days.txt`
4. Run the script with `sudo` on your Mac
5. The app will be blocked automatically on the scheduled days/times

### Manual Control
1. Select your app
2. Generate block and restore scripts
3. Run `block_[app].sh` to start blocking
4. Run `restore_[app].sh` to stop blocking and removal of cron jobs and LaunchDaemons

## 📋 Requirements

- macOS (tested on macOS 10.14+)
- Administrator/sudo privileges
- Basic terminal/command line knowledge

## ⚠️ Important Notes

- These scripts require **sudo privileges** to run
- Blocking works by continuously terminating the app process
- The blocked app cannot be opened while blocking is active
- Scripts are generated client-side (no data is sent to any server)

## 🎯 Use Cases

- Parents managing kids' screen time during school hours
- Students blocking distractions during study time
- Professionals enforcing focus periods
- Anyone wanting scheduled or manual app blocking on macOS

## 📝 Files Included

- `index.html` - Main script generator interface
- `calendar.html` - School day calendar selector
- `style.css` - Styles for script generator
- `calendar.css` - Styles for calendar
- `script.js` - Script generator functionality
- `calendar.js` - Calendar functionality
- `README.md` - This file

## 🔍 Troubleshooting

### Check if blocking is active
To verify if an app is currently being blocked:
```bash
sudo launchctl list | grep com.block.messages
```
Replace "messages" with your app name. If you see output, blocking is active. No output means blocking is not running.

### View logs (Scheduled Blocking only)
To see when blocking was enabled/disabled and school day checks:
```bash
cat /var/log/messages_block.log
```
Replace "messages" with your app name if you used a different app.

### Common Issues
- **Blocking not working?** Make sure you ran the setup script with `sudo`
- **Cron jobs not running?** Check that dates are properly formatted in `/usr/local/etc/school_days.txt`
- **App still opens?** Verify the LaunchDaemon is loaded with the command above

## 🤝 Contributing

This is a simple static site. Feel free to fork and customize for your needs!

## 📜 License

Free to use and modify. Created by Jacob Farkas with assistance from Claude (Anthropic).

## 🔗 Related

Generated scripts use:
- macOS LaunchDaemons for persistent blocking
- Cron jobs for scheduled execution
- Bash scripts for setup and control

---

**Author:** Jacob Farkas  
**Created:** 2025-10-30  
**Powered by:** HTML, CSS, JavaScript (vanilla, no frameworks)
