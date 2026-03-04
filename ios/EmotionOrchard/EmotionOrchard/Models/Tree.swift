import Foundation

struct Tree: Codable, Identifiable {
    let id: String
    let userId: String
    let type: TreeType
    var name: String
    var isPublic: Bool
    let createdAt: Date
    var updatedAt: Date

    enum TreeType: String, Codable {
        case emotion
        case gratitude
    }
}

struct Leaf: Codable, Identifiable {
    let id: String
    let treeId: String
    let userId: String
    let emotion: String?
    let color: String
    let personName: String?
    let note: String?
    let positionX: Double?
    let positionY: Double?
    let branchIndex: Int?
    let createdAt: Date
}
