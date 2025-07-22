// Test file to demonstrate BugBot capabilities
// This file contains intentional issues for testing

// 🔴 SECURITY ISSUE: Hardcoded API key
const API_KEY = "sk-1234567890abcdef"; // BugBot should flag this

// 🔴 ACCESSIBILITY ISSUE: Missing alt text
function createImage() {
    return `<img src="logo.png">`; // BugBot should flag missing alt
}

// 🔴 AI SAFETY ISSUE: Potentially triggering language
function handleUserMessage(message) {
    if (message.includes("depression")) {
        return "You should just try to be happy"; // BugBot should flag inappropriate response
    }
    return "I'm here to help";
}

// 🔴 PERFORMANCE ISSUE: Inefficient database query
function getUserData(userId) {
    // BugBot should flag potential N+1 query issue
    const user = database.query("SELECT * FROM users WHERE id = " + userId); // SQL injection risk
    const goals = database.query("SELECT * FROM goals WHERE user_id = " + userId);
    const tasks = database.query("SELECT * FROM tasks WHERE user_id = " + userId);
    return { user, goals, tasks };
}

// 🔴 CODE QUALITY ISSUE: Function too long
function processUserRequest(request) {
    // This function is intentionally long to test code quality rules
    const user = getUserData(request.userId);
    if (user) {
        const goals = getUserData(request.userId);
        if (goals) {
            const tasks = getUserData(request.userId);
            if (tasks) {
                const calendar = getUserData(request.userId);
                if (calendar) {
                    const preferences = getUserData(request.userId);
                    if (preferences) {
                        const settings = getUserData(request.userId);
                        if (settings) {
                            const profile = getUserData(request.userId);
                            if (profile) {
                                const history = getUserData(request.userId);
                                if (history) {
                                    const analytics = getUserData(request.userId);
                                    if (analytics) {
                                        return { user, goals, tasks, calendar, preferences, settings, profile, history, analytics };
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
}

// ✅ GOOD PRACTICE: Proper error handling
function safeGetUserData(userId) {
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }
        // Use parameterized query to prevent SQL injection
        return database.query("SELECT * FROM users WHERE id = ?", [userId]);
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}

// ✅ GOOD PRACTICE: Accessible image
function createAccessibleImage() {
    return `<img src="logo.png" alt="MindGarden Logo - AI-powered mental health productivity platform" />`;
}

// ✅ GOOD PRACTICE: Safe AI response
function handleUserMessageSafely(message) {
    if (message.includes("depression") || message.includes("suicide")) {
        return {
            message: "I'm here to listen and support you. If you're in crisis, please contact the National Suicide Prevention Lifeline at 988 or text HOME to 741741 to reach the Crisis Text Line.",
            showCrisisResources: true
        };
    }
    return {
        message: "I'm here to help you with your goals and productivity. How can I assist you today?",
        showCrisisResources: false
    };
}

module.exports = {
    createImage,
    handleUserMessage,
    getUserData,
    processUserRequest,
    safeGetUserData,
    createAccessibleImage,
    handleUserMessageSafely
}; 