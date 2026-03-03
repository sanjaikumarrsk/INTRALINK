class User {
  final String id;
  final String name;
  final String mobileNumber;
  final String role;
  final String? ward;
  final String token;

  User({
    required this.id,
    required this.name,
    required this.mobileNumber,
    required this.role,
    this.ward,
    required this.token,
  });

  factory User.fromJson(Map<String, dynamic> json, {String? token}) {
    return User(
      id: json['userId'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      mobileNumber: json['mobileNumber'] ?? '',
      role: json['role'] ?? '',
      ward: json['ward']?.toString(),
      token: token ?? json['token'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': id,
      'name': name,
      'mobileNumber': mobileNumber,
      'role': role,
      'ward': ward,
      'token': token,
    };
  }
}
