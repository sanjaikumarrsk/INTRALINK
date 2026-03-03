import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../providers/issue_provider.dart';
import '../widgets/gradient_button.dart';
import '../widgets/bg_wrapper.dart';

class CreateReportScreen extends StatefulWidget {
  const CreateReportScreen({super.key});

  @override
  State<CreateReportScreen> createState() => _CreateReportScreenState();
}

class _CreateReportScreenState extends State<CreateReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _wardController = TextEditingController();
  final _manualLocationController = TextEditingController();

  String? _selectedIssueType;
  File? _selectedImage;
  double? _latitude;
  double? _longitude;
  bool _isGettingLocation = false;
  bool _useManualLocation = false; // toggle: GPS vs Manual
  String? _gpsError;

  @override
  void initState() {
    super.initState();
    // Try GPS once on init, with timeout
    _getCurrentLocation();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _wardController.dispose();
    _manualLocationController.dispose();
    super.dispose();
  }

  // ── GPS with single attempt + 10s timeout ──────────────────────
  Future<void> _getCurrentLocation() async {
    if (_isGettingLocation) return;
    setState(() {
      _isGettingLocation = true;
      _gpsError = null;
    });

    try {
      // 1. Check if service enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _isGettingLocation = false;
          _gpsError = 'Location services are disabled.';
        });
        return;
      }

      // 2. Check permission (request ONCE only)
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _isGettingLocation = false;
            _gpsError = 'Location permission denied.';
          });
          if (mounted) {
            _showPermissionDialog('Location permission was denied. Please allow location access.');
          }
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _isGettingLocation = false;
          _gpsError = 'Location permanently denied. Use manual entry.';
        });
        if (mounted) {
          _showSettingsDialog();
        }
        return;
      }

      // 3. Get position with 10 second timeout
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      ).timeout(const Duration(seconds: 10));

      if (!mounted) return;
      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
        _isGettingLocation = false;
        _gpsError = null;
        // Autofill manual field with coords for editing
        _manualLocationController.text =
            '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
      });
    } on TimeoutException {
      if (!mounted) return;
      setState(() {
        _isGettingLocation = false;
        _gpsError = 'GPS timed out. Enter location manually.';
        _useManualLocation = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isGettingLocation = false;
        _gpsError = 'Could not get location. Enter manually.';
      });
    }
  }

  void _showPermissionDialog(String message) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Location Permission'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showSettingsDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Location Permanently Denied'),
        content: const Text(
          'Location permission is permanently denied. '
          'Please enable it from Settings, or use manual location entry.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Geolocator.openAppSettings();
            },
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: source,
      maxWidth: 1280,
      maxHeight: 960,
      imageQuality: 80,
    );

    if (picked != null) {
      setState(() {
        _selectedImage = File(picked.path);
      });
    }
  }

  void _showImagePicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              Text('Select Image',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 20),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.camera_alt_rounded,
                      color: AppTheme.primaryColor),
                ),
                title: const Text('Take Photo'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.accentColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.photo_library_rounded,
                      color: AppTheme.accentColor),
                ),
                title: const Text('Choose from Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedIssueType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an issue type')),
      );
      return;
    }

    // Validate location
    if (_useManualLocation &&
        _manualLocationController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please enter a location or use GPS')),
      );
      return;
    }

    final issueProvider = Provider.of<IssueProvider>(context, listen: false);

    final success = await issueProvider.createIssue(
      title: _titleController.text.trim(),
      issueType: _selectedIssueType!,
      description: _descriptionController.text.trim(),
      ward: _wardController.text.trim().isNotEmpty
          ? _wardController.text.trim()
          : null,
      latitude: _latitude,
      longitude: _longitude,
      image: _selectedImage,
    );

    if (success && mounted) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.successColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded,
                    color: AppTheme.successColor, size: 60),
              ),
              const SizedBox(height: 16),
              Text('Report Submitted!',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(
                'Your infrastructure report has been submitted successfully.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // close dialog
                Navigator.pop(context, true); // return true to refresh dashboard
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Report'),
      ),
      body: BgWrapper(
        child: Consumer<IssueProvider>(
          builder: (context, issueProvider, _) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Report an Issue',
                        style: Theme.of(context)
                            .textTheme
                            .headlineMedium
                            ?.copyWith(color: Colors.white)),
                    const SizedBox(height: 4),
                    Text(
                      'Help us improve your area\'s infrastructure',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 14),
                    ),
                    const SizedBox(height: 24),

                    // ── Title ──
                    _sectionLabel('Title *'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        hintText: 'Enter issue title (e.g., Broken pipe in Karur)',
                        prefixIcon: Icon(Icons.title_rounded),
                      ),
                      validator: (v) =>
                          (v == null || v.trim().isEmpty)
                              ? 'Title is required'
                              : null,
                    ),
                    const SizedBox(height: 20),

                    // ── Issue Type ──
                    _sectionLabel('Issue Type *'),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedIssueType,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.category_rounded),
                        hintText: 'Select issue type',
                      ),
                      items: AppConstants.issueTypes.map((type) {
                        return DropdownMenuItem(
                          value: type,
                          child: Row(
                            children: [
                              Icon(AppTheme.getIssueTypeIcon(type),
                                  size: 20, color: AppTheme.primaryColor),
                              const SizedBox(width: 10),
                              Text(type),
                            ],
                          ),
                        );
                      }).toList(),
                      onChanged: (v) =>
                          setState(() => _selectedIssueType = v),
                      validator: (v) =>
                          v == null ? 'Please select an issue type' : null,
                    ),
                    const SizedBox(height: 20),

                    // ── Description ──
                    _sectionLabel('Description *'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _descriptionController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Describe the issue in detail...',
                        prefixIcon: Padding(
                          padding: EdgeInsets.only(bottom: 60),
                          child: Icon(Icons.description_rounded),
                        ),
                      ),
                      validator: (v) =>
                          (v == null || v.trim().isEmpty)
                              ? 'Please describe the issue'
                              : null,
                    ),
                    const SizedBox(height: 20),

                    // ── Ward ──
                    _sectionLabel('Ward (Optional)'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _wardController,
                      decoration: const InputDecoration(
                        hintText: 'Enter ward number',
                        prefixIcon: Icon(Icons.location_city_rounded),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── Photo ──
                    _sectionLabel('Photo Evidence'),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: _showImagePicker,
                      child: Container(
                        height: 200,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(16),
                          border:
                              Border.all(color: Colors.grey.shade300),
                        ),
                        child: _selectedImage != null
                            ? Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius:
                                        BorderRadius.circular(16),
                                    child: Image.file(
                                      _selectedImage!,
                                      height: 200,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                  Positioned(
                                    top: 8,
                                    right: 8,
                                    child: GestureDetector(
                                      onTap: () => setState(
                                          () => _selectedImage = null),
                                      child: Container(
                                        padding:
                                            const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(
                                          color: Colors.red,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.close,
                                            color: Colors.white,
                                            size: 18),
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : Column(
                                mainAxisAlignment:
                                    MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add_a_photo_rounded,
                                      size: 48,
                                      color: Colors.grey.shade400),
                                  const SizedBox(height: 8),
                                  Text('Tap to add photo',
                                      style: TextStyle(
                                          color: Colors.grey.shade500,
                                          fontSize: 14)),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── LOCATION TOGGLE ──
                    _sectionLabel('Location'),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(
                                  () => _useManualLocation = false),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    vertical: 12),
                                decoration: BoxDecoration(
                                  color: !_useManualLocation
                                      ? AppTheme.primaryColor
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.gps_fixed_rounded,
                                        size: 18,
                                        color: !_useManualLocation
                                            ? Colors.white
                                            : Colors.grey),
                                    const SizedBox(width: 6),
                                    Text('Use GPS',
                                        style: TextStyle(
                                            color: !_useManualLocation
                                                ? Colors.white
                                                : Colors.grey,
                                            fontWeight:
                                                FontWeight.w600,
                                            fontSize: 13)),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(
                                  () => _useManualLocation = true),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    vertical: 12),
                                decoration: BoxDecoration(
                                  color: _useManualLocation
                                      ? AppTheme.primaryColor
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.edit_location_rounded,
                                        size: 18,
                                        color: _useManualLocation
                                            ? Colors.white
                                            : Colors.grey),
                                    const SizedBox(width: 6),
                                    Text('Enter Manually',
                                        style: TextStyle(
                                            color: _useManualLocation
                                                ? Colors.white
                                                : Colors.grey,
                                            fontWeight:
                                                FontWeight.w600,
                                            fontSize: 13)),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // ── GPS Info / Manual field ──
                    if (!_useManualLocation) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _latitude != null
                              ? AppTheme.successColor
                                  .withValues(alpha: 0.12)
                              : Colors.white.withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _latitude != null
                                ? AppTheme.successColor
                                    .withValues(alpha: 0.3)
                                : Colors.grey.shade300,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _latitude != null
                                  ? Icons.gps_fixed_rounded
                                  : Icons.gps_not_fixed_rounded,
                              color: _latitude != null
                                  ? AppTheme.successColor
                                  : Colors.grey,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _isGettingLocation
                                  ? const Row(children: [
                                      SizedBox(
                                          width: 18,
                                          height: 18,
                                          child:
                                              CircularProgressIndicator(
                                                  strokeWidth: 2)),
                                      SizedBox(width: 8),
                                      Text('Detecting location...'),
                                    ])
                                  : _latitude != null
                                      ? Text(
                                          '${_latitude!.toStringAsFixed(4)}, ${_longitude!.toStringAsFixed(4)}',
                                          style: const TextStyle(
                                              color:
                                                  AppTheme.successColor,
                                              fontWeight:
                                                  FontWeight.w500),
                                        )
                                      : Text(
                                          _gpsError ??
                                              'Location not available',
                                          style: const TextStyle(
                                              color: Colors.grey)),
                            ),
                            if (!_isGettingLocation && _latitude == null)
                              TextButton(
                                onPressed: _getCurrentLocation,
                                child: const Text('Retry'),
                              ),
                          ],
                        ),
                      ),
                    ] else ...[
                      TextFormField(
                        controller: _manualLocationController,
                        decoration: const InputDecoration(
                          hintText:
                              'Enter Area / City (e.g. Karur, Ward 6)',
                          prefixIcon:
                              Icon(Icons.edit_location_rounded),
                          labelText: 'Location',
                        ),
                        validator: (v) {
                          if (_useManualLocation &&
                              (v == null || v.trim().isEmpty)) {
                            return 'Please enter a location';
                          }
                          return null;
                        },
                      ),
                    ],
                    const SizedBox(height: 24),

                    // ── Error ──
                    if (issueProvider.error != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.errorColor
                              .withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline,
                                color: Colors.white),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(issueProvider.error!,
                                  style: const TextStyle(
                                      color: Colors.white)),
                            ),
                          ],
                        ),
                      ),

                    // ── Submit ──
                    GradientButton(
                      text: 'Submit Report',
                      isLoading: issueProvider.isSubmitting,
                      icon: Icons.send_rounded,
                      onPressed:
                          issueProvider.isSubmitting ? null : _submit,
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: Colors.white.withValues(alpha: 0.9),
      ),
    );
  }
}
