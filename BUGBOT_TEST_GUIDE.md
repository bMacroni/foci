# 🐛 Testing BugBot - Simple Guide

Since Git isn't available in the terminal, here's how to test BugBot using GitHub Desktop:

## **Method 1: Using GitHub Desktop (Recommended)**

### Step 1: Create Test Branch
1. Open **GitHub Desktop**
2. Click **"Current Branch"** dropdown
3. Click **"New Branch"**
4. Name it: `test-bugbot-demo`
5. Click **"Create Branch"**

### Step 2: Add Test File
1. The `test-bugbot.js` file should appear in GitHub Desktop
2. Add commit message: `"Add test file to demonstrate BugBot capabilities"`
3. Click **"Commit to test-bugbot-demo"**

### Step 3: Push and Create PR
1. Click **"Push origin"**
2. Go to GitHub.com
3. Create a **Pull Request** for the `test-bugbot-demo` branch
4. Watch BugBot review your code automatically!

## **Method 2: Test BugBot in Cursor Directly**

### Step 1: Open BugBot Panel
1. Click the **BugBot icon** in Cursor sidebar
2. Look for **"Review Current File"** or similar option
3. Select the `test-bugbot.js` file

### Step 2: Check for Issues
BugBot should flag these issues in `test-bugbot.js`:

🔴 **Security Issues:**
- Hardcoded API key on line 4
- SQL injection risk on line 18

🔴 **Accessibility Issues:**
- Missing alt text on line 7

🔴 **AI Safety Issues:**
- Inappropriate response on line 12
- Triggering language handling

🔴 **Performance Issues:**
- N+1 query problem on line 17
- Function too long on line 22

🔴 **Code Quality Issues:**
- Complex nested conditions
- Poor error handling

## **Method 3: Use Copilot Chat as Alternative**

If BugBot isn't working, use Copilot Chat:

1. Press **`Ctrl+I`** to open Copilot Chat
2. Ask: *"Please review the test-bugbot.js file for security, accessibility, AI safety, and performance issues"*
3. Copilot will analyze the file and provide feedback

## **Expected BugBot Findings**

The test file contains these intentional issues:

### 🔒 Security (Critical)
- **Line 4**: Hardcoded API key `"sk-1234567890abcdef"`
- **Line 18**: SQL injection vulnerability

### ♿ Accessibility (High)
- **Line 7**: Missing alt text in image tag

### 🤖 AI Safety (High)
- **Line 12**: Inappropriate response to depression
- **Line 13**: Missing crisis resources

### ⚡ Performance (Medium)
- **Line 17**: Multiple database queries (N+1 problem)
- **Line 22**: Function too long and complex

### 🧹 Code Quality (Medium)
- **Line 22**: Overly complex nested conditions
- **Line 17**: Poor error handling

## **What to Look For**

When BugBot runs, you should see:

1. **Issue Count**: Should find 6+ issues
2. **Severity Levels**: Critical, High, Medium, Low
3. **Categories**: Security, Accessibility, AI Safety, Performance, Code Quality
4. **Suggestions**: How to fix each issue
5. **Mental Health Context**: Special attention to AI safety

## **Next Steps After Testing**

1. **Review all issues** BugBot found
2. **Understand the severity levels**
3. **Learn from the suggestions**
4. **Delete the test file** when done
5. **Apply the same review process** to your real code

## **Troubleshooting**

### BugBot Not Running?
- Check if extension is installed
- Verify GitHub connection
- Try Copilot Chat as alternative

### No Issues Found?
- Check if `.bugbotrc` is being read
- Verify file patterns in configuration
- Try a different test file

### Too Many Issues?
- Adjust severity threshold in `.bugbotrc`
- Focus on critical/high priority first
- Gradually improve code quality

Remember: This is a learning tool! Don't feel overwhelmed by the number of issues - focus on understanding why each one matters for your mental health app. 