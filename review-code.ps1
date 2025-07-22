# MindGarden Manual Code Review Helper
# This script helps you set up a proper review workflow

Write-Host "🔍 MindGarden Code Review Helper" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "MANUAL_CODE_REVIEW.md")) {
    Write-Host "❌ Error: Please run this script from the mindgarden directory." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Manual review documentation found" -ForegroundColor Green

# Get current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow

# Check if there are uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "📝 You have uncommitted changes:" -ForegroundColor Cyan
    Write-Host $status -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Would you like to commit these changes first? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        $commitMessage = Read-Host "Enter commit message"
        git add .
        git commit -m $commitMessage
        Write-Host "✅ Changes committed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔍 Code Review Checklist:" -ForegroundColor Cyan
Write-Host ""

# Security checklist
Write-Host "🔒 Security Review:" -ForegroundColor Red
Write-Host "  - [ ] No hardcoded API keys" -ForegroundColor White
Write-Host "  - [ ] User input sanitized" -ForegroundColor White
Write-Host "  - [ ] Authentication checks in place" -ForegroundColor White
Write-Host "  - [ ] Database queries parameterized" -ForegroundColor White
Write-Host ""

# Accessibility checklist
Write-Host "♿ Accessibility Review:" -ForegroundColor Blue
Write-Host "  - [ ] Images have alt text" -ForegroundColor White
Write-Host "  - [ ] Color contrast meets standards" -ForegroundColor White
Write-Host "  - [ ] Keyboard navigation works" -ForegroundColor White
Write-Host "  - [ ] Screen reader compatible" -ForegroundColor White
Write-Host ""

# AI Safety checklist
Write-Host "🤖 AI Safety Review:" -ForegroundColor Magenta
Write-Host "  - [ ] Gemini prompts appropriate" -ForegroundColor White
Write-Host "  - [ ] Crisis resources linked" -ForegroundColor White
Write-Host "  - [ ] No triggering language" -ForegroundColor White
Write-Host "  - [ ] AI fallbacks in place" -ForegroundColor White
Write-Host ""

# Performance checklist
Write-Host "⚡ Performance Review:" -ForegroundColor Yellow
Write-Host "  - [ ] Database queries optimized" -ForegroundColor White
Write-Host "  - [ ] Images properly sized" -ForegroundColor White
Write-Host "  - [ ] Loading states implemented" -ForegroundColor White
Write-Host "  - [ ] Error boundaries in place" -ForegroundColor White
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Press Ctrl+I to open Copilot Chat" -ForegroundColor White
Write-Host "2. Ask: 'Please review my code for security, accessibility, AI safety, and performance'" -ForegroundColor White
Write-Host "3. Go through the checklist above" -ForegroundColor White
Write-Host "4. Create a pull request when ready" -ForegroundColor White
Write-Host ""

Write-Host "💡 Tips:" -ForegroundColor Green
Write-Host "- Focus on critical items first (security, accessibility, AI safety)" -ForegroundColor White
Write-Host "- Use Copilot Chat for technical review" -ForegroundColor White
Write-Host "- Test with actual users when possible" -ForegroundColor White
Write-Host "- Document any issues found for future reference" -ForegroundColor White
Write-Host ""

Write-Host "📖 Read MANUAL_CODE_REVIEW.md for detailed instructions" -ForegroundColor Yellow 