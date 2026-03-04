import Foundation

struct ChatMessage: Codable, Identifiable {
    let id: Int
    let userId: String
    let role: String
    let content: String
    let createdAt: Date
}
