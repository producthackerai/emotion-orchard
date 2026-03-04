import SwiftUI

struct ContentView: View {
    @State private var authService = AuthService.shared

    var body: some View {
        Group {
            if authService.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .background(Theme.background)
    }
}

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            Text("Orchard View")
                .tabItem {
                    Image(systemName: "tree")
                    Text("Orchard")
                }
                .tag(0)

            Text("Tree View")
                .tabItem {
                    Image(systemName: "leaf")
                    Text("Tree")
                }
                .tag(1)

            Text("Insights View")
                .tabItem {
                    Image(systemName: "chart.bar")
                    Text("Insights")
                }
                .tag(2)

            Text("Chat View")
                .tabItem {
                    Image(systemName: "message")
                    Text("Chat")
                }
                .tag(3)
        }
        .tint(Theme.accent)
    }
}

struct AuthView: View {
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("Emotion Orchard")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(Theme.textPrimary)

            Text("Grow your feelings into something beautiful")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)

            VStack(spacing: 12) {
                TextField("Email", text: $email)
                    .textFieldStyle(.roundedBorder)
                    .autocapitalization(.none)

                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)

                Button("Sign In") {
                    Task {
                        try? await AuthService.shared.signIn(email: email, password: password)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.accent)
            }
            .padding(.horizontal, 32)

            Spacer()
        }
        .background(Theme.background)
    }
}
