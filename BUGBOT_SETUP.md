# 🐛 BugBot Setup for MindGarden

This guide explains how to use BugBot for automated code review in the MindGarden project.

## What is BugBot?

BugBot is an AI-powered code review tool that helps catch issues, improve code quality, and maintain best practices. For MindGarden, it's particularly valuable because:

- **Mental Health Safety**: Ensures AI interactions are appropriate for users with anxiety/depression
- **Security**: Protects sensitive user data in a mental health context
- **Accessibility**: Maintains high standards for users who may have cognitive challenges
- **Code Quality**: Keeps the codebase maintainable as the project grows

## Setup Instructions

### 1. Install BugBot Extension

1. Open Cursor
2. Press `Ctrl+Shift+X` to open Extensions
3. Search for "BugBot" 
4. Click "Install"

### 2. Connect to GitHub

1. Click the BugBot icon in the sidebar
2. Sign in with your GitHub account
3. Grant BugBot access to your MindGarden repository
4. Select the repository when prompted

### 3. Configuration

The project includes a `.bugbotrc` file with settings optimized for:
- **Security**: High priority for user data protection
- **Accessibility**: High priority for mental health users
- **AI Safety**: High priority for Gemini interactions
- **Performance**: Medium priority for smooth UX
- **Code Quality**: Medium priority for maintainability

## How to Use BugBot

### For Solo Development

#### Option 1: Pull Request Workflow (Recommended)
1. Create a feature branch: `git checkout -b feature/new-feature`
2. Make your changes
3. Create a pull request to main/develop
4. BugBot will automatically review and comment
5. Address any issues before merging

#### Option 2: Direct Commit Review
1. Make changes to your code
2. Commit with a descriptive message
3. BugBot will review the commit and provide feedback
4. Fix issues in subsequent commits

### Review Types

BugBot will check for:

#### 🔒 Security Issues
- SQL injection vulnerabilities
- XSS attacks
- Authentication bypasses
- Data exposure risks

#### ♿ Accessibility Issues  
- Missing alt text
- Poor color contrast
- Keyboard navigation problems
- Screen reader compatibility

#### 🤖 AI Safety Issues
- Inappropriate AI responses
- Unsafe prompt patterns
- Mental health trigger words
- Crisis response handling

#### ⚡ Performance Issues
- Slow database queries
- Memory leaks
- Inefficient algorithms
- Large bundle sizes

#### 🧹 Code Quality Issues
- Code smells
- Duplicate code
- Complex functions
- Poor naming conventions

## Severity Levels

- **🔴 Critical**: Must fix immediately (security, data loss)
- **🟠 High**: Fix before next release (accessibility, AI safety)
- **🟡 Medium**: Fix when convenient (performance, code quality)
- **🟢 Low**: Consider for future improvement (style, documentation)

## Best Practices

### 1. Create Meaningful Pull Requests
```bash
# Good PR workflow
git checkout -b feature/goal-management
# Make changes
git add .
git commit -m "Add goal creation with AI assistance"
git push origin feature/goal-management
# Create PR on GitHub
```

### 2. Review BugBot Feedback
- Read all comments carefully
- Prioritize critical and high-severity issues
- Don't feel pressured to fix everything at once
- Use feedback as a learning opportunity

### 3. Iterative Improvement
- Start with security and accessibility issues
- Gradually improve code quality over time
- Learn from BugBot's suggestions
- Develop better coding habits

### 4. Mental Health Considerations
- Pay special attention to AI safety reviews
- Ensure crisis resources are properly linked
- Review language for potential triggers
- Test accessibility features thoroughly

## Troubleshooting

### BugBot Not Running
1. Check that the extension is installed
2. Verify GitHub connection
3. Ensure repository is selected
4. Check `.bugbotrc` configuration

### Too Many Issues
1. Adjust severity threshold in `.bugbotrc`
2. Focus on critical/high priority first
3. Use `ignorePatterns` for test files
4. Gradually improve code quality

### False Positives
1. Add patterns to `ignorePatterns` in `.bugbotrc`
2. Use inline comments to suppress specific warnings
3. Adjust custom rules as needed

## Integration with Development Workflow

### Daily Development
1. Start with a feature branch
2. Make incremental commits
3. Create PR when feature is complete
4. Review BugBot feedback
5. Merge after addressing critical issues

### Release Preparation
1. Run full BugBot review on main branch
2. Address all critical and high-priority issues
3. Review accessibility and AI safety
4. Test mental health features thoroughly
5. Deploy with confidence

## Custom Rules for MindGarden

The configuration includes special rules for:

### Mental Health Sensitivity
- Monitors for trigger words
- Ensures appropriate crisis response
- Reviews AI interaction safety
- Checks accessibility features

### AI Safety
- Reviews Gemini function calls
- Checks prompt safety
- Monitors AI response patterns
- Ensures appropriate fallbacks

## Getting Help

- Check BugBot documentation
- Review `.bugbotrc` configuration
- Test with small changes first
- Gradually increase review depth

Remember: BugBot is a tool to help you, not overwhelm you. Start with the basics and gradually incorporate more advanced features as you become comfortable with the workflow. 