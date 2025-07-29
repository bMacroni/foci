# MindGarden BugBot Setup Script
# Run this script to set up BugBot and create your first test branch

Write-Host "🐛 Setting up BugBot for MindGarden..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path ".bugbotrc")) {
    Write-Host "❌ Error: .bugbotrc not found. Please run this script from the mindgarden directory." -ForegroundColor Red
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository. Please run this from the mindgarden directory." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configuration files found" -ForegroundColor Green

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow

# Create a test feature branch
$testBranch = "feature/bugbot-test-$(Get-Date -Format 'yyyyMMdd-HHmm')"
Write-Host "🌿 Creating test branch: $testBranch" -ForegroundColor Cyan

git checkout -b $testBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Test branch created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create test branch" -ForegroundColor Red
    exit 1
}

# Add and commit the BugBot configuration
Write-Host "📝 Adding BugBot configuration files..." -ForegroundColor Cyan

git add .bugbotrc
git add .github/workflows/bugbot-review.yml
git add BUGBOT_SETUP.md

git commit -m "Add BugBot configuration and documentation

- Add .bugbotrc with mental health app optimizations
- Add GitHub Actions workflow for automated reviews
- Add comprehensive setup documentation
- Configure security, accessibility, and AI safety rules"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BugBot configuration committed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to commit configuration" -ForegroundColor Red
    exit 1
}

# Push the branch
Write-Host "🚀 Pushing test branch to GitHub..." -ForegroundColor Cyan
git push origin $testBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Test branch pushed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push branch" -ForegroundColor Red
    Write-Host "💡 You may need to set up your remote origin first" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 BugBot setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Install BugBot extension in Cursor (Ctrl+Shift+X)" -ForegroundColor White
Write-Host "2. Connect BugBot to your GitHub account" -ForegroundColor White
Write-Host "3. Select your MindGarden repository" -ForegroundColor White
Write-Host "4. Create a pull request for branch: $testBranch" -ForegroundColor White
Write-Host "5. Watch BugBot review your code automatically!" -ForegroundColor White
Write-Host ""
Write-Host "📖 Read BUGBOT_SETUP.md for detailed instructions" -ForegroundColor Yellow
Write-Host "🔗 GitHub PR URL will be: https://github.com/[your-username]/MindGarden/pull/new/$testBranch" -ForegroundColor Yellow 