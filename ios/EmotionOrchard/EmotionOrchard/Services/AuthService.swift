import Foundation

@Observable
final class AuthService {
    static let shared = AuthService()

    var isAuthenticated = false
    var currentUserId: String?

    private init() {
        // Check for existing session on launch
        Task { await checkSession() }
    }

    func accessToken() async -> String? {
        // TODO: Implement with Supabase Swift SDK
        return nil
    }

    func signIn(email: String, password: String) async throws {
        // TODO: Implement with Supabase Swift SDK
    }

    func signUp(email: String, password: String) async throws {
        // TODO: Implement with Supabase Swift SDK
    }

    func signOut() async {
        isAuthenticated = false
        currentUserId = nil
    }

    func handleOAuthCallback(_ url: URL) {
        // TODO: Handle OAuth callback
    }

    private func checkSession() async {
        // TODO: Check for existing Supabase session
    }
}
