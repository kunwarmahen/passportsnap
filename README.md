# PassportSnap 📸

> Professional passport photos in minutes - Free, instant, and 100% private

Create compliant passport photos right in your browser. No appointments, no waiting, no software installation required, vibe coded

![PassportSnap](https://img.shields.io/badge/Version-1.0.0-emerald?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-teal?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)

---

## ✨ Features

### 🌍 Multi-Country Support

- **8+ Countries**: US, Canada, UK, Australia, India, China, Germany, France
- **Country-specific dimensions**: Automatically adjusts to each country's requirements
- **Official compliance**: Meets passport photo standards for all supported countries

### 🎨 Professional Photo Editor

- **Smart positioning guides**: Visual overlays showing exactly where to position your face
- **Advanced adjustments**: Brightness, contrast, and color saturation controls
- **Real-time preview**: See changes instantly as you edit
- **Zoom & position**: Drag to move, scale slider to resize
- **One-click reset**: Restore default settings instantly

### 📐 Intelligent Guidelines

- **Head oval guide**: Shows optimal face area (50-69% coverage)
- **Eye level indicator**: Precise horizontal line for eye positioning
- **Chin level marker**: Ensures proper facial framing
- **Center alignment**: Vertical line for symmetrical positioning
- **Measurement rulers**: Percentage-based side scales
- **Top of head marker**: Shows where crown should be
- **Shoulder guide**: Proper shoulder positioning
- **Color-coded system**: Each guideline has a distinct purpose

### 🖨️ Print-Ready Output

- **High resolution**: 300 DPI professional quality
- **4×6 print layouts**: Choose 4 or 6 photos per sheet
- **Single photo download**: Individual passport photo
- **Optimized spacing**: Perfect margins for cutting
- **Multiple formats**: PNG with maximum quality

### 🔒 Privacy First

- **100% client-side processing**: Photos never leave your device
- **No server uploads**: All editing happens in your browser
- **No data storage**: We never see or store your photos
- **HEIC support**: Automatic conversion for iPhone photos

---

## 🚀 Quick Start

### Option 1: Use Online (Easiest)

Simply open the app in your browser and start creating passport photos immediately. No installation required!

### Option 2: Run Locally

#### Prerequisites

- Node.js 16.x or higher
- npm or yarn

#### Installation

```bash
# Clone the repository
git clone https://github.com/kunwarmahen/passportsnap.git

# Navigate to project directory
cd passportsnap

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

#### Build for Production

```bash
# Create optimized production build
npm run build

# The build folder will contain the production-ready files
```

---

## 📖 How to Use

### Step 1: Upload

1. Select your country from the grid
2. Upload any portrait photo (JPEG, PNG, or HEIC)
3. The photo will load into the editor automatically

### Step 2: Edit

1. **Position**: Drag the photo to move it around
2. **Zoom**: Use the scale slider to resize (0.1x to 3x)
3. **Adjust colors**:
   - Brightness (50-150%)
   - Contrast (50-150%)
   - Saturation (0-200%)
4. **Use guidelines**: Toggle guides on/off to see positioning helpers
5. **Align properly**:
   - Center face on vertical line
   - Eyes at teal line
   - Chin at rose line
   - Head within amber oval

### Step 3: Download

1. Choose your print layout (4 or 6 photos)
2. Download single photo for digital use
3. Download 4×6 print sheet for printing
4. Print at home or take to any photo lab

---

## 🎯 Supported Countries & Dimensions

| Country           | Dimensions             | Aspect Ratio |
| ----------------- | ---------------------- | ------------ |
| 🇺🇸 United States  | 2" × 2" (600×600px)    | 1:1          |
| 🇨🇦 Canada         | 2" × 2" (600×600px)    | 1:1          |
| 🇬🇧 United Kingdom | 2" × 2.5" (600×750px)  | 4:5          |
| 🇦🇺 Australia      | 2" × 2.5" (600×750px)  | 4:5          |
| 🇮🇳 India          | 2" × 2" (600×600px)    | 1:1          |
| 🇨🇳 China          | 2" × 2.67" (600×800px) | 3:4          |
| 🇩🇪 Germany        | 2" × 2.5" (600×750px)  | 4:5          |
| 🇫🇷 France         | 2" × 2.5" (600×750px)  | 4:5          |

All photos are generated at **300 DPI** for professional print quality.

---

## 🛠️ Technical Stack

### Core Technologies

- **React 18**: Modern UI library with hooks
- **Lucide React**: Beautiful icon set
- **Tailwind CSS**: Utility-first styling
- **HTML5 Canvas**: Image processing and manipulation

### Key Libraries

- **heic2any**: HEIC to JPEG conversion for iPhone photos
- **Canvas API**: Professional image editing capabilities

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 📁 Project Structure

```
passportsnap/
├── src/
│   ├── components/
│   │   └── PassportPhotoApp.jsx    # Main application component
│   ├── App.js                       # Root component
│   ├── index.js                     # Entry point
│   └── index.css                    # Global styles
├── public/
│   ├── index.html                   # HTML template
│   └── favicon.ico                  # App icon
├── package.json                     # Dependencies
└── README.md                        # Documentation
```

---

## 🎨 Design System

### Color Palette

- **Primary**: Emerald (#059669)
- **Secondary**: Teal (#0d9488)
- **Accents**: Amber, Purple, Rose, Cyan
- **Neutrals**: Gray scale

### Typography

- **Headings**: Bold, modern sans-serif
- **Body**: Clean, readable fonts
- **UI Elements**: Semibold for emphasis

### Components

- **Rounded corners**: Consistent 2xl border radius
- **Shadows**: Layered depth with hover effects
- **Gradients**: Emerald to teal accent gradients
- **Glassmorphism**: Backdrop blur effects

---

## 🔧 Configuration

### Adding New Countries

```javascript
const countries = [
  {
    code: "XX",
    name: "Country Name",
    size: { width: 600, height: 600 },
    flag: "🏴",
  },
  // Add more countries...
];
```

### Customizing Guidelines

Modify the guideline positions in the editor section:

```javascript
// Eye level position (percentage from top)
style={{ top: '28%', left: '5%', width: '90%' }}

// Chin level position
style={{ top: '65%', left: '5%', width: '90%' }}
```

### Adjusting Print Layout

```javascript
// Modify in generatePrintLayout function
const printWidth = 1200; // 4" × 300 DPI
const printHeight = 1800; // 6" × 300 DPI
```

---

## 🐛 Troubleshooting

### HEIC Files Not Converting

**Problem**: iPhone photos (HEIC) fail to load

**Solution**: Ensure heic2any library is loaded. Add to your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js"></script>
```

### Preview Not Updating

**Problem**: Changes don't reflect immediately

**Solution**: Clear browser cache and refresh. The app uses real-time canvas rendering.

### Low Quality Downloads

**Problem**: Downloaded photos appear blurry

**Solution**: Ensure you're downloading at 300 DPI. Check that canvas export uses quality 1.0:

```javascript
canvas.toDataURL("image/png", 1.0);
```

### Guidelines Not Showing

**Problem**: Positioning guides don't appear

**Solution**: Click the "Show Guidelines" button in the editor. Guidelines are togglable.

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

- Use GitHub Issues to report bugs
- Include browser version and steps to reproduce
- Attach screenshots if applicable

### Feature Requests

- Open an issue with the "enhancement" label
- Describe the feature and use case
- Explain why it would be valuable

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test across multiple browsers
- Update README if adding features

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No liability
- ❌ No warranty

---

## 🙏 Acknowledgments

- **Icons**: [Lucide React](https://lucide.dev) for beautiful, consistent icons
- **Image Processing**: HTML5 Canvas API for professional editing
- **HEIC Conversion**: [heic2any](https://github.com/alexcorvi/heic2any) for iPhone photo support
- **Design Inspiration**: Modern web design trends and best practices

---

## 🗺️ Roadmap

### Version 1.1 (Coming Soon)

- [ ] More country templates (Japan, Brazil, South Korea)
- [ ] Background removal tool
- [ ] Auto face detection and positioning
- [ ] Dark mode support

### Version 1.2

- [ ] Mobile app (iOS & Android)
- [ ] Batch processing
- [ ] Cloud save (optional)
- [ ] Print delivery service integration

### Version 2.0

- [ ] AI-powered quality check
- [ ] Automatic compliance verification
- [ ] Multi-language support
- [ ] Professional photo retouching

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/passportsnap?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/passportsnap?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/passportsnap?style=social)

---

## 💖 Support the Project

If PassportSnap helped you, consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 📢 Sharing with friends
- ☕ [Buy me a coffee](https://buymeacoffee.com/passportsnap)

---

<div align="center">

**Made with ❤️ by the PassportSnap Team**

[Report Bug](https://github.com/kunwarmahen/passportsnap/issues) • [Request Feature](https://github.com/kunwarmahen/passportsnap/issues)

</div>
