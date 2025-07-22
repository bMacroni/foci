# 🔍 Manual Code Review for MindGarden

Since BugBot extension isn't available, here's a comprehensive manual code review process tailored for your mental health app.

## Pre-Review Checklist

### 🔒 Security Review
- [ ] No hardcoded API keys or secrets
- [ ] User input is properly sanitized
- [ ] Authentication checks are in place
- [ ] Database queries use parameterized statements
- [ ] HTTPS is enforced for all connections
- [ ] User data is encrypted at rest

### ♿ Accessibility Review
- [ ] All images have alt text
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works properly
- [ ] Screen reader compatibility tested
- [ ] Focus indicators are visible
- [ ] Text is readable (minimum 16px font)

### 🤖 AI Safety Review
- [ ] Gemini prompts are appropriate for mental health context
- [ ] Crisis response resources are properly linked
- [ ] No triggering language in AI responses
- [ ] AI fallbacks are in place for errors
- [ ] User can easily report inappropriate AI responses
- [ ] AI interactions are logged for safety review

### ⚡ Performance Review
- [ ] Database queries are optimized
- [ ] Images are properly sized and compressed
- [ ] JavaScript bundles are minified
- [ ] API responses are cached where appropriate
- [ ] Loading states are implemented
- [ ] Error boundaries are in place

### 🧹 Code Quality Review
- [ ] Functions are under 50 lines
- [ ] Variable names are descriptive
- [ ] No duplicate code
- [ ] Error handling is comprehensive
- [ ] Comments explain complex logic
- [ ] Code follows project conventions

## Review Process

### Step 1: Self-Review
Before creating a pull request, review your own code:

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code changes ...

# Review your changes
git diff main

# Run tests
npm test

# Check for linting issues
npm run lint
```

### Step 2: Use GitHub Copilot Chat
1. Press `Ctrl+I` to open Copilot Chat
2. Ask it to review your code:
   ```
   Please review this code for:
   - Security issues
   - Accessibility problems
   - AI safety concerns
   - Performance issues
   - Code quality improvements
   ```

### Step 3: Create Pull Request
1. Push your branch: `git push origin feature/your-feature-name`
2. Create PR on GitHub
3. Use this PR template:

```markdown
## 🎯 Feature Description
Brief description of what this PR adds/fixes

## 🔍 Review Checklist
- [ ] Security reviewed
- [ ] Accessibility tested
- [ ] AI safety verified
- [ ] Performance checked
- [ ] Code quality reviewed

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Accessibility testing done

## 📝 Changes Made
- List of specific changes

## 🚨 Breaking Changes
- Any breaking changes or migrations needed

## 📸 Screenshots
- Add screenshots if UI changes
```

## Mental Health Specific Reviews

### Crisis Response Review
- [ ] Crisis hotline numbers are current
- [ ] Emergency resources are easily accessible
- [ ] AI won't give medical advice
- [ ] Clear disclaimers about AI limitations
- [ ] Easy way to contact human support

### Trigger Word Review
- [ ] No inappropriate language in UI
- [ ] AI responses avoid triggering content
- [ ] Content warnings where appropriate
- [ ] User can customize sensitivity settings
- [ ] Clear reporting mechanisms

### User Experience Review
- [ ] Interface is calming and not overwhelming
- [ ] Loading states are gentle
- [ ] Error messages are supportive
- [ ] Success feedback is encouraging
- [ ] Navigation is intuitive

## Automated Tools

### ESLint Configuration
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-has-content": "error",
    "jsx-a11y/aria-props": "error"
  }
}
```

### Pre-commit Hooks
```bash
# Install husky
npm install --save-dev husky

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm test"
    }
  }
}
```

## Review Templates

### For New Features
```markdown
## Feature Review: [Feature Name]

### Security
- [ ] User data protection
- [ ] Input validation
- [ ] Authentication required

### Accessibility  
- [ ] Screen reader compatible
- [ ] Keyboard navigation
- [ ] Color contrast

### AI Safety
- [ ] Appropriate prompts
- [ ] Crisis resources
- [ ] Fallback handling

### Performance
- [ ] Loading optimization
- [ ] Bundle size impact
- [ ] Database efficiency
```

### For Bug Fixes
```markdown
## Bug Fix Review: [Bug Description]

### Root Cause
- What caused the bug?

### Fix Approach
- How was it fixed?

### Testing
- [ ] Bug is resolved
- [ ] No regressions
- [ ] Edge cases handled

### Prevention
- How to prevent similar bugs?
```

## Weekly Review Schedule

### Monday: Security Focus
- Review authentication flows
- Check for data exposure
- Verify API security

### Wednesday: Accessibility Focus  
- Test with screen readers
- Check keyboard navigation
- Review color contrast

### Friday: AI Safety Focus
- Review Gemini interactions
- Check crisis response
- Verify appropriate language

## Getting Help

### When You're Stuck
1. Use GitHub Copilot Chat (`Ctrl+I`)
2. Check the documentation
3. Review similar code in the project
4. Ask for help in your development notes

### Learning Resources
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Mental Health App Best Practices](https://www.mentalhealth.gov/)

Remember: Manual reviews take time but build your skills and ensure quality. Start with the critical items (security, accessibility, AI safety) and gradually expand your review process. 