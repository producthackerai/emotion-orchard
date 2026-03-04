import SwiftUI

@main
struct EmotionOrchardApp: App {
    init() {
        // Force dark mode
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
            windowScene.windows.forEach { window in
                window.overrideUserInterfaceStyle = .dark
            }
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
                .onOpenURL { url in
                    // Handle OAuth callbacks
                    handleDeepLink(url)
                }
        }
    }

    private func handleDeepLink(_ url: URL) {
        // Handle Supabase OAuth callback
        if url.host == "login-callback" {
            AuthService.shared.handleOAuthCallback(url)
        }
    }
}
